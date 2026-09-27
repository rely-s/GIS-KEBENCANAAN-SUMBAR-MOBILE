from collections import OrderedDict
import asyncio
import logging
from typing import Dict, Tuple, Optional
from fastapi import APIRouter, Depends, Path, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_async_db, AsyncSessionLocal

logger = logging.getLogger("tiles")
router = APIRouter(prefix="/tiles", tags=["Vector Tiles"])

# Cache LRU di memori untuk tile hasil build (Maksimal 1.000 entri untuk mencegah memory leak)
_tile_cache: OrderedDict[Tuple[int, int, int, Optional[str], str], bytes] = OrderedDict()
MAX_TILE_CACHE_SIZE = 1000
_last_refresh: Optional[str] = None


def put_tile_cache(key: Tuple[int, int, int, Optional[str], str], val: bytes):
    if key in _tile_cache:
        _tile_cache.move_to_end(key)
    _tile_cache[key] = val
    if len(_tile_cache) > MAX_TILE_CACHE_SIZE:
        _tile_cache.popitem(last=False)


async def refresh_mv_dampak_concurrently():
    """
    Me-refresh Materialized View mv_dampak_per_kecamatan secara CONCURRENTLY
    sesuai rekomendasi 11-optimasi-performa.md.
    Menggunakan unique index pada wilayah_id sehingga pembacaan tidak terblokir (zero table lock).
    """
    global _tile_cache, _last_refresh
    try:
        async with AsyncSessionLocal() as session:
            logger.info("[-] Menjalankan REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dampak_per_kecamatan...")
            await session.execute(text("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dampak_per_kecamatan;"))
            await session.commit()
            
            # Ambil timestamp terakhir refresh
            res = await session.execute(text("SELECT MAX(terakhir_refresh)::text FROM mv_dampak_per_kecamatan;"))
            row = res.scalar()
            _last_refresh = row or "Baru saja"
            
            # Invalidation tile cache agar request berikutnya menyajikan data baru
            _tile_cache.clear()
            logger.info("[+] Materialized view mv_dampak_per_kecamatan berhasil di-refresh concurrently.")
    except Exception as e:
        logger.error(f"[!] Gagal refresh materialized view concurrently: {e}")


async def start_tiles_scheduler(interval_seconds: int = 900):
    """
    Background worker terjadwal untuk refresh MV mv_dampak_per_kecamatan setiap 15 menit (900 detik).
    """
    # Tunggu beberapa detik di startup sebelum refresh pertama
    await asyncio.sleep(5)
    await refresh_mv_dampak_concurrently()
    
    while True:
        try:
            await asyncio.sleep(interval_seconds)
            await refresh_mv_dampak_concurrently()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"[!] Error pada background tile scheduler: {e}")
            await asyncio.sleep(60)


@router.get("/choropleth/{z}/{x}/{y}.mvt")
async def get_choropleth_tile(
    z: int = Path(..., ge=0, le=22, description="Zoom level (0-22)"),
    x: int = Path(..., ge=0, description="Tile X coordinate"),
    y: int = Path(..., ge=0, description="Tile Y coordinate"),
    level: str = Query("kabupaten", description="Level wilayah: 'kabupaten' (makro default) atau 'kecamatan'"),
    v: Optional[str] = Query(None, description="Cache buster version"),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Menyajikan Vector Tile (MVT) poligon kabupaten/kecamatan beserta data agregasi dampak bencana.
    Mendukung agregasi hierarkis anak kecamatan untuk level kabupaten makro.
    """
    target_level = "kecamatan" if level and level.lower() == "kecamatan" else "kabupaten"
    cache_key = (z, x, y, v, target_level)
    if cache_key in _tile_cache:
        _tile_cache.move_to_end(cache_key)
        return Response(
            content=_tile_cache[cache_key],
            media_type="application/x-protobuf",
            headers={
                "Content-Type": "application/x-protobuf",
                "Cache-Control": "public, max-age=900, stale-while-revalidate=3600",
                "X-Tile-Cache": "HIT"
            }
        )

    # Pilih geometri simplifikasi pada zoom rendah (LOD) agar render kilat
    geom_expr = "ST_Transform(ST_MakeValid(COALESCE(w.geom_simplified, w.geom)), 3857)" if z <= 10 else "ST_Transform(ST_MakeValid(w.geom), 3857)"

    sql = text(f"""
        WITH agg_dampak AS (
            SELECT 
                w.id AS wilayah_id,
                COALESCE(
                    CASE 
                        WHEN :target_level = 'kabupaten' THEN (
                            SELECT SUM(sub_mv.total_kerugian) 
                            FROM mv_dampak_per_kecamatan sub_mv 
                            JOIN wilayah_administratif sub_w ON sub_w.id = sub_mv.wilayah_id 
                            WHERE sub_w.parent_id = w.id
                        )
                        ELSE mv.total_kerugian 
                    END, 0
                )::float AS total_kerugian,
                COALESCE(
                    CASE 
                        WHEN :target_level = 'kabupaten' THEN (
                            SELECT SUM(sub_mv.total_meninggal) 
                            FROM mv_dampak_per_kecamatan sub_mv 
                            JOIN wilayah_administratif sub_w ON sub_w.id = sub_mv.wilayah_id 
                            WHERE sub_w.parent_id = w.id
                        )
                        ELSE mv.total_meninggal 
                    END, 0
                )::int AS total_meninggal,
                COALESCE(
                    CASE 
                        WHEN :target_level = 'kabupaten' THEN (
                            SELECT SUM(sub_mv.total_luka) 
                            FROM mv_dampak_per_kecamatan sub_mv 
                            JOIN wilayah_administratif sub_w ON sub_w.id = sub_mv.wilayah_id 
                            WHERE sub_w.parent_id = w.id
                        )
                        ELSE mv.total_luka 
                    END, 0
                )::int AS total_luka,
                COALESCE(
                    CASE 
                        WHEN :target_level = 'kabupaten' THEN (
                            SELECT SUM(sub_mv.total_terdampak) 
                            FROM mv_dampak_per_kecamatan sub_mv 
                            JOIN wilayah_administratif sub_w ON sub_w.id = sub_mv.wilayah_id 
                            WHERE sub_w.parent_id = w.id
                        )
                        ELSE mv.total_terdampak 
                    END, 0
                )::int AS total_terdampak,
                COALESCE(
                    CASE 
                        WHEN :target_level = 'kabupaten' THEN (
                            SELECT SUM(sub_mv.jumlah_kejadian) 
                            FROM mv_dampak_per_kecamatan sub_mv 
                            JOIN wilayah_administratif sub_w ON sub_w.id = sub_mv.wilayah_id 
                            WHERE sub_w.parent_id = w.id
                        )
                        ELSE mv.jumlah_kejadian 
                    END, 0
                )::int AS jumlah_kejadian
            FROM wilayah_administratif w
            LEFT JOIN mv_dampak_per_kecamatan mv ON mv.wilayah_id = w.id
            WHERE w.level = :target_level
        ),
        mvtgeom AS (
            SELECT 
                w.id,
                w.nama,
                w.kode_wilayah,
                ad.total_kerugian,
                ad.total_meninggal,
                ad.total_luka,
                ad.total_terdampak,
                ad.jumlah_kejadian,
                CASE 
                    WHEN ad.total_kerugian >= 1500000000 OR ad.total_meninggal > 0 THEN 'tinggi'
                    WHEN ad.total_kerugian >= 400000000 THEN 'sedang'
                    ELSE 'rendah'
                END AS tingkat_risiko,
                ST_AsMVTGeom(
                    {geom_expr},
                    ST_TileEnvelope(:z, :x, :y),
                    4096,
                    64,
                    true
                ) AS geom
            FROM wilayah_administratif w
            JOIN agg_dampak ad ON ad.wilayah_id = w.id
            WHERE w.level = :target_level
              AND w.geom IS NOT NULL
              AND ST_Intersects(
                  w.geom,
                  ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326)
              )
        )
        SELECT ST_AsMVT(mvtgeom.*, 'choropleth_kecamatan') AS mvt FROM mvtgeom;
    """)

    try:
        result = await db.execute(sql, {"z": z, "x": x, "y": y, "target_level": target_level})
        mvt = result.scalar()

        if not mvt:
            return Response(
                content=b"",
                status_code=status.HTTP_204_NO_CONTENT,
                headers={"Cache-Control": "public, max-age=300"}
            )

        tile_bytes = bytes(mvt)
        put_tile_cache(cache_key, tile_bytes)
        return Response(
            content=tile_bytes,
            media_type="application/x-protobuf",
            headers={
                "Content-Type": "application/x-protobuf",
                "Cache-Control": "public, max-age=900, stale-while-revalidate=3600",
                "X-Tile-Cache": "MISS"
            }
        )
    except Exception as e:
        logger.warning(f"Gagal generate MVT tile {z}/{x}/{y}: {e}")
        return Response(
            content=b"",
            status_code=status.HTTP_204_NO_CONTENT,
            headers={"Cache-Control": "public, max-age=60"}
        )


@router.post("/refresh-materialized-view")
async def trigger_refresh():
    """Trigger manual refresh materialized view CONCURRENTLY untuk admin/petugas."""
    await refresh_mv_dampak_concurrently()
    return {
        "status": "success",
        "message": "Materialized view mv_dampak_per_kecamatan berhasil di-refresh concurrently.",
        "terakhir_refresh": _last_refresh
    }
