from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union

from app.core.database import get_async_db
from app.services.routing_service import kalkulasi_evakuasi_darurat, get_nearest_posko, classify_disaster_flow

router = APIRouter(prefix="", tags=["Routing Evakuasi & Posko"])

class EvakuasiRequest(BaseModel):
    lat: Optional[float] = Field(default=None, ge=-90.0, le=90.0, description="Lintang titik pengguna")
    lon: Optional[float] = Field(default=None, ge=-180.0, le=180.0, description="Bujur titik pengguna")
    kecamatan_id: Optional[Union[int, str]] = Field(default=None, description="ID atau kode kecamatan hasil cascading combobox")
    jenis_bencana: Optional[str] = Field(default="gempa", description="tsunami | gempa | galodo | banjir | longsor | erupsi")
    moda: Optional[str] = Field(default="mobil", description="Moda transportasi: mobil | motor | jalan_kaki")
    dest_lat: Optional[float] = Field(default=None, ge=-90.0, le=90.0, description="Lintang titik tujuan spesifik (opsional)")
    dest_lon: Optional[float] = Field(default=None, ge=-180.0, le=180.0, description="Bujur titik tujuan spesifik (opsional)")
    dest_nama: Optional[str] = Field(default=None, description="Nama titik tujuan spesifik (opsional)")
    posko_id: Optional[int] = Field(default=None, description="ID posko tujuan spesifik (opsional)")

class InstruksiLangkah(BaseModel):
    teks: str
    jarak_m: int
    nama_jalan: Optional[str] = ""

class PoskoInfo(BaseModel):
    id: int
    nama: str
    alamat: Optional[str] = None
    jenis: Optional[str] = None
    kapasitas: Optional[int] = None
    fasilitas: Optional[List[str]] = []
    kontak_pic: Optional[str] = None
    kontak_telepon: Optional[str] = None
    lat: float
    lon: float

class ProfilElevasi(BaseModel):
    elevasi_asal_mdpl: float
    elevasi_tujuan_mdpl: float
    elevasi_efektif_mdpl: float
    gain_elevasi_m: float
    is_shelter_vertikal: bool
    aman_tsunami: bool
    catatan_elevasi: str

class DetourInfo(BaseModel):
    aktif: bool
    nama_koridor: str
    catatan: str

class EvakuasiResponse(BaseModel):
    alur: str = Field(..., description="PROTOKOL_TSUNAMI | PROTOKOL_GALODO | PROTOKOL_GEMPA_SESAR | PROTOKOL_ERUPSI")
    jenis_bencana: str
    posko: PoskoInfo
    jarak_km: float
    jarak_lurus_km: Optional[float] = None
    routing_engine: Optional[str] = "osrm"
    estimasi_menit: int
    geometry: Dict[str, Any]
    instruksi: List[InstruksiLangkah]
    menghindari_blokade: bool
    detour_info: Optional[DetourInfo] = None
    profil_elevasi: Optional[ProfilElevasi] = None
    hazard_warnings: Optional[List[str]] = []
    is_fallback: bool = False
    fallback_info: Optional[Dict[str, Any]] = None
    zonasi_info: Optional[Dict[str, Any]] = None
    kecamatan_id: Optional[Union[int, str]] = None

@router.post("/routing/evakuasi", response_model=EvakuasiResponse)
async def evakuasi_darurat(
    payload: EvakuasiRequest,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Endpoint Inti Evakuasi Terpadu:
    - ALUR A (Tsunami): Rekomendasi shelter di luar zona bahaya / shelter vertikal TES
    - ALUR B (Non-Tsunami: Galodo & Gempa): Posko terdekat dalam kecamatan yang sama
    - Fallback cerdas jika kecamatan belum memiliki posko aktif
    - Menghitung rute turn-by-turn turn sadar blokade jalan (OSRM / Valhalla)
    """
    try:
        hasil = await kalkulasi_evakuasi_darurat(
            db=db,
            lat=payload.lat,
            lon=payload.lon,
            kecamatan_id=payload.kecamatan_id,
            jenis_bencana=payload.jenis_bencana or "gempa",
            moda=payload.moda or "mobil",
            dest_lat=payload.dest_lat,
            dest_lon=payload.dest_lon,
            dest_nama=payload.dest_nama,
            posko_id=payload.posko_id
        )
        return hasil
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "POSKO_NOT_FOUND",
                    "message": str(e)
                }
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "ROUTING_FAILED",
                    "message": f"Gagal menghitung rute evakuasi: {str(e)}"
                }
            }
        )

@router.get("/routing/bencana-aktif")
async def cek_status_bencana_aktif(
    db: AsyncSession = Depends(get_async_db)
):
    """
    Mendeteksi status ancaman bencana aktif di Sumatera Barat secara real-time:
    - Cek apakah ada gempa dengan potensi tsunami (Alur A)
    - Cek peringatan dini cuaca ekstrem / galodo lahar dingin Marapi (Alur B)
    - Rekomendasi alur default untuk tombol Evakuasi Sekarang
    """
    # 1. Cek potensi tsunami gempa BMKG
    tsunami_q = text("""
        SELECT external_id, magnitude, wilayah_teks, waktu_kejadian, potensi_tsunami
        FROM gempa_bmkg
        WHERE potensi_tsunami = true AND waktu_kejadian >= now() - INTERVAL '24 hours'
        ORDER BY waktu_kejadian DESC LIMIT 1;
    """)
    tsunami_row = (await db.execute(tsunami_q)).fetchone()

    # 2. Cek gempa darat dangkal Sesar Semangko lokal (M >= 4.0, kedalaman <= 30km di darat Sumbar)
    sesar_q = text("""
        SELECT external_id, magnitude, wilayah_teks, waktu_kejadian, kedalaman_km
        FROM gempa_bmkg
        WHERE waktu_kejadian >= now() - INTERVAL '24 hours'
          AND magnitude >= 4.0
          AND (kedalaman_km IS NULL OR kedalaman_km <= 35)
          AND (
            LOWER(wilayah_teks) LIKE '%bukittinggi%' OR
            LOWER(wilayah_teks) LIKE '%padang panjang%' OR
            LOWER(wilayah_teks) LIKE '%solok%' OR
            LOWER(wilayah_teks) LIKE '%tanah datar%' OR
            LOWER(wilayah_teks) LIKE '%agam%' OR
            LOWER(wilayah_teks) LIKE '%pasaman%'
          )
        ORDER BY waktu_kejadian DESC LIMIT 1;
    """)
    sesar_row = (await db.execute(sesar_q)).fetchone()

    # 3. Cek peringatan cuaca / lahar dingin / erupsi
    cuaca_q = text("""
        SELECT identifier, event, headline, severity, area_desc
        FROM peringatan_cuaca_bmkg
        WHERE expires >= now() OR created_at >= now() - INTERVAL '12 hours'
        ORDER BY id DESC LIMIT 1;
    """)
    cuaca_row = (await db.execute(cuaca_q)).fetchone()

    if tsunami_row:
        return {
            "status_siaga": "BAHAYA_TSUNAMI",
            "alur_rekomendasi": "PROTOKOL_TSUNAMI",
            "jenis_bencana_aktif": "tsunami",
            "keterangan": f"Peringatan Dini Tsunami Aktif: Gempa M{tsunami_row.magnitude} di {tsunami_row.wilayah_teks}",
            "data": {
                "gempa_id": tsunami_row.external_id,
                "magnitude": float(tsunami_row.magnitude),
                "waktu": tsunami_row.waktu_kejadian.isoformat() if tsunami_row.waktu_kejadian else None
            }
        }
    elif cuaca_row and ("galodo" in (cuaca_row.event or "").lower() or "lahar" in (cuaca_row.headline or "").lower()):
        return {
            "status_siaga": "SIAGA_GALODO",
            "alur_rekomendasi": "PROTOKOL_GALODO",
            "jenis_bencana_aktif": "galodo",
            "keterangan": f"Peringatan Banjir Lahar Dingin (Galodo): {cuaca_row.headline}",
            "data": {
                "event": cuaca_row.event,
                "area": cuaca_row.area_desc
            }
        }
    elif sesar_row:
        return {
            "status_siaga": "WASPADA_GEMPA_SESAR",
            "alur_rekomendasi": "PROTOKOL_GEMPA_SESAR",
            "jenis_bencana_aktif": "gempa",
            "keterangan": f"Gempa Darat Dangkal Sesar Semangko M{sesar_row.magnitude} di {sesar_row.wilayah_teks}",
            "data": {
                "gempa_id": sesar_row.external_id,
                "magnitude": float(sesar_row.magnitude),
                "kedalaman": float(sesar_row.kedalaman_km or 10),
                "waktu": sesar_row.waktu_kejadian.isoformat() if sesar_row.waktu_kejadian else None
            }
        }
    else:
        return {
            "status_siaga": "NORMAL_SIAGA",
            "alur_rekomendasi": "PROTOKOL_GEMPA_SESAR",
            "jenis_bencana_aktif": "gempa",
            "keterangan": "Tidak ada peringatan tsunami seketika. Siaga darurat kesiapsiagaan bencana aktif.",
            "data": None
        }



