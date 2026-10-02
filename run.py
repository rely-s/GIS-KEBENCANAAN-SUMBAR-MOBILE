"""
Orchestrator Tunggal Produksi - GIS Kebencanaan Provinsi Sumatera Barat
BPBD Provinsi Sumatera Barat & LPPM UPI "YPTK" Padang
================================================================================
Menjalankan seluruh subsistem dalam satu perintah:
1. Validasi Prasyarat Lingkungan (Python >= 3.10, Node.js, npm, PostgreSQL Port 5433)
2. Database Readiness & Eksekusi Migrasi Alembic (Head)
3. Eksekusi Paralel FastAPI Backend (:8000) dan Vite Dev Server (:5173)
4. Graceful Shutdown & Cleanup Port Handler
"""

import sys
import os
import time
import socket
import signal
import subprocess
import shutil
from pathlib import Path

# ANSI Color Codes untuk Tampilan Terminal Komando
class TermColor:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    MAGENTA = "\033[35m"
    CYAN = "\033[36m"
    WHITE = "\033[37m"

def print_banner():
    banner = f"""{TermColor.CYAN}{TermColor.BOLD}
================================================================================
   GIS KEBENCANAAN SUMATERA BARAT - PUSDALOPS BPBD PROV. SUMBAR
   Kolaborasi Riset Strategis: LPPM Universitas Putra Indonesia "YPTK" Padang
================================================================================{TermColor.RESET}"""
    print(banner)

def log_info(msg: str):
    print(f"{TermColor.CYAN}[INFO]{TermColor.RESET} {msg}")

def log_success(msg: str):
    print(f"{TermColor.GREEN}[SUKSES]{TermColor.RESET} {msg}")

def log_warn(msg: str):
    print(f"{TermColor.YELLOW}[PERINGATAN]{TermColor.RESET} {msg}")

def log_error(msg: str):
    print(f"{TermColor.RED}[ERROR]{TermColor.RESET} {msg}")

def is_port_open(host: str, port: int, timeout: float = 1.5) -> bool:
    """Cek apakah port jaringan sedang aktif merespons koneksi TCP."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        return result == 0

def check_system_requirements(root_dir: Path):
    """Validasi versi Python, Node.js, npm, dan PostgreSQL port 5433."""
    log_info("Memeriksa prasyarat lingkungan eksekusi...")

    # 1. Cek Python Version (>= 3.10)
    py_ver = sys.version_info
    if py_ver < (3, 10):
        log_error(f"Python minimal versi 3.10 diperlukan. Terdeteksi: {py_ver.major}.{py_ver.minor}.{py_ver.micro}")
        sys.exit(1)
    log_success(f"Python Runtime: v{py_ver.major}.{py_ver.minor}.{py_ver.micro}")

    # 2. Cek Node.js & npm
    node_bin = shutil.which("node")
    npm_bin = shutil.which("npm")
    if not node_bin or not npm_bin:
        log_error("Node.js dan npm harus terpasang di sistem PATH.")
        sys.exit(1)

    try:
        node_v = subprocess.check_output([node_bin, "-v"], text=True).strip()
        log_success(f"Node.js Runtime: {node_v}")
    except Exception as e:
        log_warn(f"Gagal mendeteksi versi Node.js: {e}")

    # 3. Cek PostgreSQL Port 5433 (Dedicated GIS Instance)
    db_port = 5433
    if is_port_open("127.0.0.1", db_port):
        log_success(f"PostgreSQL GIS Instance aktif di port {db_port}.")
    else:
        log_warn(f"Port PostgreSQL {db_port} belum aktif merespons.")
        # Opsi auto-start bila binary pg_ctl lokal ditemukan
        pg_ctl_candidates = [
            Path(r"C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe"),
            Path(r"C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe"),
            Path(r"C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe"),
            Path(r"E:\pgsql\bin\pg_ctl.exe"),
        ]
        pg_ctl = None
        for cand in pg_ctl_candidates:
            if cand.exists():
                pg_ctl = cand
                break
        if not pg_ctl and shutil.which("pg_ctl"):
            pg_ctl = Path(shutil.which("pg_ctl"))

        pg_data_candidates = [
            root_dir / "data_pg",
            Path(r"E:\pgsql\data"),
        ]
        pg_data = None
        for cand in pg_data_candidates:
            if cand.exists():
                pg_data = cand
                break

        pg_log = root_dir / "pg_server.log"
        if pg_ctl and pg_data and pg_log:
            log_info(f"Mencoba menyalakan PostgreSQL GIS Instance ({pg_data.name}) dengan {pg_ctl.name}...")
            pid_file = pg_data / "postmaster.pid"
            if pid_file.exists():
                try:
                    if not is_port_open("127.0.0.1", db_port):
                        pid_file.unlink(missing_ok=True)
                except Exception:
                    pass
            subprocess.run([str(pg_ctl), "start", "-D", str(pg_data), "-l", str(pg_log), "-w", "-t", "60"], capture_output=True)
            if is_port_open("127.0.0.1", db_port):
                log_success(f"PostgreSQL GIS Instance berhasil dinyalakan di port {db_port}.")
            else:
                log_error(f"PostgreSQL port {db_port} gagal dinyalakan otomatis. Periksa {pg_log}.")
        else:
            log_warn(f"Pastikan database PostgreSQL dengan PostGIS berjalan pada port {db_port}.")

def run_database_migrations(backend_dir: Path):
    """Menjalankan migrasi skema Alembic (head) untuk memastikan struktur tabel PostGIS sinkron."""
    log_info("Menjalankan migrasi database skema Alembic (head)...")
    try:
        res = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            cwd=str(backend_dir),
            capture_output=True,
            text=True
        )
        if res.returncode == 0:
            log_success("Skema database PostGIS telah mutakhir (head).")
        else:
            log_warn(f"Alembic migration notice: {res.stderr.strip() or res.stdout.strip()}")
    except Exception as e:
        log_warn(f"Tidak dapat mengeksekusi alembic otomatis: {e}")

def main():
    print_banner()
    root_dir = Path(__file__).resolve().parent
    backend_dir = root_dir / "backend"
    frontend_dir = root_dir / "frontend"
    mobile_dir = root_dir / "mobile"

    if not backend_dir.exists() or not frontend_dir.exists():
        log_error("Direktori 'backend' atau 'frontend' tidak ditemukan di root repositori.")
        sys.exit(1)

    check_system_requirements(root_dir)
    run_database_migrations(backend_dir)

    log_info("Memulai server FastAPI Backend, Vite Frontend, dan Expo Mobile...")

    # Jalankan Backend FastAPI (Port 8000)
    backend_cmd = [
        sys.executable, "-m", "uvicorn", "app.main:app",
        "--host", "127.0.0.1",
        "--port", "8000",
        "--reload"
    ]
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=str(backend_dir),
        env=os.environ.copy()
    )

    # Jalankan Frontend Vite (Port 5173 terkonfigurasi di vite.config.ts)
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_args = [npm_cmd, "run", "dev"]
    frontend_proc = subprocess.Popen(
        frontend_args,
        cwd=str(frontend_dir),
        env=os.environ.copy()
    )

    # Jalankan Mobile Expo (Port 8081 / Web & Expo Go)
    mobile_proc = None
    if mobile_dir.exists():
        npx_cmd = "npx.cmd" if os.name == "nt" else "npx"
        mobile_args = [npx_cmd, "expo", "start"]
        mobile_proc = subprocess.Popen(
            mobile_args,
            cwd=str(mobile_dir),
            env=os.environ.copy()
        )

    log_success("Dashboard GIS Kebencanaan Sumatera Barat Berhasil Diluncurkan!")
    print(f"""
{TermColor.GREEN}{TermColor.BOLD}--------------------------------------------------------------------------------
[PORTAL APLIKASI UTAMA]
   - Dashboard GIS Web      : {TermColor.WHITE}http://127.0.0.1:5173/{TermColor.GREEN}
   - Mobile Web Preview     : {TermColor.WHITE}http://localhost:8081/{TermColor.GREEN}
   - Mobile Expo Go (HP)    : {TermColor.WHITE}exp://192.168.50.163:8081{TermColor.GREEN} (Scan QR Code di terminal)
   - Backend API REST & Geo : {TermColor.WHITE}http://127.0.0.1:8000/{TermColor.GREEN}
   - Dokumentasi Swagger UI : {TermColor.WHITE}http://127.0.0.1:8000/docs{TermColor.GREEN}

[ROLE AKSES PUSDALOPS & PIMPINAN (Tersedia Tombol 1-Click Preset di UI)]
   - Super Admin : superadmin / SuperAdminSumbar2026! (Akses Penuh Semua Modul)
   - Admin BPBD  : admin / AdminSumbar2026!
   - Operator Lap: operator / OperatorPadang2026!
   - Pimpinan    : pimpinan / PimpinanSumbar2026!
--------------------------------------------------------------------------------{TermColor.RESET}

{TermColor.YELLOW}Tekan Ctrl+C di terminal ini kapan saja untuk mematikan semua layanan secara aman.{TermColor.RESET}
""")

    def shutdown_handler(sig, frame):
        log_info("Menerima sinyal terminasi. Mematikan seluruh proses anak...")
        try:
            if mobile_proc and mobile_proc.poll() is None:
                if os.name == 'nt':
                    subprocess.run(["taskkill", "/F", "/T", "/PID", str(mobile_proc.pid)], capture_output=True)
                else:
                    mobile_proc.terminate()
            if frontend_proc.poll() is None:
                if os.name == 'nt':
                    subprocess.run(["taskkill", "/F", "/T", "/PID", str(frontend_proc.pid)], capture_output=True)
                else:
                    frontend_proc.terminate()
            if backend_proc.poll() is None:
                if os.name == 'nt':
                    subprocess.run(["taskkill", "/F", "/T", "/PID", str(backend_proc.pid)], capture_output=True)
                else:
                    backend_proc.terminate()
        except Exception as e:
            log_warn(f"Error saat teardown proses: {e}")
        log_success("Seluruh layanan telah dinonaktifkan dengan aman. Selesai.")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)

    try:
        while True:
            # Periksa apakah salah satu proses mendadak crash
            if backend_proc.poll() is not None:
                log_error(f"Backend FastAPI berhenti dengan kode keluar {backend_proc.poll()}. Mematikan layanan.")
                shutdown_handler(None, None)
            if frontend_proc.poll() is not None:
                log_error(f"Frontend Vite berhenti dengan kode keluar {frontend_proc.poll()}. Mematikan layanan.")
                shutdown_handler(None, None)
            if mobile_proc and mobile_proc.poll() is not None:
                log_error(f"Mobile Expo berhenti dengan kode keluar {mobile_proc.poll()}. Mematikan layanan.")
                shutdown_handler(None, None)
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown_handler(None, None)

if __name__ == "__main__":
    main()
