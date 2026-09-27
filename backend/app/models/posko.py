from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index, CheckConstraint
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from app.core.database import Base

class PoskoEvakuasi(Base):
    __tablename__ = "posko_evakuasi"

    id = Column(Integer, primary_key=True, index=True)
    nama = Column(String(150), nullable=False)
    alamat = Column(String(255), nullable=True)
    jenis = Column(String(30), nullable=True)
    lokasi = Column(Geometry(geometry_type="POINT", srid=4326), nullable=False)
    kapasitas = Column(Integer, nullable=True)
    fasilitas = Column(ARRAY(String), nullable=True)
    kontak_pic = Column(String(100), nullable=True)
    kontak_telepon = Column(String(30), nullable=True)
    status = Column(String(20), default="aktif", index=True)
    wilayah_id = Column(Integer, ForeignKey("wilayah_administratif.id"), nullable=True)
    id_kecamatan = Column(String(10), ForeignKey("kecamatan.id"), nullable=True, index=True)

    # Kolom Pilah Kelompok Rentan & Fasilitas Standar BNPB
    jumlah_pengungsi_pria = Column(Integer, default=0)
    jumlah_pengungsi_wanita = Column(Integer, default=0)
    jumlah_pengungsi_lansia = Column(Integer, default=0)
    jumlah_pengungsi_balita = Column(Integer, default=0)
    jumlah_pengungsi_disabilitas = Column(Integer, default=0)
    ketersediaan_air_bersih = Column(String(10), default="YA")
    ketersediaan_dapur_umum = Column(String(10), default="TIDAK")
    ketersediaan_tenaga_medis = Column(String(10), default="TIDAK")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    wilayah = relationship("WilayahAdministratif")

    __table_args__ = (
        CheckConstraint(
            "jenis IN ('posko_utama', 'posko_pengungsi', 'titik_kumpul', 'shelter_sementara', 'fasilitas_kesehatan', 'shelter_tes_tea', 'sirine_tsunami')",
            name="check_posko_jenis"
        ),
        CheckConstraint(
            "status IN ('aktif', 'penuh', 'nonaktif')",
            name="check_posko_status"
        ),
        Index("idx_posko_lokasi", "lokasi", postgresql_using="gist"),
    )


class PoskoShelter(Base):
    """
    Model Fasilitas Posko & Shelter Pengungsian Terpadu Standar BNPB
    Mendukung pendataan pilah kelompok rentan (lansia, balita, disabilitas)
    dan ketersediaan logistik serta fasilitas sanitasi air bersih.
    """
    __tablename__ = "posko_shelter"

    id = Column(Integer, primary_key=True, index=True)
    nama_tempat = Column(String(150), nullable=False)
    jenis_fasilitas = Column(String(50), nullable=False, default="Shelter Sementara")
    alamat_lengkap = Column(String(255), nullable=False)
    kode_desa = Column(String(15), nullable=True)
    penanggung_jawab_nama = Column(String(100), nullable=True)
    kontak_telepon = Column(String(30), nullable=True)
    kapasitas_maksimal = Column(Integer, nullable=False, default=100)
    jumlah_pengungsi_pria = Column(Integer, default=0)
    jumlah_pengungsi_wanita = Column(Integer, default=0)
    jumlah_pengungsi_lansia = Column(Integer, default=0)
    jumlah_pengungsi_balita = Column(Integer, default=0)
    jumlah_pengungsi_disabilitas = Column(Integer, default=0)
    ketersediaan_air_bersih = Column(String(10), default="YA")
    ketersediaan_dapur_umum = Column(String(10), default="TIDAK")
    ketersediaan_tenaga_medis = Column(String(10), default="TIDAK")
    status_kelayakan = Column(String(20), default="AKTIF")
    geom = Column(Geometry(geometry_type="POINT", srid=4326), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("idx_posko_shelter_geom", "geom", postgresql_using="gist"),
    )
