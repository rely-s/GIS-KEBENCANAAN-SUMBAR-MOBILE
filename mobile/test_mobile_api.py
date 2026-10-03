"""
Test Script: Verifikasi Integrasi Endpoint Mobile App Siaga Sumbar
Memastikan seluruh endpoint yang dikonsumsi oleh aplikasi mobile merespons 200/201 dengan struktur JSON yang valid.
"""

import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def run_test(name, path, method="GET", payload=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    data = json.dumps(payload).encode("utf-8") if payload else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode("utf-8")
            body = json.loads(content)
            print(f"[PASS] {name} | HTTP {resp.status} | Data OK")
            return True, body
    except Exception as e:
        print(f"[FAIL] {name} | Error: {e}")
        return False, None

def main():
    print("=" * 65)
    print("MOBILE APP INTEGRATION TEST - SIAGA SUMBAR (FASTAPI & POSTGIS)")
    print("=" * 65)

    passed = 0
    total = 5

    # 1. Proximity Threats Check (PostGIS Spheroidal Geodesic)
    ok, data = run_test("1. Radar Ancaman (/proximity/check)", "/proximity/check?lat=-0.9471&lon=100.3543")
    if ok and data.get("status") == "ok" and "primary_threat" in data:
        passed += 1

    # 2. Posko & Shelter (GeoJSON FeatureCollection)
    ok, data = run_test("2. Shelter Evakuasi & Posko (/posko)", "/posko?lat=-0.9471&lon=100.3543&limit=5")
    if ok and data.get("type") == "FeatureCollection" and len(data.get("features", [])) > 0:
        passed += 1

    # 3. Feed Bencana Terverifikasi
    ok, data = run_test("3. Feed Bencana Lapangan (/bencana)", "/bencana?limit=5")
    if ok and data.get("status") == "success" and "data" in data:
        passed += 1

    # 4. Peringatan Ruas Jalan Terputus (Blokade Bencana)
    ok, data = run_test("4. Jalan Terputus (/jalan-terputus)", "/jalan-terputus")
    if ok and data.get("type") == "FeatureCollection" and isinstance(data.get("features"), list):
        passed += 1

    # 5. Form Lapor Kejadian Warga (Crowdsourcing)
    ok, data = run_test(
        "5. Lapor Kejadian Warga (/bencana/lapor)",
        "/bencana/lapor",
        method="POST",
        payload={
            "jenis_bencana": "banjir",
            "lat": -0.9471,
            "lon": 100.3543,
            "deskripsi": "Tes otomatis pengiriman laporan dari mobile app siaga sumbar",
            "nama_pelapor": "Automated Mobile Test",
            "kontak_pelapor": "081234567890"
        }
    )
    if ok and data.get("status") == "success" and "bencana_id" in data:
        passed += 1

    print("-" * 65)
    print(f"Hasil Pengujian: {passed}/{total} Pengujian Lulus")
    if passed == total:
        print("STATUS: INTEGRASI MOBILE APP 100% SEMPURNA & SIAP PRODUKSI!")
        sys.exit(0)
    else:
        print("STATUS: ADA PENGUJIAN YANG GAGAL")
        sys.exit(1)

if __name__ == "__main__":
    main()
