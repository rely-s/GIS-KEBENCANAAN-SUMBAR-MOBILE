import json
import urllib.request
import urllib.error
import sys

BASE_URL = "http://127.0.0.1:8000"

def get(path, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Accept": "*/*"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode("utf-8")
            try:
                data = json.loads(content)
            except:
                data = content
            return resp.status, data
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except:
            return e.code, body
    except Exception as e:
        return 500, str(e)

def post(path, payload, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data_bytes, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return resp.status, data
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except:
            return e.code, body
    except Exception as e:
        return 500, str(e)

def main():
    print("=" * 60)
    print("GIS KEBENCANAAN SUMBAR - COMPREHENSIVE SYSTEM VERIFICATION")
    print("=" * 60)

    results = []

    # 1. Health
    status, data = get("/api/health")
    db_stat = data.get("database", {}).get("status") if isinstance(data.get("database"), dict) else data.get("database")
    ok = (status == 200 and db_stat == "connected")
    results.append(("Health Check", status, ok, f"DB: {db_stat} (PostGIS: {data.get('database',{}).get('postgis','N/A') if isinstance(data.get('database'), dict) else 'ok'})"))

    # 2. Cascading Wilayah
    status, prov = get("/api/provinsi")
    ok = (status == 200 and len(prov) > 0)
    results.append(("Cascading: Provinsi", status, ok, f"{len(prov) if isinstance(prov, list) else 0} provinsi"))

    status, kota = get("/api/kota?id_provinsi=13")
    ok = (status == 200 and len(kota) > 0)
    results.append(("Cascading: Kota/Kab (Sumbar 13)", status, ok, f"{len(kota) if isinstance(kota, list) else 0} kota/kab"))

    status, kec = get("/api/kecamatan?id_kota=1371")
    ok = (status == 200 and len(kec) > 0)
    results.append(("Cascading: Kecamatan (Kota Padang 1371)", status, ok, f"{len(kec) if isinstance(kec, list) else 0} kecamatan"))

    # 3. Layer Data (Public)
    status, bencana = get("/api/bencana")
    ok = (status == 200 and "data" in bencana)
    results.append(("Layer: Bencana", status, ok, f"{len(bencana.get('data', [])) if isinstance(bencana, dict) else 0} kejadian"))

    status, posko = get("/api/posko")
    ok = (status == 200 and "features" in posko)
    results.append(("Layer: Posko Evakuasi", status, ok, f"{len(posko.get('features', [])) if isinstance(posko, dict) else 0} posko"))

    status, jalan = get("/api/jalan-terputus")
    ok = (status == 200 and "features" in jalan)
    results.append(("Layer: Jalan Terputus", status, ok, f"{len(jalan.get('features', [])) if isinstance(jalan, dict) else 0} segmen"))

    # 4. Trailing slash resilience
    status, posko_slash = get("/api/posko/")
    ok = (status == 200)
    results.append(("Trailing Slash /api/posko/", status, ok, "Handled without 307 drop"))

    status, bencana_slash = get("/api/bencana/")
    ok = (status == 200)
    results.append(("Trailing Slash /api/bencana/", status, ok, "Handled without 307 drop"))

    # 5. SITREP Public
    status, sitrep_pub = get("/api/sitrep")
    ok = (status == 200 and "kpi" in sitrep_pub)
    results.append(("SITREP: Public API (/api/sitrep)", status, ok, f"Meninggal: {sitrep_pub.get('kpi',{}).get('total_meninggal')}"))

    status, sitrep_ringkasan = get("/api/sitrep/ringkasan")
    ok = (status == 200 and "kpi" in sitrep_ringkasan)
    results.append(("SITREP: Ringkasan (/api/sitrep/ringkasan)", status, ok, "Accessible for citizen/press"))

    # Test PDF / HTML Printable Document
    status, sitrep_doc = get("/api/laporan/sitrep")
    ok = (status == 200)
    results.append(("SITREP: Dokumen Resmi (/api/laporan/sitrep)", status, ok, "Printable HTML/PDF Standard BNPB"))

    # 6. Auth Login (Admin & Operator)
    status, login_admin = post("/api/auth/login", {"email": "admin@sumbarprov.go.id", "password": "AdminSumbar2026!"})
    admin_token = login_admin.get("access_token") if isinstance(login_admin, dict) else None
    ok = (status == 200 and admin_token is not None)
    results.append(("Auth: Login Admin", status, ok, f"User: {login_admin.get('user',{}).get('nama')}"))

    status, login_operator = post("/api/auth/login", {"email": "operator.padang@sumbarprov.go.id", "password": "OperatorPadang2026!"})
    operator_token = login_operator.get("access_token") if isinstance(login_operator, dict) else None
    ok = (status == 200 and operator_token is not None)
    results.append(("Auth: Login Operator", status, ok, f"User: {login_operator.get('user',{}).get('nama')}"))

    # 7. Authenticated User Profile
    status, profile = get("/api/auth/me", token=admin_token)
    ok = (status == 200 and profile.get("role") == "admin")
    results.append(("Auth: Get Profile (/api/auth/me)", status, ok, f"Role: {profile.get('role')}"))

    # 8. SITREP Admin
    status, sitrep_adm = get("/api/admin/sitrep", token=admin_token)
    ok = (status == 200 and "kpi" in sitrep_adm)
    results.append(("SITREP: Admin Pusdalops (/api/admin/sitrep)", status, ok, f"Klasifikasi: {sitrep_adm.get('metadata',{}).get('klasifikasi')}"))

    # 9. Admin Portal Endpoints
    status, adm_users = get("/api/admin/pengguna", token=admin_token)
    ok = (status == 200 and "data" in adm_users)
    results.append(("Portal Petugas: List Pengguna", status, ok, f"{len(adm_users.get('data',[]))} pengguna"))

    status, adm_stats = get("/api/admin/statistik", token=admin_token)
    ok = (status == 200 and "ringkasan" in adm_stats)
    results.append(("Portal Petugas: Ringkasan Eksekutif", status, ok, f"Siaga: {adm_stats.get('status_siaga')}"))

    status, adm_queue = get("/api/admin/verifikasi-queue", token=admin_token)
    ok = (status == 200 and "data" in adm_queue)
    results.append(("Portal Petugas: Verifikasi Queue", status, ok, f"{len(adm_queue.get('data',[]))} antrean"))

    status, adm_audit = get("/api/admin/audit-logs", token=admin_token)
    ok = (status == 200 and "data" in adm_audit)
    results.append(("Portal Petugas: Audit Trail", status, ok, f"{len(adm_audit.get('data',[]))} log aktivitas"))

    # 10. Chatbot AI
    status, bot_res = post("/api/bot/chat", {"pesan": "Apakah ada info gempa bumi terkini di Sumbar?"})
    ok = (status == 200 and "jawaban" in bot_res)
    results.append(("Chatbot: Asisten Siaga Bencana", status, ok, f"Kategori: {bot_res.get('kategori')}"))

    # 11. Spatial Proximity Engine
    status, prox_res = get("/api/proximity/threats?lat=-0.9471&lon=100.4172")
    ok = (status == 200)
    results.append(("Engine: Spatial Proximity Threats", status, ok, f"Status: {status}"))

    # Summary
    print("\nRESULTS TABLE:")
    print("-" * 75)
    print(f"{'Endpoint / Feature':<42} | {'HTTP':<5} | {'State':<7} | {'Details'}")
    print("-" * 75)
    all_passed = True
    for name, st, passed, detail in results:
        state_str = "[PASS]" if passed else "[FAIL]"
        if not passed:
            all_passed = False
        print(f"{name:<42} | {st:<5} | {state_str:<7} | {detail}")
    print("-" * 75)
    if all_passed:
        print("ALL TESTS PASSED! Backend, Database, Auth, SITREP, and Layers are 100% OPERATIONAL.")
    else:
        print("SOME TESTS FAILED! Review details above.")

if __name__ == "__main__":
    main()
