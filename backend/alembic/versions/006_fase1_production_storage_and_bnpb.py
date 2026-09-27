"""Production consolidation: Add foto_url to kejadian_bencana, add BNPB humanitarian fields to posko_evakuasi, and create ancaman_geologis table

Revision ID: 006_fase1_storage_bnpb
Revises: 005_shelter_kaji_cepat
Create Date: 2026-09-25 14:22:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry

revision: str = '006_fase1_storage_bnpb'
down_revision: Union[str, None] = '005_shelter_kaji_cepat'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Tambahkan foto_url pada kejadian_bencana
    op.add_column('kejadian_bencana', sa.Column('foto_url', sa.String(length=255), nullable=True))

    # 2. Tambahkan kolom pilah kelompok rentan & fasilitas standar BNPB pada posko_evakuasi
    op.add_column('posko_evakuasi', sa.Column('jumlah_pengungsi_pria', sa.Integer(), server_default='0'))
    op.add_column('posko_evakuasi', sa.Column('jumlah_pengungsi_wanita', sa.Integer(), server_default='0'))
    op.add_column('posko_evakuasi', sa.Column('jumlah_pengungsi_lansia', sa.Integer(), server_default='0'))
    op.add_column('posko_evakuasi', sa.Column('jumlah_pengungsi_balita', sa.Integer(), server_default='0'))
    op.add_column('posko_evakuasi', sa.Column('jumlah_pengungsi_disabilitas', sa.Integer(), server_default='0'))
    op.add_column('posko_evakuasi', sa.Column('ketersediaan_air_bersih', sa.String(length=10), server_default='YA'))
    op.add_column('posko_evakuasi', sa.Column('ketersediaan_dapur_umum', sa.String(length=10), server_default='TIDAK'))
    op.add_column('posko_evakuasi', sa.Column('ketersediaan_tenaga_medis', sa.String(length=10), server_default='TIDAK'))

    # 3. Buat tabel spasial ancaman_geologis terindeks GiST
    op.create_table(
        'ancaman_geologis',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nama', sa.String(length=150), nullable=False),
        sa.Column('jenis', sa.String(length=50), nullable=False),
        sa.Column('buffer_meter', sa.Integer(), server_default='500'),
        sa.Column('tingkat_bahaya', sa.String(length=50), server_default='BAHAYA_TINGGI'),
        sa.Column('deskripsi', sa.Text(), nullable=True),
        sa.Column('petunjuk_keselamatan', sa.Text(), nullable=True),
        sa.Column('geom', Geometry(geometry_type='GEOMETRY', srid=4326), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.execute("CREATE INDEX IF NOT EXISTS idx_ancaman_geologis_geom ON ancaman_geologis USING GIST (geom);")

    # 4. Seeding entitas ancaman geologis riil Sumatera Barat (Pusgen & PVMBG)
    op.execute("""
        INSERT INTO ancaman_geologis (nama, jenis, buffer_meter, tingkat_bahaya, deskripsi, petunjuk_keselamatan, geom)
        VALUES 
        (
            'Sesar Sumatera Segmen Sianok',
            'sesar',
            2500,
            'BAHAYA_SESAR_DANGKAL',
            'Patahan geser aktif darat membelah Ngarai Sianok, Kota Bukittinggi hingga Danau Maninjau dengan laju geser 11 mm/tahun.',
            'ZONA SESAR AKTIF DANGKAL! Menjauh dari bangunan tinggi dan tebing curam Ngarai Sianok. Evakuasi mandiri ke lapangan terbuka.',
            ST_SetSRID(ST_GeomFromText('LINESTRING(100.250 -0.200, 100.369 -0.305, 100.480 -0.420)'), 4326)
        ),
        (
            'Sesar Sumatera Segmen Sumani',
            'sesar',
            2000,
            'BAHAYA_SESAR_DANGKAL',
            'Patahan aktif darat menghubungkan Danau Singkarak, Kota Solok, hingga batas utara Danau Dibawah.',
            'ZONA PATAHAN AKTIF SUMANI! Waspadai retakan tanah dan guncangan permukaan. Hindari struktur bangunan yang rentan roboh.',
            ST_SetSRID(ST_GeomFromText('LINESTRING(100.550 -0.620, 100.620 -0.750, 100.680 -0.880, 100.720 -1.020)'), 4326)
        ),
        (
            'Sesar Sumatera Segmen Suliti',
            'sesar',
            2000,
            'BAHAYA_SESAR_DANGKAL',
            'Patahan aktif memanjang dari Danau Diatas melewati Lembah Gumanti menuju Kabupaten Solok Selatan.',
            'ZONA BAHAYA SESAR SULITI! Waspadai pergeseran tanah dan potensi longsor di lereng perbukitan Solok Selatan.',
            ST_SetSRID(ST_GeomFromText('LINESTRING(100.740 -1.050, 100.900 -1.250, 101.230 -1.520)'), 4326)
        ),
        (
            'Koridor Sempadan Batang Anai (Lahar Hujan Marapi)',
            'galodo',
            300,
            'ZONA_BAHAYA_LAHAR',
            'Alur aliran lahar hujan dan bongkah batu andesit dari hulu kaldera Gunung Marapi melintasi Lembah Anai.',
            'ZONA BAHAYA ALIRAN LAHAR! Jauhi sempadan sungai minimal 300 meter, hindari melintasi jembatan, dan segera naik ke perbukitan.',
            ST_SetSRID(ST_GeomFromText('LINESTRING(100.345 -0.485, 100.332 -0.495, 100.315 -0.510, 100.295 -0.530)'), 4326)
        ),
        (
            'Koridor Batang Bukik Batabuah (Lereng Timur Marapi)',
            'galodo',
            250,
            'ZONA_BAHAYA_LAHAR',
            'Sempadan sungai lahar hujan Marapi kawasan Canduang dan Bukik Batabuah Agam.',
            'ZONA BAHAYA GALODO! Segera evakuasi ke zona aman perbukitan menjauhi alur sungai. Pantau curah hujan puncak kaldera.',
            ST_SetSRID(ST_GeomFromText('LINESTRING(100.440 -0.380, 100.430 -0.395, 100.420 -0.410)'), 4326)
        ),
        (
            'Zona Megathrust Mentawai (Segmen Siberut Mw 8.9)',
            'megathrust',
            45000,
            'ZONA_BAHAYA_TSUNAMI',
            'Bidang penunjaman lempeng aktif Samudera Hindia barat Kepulauan Mentawai dengan potensi gempa dahsyat dan tsunami.',
            'ZONA ANCAMAN TSUNAMI NEAR-FIELD! Segera evakuasi ke shelter bertingkat (lantai 3+) atau dataran tinggi > 15 mdpl sesaat setelah gempa kuat.',
            ST_SetSRID(ST_GeomFromText('LINESTRING(98.500 0.500, 99.100 -0.800, 99.800 -1.800, 100.500 -2.900)'), 4326)
        );
    """)

def downgrade() -> None:
    op.drop_table('ancaman_geologis')
    op.drop_column('posko_evakuasi', 'ketersediaan_tenaga_medis')
    op.drop_column('posko_evakuasi', 'ketersediaan_dapur_umum')
    op.drop_column('posko_evakuasi', 'ketersediaan_air_bersih')
    op.drop_column('posko_evakuasi', 'jumlah_pengungsi_disabilitas')
    op.drop_column('posko_evakuasi', 'jumlah_pengungsi_balita')
    op.drop_column('posko_evakuasi', 'jumlah_pengungsi_lansia')
    op.drop_column('posko_evakuasi', 'jumlah_pengungsi_wanita')
    op.drop_column('posko_evakuasi', 'jumlah_pengungsi_pria')
    op.drop_column('kejadian_bencana', 'foto_url')
