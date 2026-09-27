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
        # Opsi auto-start bila binary postgres lokal ditemukan
        pg_bin = Path(r"E:\pgsql\bin\postgres.exe")
        pg_data = Path(r"E:\pgsql\data")
        if pg_bin.exists() and pg_data.exists():
            log_info("Mencoba menyalakan PostgreSQL GIS Instance secara otomatis...")
            subprocess.Popen([str(pg_bin), "-D", str(pg_data)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            # Tunggu hingga 5 detik
            for _ in range(10):
                time.sleep(0.5)
                if is_port_open("127.0.0.1", db_port):
                    log_success(f"PostgreSQL GIS Instance berhasil dinyalakan di port {db_port}.")
                    break
            else:
                log_error(f"PostgreSQL port {db_port} gagal dinyalakan otomatis. Pastikan service berjalan.")
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

    if not backend_dir.exists() or not frontend_dir.exists():
        log_error("Direktori 'backend' atau 'frontend' tidak ditemukan di root repositori.")
        sys.exit(1)

    check_system_requirements(root_dir)
    run_database_migrations(backend_dir)

    log_info("Memulai server FastAPI Backend dan Vite Frontend...")

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

    # Jalankan Frontend Vite (Port 5173)
    # Di Windows, npm adalah npm.cmd
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_args = [npm_cmd, "run", "dev", "--", "--host", "127.0.0.1", "--port", "5173"]
    frontend_proc = subprocess.Popen(
        frontend_args,
        cwd=str(frontend_dir),
        env=os.environ.copy()
    )

    log_success("Dashboard GIS Kebencanaan Sumatera Barat Berhasil Diluncurkan!")
    print(f"""
{TermColor.GREEN}{TermColor.BOLD}--------------------------------------------------------------------------------
[PORTAL APLIKASI UTAMA]
   - Dashboard GIS Web      : {TermColor.WHITE}http://127.0.0.1:5173/{TermColor.GREEN}
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
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown_handler(None, None)

if __name__ == "__main__":
    main()
