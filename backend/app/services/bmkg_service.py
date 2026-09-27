import httpx
import asyncio
import re
import logging
from datetime import datetime, timezone
from sqlalchemy import text
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.config import settings
from app.core.database import sync_engine
from app.routers.events import broadcaster

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

# Filter spasial Bounding Box Provinsi Sumatera Barat (termasuk Kepulauan Mentawai & zona subduksi megathrust)
SUMBAR_BOUNDS = {
    "lat_min": -3.5,
    "lat_max": 0.9,
    "lon_min": 98.5,
    "lon_max": 101.9
}

SUMBAR_KEYWORDS = [
    "sumbar", "sumatera barat", "padang", "bukittinggi", "pariaman", 
    "agam", "pasaman", "solok", "tanah datar", "mentawai", 
    "pesisir selatan", "sijunjung", "dharmasraya", "sawahlunto", 
    "payakumbuh", "lima puluh kota", "50 kota", "singkarak", "maninjau", "marapi"
]

def is_in_sumbar(lat: float, lon: float, wilayah_teks: str) -> bool:
    """
    Mengecek apakah koordinat atau wilayah berada di teritori/zona ancaman Sumatera Barat.
    """
    in_box = (
        SUMBAR_BOUNDS["lat_min"] <= lat <= SUMBAR_BOUNDS["lat_max"] and
        SUMBAR_BOUNDS["lon_min"] <= lon <= SUMBAR_BOUNDS["lon_max"]
    )
    if in_box:
        return True

    text_lower = (wilayah_teks or "").lower()
    return any(keyword in text_lower for keyword in SUMBAR_KEYWORDS)

def upsert_gempa_sync(
    external_id: str,
    magnitude: float,
    kedalaman_km: float,
    lon: float,
    lat: float,
    wilayah_teks: str,
    waktu_kejadian: datetime,
    potensi_tsunami: bool,
    dirasakan: bool,
    shakemap_url: str = ""
) -> tuple[bool, dict]:
    """
    Menyimpan atau memperbarui data gempa BMKG ke PostGIS.
    Mengembalikan (is_inserted, gempa_dict) menggunakan fitur PostgreSQL `xmax = 0`
    untuk mendeteksi event gempa baru secara 100% deterministik.
    """
    with sync_engine.connect() as conn:
        query = text("""
            INSERT INTO gempa_bmkg (
                external_id, magnitude, kedalaman_km, lokasi, 
                wilayah_teks, waktu_kejadian, potensi_tsunami, dirasakan, synced_at
            )
            VALUES (
                :external_id, :magnitude, :kedalaman_km, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326),
                :wilayah_teks, :waktu_kejadian, :potensi_tsunami, :dirasakan, now()
            )
            ON CONFLICT (external_id) DO UPDATE
            SET magnitude = EXCLUDED.magnitude,
                kedalaman_km = EXCLUDED.kedalaman_km,
                lokasi = EXCLUDED.lokasi,
                wilayah_teks = EXCLUDED.wilayah_teks,
                waktu_kejadian = EXCLUDED.waktu_kejadian,
                potensi_tsunami = EXCLUDED.potensi_tsunami,
                dirasakan = EXCLUDED.dirasakan,
                synced_at = now()
            RETURNING (xmax = 0) AS is_inserted, id, external_id, magnitude, kedalaman_km, wilayah_teks, potensi_tsunami, dirasakan;
        """)
        res = conn.execute(query, {
            "external_id": external_id,
            "magnitude": magnitude,
            "kedalaman_km": kedalaman_km,
            "lon": lon,
            "lat": lat,
            "wilayah_teks": wilayah_teks,
            "waktu_kejadian": waktu_kejadian,
            "potensi_tsunami": potensi_tsunami,
            "dirasakan": dirasakan
        })
        conn.commit()
        row = res.fetchone()
        if not row:
            return False, {}

        gempa_info = {
            "id": row.id,
            "external_id": row.external_id,
            "magnitude": float(row.magnitude) if row.magnitude is not None else magnitude,
            "kedalaman_km": float(row.kedalaman_km) if row.kedalaman_km is not None else kedalaman_km,
            "lat": lat,
            "lon": lon,
            "wilayah": row.wilayah_teks,
            "waktu": waktu_kejadian.isoformat() if waktu_kejadian else None,
            "potensi_tsunami": bool(row.potensi_tsunami),
            "dirasakan": bool(row.dirasakan),
            "shakemap_url": shakemap_url
        }
        return bool(row.is_inserted), gempa_info

async def sync_autogempa(client: httpx.AsyncClient) -> None:
    """
    Sinkronisasi Gempa Terkini Nasional M5.0+ (BMKG autogempa.json)
    """
    try:
        resp = await client.get(settings.BMKG_AUTOGEMPA_URL)
        if resp.status_code != 200:
            logger.warning(f"[BMKG Autogempa] Status code {resp.status_code}")
            return

        data = resp.json()
        g = data.get("Infogempa", {}).get("gempa", {})
        if not g:
            return

        raw_coords = [float(x.strip()) for x in g["Coordinates"].split(",")]
        lat, lon = (raw_coords[0], raw_coords[1]) if abs(raw_coords[0]) <= 90 and raw_coords[1] > 90 else (raw_coords[1], raw_coords[0])

        potensi_tsunami = "tsunami" in g.get("Potensi", "").lower()
        external_id = f"{g['Tanggal']}_{g['Jam']}"
        kedalaman_num = float(re.sub(r"[^\d.]", "", g.get("Kedalaman", "10")))
        shakemap = g.get("Shakemap", "")
        shakemap_url = f"https://data.bmkg.go.id/DataMKG/TEWS/{shakemap}" if shakemap else ""

        waktu_dt = None
        if "DateTime" in g:
            try:
                waktu_dt = datetime.fromisoformat(g["DateTime"])
            except Exception:
                waktu_dt = datetime.now(timezone.utc)
        else:
            waktu_dt = datetime.now(timezone.utc)

        is_new, gempa_info = await asyncio.to_thread(
            upsert_gempa_sync,
            external_id=external_id,
            magnitude=float(g.get("Magnitude", 0.0)),
            kedalaman_km=kedalaman_num,
            lon=lon,
            lat=lat,
            wilayah_teks=g.get("Wilayah", ""),
            waktu_kejadian=waktu_dt,
            potensi_tsunami=potensi_tsunami,
            dirasakan=bool(g.get("Dirasakan")),
            shakemap_url=shakemap_url
        )

        if is_new:
            logger.info(f"[BMKG EWS] Gempa baru terdeteksi: M{gempa_info['magnitude']} - {gempa_info['wilayah']}")
            await broadcaster.broadcast("gempa_baru", gempa_info)

    except Exception as e:
        logger.error(f"[BMKG Autogempa Error]: {e}")

async def sync_gempa_dirasakan(client: httpx.AsyncClient) -> None:
    """
    Sinkronisasi Gempa Dirasakan BMKG (gempadirasakan.json).
    Krusial untuk mendeteksi gempa dangkal segmen Sesar Semangko / Sesar Sumatera di darat Sumbar (M3.0 - M4.9).
    """
    try:
        url = getattr(settings, "BMKG_GEMPADIRASAKAN_URL", "https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json")
        resp = await client.get(url)
        if resp.status_code != 200:
            logger.warning(f"[BMKG Gempa Dirasakan] Status code {resp.status_code}")
            return

        data = resp.json()
        list_gempa = data.get("Infogempa", {}).get("gempa", [])
        if not isinstance(list_gempa, list):
            list_gempa = [list_gempa]

        for g in list_gempa:
            coords_str = g.get("Coordinates", "")
            if not coords_str:
                continue

            raw_coords = [float(x.strip()) for x in coords_str.split(",")]
            lat, lon = (raw_coords[0], raw_coords[1]) if abs(raw_coords[0]) <= 90 and raw_coords[1] > 90 else (raw_coords[1], raw_coords[0])

            wilayah = g.get("Wilayah", "")
            # Filter gempa terfokus pada wilayah Sumatera Barat
            if not is_in_sumbar(lat, lon, wilayah):
                continue

            external_id = f"DIRASAKAN_{g.get('Tanggal')}_{g.get('Jam')}"
            kedalaman_num = float(re.sub(r"[^\d.]", "", g.get("Kedalaman", "10")))

            waktu_dt = None
            if "DateTime" in g:
                try:
                    waktu_dt = datetime.fromisoformat(g["DateTime"])
                except Exception:
                    waktu_dt = datetime.now(timezone.utc)
            else:
                waktu_dt = datetime.now(timezone.utc)

            is_new, gempa_info = await asyncio.to_thread(
                upsert_gempa_sync,
                external_id=external_id,
                magnitude=float(g.get("Magnitude", 0.0)),
                kedalaman_km=kedalaman_num,
                lon=lon,
                lat=lat,
                wilayah_teks=wilayah,
                waktu_kejadian=waktu_dt,
                potensi_tsunami=False,
                dirasakan=True,
                shakemap_url=""
            )

            if is_new:
                logger.info(f"[BMKG EWS Sesar Darat] Gempa lokal Sumbar terdeteksi: M{gempa_info['magnitude']} - {wilayah}")
                await broadcaster.broadcast("gempa_baru", gempa_info)

    except Exception as e:
        logger.error(f"[BMKG Gempa Dirasakan Error]: {e}")

async def sync_gempa_bmkg():
    """
    Sinkronisasi Multi-Feed BMKG (Autogempa M5.0+ dan Gempa Dirasakan Sesar Darat Sumbar).
    """
    headers = {"User-Agent": "gis-kebencanaan-sumbar/1.4"}
    async with httpx.AsyncClient(timeout=12.0, headers=headers) as client:
        await sync_autogempa(client)
        await sync_gempa_dirasakan(client)

def start_bmkg_scheduler():
    """
    Menjalankan scheduler background APScheduler untuk sinkronisasi BMKG:
    - Gempa bumi Multi-Source: setiap 3 menit
    - Peringatan Dini Cuaca & Galodo (CAP): setiap 15 menit
    """
    if not scheduler.running:
        scheduler.add_job(sync_gempa_bmkg, "interval", minutes=3, id="sync_bmkg_multi_source", replace_existing=True)
        from app.services.bmkg_weather_service import sync_bmkg_weather_alerts
        scheduler.add_job(sync_bmkg_weather_alerts, "interval", minutes=15, id="sync_bmkg_weather_cap", replace_existing=True)
        scheduler.start()
        logger.info("[Scheduler] APScheduler BMKG (Gempa 3 menit & Cuaca 15 menit) aktif.")
