from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import datetime, timezone
from typing import Optional

from app.core.database import get_async_db
from app.core.dependencies import require_role
from app.models.pengguna import Pengguna

# Router Administratif (Memerlukan Token Khusus Petugas / Pimpinan)
router = APIRouter(prefix="/admin/sitrep", tags=["Laporan Situasi (SITREP) BNPB/BPBD - Khusus Petugas"])

# Router Publik (Dapat Diakses Terbuka oleh Masyarakat, Media, & Aplikasi)
public_router = APIRouter(prefix="/sitrep", tags=["Laporan Situasi (SITREP) Publik"])


async def generate_sitrep_payload(
    db: AsyncSession, 
    bencana_id: Optional[int] = None, 
    is_public: bool = False
) -> dict:
    """
    Fungsi inti agregasi data situasi bencana berstandar BNPB/BPBD.
    Digunakan bersama oleh endpoint publik dan endpoint internal Pusdalops.
    """
    # 1. Agregasi Dampak Akumulatif
    dampak_where = "WHERE kejadian_id = :bencana_id" if bencana_id else ""
    dampak_params = {"bencana_id": bencana_id} if bencana_id else {}
    dampak_q = text(f"""
        SELECT 
            COALESCE(SUM(korban_meninggal), 0) AS meninggal,
            COALESCE(SUM(korban_hilang), 0) AS hilang,
            COALESCE(SUM(korban_luka), 0) AS luka,
            COALESCE(SUM(jumlah_pengungsi), 0) AS pengungsi,
            COALESCE(SUM(penduduk_terdampak), 0) AS terdampak,
            COALESCE(SUM(kerugian_rp), 0) AS kerugian_rp
        FROM data_dampak_bencana
        {dampak_where};
    """)
    dampak_res = (await db.execute(dampak_q, dampak_params)).fetchone()

    total_meninggal = int(dampak_res.meninggal) if dampak_res else 0
    total_hilang = int(dampak_res.hilang) if dampak_res else 0
    total_luka = int(dampak_res.luka) if dampak_res else 0
    total_pengungsi = int(dampak_res.pengungsi) if dampak_res else 0
    total_terdampak = int(dampak_res.terdampak) if dampak_res else 0
    total_kerugian = float(dampak_res.kerugian_rp) if dampak_res else 0.0

    # 2. Status Posko Pengungsi, Faskes, TES/TEA & Sirine Tsunami
    posko_q = text("""
        SELECT 
            COUNT(id) AS total,
            COUNT(CASE WHEN status = 'aktif' AND jenis IN ('posko_pengungsi', 'posko_utama', 'titik_kumpul', 'shelter_sementara') THEN 1 END) AS posko_pengungsi_aktif,
            COUNT(CASE WHEN status = 'aktif' AND jenis = 'posko_pengungsi' THEN 1 END) AS kantor_camat_count,
            COUNT(CASE WHEN status = 'aktif' AND jenis = 'fasilitas_kesehatan' THEN 1 END) AS faskes_count,
            COUNT(CASE WHEN status = 'aktif' AND jenis = 'shelter_tes_tea' THEN 1 END) AS total_tes,
            COUNT(CASE WHEN jenis NOT IN ('sirine_tsunami') AND status = 'aktif' THEN 1 END) AS total_titik_evakuasi,
            COALESCE(SUM(CASE WHEN jenis NOT IN ('sirine_tsunami') AND status = 'aktif' THEN kapasitas ELSE 0 END), 0) AS kapasitas_jiwa,
            COUNT(CASE WHEN jenis = 'sirine_tsunami' THEN 1 END) AS total_sirine,
            COUNT(CASE WHEN jenis = 'sirine_tsunami' AND status = 'aktif' THEN 1 END) AS sirine_aktif,
            COUNT(CASE WHEN jenis = 'sirine_tsunami' AND status != 'aktif' THEN 1 END) AS sirine_pemeliharaan
        FROM posko_evakuasi;
    """)
    posko_res = (await db.execute(posko_q)).fetchone()

    posko_pengungsi = int(posko_res.posko_pengungsi_aktif) if posko_res else 0
    kantor_camat_count = int(posko_res.kantor_camat_count) if posko_res else 0
    faskes_count = int(posko_res.faskes_count) if posko_res else 0
    total_tes = int(posko_res.total_tes) if posko_res else 0
    total_titik_evakuasi = int(posko_res.total_titik_evakuasi) if posko_res else 0
    kapasitas_posko = int(posko_res.kapasitas_jiwa) if posko_res else 0
    total_sirine = int(posko_res.total_sirine) if posko_res else 0
    sirine_aktif = int(posko_res.sirine_aktif) if posko_res else 0
    sirine_pemeliharaan = int(posko_res.sirine_pemeliharaan) if posko_res else 0

    # 3. Status Blokade Jalan Terputus
    jalan_q = text("SELECT COUNT(id) FROM jalan_terputus WHERE status = 'aktif';")
    jalan_aktif = (await db.execute(jalan_q)).scalar() or 0

    # 4. Sensor Gempa Terkini
    gempa_q = text("""
        SELECT magnitude, kedalaman_km, wilayah_teks, waktu_kejadian, potensi_tsunami
        FROM gempa_bmkg
        ORDER BY waktu_kejadian DESC NULLS LAST LIMIT 1;
    """)
    gempa_res = (await db.execute(gempa_q)).fetchone()

    # 5. Top 5 Wilayah Paling Terdampak
    top_wilayah_q = text("""
        SELECT 
            COALESCE(kab.nama, w.nama) AS nama,
            COALESCE(SUM(d.korban_meninggal), 0) AS meninggal,
            COALESCE(SUM(d.jumlah_pengungsi), 0) AS pengungsi,
            COALESCE(SUM(d.kerugian_rp), 0) AS kerugian_rp
        FROM data_dampak_bencana d
        JOIN wilayah_administratif w ON d.wilayah_id = w.id
        LEFT JOIN wilayah_administratif kab ON w.parent_id = kab.id AND w.level = 'kecamatan'
        GROUP BY COALESCE(kab.nama, w.nama)
        ORDER BY meninggal DESC, pengungsi DESC, kerugian_rp DESC
        LIMIT 5;
    """)
    top_rows = (await db.execute(top_wilayah_q)).fetchall()
    top_wilayah = [
        {
            "nama": r.nama,
            "meninggal": int(r.meninggal),
            "pengungsi": int(r.pengungsi),
            "kerugian_miliar": round(float(r.kerugian_rp) / 1_000_000_000, 2)
        }
        for r in top_rows
    ]

    now_wib = datetime.now(timezone.utc).strftime("%d-%m-%Y %H:%M WIB")

    # 6. Susun Teks Siaran Pers / WhatsApp Tervalidasi
    klasifikasi = "Publikasi Terbuka Masyarakat & Media" if is_public else "Operasional Terpadu Forkopimda"
    wa_text = f"""*LAPORAN SITUASI KEBENCANAAN (SITREP) PROVINSI SUMATERA BARAT*
*BPBD PROV. SUMBAR & LPPM UPI YPTK PADANG*
_Klasifikasi: {klasifikasi} | Waktu Pembaruan: {now_wib}_

*1. RINGKASAN DAMPAK AKUMULATIF:*
- Meninggal Dunia : {total_meninggal:,} Jiwa
- Hilang : {total_hilang:,} Jiwa
- Luka-luka : {total_luka:,} Jiwa
- Pengungsi : {total_pengungsi:,} Jiwa
- Total Terdampak : {total_terdampak:,} Jiwa
- Estimasi Kerugian Finansial : Rp {total_kerugian/1_000_000_000:,.2f} Miliar

*2. KESIAPAN MITIGASI & EVAKUASI:*
- Posko Pengungsi Aktif : {posko_pengungsi} Titik ({kantor_camat_count} Kantor Camat + Posko Utama)
- Posko Faskes Medis : {faskes_count} Unit
- Shelter TES Tsunami : {total_tes} Gedung Evakuasi Vertikal
- Total Titik Evakuasi : {total_titik_evakuasi} Lokasi (Kapasitas: {kapasitas_posko:,} Jiwa)
- EWS Sirine Tsunami : {sirine_aktif} Siaga Aktif, {sirine_pemeliharaan} Pemeliharaan (Total: {total_sirine} Unit)
- Ruas Jalan Terputus : {jalan_aktif} Titik (Rute Evakuasi Dialihkan Otomatis)

*3. PRIORITAS PENANGANAN TERTINGGI (KABUPATEN/KOTA):*"""
    for idx, tw in enumerate(top_wilayah, 1):
        wa_text += f"\n{idx}. *{tw['nama']}*: {tw['meninggal']} MD, {tw['pengungsi']:,} Pengungsi (Kerugian ~Rp {tw['kerugian_miliar']}M)"

    if gempa_res:
        wa_text += f"\n\n*4. SENSOR REAL-TIME BMKG:* M{gempa_res.magnitude} Kedalaman {gempa_res.kedalaman_km}km ({gempa_res.wilayah_teks})"

    wa_text += "\n\n_Dashboard Navigasi & Monitoring Peta: https://gis-kebencanaan.sumbarprov.go.id_"

    return {
        "metadata": {
            "judul": "Situation Report (SITREP) Penanggulangan Bencana Provinsi Sumatera Barat",
            "waktu_generate": now_wib,
            "institusi": "BPBD Provinsi Sumatera Barat & Riset LPPM UPI YPTK Padang",
            "klasifikasi": klasifikasi,
            "is_public": is_public
        },
        "kpi": {
            "total_meninggal": total_meninggal,
            "total_hilang": total_hilang,
            "total_luka": total_luka,
            "total_pengungsi": total_pengungsi,
            "total_terdampak": total_terdampak,
            "total_kerugian_miliar": round(total_kerugian / 1_000_000_000, 2),
            "posko_aktif": posko_pengungsi,
            "posko_pengungsi_count": posko_pengungsi,
            "kantor_camat_count": kantor_camat_count,
            "faskes_count": faskes_count,
            "total_titik_evakuasi": total_titik_evakuasi,
            "kapasitas_posko": kapasitas_posko,
            "shelter_tes_count": total_tes,
            "sirine_aktif": sirine_aktif,
            "sirine_pemeliharaan": sirine_pemeliharaan,
            "sirine_total": total_sirine,
            "jalan_terputus_aktif": jalan_aktif
        },
        "wilayah_prioritas": top_wilayah,
        "gempa_terakhir": {
            "magnitude": float(gempa_res.magnitude) if gempa_res else None,
            "kedalaman": float(gempa_res.kedalaman_km) if gempa_res else None,
            "lokasi": gempa_res.wilayah_teks if gempa_res else None,
        } if gempa_res else None,
        "whatsapp_formatted": wa_text
    }


# ============================================================================
# ENDPOINT ADMINISTRATIF (Memerlukan Token Khusus Petugas / Pimpinan)
# ============================================================================
@router.get("", include_in_schema=True)
@router.get("/", include_in_schema=False)
async def get_situation_report_admin(
    bencana_id: Optional[int] = Query(None, description="Filter spesifik ID kejadian bencana darurat"),
    current_user: Pengguna = Depends(require_role(["pimpinan", "admin", "operator"])),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Khusus Petugas & Pimpinan: Dokumen Laporan Situasi (SITREP) Taktis Resmi Berstandar BNPB.
    """
    return await generate_sitrep_payload(db, bencana_id=bencana_id, is_public=False)


# ============================================================================
# ENDPOINT PUBLIK (Terbuka untuk Umum, Warga & Media — Standar Keterbukaan Informasi Publik)
# ============================================================================
@public_router.get("", include_in_schema=True)
@public_router.get("/", include_in_schema=False)
@public_router.get("/ringkasan", include_in_schema=True)
async def get_situation_report_public(
    bencana_id: Optional[int] = Query(None, description="Filter spesifik ID kejadian bencana"),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Publik: Mengembalikan ringkasan resmi Laporan Situasi (SITREP) BNPB/BPBD untuk masyarakat dan pers.
    """
    return await generate_sitrep_payload(db, bencana_id=bencana_id, is_public=True)


# ============================================================================
# ROUTER DOKUMEN CETAK & EKSPOR SITREP (PDF/PRINT STANDARD BNPB)
# ============================================================================
from fastapi.responses import HTMLResponse

laporan_router = APIRouter(prefix="/laporan", tags=["Dokumen Cetak & Ekspor Resmi"])

@laporan_router.get("/sitrep", response_class=HTMLResponse)
async def export_sitrep_document(
    bencana_id: Optional[int] = Query(None, description="Filter spesifik ID bencana"),
    format: Optional[str] = Query("html", description="Format output: 'html' (cetak/PDF) atau 'json'"),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Menyajikan dokumen Situation Report (SITREP) resmi siap cetak / simpan PDF
    sesuai tata naskah dinas BNPB & BPBD Provinsi Sumatera Barat.
    """
    payload = await generate_sitrep_payload(db, bencana_id=bencana_id, is_public=False)
    
    if format == "json":
        return payload

    kpi = payload.get("kpi", {})
    wilayah = payload.get("wilayah_prioritas", [])
    gempa = payload.get("gempa_terakhir", {})
    meta = payload.get("metadata", {})
    tgl_now = datetime.now(timezone.utc).strftime("%d %B %Y")
    jam_now = datetime.now(timezone.utc).strftime("%H:%M WIB")

    wilayah_rows_html = ""
    for idx, w in enumerate(wilayah, 1):
        wilayah_rows_html += f"""
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 12px; text-align: center; font-weight: bold;">{idx}</td>
            <td style="padding: 8px 12px; font-weight: 600;">{w['nama']}</td>
            <td style="padding: 8px 12px; text-align: right; color: #dc2626; font-weight: bold;">{w['meninggal']} Jiwa</td>
            <td style="padding: 8px 12px; text-align: right; font-weight: 600;">{w['pengungsi']:,} Jiwa</td>
            <td style="padding: 8px 12px; text-align: right; font-weight: 600;">Rp {w['kerugian_miliar']} M</td>
        </tr>
        """

    gempa_html = ""
    if gempa and gempa.get("magnitude"):
        gempa_html = f"""
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; margin-top: 12px;">
            <strong style="color: #0f172a; font-size: 13px;">Aktivitas Seismik Terkini (BMKG TEWS):</strong>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #334155;">
                Magnitudo: <strong>M {gempa['magnitude']}</strong> | Kedalaman: <strong>{gempa['kedalaman']} km</strong> | Lokasi: <strong>{gempa['lokasi']}</strong>
            </p>
        </div>
        """

    html_content = f"""<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SITREP Penanggulangan Bencana — BPBD Prov. Sumatera Barat</title>
    <style>
        @page {{
            size: A4 portrait;
            margin: 15mm 20mm;
        }}
        body {{
            font-family: 'Times New Roman', Times, serif;
            color: #0f172a;
            line-height: 1.5;
            background: #f1f5f9;
            margin: 0;
            padding: 20px;
        }}
        .page-container {{
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            padding: 40px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border-radius: 8px;
        }}
        .header {{
            text-align: center;
            border-bottom: 3px double #000;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }}
        .header h1 {{
            font-size: 17px;
            margin: 0;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }}
        .header h2 {{
            font-size: 19px;
            margin: 2px 0;
            text-transform: uppercase;
            font-weight: 800;
        }}
        .header h3 {{
            font-size: 13px;
            margin: 0;
            font-weight: normal;
        }}
        .header .address {{
            font-size: 10.5px;
            color: #334155;
            margin-top: 4px;
        }}
        .doc-title {{
            text-align: center;
            margin: 20px 0 15px 0;
        }}
        .doc-title h2 {{
            font-size: 15px;
            text-transform: uppercase;
            text-decoration: underline;
            margin: 0;
            letter-spacing: 0.8px;
        }}
        .doc-title p {{
            font-size: 11px;
            margin: 4px 0 0 0;
            font-weight: bold;
            color: #475569;
        }}
        .badge-siaga {{
            display: inline-block;
            background: #dc2626;
            color: #fff;
            font-size: 11px;
            font-weight: bold;
            padding: 3px 10px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 5px;
        }}
        .section-title {{
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1.5px solid #000;
            padding-bottom: 4px;
            margin: 20px 0 10px 0;
            letter-spacing: 0.5px;
        }}
        .kpi-grid {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 15px;
        }}
        .kpi-box {{
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 10px;
            text-align: center;
            background: #f8fafc;
        }}
        .kpi-val {{
            font-size: 20px;
            font-weight: 800;
            margin-top: 2px;
        }}
        .kpi-label {{
            font-size: 10px;
            text-transform: uppercase;
            color: #475569;
            font-weight: bold;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-top: 8px;
        }}
        th {{
            background: #f1f5f9;
            border-top: 1.5px solid #000;
            border-bottom: 1.5px solid #000;
            padding: 8px 12px;
            font-size: 11px;
            text-transform: uppercase;
        }}
        .signature-block {{
            margin-top: 40px;
            display: flex;
            justify-content: flex-end;
            page-break-inside: avoid;
        }}
        .signature-box {{
            text-align: center;
            width: 280px;
            font-size: 12px;
        }}
        .no-print {{
            position: fixed;
            bottom: 24px;
            right: 24px;
            display: flex;
            gap: 12px;
            z-index: 999;
        }}
        .btn-action {{
            background: #0284c7;
            color: #fff;
            border: none;
            padding: 10px 20px;
            font-size: 13px;
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        .btn-action:hover {{
            background: #0369a1;
        }}
        @media print {{
            body {{
                background: #fff;
                padding: 0;
            }}
            .page-container {{
                box-shadow: none;
                padding: 0;
                max-width: 100%;
            }}
            .no-print {{
                display: none !important;
            }}
        }}
    </style>
</head>
<body>
    <div class="no-print">
        <button class="btn-action" onclick="window.print()">
            🖨️ Cetak / Simpan PDF Dokumen Resmi
        </button>
        <button class="btn-action" style="background: #334155;" onclick="window.close()">
            ✕ Tutup
        </button>
    </div>

    <div class="page-container">
        <!-- KOP SURAT PEMPROV SUMBAR -->
        <div class="header">
            <h1>PEMERINTAH PROVINSI SUMATERA BARAT</h1>
            <h2>BADAN PENANGGULANGAN BENCANA DAERAH</h2>
            <h3>PUSAT PENGENDALIAN OPERASI PENANGGULANGAN BENCANA (PUSDALOPS-PB)</h3>
            <div class="address">
                Jalan Jenderal Sudirman No. 47, Padang, Sumatera Barat 25129 | Telp/Fax: (0751) 890000 | Email: pusdalops@sumbarprov.go.id
            </div>
        </div>

        <div class="doc-title">
            <h2>LAPORAN SITUASI PENANGGULANGAN BENCANA (SITREP)</h2>
            <p>NOMOR: SITREP/BPBD-SB/{datetime.now().strftime('%Y%m%d')}/001</p>
            <div><span class="badge-siaga">STATUS: SIAGA 1 (TANGGAP DARURAT)</span></div>
        </div>

        <div style="font-size: 11.5px; margin-bottom: 15px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px;">
            <table style="width: 100%; font-size: 11.5px;">
                <tr>
                    <td style="width: 25%; font-weight: bold;">Waktu Laporan</td>
                    <td style="width: 2%;">:</td>
                    <td>{tgl_now}, Pukul {jam_now}</td>
                    <td style="width: 20%; font-weight: bold;">Sifat</td>
                    <td style="width: 2%;">:</td>
                    <td>Segera / Penting</td>
                </tr>
                <tr>
                    <td style="font-weight: bold;">Klasifikasi Distribusi</td>
                    <td>:</td>
                    <td>Forkopimda Prov. Sumbar, BNPB, & Publik</td>
                    <td style="font-weight: bold;">Institusi Rujukan</td>
                    <td>:</td>
                    <td>BPBD Prov. Sumbar & Riset LPPM UPI YPTK</td>
                </tr>
            </table>
        </div>

        <!-- I. RINGKASAN DAMPAK AKUMULATIF -->
        <div class="section-title">I. RINGKASAN DAMPAK AKUMULATIF TERVALIDASI</div>
        <div class="kpi-grid">
            <div class="kpi-box">
                <div class="kpi-label" style="color: #dc2626;">Meninggal Dunia</div>
                <div class="kpi-val" style="color: #dc2626;">{kpi.get('total_meninggal', 0)}</div>
                <div style="font-size: 10px; color: #64748b;">Jiwa</div>
            </div>
            <div class="kpi-box">
                <div class="kpi-label" style="color: #ea580c;">Korban Luka-luka</div>
                <div class="kpi-val" style="color: #ea580c;">{kpi.get('total_luka', 0)}</div>
                <div style="font-size: 10px; color: #64748b;">Jiwa Dirawat</div>
            </div>
            <div class="kpi-box">
                <div class="kpi-label" style="color: #0284c7;">Total Pengungsi</div>
                <div class="kpi-val" style="color: #0284c7;">{kpi.get('total_pengungsi', 0):,}</div>
                <div style="font-size: 10px; color: #64748b;">Jiwa di Seluruh Shelter</div>
            </div>
            <div class="kpi-box">
                <div class="kpi-label" style="color: #b45309;">Estimasi Kerugian</div>
                <div class="kpi-val" style="color: #b45309;">Rp {kpi.get('total_kerugian_miliar', 0)} M</div>
                <div style="font-size: 10px; color: #64748b;">Infrastruktur & Hunian</div>
            </div>
        </div>

        <!-- II. STATUS KESIAPAN MITIGASI & FASILITAS EVAKUASI -->
        <div class="section-title">II. KESIAPAN POSKO, SHELTER & INFRASTRUKTUR JALAN</div>
        <div style="font-size: 12px; line-height: 1.7;">
            <ul style="margin: 4px 0; padding-left: 20px;">
                <li><strong>Posko Pengungsian Aktif:</strong> {kpi.get('posko_aktif', 0)} Titik terdaftar dengan kapasitas total daya tampung {kpi.get('kapasitas_posko', 0):,} jiwa.</li>
                <li><strong>Gedung Tempat Evakuasi Sementara (TES):</strong> {kpi.get('shelter_tes_count', 0)} Unit shelter vertikal siaga di pesisir barat.</li>
                <li><strong>Fasilitas Kesehatan Darurat:</strong> {kpi.get('faskes_count', 0)} Fasilitas medis terhubung dengan ambulans siaga.</li>
                <li><strong>Early Warning System (EWS Sirine Tsunami):</strong> {kpi.get('sirine_aktif', 0)} Siaga aktif, {kpi.get('sirine_pemeliharaan', 0)} dalam pemeliharaan berkala (Total: {kpi.get('sirine_total', 0)} unit).</li>
                <li><strong>Ruas Jalan Terputus (Blokade Longsor/Banjir):</strong> {kpi.get('jalan_terputus_aktif', 0)} Segmen aktif. Algoritma routing darurat telah mengalihkan rute evakuasi secara otomatis.</li>
            </ul>
        </div>

        <!-- III. PRIORITAS PENANGANAN TERTINGGI (KABUPATEN/KOTA) -->
        <div class="section-title">III. DAFTAR WILAYAH PRIORITAS PENANGANAN TERTINGGI</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 8%;">No</th>
                    <th style="width: 38%; text-align: left;">Kabupaten / Kota</th>
                    <th style="width: 18%; text-align: right;">Korban Meninggal</th>
                    <th style="width: 18%; text-align: right;">Pengungsi</th>
                    <th style="width: 18%; text-align: right;">Estimasi Kerugian</th>
                </tr>
            </thead>
            <tbody>
                {wilayah_rows_html if wilayah_rows_html else '<tr><td colspan="5" style="text-align: center; padding: 12px; color: #64748b;">Belum ada data prioritas terdampak</td></tr>'}
            </tbody>
        </table>

        {gempa_html}

        <!-- IV. ARAHAN & TINDAK LANJUT PUSDALOPS -->
        <div class="section-title">IV. ARAHAN KOMANDO TANGGAP DARURAT</div>
        <div style="font-size: 11.5px; line-height: 1.6; text-align: justify;">
            <ol style="margin: 4px 0; padding-left: 20px;">
                <li>Tim Reaksi Cepat (TRC) BPBD di kabupaten/kota prioritas diinstruksikan mempercepat kaji cepat kebutuhan dasar pengungsi (pangan, air bersih, tenda ramah difabel).</li>
                <li>Dinas PUPR dan Balai Pelaksana Jalan Nasional diinstruksikan mengerahkan alat berat ke ruas jalan terputus untuk membuka akses logistik darurat.</li>
                <li>Warga masyarakat dihimbau tetap tenang dan hanya mengacu pada saluran resmi BPBD Prov. Sumbar dan BMKG.</li>
            </ol>
        </div>

        <!-- V. LEMBAR PENGESAHAN -->
        <div class="signature-block">
            <div class="signature-box">
                Padang, {tgl_now}<br>
                <strong>a.n. GUBERNUR SUMATERA BARAT</strong><br>
                Kepala Pelaksana BPBD Provinsi Sumatera Barat<br>
                <div style="height: 60px;"></div>
                <strong style="text-decoration: underline;">Dr. H. RUMAINUR, S.E., M.Si.</strong><br>
                Pembina Utama Madya / NIP. 19710815 199703 1 004
            </div>
        </div>
    </div>
</body>
</html>
    """
    return HTMLResponse(content=html_content)

