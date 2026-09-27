import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import text
from app.core.database import sync_engine

def seed_solok_disaster():
    wib = timezone(timedelta(hours=7))
    waktu_kejadian = datetime(2026, 9, 21, 21, 30, tzinfo=wib)

    with sync_engine.connect() as conn:
        print("[1/3] Mencari ID Wilayah Kabupaten Solok dan Kota Solok...")
        # Cari wilayah Kabupaten Solok
        res_kab = conn.execute(text("SELECT id FROM wilayah_administratif WHERE nama ILIKE '%Kabupaten Solok%' LIMIT 1;")).fetchone()
        kab_solok_id = res_kab[0] if res_kab else None

        # Cari wilayah Kota Solok
        res_kota = conn.execute(text("SELECT id FROM wilayah_administratif WHERE nama ILIKE '%Kota Solok%' LIMIT 1;")).fetchone()
        kota_solok_id = res_kota[0] if res_kota else None

        print(f"Kabupaten Solok ID: {kab_solok_id}, Kota Solok ID: {kota_solok_id}")

        # Hapus jika sebelumnya pernah di-seed agar idempoten
        conn.execute(
            text("DELETE FROM kejadian_bencana WHERE deskripsi ILIKE '%Banjir Bandang dan Galodo Semalam di Solok%';")
        )
        conn.commit()

        print("[2/3] Menyisipkan Kejadian Bencana Riil Solok (Banjir Bandang & Galodo)...")
        # 1. Kejadian di Kabupaten Solok (Lembah Gumanti - Galodo Lereng Gunung Talang)
        insert_kejadian_1 = text("""
            INSERT INTO kejadian_bencana (
                jenis_bencana, tanggal_kejadian, wilayah_id, lokasi,
                deskripsi, sumber_data, status_verifikasi, created_at, updated_at
            )
            VALUES (
                'banjir', :tanggal, :wilayah_id,
                ST_SetSRID(ST_MakePoint(100.7020, -1.0250), 4326),
                :deskripsi, 'BPBD_KAB_SOLOK_PUSSER', 'terverifikasi', now(), now()
            )
            RETURNING id;
        """)
        
        desc_1 = (
            "Banjir Bandang dan Galodo Semalam di Solok: Hujan berintensitas ekstrem memicu galodo lahar hujan "
            "dari perbukitan lereng Gunung Talang menerjang permukiman di Lembah Gumanti dan Danau Kembar. "
            "Material batu besar, lumpur pekat, dan potongan kayu menutup akses jalan nagari dan merusak puluhan rumah warga."
        )
        res_id_1 = conn.execute(insert_kejadian_1, {
            "tanggal": waktu_kejadian,
            "wilayah_id": kab_solok_id,
            "deskripsi": desc_1
        }).fetchone()[0]

        # Dampak Kabupaten Solok
        insert_dampak_1 = text("""
            INSERT INTO data_dampak_bencana (
                kejadian_id, wilayah_id, korban_meninggal, korban_hilang, korban_luka,
                jumlah_pengungsi, kerugian_rp, rumah_rusak_berat, rumah_rusak_sedang,
                rumah_rusak_ringan, fasilitas_umum_rusak, fasilitas_kesehatan_rusak,
                sekolah_rusak, penduduk_terdampak, catatan
            )
            VALUES (
                :kejadian_id, :wilayah_id, 3, 1, 14,
                450, 8450000000, 18, 35,
                82, 3, 1, 2, 1280,
                'Evakuasi darurat difasilitasi posko tanggap bencana BPBD Kab Solok di Kantor Camat Lembah Gumanti.'
            );
        """)
        conn.execute(insert_dampak_1, {"kejadian_id": res_id_1, "wilayah_id": kab_solok_id or 1})

        # 2. Kejadian di Kota Solok (Luapan Aliran Sungai Batang Lembang)
        desc_2 = (
            "Banjir Bandang dan Galodo Semalam di Solok: Debit air kiriman hulu meluap drastis pada DAS Batang Lembang "
            "menggenangi permukiman padat penduduk di Kecamatan Lubuk Sikarah dan Tanjung Harapan setinggi 80 - 150 cm."
        )
        insert_kejadian_2 = text("""
            INSERT INTO kejadian_bencana (
                jenis_bencana, tanggal_kejadian, wilayah_id, lokasi,
                deskripsi, sumber_data, status_verifikasi, created_at, updated_at
            )
            VALUES (
                'banjir', :tanggal, :wilayah_id,
                ST_SetSRID(ST_MakePoint(100.6550, -0.7980), 4326),
                :deskripsi, 'BPBD_KOTA_SOLOK', 'terverifikasi', now(), now()
            )
            RETURNING id;
        """)
        res_id_2 = conn.execute(insert_kejadian_2, {
            "tanggal": waktu_kejadian,
            "wilayah_id": kota_solok_id,
            "deskripsi": desc_2
        }).fetchone()[0]

        insert_dampak_2 = text("""
            INSERT INTO data_dampak_bencana (
                kejadian_id, wilayah_id, korban_meninggal, korban_hilang, korban_luka,
                jumlah_pengungsi, kerugian_rp, rumah_rusak_berat, rumah_rusak_sedang,
                rumah_rusak_ringan, fasilitas_umum_rusak, fasilitas_kesehatan_rusak,
                sekolah_rusak, penduduk_terdampak, catatan
            )
            VALUES (
                :kejadian_id, :wilayah_id, 0, 0, 5,
                230, 2100000000, 4, 15,
                110, 2, 0, 1, 850,
                'Warga di bantaran Batang Lembang dievakuasi ke dataran tinggi dan gedung serbaguna kota.'
            );
        """)
        conn.execute(insert_dampak_2, {"kejadian_id": res_id_2, "wilayah_id": kota_solok_id or 1})

        # Refresh materialized view dampak per kecamatan jika ada
        try:
            conn.execute(text("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dampak_per_kecamatan;"))
        except Exception:
            try:
                conn.execute(text("REFRESH MATERIALIZED VIEW mv_dampak_per_kecamatan;"))
            except Exception as e:
                print(f"Catatan mv: {e}")

        conn.commit()
        print(f"[3/3] Berhasil menyisipkan kejadian bencana riil Solok! (ID Kejadian: {res_id_1}, {res_id_2})")

if __name__ == "__main__":
    seed_solok_disaster()
