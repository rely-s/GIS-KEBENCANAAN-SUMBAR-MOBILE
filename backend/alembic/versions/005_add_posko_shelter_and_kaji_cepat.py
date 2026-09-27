"""Add posko_shelter and laporan_kaji_cepat tables according to BNPB standards, and expand RBAC roles

Revision ID: 005_shelter_kaji_cepat
Revises: 004_cascading_wilayah
Create Date: 2026-09-22 22:38:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry

revision: str = '005_shelter_kaji_cepat'
down_revision: Union[str, None] = '004_cascading_wilayah'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Update check constraint pada tabel pengguna untuk mendukung 5 level RBAC
    op.execute("ALTER TABLE pengguna DROP CONSTRAINT IF EXISTS check_pengguna_role;")
    op.execute("""
        ALTER TABLE pengguna 
        ADD CONSTRAINT check_pengguna_role 
        CHECK (role IN ('operator', 'pusdalops', 'admin', 'pimpinan', 'super_admin'));
    """)

    # 2. Tabel Posko dan Shelter Pengungsian Terpadu Standar BNPB
    op.create_table(
        'posko_shelter',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nama_tempat', sa.String(length=150), nullable=False),
        sa.Column('jenis_fasilitas', sa.String(length=50), nullable=False, server_default='Shelter Sementara'),
        sa.Column('alamat_lengkap', sa.String(length=255), nullable=False),
        sa.Column('kode_desa', sa.String(length=15), nullable=True),
        sa.Column('penanggung_jawab_nama', sa.String(length=100), nullable=True),
        sa.Column('kontak_telepon', sa.String(length=30), nullable=True),
        sa.Column('kapasitas_maksimal', sa.Integer(), nullable=False, server_default='100'),
        sa.Column('jumlah_pengungsi_pria', sa.Integer(), server_default='0'),
        sa.Column('jumlah_pengungsi_wanita', sa.Integer(), server_default='0'),
        sa.Column('jumlah_pengungsi_lansia', sa.Integer(), server_default='0'),
        sa.Column('jumlah_pengungsi_balita', sa.Integer(), server_default='0'),
        sa.Column('jumlah_pengungsi_disabilitas', sa.Integer(), server_default='0'),
        sa.Column('ketersediaan_air_bersih', sa.String(length=10), server_default='YA'),
        sa.Column('ketersediaan_dapur_umum', sa.String(length=10), server_default='TIDAK'),
        sa.Column('ketersediaan_tenaga_medis', sa.String(length=10), server_default='TIDAK'),
        sa.Column('status_kelayakan', sa.String(length=20), server_default='AKTIF'),
        sa.Column('geom', Geometry(geometry_type='POINT', srid=4326), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.execute("CREATE INDEX IF NOT EXISTS idx_posko_shelter_geom ON posko_shelter USING GIST (geom);")

    # 3. Tabel Formulir Kaji Cepat Dampak (Rapid Assessment Form BNPB)
    op.create_table(
        'laporan_kaji_cepat',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('kejadian_id', sa.Integer(), nullable=True),
        sa.Column('nomor_laporan', sa.String(length=100), nullable=False),
        sa.Column('waktu_pelaporan', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('pelapor_id', sa.Integer(), nullable=True),
        sa.Column('verifikator_id', sa.Integer(), nullable=True),
        sa.Column('status_verifikasi', sa.String(length=30), server_default='MENUNGGU_VERIFIKASI'),
        sa.Column('korban_meninggal', sa.Integer(), server_default='0'),
        sa.Column('korban_hilang', sa.Integer(), server_default='0'),
        sa.Column('korban_luka_berat', sa.Integer(), server_default='0'),
        sa.Column('korban_luka_ringan', sa.Integer(), server_default='0'),
        sa.Column('total_pengungsi', sa.Integer(), server_default='0'),
        sa.Column('rumah_rusak_berat', sa.Integer(), server_default='0'),
        sa.Column('rumah_rusak_sedang', sa.Integer(), server_default='0'),
        sa.Column('rumah_rusak_ringan', sa.Integer(), server_default='0'),
        sa.Column('rumah_terendam', sa.Integer(), server_default='0'),
        sa.Column('fasilitas_kesehatan_rusak', sa.Integer(), server_default='0'),
        sa.Column('fasilitas_pendidikan_rusak', sa.Integer(), server_default='0'),
        sa.Column('jembatan_rusak', sa.Integer(), server_default='0'),
        sa.Column('jalan_terputus_titik', sa.Integer(), server_default='0'),
        sa.Column('lahan_terdampak_ha', sa.Numeric(precision=10, scale=2), server_default='0.00'),
        sa.Column('estimasi_kerugian_rupiah', sa.Numeric(precision=15, scale=2), server_default='0.00'),
        sa.Column('kebutuhan_mendesak', sa.Text(), nullable=True),
        sa.Column('upaya_penanganan', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['kejadian_id'], ['kejadian_bencana.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['pelapor_id'], ['pengguna.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['verifikator_id'], ['pengguna.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nomor_laporan')
    )


def downgrade() -> None:
    op.drop_table('laporan_kaji_cepat')
    op.drop_table('posko_shelter')
    op.execute("ALTER TABLE pengguna DROP CONSTRAINT IF EXISTS check_pengguna_role;")
    op.execute("""
        ALTER TABLE pengguna 
        ADD CONSTRAINT check_pengguna_role 
        CHECK (role IN ('operator', 'admin', 'pimpinan'));
    """)
