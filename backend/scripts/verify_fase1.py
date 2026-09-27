import asyncio
import base64
import sys
from pathlib import Path
from httpx import AsyncClient, ASGITransport

# Pastikan path backend termuat
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app

# Tiny 1x1 transparent WebP image base64
TINY_WEBP_BASE64 = (
    "data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoAAP7/2IA="
)

async def test_fase1_production_ready():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        print("=== 1. TEST POST /api/bencana/lapor-warga dengan Foto WebP ===")
        payload = {
            "jenis_bencana": "banjir",
            "lat": -0.9471,
            "lon": 100.3543,
            "deskripsi": "Banjir luapan Batang Arau mencapai tinggi 60cm di kawasan Jembatan Siti Nurbaya.",
            "nama_pelapor": "Asep Suhendar (Warga Muaro)",
            "kontak_pelapor": "081234567890",
            "foto_base64": TINY_WEBP_BASE64
        }
        res_lapor = await client.post("/api/bencana/lapor-warga", json=payload)
        assert res_lapor.status_code == 201, f"Lapor warga failed: {res_lapor.text}"
        data_lapor = res_lapor.json()
        print(f"[OK] Lapor Warga Berhasil: ID={data_lapor.get('bencana_id')}, Foto URL={data_lapor.get('foto_url')}")
        foto_url = data_lapor.get("foto_url")
        assert foto_url is not None and foto_url.startswith("/uploads/laporan/"), "Foto URL tidak tersimpan!"

        print("\n=== 2. TEST STATIC SERVING MEDIA UPLOAD ===")
        res_foto = await client.get(foto_url)
        assert res_foto.status_code == 200, f"Akses foto static gagal: {res_foto.status_code}"
        print(f"[OK] Media Foto berhasil diakses via HTTP: {foto_url} ({len(res_foto.content)} bytes)")

        print("\n=== 3. TEST GET /api/posko (Skema BNPB Pilah Rentan) ===")
        res_posko = await client.get("/api/posko")
        assert res_posko.status_code == 200, f"List posko failed: {res_posko.text}"
        features = res_posko.json().get("features", [])
        assert len(features) > 0, "Posko kosong!"
        first_props = features[0]["properties"]
        print(f"[OK] Posko terdeteksi: {first_props['nama']}")
        print(f"     - Lansia: {first_props.get('jumlah_pengungsi_lansia')}")
        print(f"     - Balita: {first_props.get('jumlah_pengungsi_balita')}")
        print(f"     - Disabilitas: {first_props.get('jumlah_pengungsi_disabilitas')}")
        print(f"     - Air Bersih: {first_props.get('ketersediaan_air_bersih')}")
        assert "jumlah_pengungsi_lansia" in first_props, "Atribut BNPB lansia tidak ditemukan di GeoJSON posko!"

        print("\n=== 4. TEST GET /api/proximity/threats (PostGIS GiST Engine) ===")
        res_threats = await client.get("/api/proximity/threats?lat=-0.9471&lon=100.3543")
        assert res_threats.status_code == 200, f"Proximity threats failed: {res_threats.text}"
        threat_data = res_threats.json()
        print(f"[OK] Proximity Engine: {threat_data.get('engine')}")
        print(f"     - Ancaman Utama: {threat_data['primary_threat']['name']} ({threat_data['primary_threat']['distance_km']} km)")
        print(f"     - Status: {threat_data['primary_threat']['status']}")
        assert "PostGIS" in threat_data.get("engine", ""), "Mesin proximity bukan PostGIS!"

        print("\n=== 5. TEST GET /api/proximity/layers (GeoJSON Spasial Ancaman) ===")
        res_layers = await client.get("/api/proximity/layers")
        assert res_layers.status_code == 200, f"Proximity layers failed: {res_layers.text}"
        layer_features = res_layers.json().get("features", [])
        print(f"[OK] Layer Ancaman Spasial Berhasil Dimuat: {len(layer_features)} entitas")
        for feat in layer_features:
            print(f"     - {feat['properties']['nama']} ({feat['properties']['jenis']})")
        assert len(layer_features) >= 6, "Layer ancaman geologis kurang dari 6!"

        print("\n[SUKSES 100%] SELURUH VERIFIKASI FASE 1 SELESAI DENGAN SUKSES!")

if __name__ == "__main__":
    asyncio.run(test_fase1_production_ready())
