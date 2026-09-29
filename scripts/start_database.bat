@echo off
REM ================================================================================
REM Skrip Peluncur Database PostgreSQL GIS (Port 5433)
REM Sistem Informasi Geografis Kebencanaan Provinsi Sumatera Barat
REM ================================================================================

echo [INFO] Memeriksa status PostgreSQL GIS Instance di port 5433...
netstat -ano | findstr ":5433" | findstr "LISTENING" >nul
if %ERRORLEVEL% EQU 0 (
    echo [SUKSES] PostgreSQL GIS Instance sudah aktif di port 5433.
    goto :check_connection
)

echo [INFO] Menyalakan PostgreSQL PostGIS di E:\pgsql...
if exist "E:\pgsql\bin\pg_ctl.exe" (
    "E:\pgsql\bin\pg_ctl.exe" start -D "E:\pgsql\data" -l "E:\pgsql\logfile.log" -w -t 15
    if %ERRORLEVEL% EQU 0 (
        echo [SUKSES] PostgreSQL GIS Instance berhasil dinyalakan di port 5433.
    ) else (
        echo [ERROR] Gagal menyalakan PostgreSQL. Periksa E:\pgsql\logfile.log
        exit /b 1
    )
) else (
    echo [ERROR] Binaries PostgreSQL tidak ditemukan di E:\pgsql\bin\pg_ctl.exe
    exit /b 1
)

:check_connection
echo [INFO] Database GIS siap menerima koneksi backend FastAPI di port 5433.
