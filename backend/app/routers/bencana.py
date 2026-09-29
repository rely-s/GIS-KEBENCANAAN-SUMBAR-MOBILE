from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import json

from app.core.database import get_async_db
from app.core.dependencies import require_role
from app.models.bencana import KejadianBencana, DataDampakBencana
from app.models.wilayah import WilayahAdministratif
from app.models.pengguna import Pengguna
from app.services.audit_service import record_audit
from app.services.storage_service import save_base64_image
from app.routers.events import broadcaster

router = APIRouter(prefix="/bencana", tags=["Data Kejadian Bencana"])

class DampakInputRequest(BaseModel):
    korban_meninggal: Optional[int] = Field(default=0, ge=0)
    korban_hilang: Optional[int] = Field(default=0, ge=0)
    korban_luka: Optional[int] = Field(default=0, ge=0)
    jumlah_pengungsi: Optional[int] = Field(default=0, ge=0)
    kerugian_rp: Optional[float] = Field(default=0.0, ge=0.0)
    rumah_rusak_berat: Optional[int] = Field(default=0, ge=0)
    rumah_rusak_sedang: Optional[int] = Field(default=0, ge=0)
    rumah_rusak_ringan: Optional[int] = Field(default=0, ge=0)
    fasilitas_umum_rusak: Optional[int] = Field(default=0, ge=0)
    fasilitas_kesehatan_rusak: Optional[int] = Field(default=0, ge=0)
    sekolah_rusak: Optional[int] = Field(default=0, ge=0)
    penduduk_terdampak: Optional[int] = Field(default=0, ge=0)
    catatan: Optional[str] = None

class BencanaCreateRequest(BaseModel):
    jenis_bencana: str = Field(..., description="gempa | tsunami | banjir | longsor | erupsi | angin_puting_beliung | kebakaran | lainnya")
    tanggal_kejadian: Optional[datetime] = Field(default_factory=datetime.utcnow)
    wilayah_id: Optional[int] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    deskripsi: Optional[str] = None
    sumber_data: Optional[str] = "operator_bpbd"
    status_verifikasi: Optional[str] = "terverifikasi"
    foto_url: Optional[str] = None
    foto_base64: Optional[str] = None
    dampak: Optional[DampakInputRequest] = None

class BencanaUpdateRequest(BaseModel):
    jenis_bencana: Optional[str] = None
    tanggal_kejadian: Optional[datetime] = None
    wilayah_id: Optional[int] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    deskripsi: Optional[str] = None
    foto_url: Optional[str] = None
    foto_base64: Optional[str] = None
    sumber_data: Optional[str] = None
    status_verifikasi: Optional[str] = None

class BencanaVerifikasiRequest(BaseModel):
    status_verifikasi: str = Field(..., description="terverifikasi | ditolak | menunggu")
    catatan: Optional[str] = None

class LaporWargaRequest(BaseModel):
    jenis_bencana: str = Field(..., description="gempa | tsunami | banjir | longsor | erupsi | angin_puting_beliung | kebakaran | lainnya")
    lat: float = Field(..., ge=-10.0, le=10.0, description="Latitude lokasi kejadian (WGS84)")
    lon: float = Field(..., ge=90.0, le=145.0, description="Longitude lokasi kejadian (WGS84)")
    deskripsi: str = Field(..., min_length=5, max_length=1500, description="Keterangan kondisi darurat lapangan")
    nama_pelapor: Optional[str] = Field(default="Warga Lapangan", max_length=100)
    kontak_pelapor: Optional[str] = Field(default=None, max_length=30)
    foto_base64: Optional[str] = Field(default=None, description="Foto bukti visual (WebP/JPEG terkompresi)")

@router.get("", include_in_schema=True)
@router.get("/", include_in_schema=False)
async def list_bencana(
    jenis: Optional[str] = Query(None, description="Filter jenis bencana"),
    tahun: Optional[int] = Query(None, description="Filter tahun"),
    wilayah_id: Optional[int] = Query(None, description="Filter ID wilayah"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Daftar kejadian bencana dengan filter jenis, tahun, dan wilayah.
    """
    filters = ["1=1"]
    params: Dict[str, Any] = {"limit": limit, "offset": offset}

    if jenis and jenis.lower() != "semua":
        filters.append("LOWER(k.jenis_bencana) = LOWER(:jenis)")
        params["jenis"] = jenis

    if tahun:
        filters.append("EXTRACT(YEAR FROM k.tanggal_kejadian) = :tahun")
        params["tahun"] = tahun

    if wilayah_id:
        filters.append("k.wilayah_id = :wilayah_id")
        params["wilayah_id"] = wilayah_id

    where_clause = " AND ".join(filters)

    sql = text(f"""
        SELECT 
            k.id,
            k.jenis_bencana,
            k.tanggal_kejadian,
            k.deskripsi,
            k.sumber_data,
            k.status_verifikasi,
            w.nama AS nama_wilayah,
            COALESCE(ST_X(k.lokasi), 0) AS lon,
            COALESCE(ST_Y(k.lokasi), 0) AS lat,
            COALESCE(SUM(d.kerugian_rp), 0) AS total_kerugian,
            COALESCE(SUM(d.korban_meninggal), 0) AS korban_meninggal,
            COALESCE(SUM(d.korban_luka), 0) AS korban_luka
        FROM kejadian_bencana k
        LEFT JOIN wilayah_administratif w ON w.id = k.wilayah_id
        LEFT JOIN data_dampak_bencana d ON d.kejadian_id = k.id
        WHERE {where_clause}
        GROUP BY k.id, k.jenis_bencana, k.tanggal_kejadian, k.deskripsi, k.sumber_data, k.status_verifikasi, w.nama, k.lokasi
        ORDER BY k.tanggal_kejadian DESC
        LIMIT :limit OFFSET :offset;
    """)

    result = await db.execute(sql, params)
    rows = result.fetchall()

    data = [
        {
            "id": r.id,
            "jenis_bencana": r.jenis_bencana,
            "tanggal_kejadian": r.tanggal_kejadian.isoformat() if r.tanggal_kejadian else None,
            "deskripsi": r.deskripsi,
            "wilayah": r.nama_wilayah or "Sumatera Barat",
            "lokasi": {"lat": float(r.lat), "lon": float(r.lon)} if r.lat != 0 else None,
            "sumber_data": r.sumber_data,
            "status_verifikasi": r.status_verifikasi,
            "dampak": {
                "kerugian_rp": float(r.total_kerugian),
                "korban_meninggal": int(r.korban_meninggal),
                "korban_luka": int(r.korban_luka)
            }
        }
        for r in rows
    ]

    return {"status": "success", "count": len(data), "data": data}

@router.get("/riwayat")
async def riwayat_bencana(
    jenis: Optional[str] = Query(None),
    tahun: Optional[int] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Alias timeline riwayat bencana terbaru untuk feed informasi.
    """
    return await list_bencana(jenis=jenis, tahun=tahun, wilayah_id=None, limit=limit, offset=0, db=db)

@router.get("/statistik")
async def statistik_bencana(
    tahun: Optional[int] = Query(None, description="Filter tahun statistik"),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Ringkasan metrik statistik bencana tingkat provinsi Sumatera Barat.
    """
    year_filter = "WHERE EXTRACT(YEAR FROM k.tanggal_kejadian) = :tahun" if tahun else ""
    params = {"tahun": tahun} if tahun else {}

    sql_ringkasan = text(f"""
        SELECT 
            COUNT(DISTINCT k.id) AS total_kejadian,
            COALESCE(SUM(d.kerugian_rp), 0) AS total_kerugian,
            COALESCE(SUM(d.korban_meninggal), 0) AS total_meninggal,
            COALESCE(SUM(d.korban_luka), 0) AS total_luka,
            COALESCE(SUM(d.jumlah_pengungsi), 0) AS total_pengungsi,
            COALESCE(SUM(d.penduduk_terdampak), 0) AS total_terdampak
        FROM kejadian_bencana k
        LEFT JOIN data_dampak_bencana d ON d.kejadian_id = k.id
        {year_filter};
    """)
    res_ringkasan = await db.execute(sql_ringkasan, params)
    ringkasan = res_ringkasan.first()

    # Breakdown per jenis
    sql_per_jenis = text(f"""
        SELECT 
            k.jenis_bencana,
            COUNT(k.id) AS jumlah,
            COALESCE(SUM(d.kerugian_rp), 0) AS kerugian
        FROM kejadian_bencana k
        LEFT JOIN data_dampak_bencana d ON d.kejadian_id = k.id
        {year_filter}
        GROUP BY k.jenis_bencana
        ORDER BY jumlah DESC;
    """)
    res_jenis = await db.execute(sql_per_jenis, params)
    distribusi = [
        {"jenis": r.jenis_bencana, "jumlah": int(r.jumlah), "kerugian_rp": float(r.kerugian)}
        for r in res_jenis.fetchall()
    ]

    total_kerugian = float(ringkasan.total_kerugian) if ringkasan else 0.0
    return {
        "status": "success",
        "tahun": tahun or "Semua Tahun",
        "ringkasan": {
            "total_kejadian": int(ringkasan.total_kejadian) if ringkasan else 0,
            "total_kerugian_rp": total_kerugian,
            "total_kerugian_miliar": round(total_kerugian / 1_000_000_000, 2),
            "total_korban_meninggal": int(ringkasan.total_meninggal) if ringkasan else 0,
            "total_korban_luka": int(ringkasan.total_luka) if ringkasan else 0,
            "total_pengungsi": int(ringkasan.total_pengungsi) if ringkasan else 0,
            "total_terdampak": int(ringkasan.total_terdampak) if ringkasan else 0
        },
        "distribusi_bencana": distribusi
    }

@router.get("/heatmap")
async def heatmap_bencana(
    jenis: Optional[str] = Query(None),
    tahun: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Titik-titik spasial bencana dalam format GeoJSON FeatureCollection ringan untuk heatmap layer.
    """
    filters = ["k.lokasi IS NOT NULL"]
    params: Dict[str, Any] = {}

    if jenis and jenis.lower() != "semua":
        filters.append("LOWER(k.jenis_bencana) = LOWER(:jenis)")
        params["jenis"] = jenis

    if tahun:
        filters.append("EXTRACT(YEAR FROM k.tanggal_kejadian) = :tahun")
        params["tahun"] = tahun

    where_clause = " AND ".join(filters)

    sql = text(f"""
        SELECT 
            k.id,
            k.jenis_bencana,
            ST_X(k.lokasi) AS lon,
            ST_Y(k.lokasi) AS lat,
            COALESCE(SUM(d.kerugian_rp), 10000000) AS intensitas_kerugian
        FROM kejadian_bencana k
        LEFT JOIN data_dampak_bencana d ON d.kejadian_id = k.id
        WHERE {where_clause}
        GROUP BY k.id, k.jenis_bencana, k.lokasi;
    """)
    result = await db.execute(sql, params)
    rows = result.fetchall()

    features = []
    for r in rows:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [float(r.lon), float(r.lat)]
            },
            "properties": {
                "id": r.id,
                "jenis": r.jenis_bencana,
                "bobot": min(1.0, float(r.intensitas_kerugian) / 5_000_000_000)
            }
        })

    return {
        "type": "FeatureCollection",
        "features": features
    }

@router.get("/{bencana_id}")
async def detail_bencana(
    bencana_id: int,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Detail satu kejadian bencana beserta rincian dampak fisik dan korbannya.
    """
    sql = text("""
        SELECT 
            k.id,
            k.jenis_bencana,
            k.tanggal_kejadian,
            k.deskripsi,
            k.sumber_data,
            k.status_verifikasi,
            w.nama AS nama_wilayah,
            COALESCE(ST_X(k.lokasi), 0) AS lon,
            COALESCE(ST_Y(k.lokasi), 0) AS lat,
            d.korban_meninggal,
            d.korban_hilang,
            d.korban_luka,
            d.jumlah_pengungsi,
            d.kerugian_rp,
            d.rumah_rusak_berat,
            d.rumah_rusak_sedang,
            d.rumah_rusak_ringan,
            d.fasilitas_umum_rusak,
            d.fasilitas_kesehatan_rusak,
            d.sekolah_rusak,
            d.penduduk_terdampak,
            d.catatan
        FROM kejadian_bencana k
        LEFT JOIN wilayah_administratif w ON w.id = k.wilayah_id
        LEFT JOIN data_dampak_bencana d ON d.kejadian_id = k.id
        WHERE k.id = :bencana_id;
    """)
    res = await db.execute(sql, {"bencana_id": bencana_id})
    row = res.first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "BENCANA_NOT_FOUND", "message": f"Kejadian bencana ID {bencana_id} tidak ditemukan."}}
        )

    return {
        "id": row.id,
        "jenis_bencana": row.jenis_bencana,
        "tanggal_kejadian": row.tanggal_kejadian.isoformat() if row.tanggal_kejadian else None,
        "deskripsi": row.deskripsi,
        "wilayah": row.nama_wilayah or "Sumatera Barat",
        "lokasi": {"lat": float(row.lat), "lon": float(row.lon)} if row.lat != 0 else None,
        "sumber_data": row.sumber_data,
        "status_verifikasi": row.status_verifikasi,
        "dampak": {
            "korban_meninggal": int(row.korban_meninggal or 0),
            "korban_hilang": int(row.korban_hilang or 0),
            "korban_luka": int(row.korban_luka or 0),
            "jumlah_pengungsi": int(row.jumlah_pengungsi or 0),
            "kerugian_rp": float(row.kerugian_rp or 0),
            "rumah_rusak_berat": int(row.rumah_rusak_berat or 0),
            "rumah_rusak_sedang": int(row.rumah_rusak_sedang or 0),
            "rumah_rusak_ringan": int(row.rumah_rusak_ringan or 0),
            "fasilitas_umum_rusak": int(row.fasilitas_umum_rusak or 0),
            "fasilitas_kesehatan_rusak": int(row.fasilitas_kesehatan_rusak or 0),
            "sekolah_rusak": int(row.sekolah_rusak or 0),
            "penduduk_terdampak": int(row.penduduk_terdampak or 0),
            "catatan": row.catatan
        }
    }

# ============================================================================
# ENDPOINTS MUTASI (CREATE, UPDATE, VERIFIKASI, DELETE)
# ============================================================================

@router.post("/lapor", status_code=status.HTTP_201_CREATED)
@router.post("/lapor-warga", status_code=status.HTTP_201_CREATED)
async def lapor_bencana_warga(
    payload: LaporWargaRequest,
    request: Request,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Endpoint Partisipatif Publik (Crowdsourcing Warga):
    Melaporkan kondisi darurat bencana langsung dari ponsel warga.
    Laporan otomatis masuk antrean verifikasi supervisor Pusdalops.
    """
    valid_jenis = ['gempa', 'tsunami', 'banjir', 'longsor', 'erupsi', 'angin_puting_beliung', 'kebakaran', 'lainnya']
    if payload.jenis_bencana not in valid_jenis:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": {"code": "INVALID_JENIS", "message": f"Jenis bencana harus salah satu dari: {', '.join(valid_jenis)}"}}
        )

    # Validasi Bounding Box Spasial Sumatera Barat (Lat: -3.5 s/d 0.9, Lon: 98.5 s/d 101.9)
    if not (-3.5 <= payload.lat <= 0.9 and 98.5 <= payload.lon <= 101.9):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": {"code": "OUT_OF_BOUNDS", "message": "Koordinat lokasi pelaporan berada di luar batas wilayah Provinsi Sumatera Barat."}}
        )

    # Cari wilayah administratif terdekat via PostGIS
    wilayah_query = text("""
        SELECT id, nama FROM wilayah_administratif
        ORDER BY ST_Distance(geom, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)) ASC
        LIMIT 1;
    """)
    wilayah_row = (await db.execute(wilayah_query, {"lon": payload.lon, "lat": payload.lat})).fetchone()
    wilayah_id = wilayah_row.id if wilayah_row else None
    wilayah_nama = wilayah_row.nama if wilayah_row else "Sumatera Barat"

    clean_pelapor = payload.nama_pelapor.strip() if payload.nama_pelapor else "Warga Lapangan"
    clean_kontak = payload.kontak_pelapor.strip() if payload.kontak_pelapor else "Tanpa Nomor Kontak"
    laporan_deskripsi = f"[Laporan Warga: {clean_pelapor} | Kontak: {clean_kontak}] {payload.deskripsi}"

    # Simpan bukti visual foto jika disertakan
    foto_url = None
    if payload.foto_base64:
        foto_url = save_base64_image(payload.foto_base64, subfolder="laporan")

    sql_kejadian = text("""
        INSERT INTO kejadian_bencana (
            jenis_bencana, tanggal_kejadian, wilayah_id, lokasi, deskripsi, foto_url, sumber_data, status_verifikasi, dibuat_oleh, created_at, updated_at
        ) VALUES (
            :jenis, now(), :wilayah_id, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), :deskripsi, :foto_url, 'laporan_warga', 'menunggu', NULL, now(), now()
        ) RETURNING id, jenis_bencana, status_verifikasi, foto_url, created_at;
    """)

    res = await db.execute(sql_kejadian, {
        "jenis": payload.jenis_bencana,
        "wilayah_id": wilayah_id,
        "lon": payload.lon,
        "lat": payload.lat,
        "deskripsi": laporan_deskripsi,
        "foto_url": foto_url
    })
    row = res.fetchone()

    # Catat jejak audit crowdsourcing
    client_ip = request.client.host if request.client else None
    await record_audit(
        db=db,
        pengguna_id=None,
        aksi="LAPOR_WARGA_CROWDSOURCE",
        tabel_target="kejadian_bencana",
        record_id=row.id,
        detail={"jenis": payload.jenis_bencana, "pelapor": clean_pelapor, "lat": payload.lat, "lon": payload.lon, "foto_terlampir": bool(foto_url)},
        ip_address=client_ip
    )

    await db.commit()

    # Siarkan notifikasi darurat secara real-time ke dashboard Pusdalops
    await broadcaster.broadcast("laporan_baru", {
        "id": row.id,
        "ticket_id": f"LAPOR-SUMBAR-{row.id}",
        "jenis_bencana": payload.jenis_bencana,
        "wilayah": wilayah_nama,
        "lat": payload.lat,
        "lon": payload.lon,
        "deskripsi": laporan_deskripsi,
        "foto_url": row.foto_url,
        "status_verifikasi": "menunggu",
        "created_at": datetime.utcnow().isoformat()
    })

    return {
        "status": "success",
        "ticket_id": f"LAPOR-SUMBAR-{row.id}",
        "bencana_id": row.id,
        "foto_url": row.foto_url,
        "message": "Terima kasih atas kepedulian Anda. Laporan situasi dan bukti foto telah diterima Pusdalops BPBD Sumbar dan segera diverifikasi petugas.",
        "wilayah_terdeteksi": wilayah_nama,
        "estimasi_tindakan": "Petugas TRC terdekat segera mengonfirmasi titik koordinat."
    }

@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_bencana(
    payload: BencanaCreateRequest,
    request: Request,
    current_user: Pengguna = Depends(require_role(["operator", "admin"])),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Operator & Admin: Melaporkan kejadian bencana baru beserta rincian dampak awalnya.
    """
    valid_jenis = ['gempa', 'tsunami', 'banjir', 'longsor', 'erupsi', 'angin_puting_beliung', 'kebakaran', 'lainnya']
    if payload.jenis_bencana not in valid_jenis:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": {"code": "INVALID_JENIS", "message": f"Jenis bencana harus salah satu dari: {', '.join(valid_jenis)}"}}
        )

    # Validasi Anti-BOLA / IDOR dan Penegakan Status Verifikasi Operator
    target_wilayah_id = payload.wilayah_id
    if current_user.role == "operator":
        # Operator lapangan selalu masuk antrean 'menunggu' untuk diverifikasi supervisor Pusdalops
        status_verifikasi = "menunggu"
        sumber_data = f"operator_lapangan_{current_user.nama}"
        if current_user.wilayah_tugas_id is not None:
            if target_wilayah_id is not None and target_wilayah_id != current_user.wilayah_tugas_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "error": {
                            "code": "FORBIDDEN_WILAYAH",
                            "message": "Akses ditolak: Anda hanya berwenang melaporkan bencana di wilayah tugas Anda."
                        }
                    }
                )
            target_wilayah_id = current_user.wilayah_tugas_id
    else:
        status_verifikasi = payload.status_verifikasi or "terverifikasi"
        sumber_data = payload.sumber_data or "pusdalops_bpbd"

    # Proses foto bukti jika ada
    foto_url = payload.foto_url
    if payload.foto_base64:
        foto_url = save_base64_image(payload.foto_base64, subfolder="laporan")

    # Simpan Kejadian
    geom_sql = "ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)" if (payload.lat is not None and payload.lon is not None) else "NULL"
    tgl = payload.tanggal_kejadian or datetime.utcnow()

    sql_kejadian = text(f"""
        INSERT INTO kejadian_bencana (
            jenis_bencana, tanggal_kejadian, wilayah_id, lokasi, deskripsi, foto_url, sumber_data, status_verifikasi, dibuat_oleh, created_at, updated_at
        ) VALUES (
            :jenis, :tgl, :wilayah_id, {geom_sql}, :deskripsi, :foto_url, :sumber, :verif, :dibuat_oleh, now(), now()
        ) RETURNING id, jenis_bencana, tanggal_kejadian, status_verifikasi, foto_url;
    """)

    params: Dict[str, Any] = {
        "jenis": payload.jenis_bencana,
        "tgl": tgl,
        "wilayah_id": target_wilayah_id,
        "deskripsi": payload.deskripsi,
        "foto_url": foto_url,
        "sumber": sumber_data,
        "verif": status_verifikasi,
        "dibuat_oleh": current_user.id
    }
    if payload.lat is not None and payload.lon is not None:
        params["lat"] = payload.lat
        params["lon"] = payload.lon

    res_kejadian = await db.execute(sql_kejadian, params)
    row_kejadian = res_kejadian.fetchone()

    # Simpan Data Dampak Awal jika disertakan
    if payload.dampak:
        d = payload.dampak
        eff_wilayah_id = target_wilayah_id or payload.wilayah_id or 1
        sql_dampak = text("""
            INSERT INTO data_dampak_bencana (
                kejadian_id, wilayah_id, korban_meninggal, korban_hilang, korban_luka,
                jumlah_pengungsi, kerugian_rp, rumah_rusak_berat, rumah_rusak_sedang,
                rumah_rusak_ringan, fasilitas_umum_rusak, fasilitas_kesehatan_rusak,
                sekolah_rusak, penduduk_terdampak, catatan, updated_at
            ) VALUES (
                :kejadian_id, :wilayah_id, :meninggal, :hilang, :luka,
                :pengungsi, :kerugian, :rb, :rs, :rr, :fasum, :faskes,
                :sekolah, :terdampak, :catatan, now()
            );
        """)
        await db.execute(sql_dampak, {
            "kejadian_id": row_kejadian.id,
            "wilayah_id": eff_wilayah_id,
            "meninggal": d.korban_meninggal or 0,
            "hilang": d.korban_hilang or 0,
            "luka": d.korban_luka or 0,
            "pengungsi": d.jumlah_pengungsi or 0,
            "kerugian": d.kerugian_rp or 0.0,
            "rb": d.rumah_rusak_berat or 0,
            "rs": d.rumah_rusak_sedang or 0,
            "rr": d.rumah_rusak_ringan or 0,
            "fasum": d.fasilitas_umum_rusak or 0,
            "faskes": d.fasilitas_kesehatan_rusak or 0,
            "sekolah": d.sekolah_rusak or 0,
            "terdampak": d.penduduk_terdampak or 0,
            "catatan": d.catatan
        })

    # Catat Audit Log
    client_ip = request.client.host if request.client else None
    await record_audit(
        db=db,
        pengguna_id=current_user.id,
        aksi="CREATE_BENCANA",
        tabel_target="kejadian_bencana",
        record_id=row_kejadian.id,
        detail={"jenis": payload.jenis_bencana, "wilayah_id": payload.wilayah_id},
        ip_address=client_ip
    )

    await db.commit()

    await broadcaster.broadcast("bencana_baru", {
        "id": row_kejadian.id,
        "jenis_bencana": row_kejadian.jenis_bencana,
        "status_verifikasi": row_kejadian.status_verifikasi,
        "created_by": current_user.nama
    })

    return {
        "message": f"Kejadian bencana '{row_kejadian.jenis_bencana}' berhasil dicatat (ID: {row_kejadian.id}).",
        "id": row_kejadian.id,
        "jenis_bencana": row_kejadian.jenis_bencana,
        "status_verifikasi": row_kejadian.status_verifikasi
    }

@router.put("/{bencana_id}")
async def update_bencana(
    bencana_id: int,
    payload: BencanaUpdateRequest,
    request: Request,
    current_user: Pengguna = Depends(require_role(["operator", "admin"])),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Operator & Admin: Memperbarui data umum kejadian bencana.
    """
    # Verifikasi eksistensi bencana dan validasi anti-BOLA wilayah
    check_query = text("SELECT id, jenis_bencana, wilayah_id FROM kejadian_bencana WHERE id = :id;")
    existing = (await db.execute(check_query, {"id": bencana_id})).fetchone()
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": f"Bencana dengan ID {bencana_id} tidak ditemukan."}}
        )

    # Operator daerah hanya boleh edit bencana di wilayah tugasnya dan tidak boleh self-verify
    if current_user.role == "operator":
        if current_user.wilayah_tugas_id is not None and existing.wilayah_id is not None and existing.wilayah_id != current_user.wilayah_tugas_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"error": {"code": "FORBIDDEN_WILAYAH", "message": "Akses ditolak: Anda hanya berwenang memperbarui bencana di wilayah tugas Anda."}}
            )
        if payload.status_verifikasi is not None and payload.status_verifikasi != "menunggu":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"error": {"code": "FORBIDDEN_VERIFIKASI", "message": "Akses ditolak: Status verifikasi hanya dapat disahkan oleh supervisor Pusdalops atau Pimpinan."}}
            )

    updates = ["updated_at = now()"]
    params: Dict[str, Any] = {"id": bencana_id}

    if payload.jenis_bencana:
        updates.append("jenis_bencana = :jenis")
        params["jenis"] = payload.jenis_bencana
    if payload.tanggal_kejadian:
        updates.append("tanggal_kejadian = :tgl")
        params["tgl"] = payload.tanggal_kejadian
    if payload.wilayah_id is not None:
        updates.append("wilayah_id = :wilayah_id")
        params["wilayah_id"] = payload.wilayah_id
    if payload.deskripsi is not None:
        updates.append("deskripsi = :deskripsi")
        params["deskripsi"] = payload.deskripsi
    if payload.sumber_data is not None:
        updates.append("sumber_data = :sumber")
        params["sumber"] = payload.sumber_data
    if payload.status_verifikasi is not None:
        updates.append("status_verifikasi = :status_verifikasi")
        params["status_verifikasi"] = payload.status_verifikasi
    if payload.foto_base64:
        new_foto = save_base64_image(payload.foto_base64, subfolder="laporan")
        if new_foto:
            updates.append("foto_url = :foto_url")
            params["foto_url"] = new_foto
    elif payload.foto_url is not None:
        updates.append("foto_url = :foto_url")
        params["foto_url"] = payload.foto_url
    if payload.lat is not None and payload.lon is not None:
        updates.append("lokasi = ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)")
        params["lat"] = payload.lat
        params["lon"] = payload.lon

    update_sql = text(f"""
        UPDATE kejadian_bencana
        SET {', '.join(updates)}
        WHERE id = :id
        RETURNING id, jenis_bencana, status_verifikasi;
    """)
    res = await db.execute(update_sql, params)
    row = res.fetchone()

    # Catat Audit Log
    client_ip = request.client.host if request.client else None
    await record_audit(
        db=db,
        pengguna_id=current_user.id,
        aksi="UPDATE_BENCANA",
        tabel_target="kejadian_bencana",
        record_id=bencana_id,
        detail=params,
        ip_address=client_ip
    )

    await db.commit()

    return {
        "message": f"Kejadian bencana ID {bencana_id} berhasil diperbarui.",
        "id": row.id,
        "jenis_bencana": row.jenis_bencana,
        "status_verifikasi": row.status_verifikasi
    }

@router.post("/{bencana_id}/dampak")
async def upsert_dampak_bencana(
    bencana_id: int,
    payload: DampakInputRequest,
    request: Request,
    wilayah_id: Optional[int] = Query(None, description="Wilayah administratif terdampak"),
    current_user: Pengguna = Depends(require_role(["operator", "admin"])),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Operator & Admin: Memperbarui atau menambahkan rincian dampak fisik & korban bencana.
    """
    # Cari wilayah default kejadian jika tidak dioper
    kejadian_q = text("SELECT id, wilayah_id FROM kejadian_bencana WHERE id = :id;")
    kejadian = (await db.execute(kejadian_q, {"id": bencana_id})).fetchone()
    if not kejadian:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": f"Kejadian bencana ID {bencana_id} tidak ditemukan."}}
        )

    target_wilayah = wilayah_id or kejadian.wilayah_id or 1

    # Cek apakah sudah ada data dampak untuk kejadian ini
    cek_dampak = text("SELECT id FROM data_dampak_bencana WHERE kejadian_id = :kid LIMIT 1;")
    existing_dampak = (await db.execute(cek_dampak, {"kid": bencana_id})).fetchone()

    if existing_dampak:
        update_dampak_sql = text("""
            UPDATE data_dampak_bencana
            SET 
                wilayah_id = :wilayah_id,
                korban_meninggal = :meninggal,
                korban_hilang = :hilang,
                korban_luka = :luka,
                jumlah_pengungsi = :pengungsi,
                kerugian_rp = :kerugian,
                rumah_rusak_berat = :rb,
                rumah_rusak_sedang = :rs,
                rumah_rusak_ringan = :rr,
                fasilitas_umum_rusak = :fasum,
                fasilitas_kesehatan_rusak = :faskes,
                sekolah_rusak = :sekolah,
                penduduk_terdampak = :terdampak,
                catatan = COALESCE(:catatan, catatan),
                updated_at = now()
            WHERE id = :id
            RETURNING id;
        """)
        await db.execute(update_dampak_sql, {
            "id": existing_dampak.id,
            "wilayah_id": target_wilayah,
            "meninggal": payload.korban_meninggal or 0,
            "hilang": payload.korban_hilang or 0,
            "luka": payload.korban_luka or 0,
            "pengungsi": payload.jumlah_pengungsi or 0,
            "kerugian": payload.kerugian_rp or 0.0,
            "rb": payload.rumah_rusak_berat or 0,
            "rs": payload.rumah_rusak_sedang or 0,
            "rr": payload.rumah_rusak_ringan or 0,
            "fasum": payload.fasilitas_umum_rusak or 0,
            "faskes": payload.fasilitas_kesehatan_rusak or 0,
            "sekolah": payload.sekolah_rusak or 0,
            "terdampak": payload.penduduk_terdampak or 0,
            "catatan": payload.catatan
        })
        dampak_id = existing_dampak.id
    else:
        insert_dampak_sql = text("""
            INSERT INTO data_dampak_bencana (
                kejadian_id, wilayah_id, korban_meninggal, korban_hilang, korban_luka,
                jumlah_pengungsi, kerugian_rp, rumah_rusak_berat, rumah_rusak_sedang,
                rumah_rusak_ringan, fasilitas_umum_rusak, fasilitas_kesehatan_rusak,
                sekolah_rusak, penduduk_terdampak, catatan, updated_at
            ) VALUES (
                :kejadian_id, :wilayah_id, :meninggal, :hilang, :luka,
                :pengungsi, :kerugian, :rb, :rs, :rr, :fasum, :faskes,
                :sekolah, :terdampak, :catatan, now()
            ) RETURNING id;
        """)
        res = await db.execute(insert_dampak_sql, {
            "kejadian_id": bencana_id,
            "wilayah_id": target_wilayah,
            "meninggal": payload.korban_meninggal or 0,
            "hilang": payload.korban_hilang or 0,
            "luka": payload.korban_luka or 0,
            "pengungsi": payload.jumlah_pengungsi or 0,
            "kerugian": payload.kerugian_rp or 0.0,
            "rb": payload.rumah_rusak_berat or 0,
            "rs": payload.rumah_rusak_sedang or 0,
            "rr": payload.rumah_rusak_ringan or 0,
            "fasum": payload.fasilitas_umum_rusak or 0,
            "faskes": payload.fasilitas_kesehatan_rusak or 0,
            "sekolah": payload.sekolah_rusak or 0,
            "terdampak": payload.penduduk_terdampak or 0,
            "catatan": payload.catatan
        })
        dampak_id = res.fetchone().id

    # Catat Audit Log
    client_ip = request.client.host if request.client else None
    await record_audit(
        db=db,
        pengguna_id=current_user.id,
        aksi="UPSERT_DAMPAK_BENCANA",
        tabel_target="data_dampak_bencana",
        record_id=dampak_id,
        detail={"bencana_id": bencana_id, "kerugian": payload.kerugian_rp, "pengungsi": payload.jumlah_pengungsi},
        ip_address=client_ip
    )

    await db.commit()

    return {
        "message": f"Data dampak bencana ID {bencana_id} berhasil diperbarui.",
        "dampak_id": dampak_id,
        "bencana_id": bencana_id
    }

@router.put("/{bencana_id}/verifikasi")
async def verifikasi_bencana(
    bencana_id: int,
    payload: BencanaVerifikasiRequest,
    request: Request,
    current_user: Pengguna = Depends(require_role(["admin", "pimpinan"])),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Admin Pusdalops & Pimpinan: Memverifikasi laporan kejadian bencana agar tayang di peta publik.
    """
    valid_status = ['terverifikasi', 'menunggu', 'ditolak']
    if payload.status_verifikasi not in valid_status:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": {"code": "INVALID_STATUS", "message": f"Status verifikasi harus salah satu dari: {', '.join(valid_status)}"}}
        )

    query = text("""
        UPDATE kejadian_bencana
        SET status_verifikasi = :status,
            updated_at = now()
        WHERE id = :id
        RETURNING id, jenis_bencana, status_verifikasi;
    """)
    res = await db.execute(query, {"status": payload.status_verifikasi, "id": bencana_id})
    row = res.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": f"Kejadian bencana ID {bencana_id} tidak ditemukan."}}
        )

    # Catat Audit Log
    client_ip = request.client.host if request.client else None
    await record_audit(
        db=db,
        pengguna_id=current_user.id,
        aksi="VERIFIKASI_BENCANA",
        tabel_target="kejadian_bencana",
        record_id=bencana_id,
        detail={"status": payload.status_verifikasi, "catatan": payload.catatan},
        ip_address=client_ip
    )

    await db.commit()

    await broadcaster.broadcast("laporan_diverifikasi", {
        "id": row.id,
        "jenis_bencana": row.jenis_bencana,
        "status_verifikasi": row.status_verifikasi,
        "verified_by": current_user.nama,
        "catatan": payload.catatan
    })

    return {
        "message": f"Status verifikasi kejadian ID {bencana_id} diubah menjadi '{row.status_verifikasi}'.",
        "id": row.id,
        "status_verifikasi": row.status_verifikasi
    }

@router.delete("/{bencana_id}")
async def delete_bencana(
    bencana_id: int,
    request: Request,
    current_user: Pengguna = Depends(require_role(["admin", "super_admin"])),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Khusus Admin & Super Admin: Menghapus kejadian bencana dan data dampaknya dari sistem.
    """
    query = text("DELETE FROM kejadian_bencana WHERE id = :id RETURNING id, jenis_bencana;")
    res = await db.execute(query, {"id": bencana_id})
    row = res.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": f"Kejadian bencana ID {bencana_id} tidak ditemukan."}}
        )

    # Catat Audit Log
    client_ip = request.client.host if request.client else None
    await record_audit(
        db=db,
        pengguna_id=current_user.id,
        aksi="DELETE_BENCANA",
        tabel_target="kejadian_bencana",
        record_id=bencana_id,
        detail={"jenis": row.jenis_bencana},
        ip_address=client_ip
    )

    await db.commit()

    return {
        "message": f"Kejadian bencana '{row.jenis_bencana}' (ID {bencana_id}) berhasil dihapus.",
        "id": row.id
    }

