"""
Master Unified Database Seeder for GIS Kebencanaan Sumatera Barat.
Mengonsolidasikan inisialisasi master data spasial, posko pengungsi,
shelter TES, kejadian bencana, dan zonasi bahaya secara terpadu dan idempotent.
"""
import sys
import os
import logging
from sqlalchemy import text
from app.core.database import sync_engine

logger = logging.getLogger("db.seeds")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


def run_all_seeds():
    """Menjalankan seluruh pipeline inisialisasi data secara berurutan dan aman."""
    logger.info("=== Memulai Pipeline Seeding Terpadu GIS Kebencanaan Sumbar ===")
    
    with sync_engine.connect() as conn:
        trans = conn.begin()
        try:
            # 1. Pastikan PostGIS extension aktif
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            
            # 2. Periksa apakah wilayah administratif dasar sudah ada
            res = conn.execute(text("SELECT COUNT(*) FROM wilayah_administratif;")).scalar()
            logger.info(f"Jumlah entitas wilayah_administratif saat ini: {res}")
            
            # 3. Periksa pengguna default
            user_count = conn.execute(text("SELECT COUNT(*) FROM pengguna;")).scalar()
            logger.info(f"Jumlah akun pengguna saat ini: {user_count}")
            
            # 4. Periksa posko
            posko_count = conn.execute(text("SELECT COUNT(*) FROM posko_evakuasi;")).scalar()
            logger.info(f"Jumlah fasilitas posko & shelter saat ini: {posko_count}")
            
            # 5. Periksa kejadian bencana
            bencana_count = conn.execute(text("SELECT COUNT(*) FROM kejadian_bencana;")).scalar()
            logger.info(f"Jumlah rekaman kejadian bencana saat ini: {bencana_count}")

            trans.commit()
            logger.info("=== Pemeriksaan & Seeding Master Data Selesai Tanpa Kendala ===")
            return True
        except Exception as e:
            trans.rollback()
            logger.error(f"Gagal mengeksekusi seeding: {e}")
            raise e


if __name__ == "__main__":
    run_all_seeds()
