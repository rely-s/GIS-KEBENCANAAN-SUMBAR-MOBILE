from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from app.core.database import get_async_db
from app.core.dependencies import require_role
from app.models.pengguna import Pengguna
from app.services.routing_service import get_nearest_posko
from app.services.audit_service import record_audit

router = APIRouter(prefix="/posko", tags=["Posko Evakuasi & Mitigasi (CRUD)"])

# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class PoskoCreateRequest(BaseModel):
    nama: str = Field(..., max_length=150, description="Nama posko atau fasilitas evakuasi")
    jenis: str = Field(
        default="posko_utama",
        description="posko_utama | posko_pengungsi | titik_kumpul | shelter_sementara | fasilitas_kesehatan | shelter_tes_tea | sirine_tsunami"
    )
    lat: float = Field(..., ge=-10.0, le=10.0, description="Latitude titik posko (WGS84)")
    lon: float = Field(..., ge=90.0, le=145.0, description="Longitude titik posko (WGS84)")
    kapasitas: Optional[int] = Field(default=100, ge=0, description="Daya tampung maksimum pengungsi")
    fasilitas: Optional[List[str]] = Field(default_factory=list, description="Daftar fasilitas [air_bersih, mck, dapur_umum, genset, faskes, ramah_difabel]")
    kontak_pic: Optional[str] = Field(default=None, max_length=100, description="Nama penanggung jawab lapangan")
    kontak_telepon: Optional[str] = Field(default=None, max_length=30, description="Nomor telepon darurat PIC")
    status: Optional[str] = Field(default="aktif", description="aktif | penuh | nonaktif")
    wilayah_id: Optional[int] = Field(default=None, description="ID wilayah administratif")
    
    # Standar Kemanusiaan & Pilah Kelompok Rentan BNPB
    jumlah_pengungsi_pria: Optional[int] = Field(default=0, ge=0)
    jumlah_pengungsi_wanita: Optional[int] = Field(default=0, ge=0)
    jumlah_pengungsi_lansia: Optional[int] = Field(default=0, ge=0)
    jumlah_pengungsi_balita: Optional[int] = Field(default=0, ge=0)
    jumlah_pengungsi_disabilitas: Optional[int] = Field(default=0, ge=0)
    ketersediaan_air_bersih: Optional[str] = Field(default="YA")
    ketersediaan_dapur_umum: Optional[str] = Field(default="TIDAK")
    ketersediaan_tenaga_medis: Optional[str] = Field(default="TIDAK")

class PoskoUpdateRequest(BaseModel):
    nama: Optional[str] = Field(None, max_length=150)
    jenis: Optional[str] = None
    lat: Optional[float] = Field(None, ge=-10.0, le=10.0)
    lon: Optional[float] = Field(None, ge=90.0, le=145.0)
    kapasitas: Optional[int] = Field(None, ge=0)
    fasilitas: Optional[List[str]] = None
    kontak_pic: Optional[str] = None
    kontak_telepon: Optional[str] = None
    status: Optional[str] = None
    wilayah_id: Optional[int] = None
    jumlah_pengungsi_pria: Optional[int] = Field(None, ge=0)
    jumlah_pengungsi_wanita: Optional[int] = Field(None, ge=0)
    jumlah_pengungsi_lansia: Optional[int] = Field(None, ge=0)
    jumlah_pengungsi_balita: Optional[int] = Field(None, ge=0)
    jumlah_pengungsi_disabilitas: Optional[int] = Field(None, ge=0)
    ketersediaan_air_bersih: Optional[str] = None
    ketersediaan_dapur_umum: Optional[str] = None
    ketersediaan_tenaga_medis: Optional[str] = None

class PoskoStatusRequest(BaseModel):
    status: str = Field(..., description="Status: aktif | penuh | nonaktif")
    kapasitas: Optional[int] = None

# ============================================================================
# ENDPOINTS PUBLIK & BACA (READ)
# ============================================================================

@router.get("", include_in_schema=True)
@router.get("/", include_in_schema=False)
async def list_semua_posko(
    lat: Optional[float] = Query(None, description="Latitude pengguna untuk sorting jarak terdekat"),
    lon: Optional[float] = Query(None, description="Longitude pengguna untuk sorting jarak terdekat"),
    limit: Optional[int] = Query(None, ge=1, le=100, description="Batas jumlah hasil"),
    jenis: Optional[str] = None,
    include_nonaktif: bool = False,
    wilayah_id: Optional[int] = None,
    id_kecamatan: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Mengembalikan daftar posko/shelter/sirine dalam format GeoJSON FeatureCollection.
    Mendukung sorting jarak spasial terdekat jika parameter lat dan lon diberikan.
    """
    conditions = []
    params: Dict[str, Any] = {}

    if not include_nonaktif and jenis != "sirine_tsunami":
        conditions.append("status = 'aktif'")
    if jenis:
        conditions.append("jenis = :jenis")
        params["jenis"] = jenis
    if wilayah_id:
        conditions.append("wilayah_id = :wilayah_id")
        params["wilayah_id"] = wilayah_id
    if id_kecamatan:
        conditions.append("(id_kecamatan = :id_kecamatan OR wilayah_id IN (SELECT wilayah_administratif_id FROM kecamatan WHERE id = :id_kecamatan))")
        params["id_kecamatan"] = id_kecamatan
    if search:
        conditions.append("LOWER(nama) LIKE :search")
        params["search"] = f"%{search.lower()}%"

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    has_coords = lat is not None and lon is not None
    if has_coords:
        params["lat"] = lat
        params["lon"] = lon
        dist_field = ", ST_Distance(lokasi::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography) AS jarak_meter"
        order_clause = "ORDER BY lokasi <-> ST_SetSRID(ST_MakePoint(:lon, :lat), 4326) ASC"
    else:
        dist_field = ", NULL AS jarak_meter"
        order_clause = "ORDER BY id DESC"

    limit_clause = ""
    if limit is not None:
        params["limit"] = limit
        limit_clause = "LIMIT :limit"

    features = []
    try:
        query = text(f"""
            SELECT 
                id, nama, jenis, kapasitas, fasilitas, kontak_pic, kontak_telepon, status, wilayah_id, id_kecamatan,
                jumlah_pengungsi_pria, jumlah_pengungsi_wanita, jumlah_pengungsi_lansia, jumlah_pengungsi_balita, jumlah_pengungsi_disabilitas,
                ketersediaan_air_bersih, ketersediaan_dapur_umum, ketersediaan_tenaga_medis,
                ST_X(lokasi) AS lon, ST_Y(lokasi) AS lat, updated_at{dist_field}
            FROM posko_evakuasi
            {where_clause}
            {order_clause}
            {limit_clause};
        """)
        result = await db.execute(query, params)
        rows = result.fetchall()

        for r in rows:
            j_meter = round(float(r.jarak_meter)) if getattr(r, 'jarak_meter', None) is not None else None
            j_km = round(j_meter / 1000.0, 2) if j_meter is not None else None

            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [float(r.lon), float(r.lat)]
                },
                "properties": {
                    "id": r.id,
                    "nama": r.nama,
                    "jenis": r.jenis,
                    "kapasitas": r.kapasitas,
                    "fasilitas": r.fasilitas or [],
                    "kontak_pic": r.kontak_pic,
                    "kontak_telepon": r.kontak_telepon,
                    "status": r.status,
                    "wilayah_id": r.wilayah_id,
                    "id_kecamatan": r.id_kecamatan,
                    "jarak_meter": j_meter,
                    "jarak_km": j_km,
                    "jumlah_pengungsi_pria": r.jumlah_pengungsi_pria or 0,
                    "jumlah_pengungsi_wanita": r.jumlah_pengungsi_wanita or 0,
                    "jumlah_pengungsi_lansia": r.jumlah_pengungsi_lansia or 0,
                    "jumlah_pengungsi_balita": r.jumlah_pengungsi_balita or 0,
                    "jumlah_pengungsi_disabilitas": r.jumlah_pengungsi_disabilitas or 0,
                    "ketersediaan_air_bersih": r.ketersediaan_air_bersih or "YA",
                    "ketersediaan_dapur_umum": r.ketersediaan_dapur_umum or "TIDAK",
                    "ketersediaan_tenaga_medis": r.ketersediaan_tenaga_medis or "TIDAK",
                    "updated_at": r.updated_at.isoformat() if r.updated_at else None
                }
            })
    except Exception as e:
        # Fallback menggunakan katalog posko & shelter resmi terverifikasi BPBD Sumbar
        from app.services.routing_service import OFFICIAL_SUMBAR_SHELTERS
        import math

        for s in OFFICIAL_SUMBAR_SHELTERS:
            if jenis and s.get("jenis") != jenis:
                continue
            p_lat, p_lon = s["lat"], s["lon"]
            
            j_meter = None
            j_km = None
            if has_coords:
                # Formula Haversine Geodesik Presisi Tinggi
                R = 6371000.0  # meter
                phi1, phi2 = math.radians(lat), math.radians(p_lat)
                dphi = math.radians(p_lat - lat)
                dlam = math.radians(p_lon - lon)
                a = (math.sin(dphi / 2.0) ** 2 +
                     math.cos(phi1) * math.cos(phi2) * (math.sin(dlam / 2.0) ** 2))
                c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
                j_meter = round(R * c)
                j_km = round(j_meter / 1000.0, 2)

            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [p_lon, p_lat]
                },
                "properties": {
                    "id": s["id"],
                    "nama": s["nama"],
                    "jenis": s.get("jenis", "shelter_tes_tea"),
                    "kapasitas": s.get("kapasitas", 1000),
                    "fasilitas": s.get("fasilitas", []),
                    "kontak_pic": s.get("kontak_pic", "Pusdalops BPBD"),
                    "kontak_telepon": s.get("kontak_telepon", "112"),
                    "status": "aktif",
                    "wilayah_id": None,
                    "id_kecamatan": None,
                    "jarak_meter": j_meter,
                    "jarak_km": j_km,
                    "jumlah_pengungsi_pria": 0,
                    "jumlah_pengungsi_wanita": 0,
                    "jumlah_pengungsi_lansia": 0,
                    "jumlah_pengungsi_balita": 0,
                    "jumlah_pengungsi_disabilitas": 0,
                    "ketersediaan_air_bersih": "YA",
                    "ketersediaan_dapur_umum": "YA",
                    "ketersediaan_tenaga_medis": "YA",
                    "updated_at": None
                }
            })

        if has_coords:
            features.sort(key=lambda f: f["properties"]["jarak_meter"] if f["properties"]["jarak_meter"] is not None else float("inf"))

        if limit is not None:
            features = features[:limit]

    return {
        "type": "FeatureCollection",
        "features": features
    }

@router.get("/geojson")
async def list_posko_geojson(
    jenis: Optional[str] = None,
    include_nonaktif: bool = False,
    wilayah_id: Optional[int] = None,
    id_kecamatan: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Endpoint Khusus MapLibre GL JS: Menyajikan GeoJSON FeatureCollection titik posko & shelter
    lengkap dengan atribut kapasitas untuk clustering terakselerasi GPU.
    """
    return await list_semua_posko(jenis, include_nonaktif, wilayah_id, id_kecamatan, search, db)

@router.get("/nearest")
async def nearest_posko_endpoint(
    lat: float,
    lon: float,
    limit: int = 3,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Mencari posko evakuasi terdekat menggunakan operator spasial PostGIS KNN (<->).
    """
    poskos = await get_nearest_posko(db, lat, lon, limit=limit)
    return {"data": poskos}

@router.get("/sirine/status")
async def status_sirine_tsunami(
    db: AsyncSession = Depends(get_async_db)
):
    """
    Mengembalikan telemetri dan status operasional seluruh 46 sirine EWS Tsunami BPBD.
    """
    query = text("""
        SELECT 
            p.id, p.nama, p.status, p.kontak_pic, p.kontak_telepon,
            ST_X(p.lokasi) AS lon, ST_Y(p.lokasi) AS lat,
            w.nama AS wilayah_nama, p.updated_at
        FROM posko_evakuasi p
        LEFT JOIN wilayah_administratif w ON w.id = p.wilayah_id
        WHERE p.jenis = 'sirine_tsunami'
        ORDER BY p.id ASC;
    """)
    result = await db.execute(query)
    rows = result.fetchall()

    items = []
    for r in rows:
        items.append({
            "id": r.id,
            "nama": r.nama,
            "status": r.status or "aktif",
            "wilayah": r.wilayah_nama or "Pesisir Barat Sumbar",
            "lat": float(r.lat),
            "lon": float(r.lon),
            "radius_akustik_km": 2.0,
            "kontak_pic": r.kontak_pic,
            "kontak_telepon": r.kontak_telepon,
            "terakhir_diperiksa": r.updated_at.isoformat() if r.updated_at else None
        })

    return {
        "total_sirine": len(items),
        "aktif_siaga": sum(1 for s in items if s["status"] == "aktif"),
        "dalam_pemeliharaan": sum(1 for s in items if s["status"] != "aktif"),
        "data": items
    }

@router.get("/{posko_id}")
async def detail_posko(
    posko_id: int,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Mengambil data detail tunggal dari suatu posko/shelter.
    """
    query = text("""
        SELECT 
            p.id, p.nama, p.jenis, p.kapasitas, p.fasilitas, p.kontak_pic, p.kontak_telepon, p.status,
            p.wilayah_id, w.nama AS wilayah_nama,
            p.jumlah_pengungsi_pria, p.jumlah_pengungsi_wanita, p.jumlah_pengungsi_lansia,
            p.jumlah_pengungsi_balita, p.jumlah_pengungsi_disabilitas,
            p.ketersediaan_air_bersih, p.ketersediaan_dapur_umum, p.ketersediaan_tenaga_medis,
            ST_X(p.lokasi) AS lon, ST_Y(p.lokasi) AS lat, p.created_at, p.updated_at
        FROM posko_evakuasi p
        LEFT JOIN wilayah_administratif w ON w.id = p.wilayah_id
        WHERE p.id = :posko_id;
    """)
    result = await db.execute(query, {"posko_id": posko_id})
    row = result.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": f"Posko dengan ID {posko_id} tidak ditemukan."}}
        )

    return {
        "id": row.id,
        "nama": row.nama,
        "jenis": row.jenis,
        "kapasitas": row.kapasitas,
        "fasilitas": row.fasilitas or [],
        "kontak_pic": row.kontak_pic,
        "kontak_telepon": row.kontak_telepon,
        "status": row.status,
        "wilayah_id": row.wilayah_id,
        "wilayah_nama": row.wilayah_nama,
        "jumlah_pengungsi_pria": row.jumlah_pengungsi_pria or 0,
        "jumlah_pengungsi_wanita": row.jumlah_pengungsi_wanita or 0,
        "jumlah_pengungsi_lansia": row.jumlah_pengungsi_lansia or 0,
        "jumlah_pengungsi_balita": row.jumlah_pengungsi_balita or 0,
        "jumlah_pengungsi_disabilitas": row.jumlah_pengungsi_disabilitas or 0,
        "ketersediaan_air_bersih": row.ketersediaan_air_bersih or "YA",
        "ketersediaan_dapur_umum": row.ketersediaan_dapur_umum or "TIDAK",
        "ketersediaan_tenaga_medis": row.ketersediaan_tenaga_medis or "TIDAK",
        "lat": float(row.lat),
        "lon": float(row.lon),
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None
    }

# ============================================================================
# ENDPOINTS MUTASI (CREATE, UPDATE, DELETE) - KHUSUS OPERATOR & ADMIN
# ============================================================================

@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_posko(
    payload: PoskoCreateRequest,
    request: Request,
    current_user: Pengguna = Depends(require_role(["operator", "admin"])),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Operator & Admin: Menambahkan titik posko evakuasi, shelter vertikal TES, atau sirine baru.
    """
    valid_jenis = ['posko_utama', 'posko_pengungsi', 'titik_kumpul', 'shelter_sementara', 'fasilitas_kesehatan', 'shelter_tes_tea', 'sirine_tsunami']
    if payload.jenis not in valid_jenis:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": {"code": "INVALID_JENIS", "message": f"Jenis posko harus salah satu dari: {', '.join(valid_jenis)}"}}
        )

    valid_status = ['aktif', 'penuh', 'nonaktif']
    if payload.status not in valid_status:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": {"code": "INVALID_STATUS", "message": f"Status posko harus salah satu dari: {', '.join(valid_status)}"}}
        )

    query = text("""
        INSERT INTO posko_evakuasi (
            nama, jenis, lokasi, kapasitas, fasilitas, kontak_pic, kontak_telepon, status, wilayah_id,
            jumlah_pengungsi_pria, jumlah_pengungsi_wanita, jumlah_pengungsi_lansia, jumlah_pengungsi_balita, jumlah_pengungsi_disabilitas,
            ketersediaan_air_bersih, ketersediaan_dapur_umum, ketersediaan_tenaga_medis,
            created_at, updated_at
        ) VALUES (
            :nama, :jenis, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326),
            :kapasitas, :fasilitas, :kontak_pic, :kontak_telepon, :status, :wilayah_id,
            :pria, :wanita, :lansia, :balita, :disabilitas,
            :air_bersih, :dapur_umum, :tenaga_medis,
            now(), now()
        ) RETURNING id, nama, jenis, status;
    """)

    result = await db.execute(query, {
        "nama": payload.nama,
        "jenis": payload.jenis,
        "lon": payload.lon,
        "lat": payload.lat,
        "kapasitas": payload.kapasitas,
        "fasilitas": payload.fasilitas or [],
        "kontak_pic": payload.kontak_pic,
        "kontak_telepon": payload.kontak_telepon,
        "status": payload.status,
        "wilayah_id": payload.wilayah_id,
        "pria": payload.jumlah_pengungsi_pria or 0,
        "wanita": payload.jumlah_pengungsi_wanita or 0,
        "lansia": payload.jumlah_pengungsi_lansia or 0,
        "balita": payload.jumlah_pengungsi_balita or 0,
        "disabilitas": payload.jumlah_pengungsi_disabilitas or 0,
        "air_bersih": payload.ketersediaan_air_bersih or "YA",
        "dapur_umum": payload.ketersediaan_dapur_umum or "TIDAK",
        "tenaga_medis": payload.ketersediaan_tenaga_medis or "TIDAK"
    })
    row = result.fetchone()

    # Catat Audit Log
    client_ip = request.client.host if request.client else None
    await record_audit(
        db=db,
        pengguna_id=current_user.id,
        aksi="CREATE_POSKO",
        tabel_target="posko_evakuasi",
        record_id=row.id,
        detail={"nama": payload.nama, "jenis": payload.jenis, "lat": payload.lat, "lon": payload.lon},
        ip_address=client_ip
    )

    await db.commit()

    return {
        "message": f"Posko/Aset '{row.nama}' berhasil ditambahkan ke basis data spasial.",
        "id": row.id,
        "nama": row.nama,
        "jenis": row.jenis,
        "status": row.status
    }

@router.put("/{posko_id}")
async def update_posko(
    posko_id: int,
    payload: PoskoUpdateRequest,
    request: Request,
    current_user: Pengguna = Depends(require_role(["operator", "admin"])),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Operator & Admin: Memperbarui data detail posko evakuasi / shelter.
    """
    # Verifikasi eksistensi posko dan validasi anti-BOLA wilayah
    check_query = text("SELECT id, nama, wilayah_id FROM posko_evakuasi WHERE id = :id;")
    existing = (await db.execute(check_query, {"id": posko_id})).fetchone()
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": f"Posko dengan ID {posko_id} tidak ditemukan."}}
        )

    # Validasi Anti-BOLA / IDOR untuk operator daerah
    if current_user.role == "operator" and current_user.wilayah_tugas_id is not None:
        if existing.wilayah_id is not None and existing.wilayah_id != current_user.wilayah_tugas_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": {
                        "code": "FORBIDDEN_WILAYAH",
                        "message": "Akses ditolak: Anda hanya berwenang memperbarui data posko di wilayah tugas Anda."
                    }
                }
            )

    updates = ["updated_at = now()"]
    params: Dict[str, Any] = {"id": posko_id}

    if payload.nama is not None:
        updates.append("nama = :nama")
        params["nama"] = payload.nama
    if payload.jenis is not None:
        updates.append("jenis = :jenis")
        params["jenis"] = payload.jenis
    if payload.kapasitas is not None:
        updates.append("kapasitas = :kapasitas")
        params["kapasitas"] = payload.kapasitas
    if payload.fasilitas is not None:
        updates.append("fasilitas = :fasilitas")
        params["fasilitas"] = payload.fasilitas
    if payload.kontak_pic is not None:
        updates.append("kontak_pic = :kontak_pic")
        params["kontak_pic"] = payload.kontak_pic
    if payload.kontak_telepon is not None:
        updates.append("kontak_telepon = :kontak_telepon")
        params["kontak_telepon"] = payload.kontak_telepon
    if payload.status is not None:
        updates.append("status = :status")
        params["status"] = payload.status
    if payload.wilayah_id is not None:
        updates.append("wilayah_id = :wilayah_id")
        params["wilayah_id"] = payload.wilayah_id
    if payload.jumlah_pengungsi_pria is not None:
        updates.append("jumlah_pengungsi_pria = :pria")
        params["pria"] = payload.jumlah_pengungsi_pria
    if payload.jumlah_pengungsi_wanita is not None:
        updates.append("jumlah_pengungsi_wanita = :wanita")
        params["wanita"] = payload.jumlah_pengungsi_wanita
    if payload.jumlah_pengungsi_lansia is not None:
        updates.append("jumlah_pengungsi_lansia = :lansia")
        params["lansia"] = payload.jumlah_pengungsi_lansia
    if payload.jumlah_pengungsi_balita is not None:
        updates.append("jumlah_pengungsi_balita = :balita")
        params["balita"] = payload.jumlah_pengungsi_balita
    if payload.jumlah_pengungsi_disabilitas is not None:
        updates.append("jumlah_pengungsi_disabilitas = :disabilitas")
        params["disabilitas"] = payload.jumlah_pengungsi_disabilitas
    if payload.ketersediaan_air_bersih is not None:
        updates.append("ketersediaan_air_bersih = :air_bersih")
        params["air_bersih"] = payload.ketersediaan_air_bersih
    if payload.ketersediaan_dapur_umum is not None:
        updates.append("ketersediaan_dapur_umum = :dapur_umum")
        params["dapur_umum"] = payload.ketersediaan_dapur_umum
    if payload.ketersediaan_tenaga_medis is not None:
        updates.append("ketersediaan_tenaga_medis = :tenaga_medis")
        params["tenaga_medis"] = payload.ketersediaan_tenaga_medis
    if payload.lat is not None and payload.lon is not None:
        updates.append("lokasi = ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)")
        params["lat"] = payload.lat
        params["lon"] = payload.lon

    update_sql = text(f"""
        UPDATE posko_evakuasi
        SET {', '.join(updates)}
        WHERE id = :id
        RETURNING id, nama, status, kapasitas;
    """)
    res = await db.execute(update_sql, params)
    row = res.fetchone()

    # Catat Audit Log
    client_ip = request.client.host if request.client else None
    await record_audit(
        db=db,
        pengguna_id=current_user.id,
        aksi="UPDATE_POSKO",
        tabel_target="posko_evakuasi",
        record_id=posko_id,
        detail=params,
        ip_address=client_ip
    )

    await db.commit()

    return {
        "message": f"Data posko '{row.nama}' berhasil diperbarui.",
        "id": row.id,
        "nama": row.nama,
        "status": row.status,
        "kapasitas": row.kapasitas
    }

@router.put("/{posko_id}/status")
async def update_posko_status(
    posko_id: int,
    payload: PoskoStatusRequest,
    request: Request,
    current_user: Pengguna = Depends(require_role(["operator", "admin"])),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Operator & Admin: Memperbarui status ketersediaan posko evakuasi (aktif, penuh, nonaktif).
    """
    valid_status = ['aktif', 'penuh', 'nonaktif']
    if payload.status not in valid_status:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": {"code": "INVALID_STATUS", "message": "Status harus salah satu dari: aktif, penuh, nonaktif"}}
        )

    # Validasi Anti-BOLA / IDOR wilayah
    check_query = text("SELECT id, nama, wilayah_id FROM posko_evakuasi WHERE id = :id;")
    existing = (await db.execute(check_query, {"id": posko_id})).fetchone()
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": f"Posko dengan ID {posko_id} tidak ditemukan."}}
        )

    if current_user.role == "operator" and current_user.wilayah_tugas_id is not None:
        if existing.wilayah_id is not None and existing.wilayah_id != current_user.wilayah_tugas_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": {
                        "code": "FORBIDDEN_WILAYAH",
                        "message": "Akses ditolak: Anda hanya berwenang memperbarui status posko di wilayah tugas Anda."
                    }
                }
            )

    query = text("""
        UPDATE posko_evakuasi
        SET status = :status,
            kapasitas = COALESCE(:kapasitas, kapasitas),
            updated_at = now()
        WHERE id = :posko_id
        RETURNING id, nama, status, kapasitas;
    """)
    res = await db.execute(query, {
        "status": payload.status,
        "kapasitas": payload.kapasitas,
        "posko_id": posko_id
    })
    row = res.fetchone()

    # Catat Audit Log
    client_ip = request.client.host if request.client else None
    await record_audit(
        db=db,
        pengguna_id=current_user.id,
        aksi="UPDATE_POSKO_STATUS",
        tabel_target="posko_evakuasi",
        record_id=posko_id,
        detail={"status": payload.status, "kapasitas": payload.kapasitas},
        ip_address=client_ip
    )

    await db.commit()
    return {
        "message": f"Status posko '{row.nama}' berhasil diubah menjadi '{row.status}'.",
        "id": row.id,
        "status": row.status,
        "kapasitas": row.kapasitas
    }

@router.delete("/{posko_id}")
async def delete_posko(
    posko_id: int,
    request: Request,
    current_user: Pengguna = Depends(require_role(["admin", "super_admin"])),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Khusus Admin & Super Admin: Menghapus (Soft-Delete / Arsip) titik posko evakuasi.
    Data tidak dihapus fisik untuk menjaga integritas riwayat pelaporan & audit trail darurat.
    """
    query = text("""
        UPDATE posko_evakuasi 
        SET status = 'nonaktif', updated_at = now() 
        WHERE id = :posko_id 
        RETURNING id, nama, status;
    """)
    res = await db.execute(query, {"posko_id": posko_id})
    row = res.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": f"Posko dengan ID {posko_id} tidak ditemukan."}}
        )

    # Catat Audit Log
    client_ip = request.client.host if request.client else None
    await record_audit(
        db=db,
        pengguna_id=current_user.id,
        aksi="SOFT_DELETE_POSKO",
        tabel_target="posko_evakuasi",
        record_id=posko_id,
        detail={"nama": row.nama, "action": "archived_nonaktif"},
        ip_address=client_ip
    )

    await db.commit()

    return {
        "message": f"Posko '{row.nama}' (ID {posko_id}) berhasil dinonaktifkan & diarsipkan dari peta evakuasi publik.",
        "id": row.id,
        "status": row.status
    }
