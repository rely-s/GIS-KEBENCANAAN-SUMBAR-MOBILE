from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "GIS Kebencanaan Sumatera Barat"
    API_V1_STR: str = "/api"
    
    # PostgreSQL & PostGIS Pool Settings
    POSTGRES_SERVER: str = Field(default="127.0.0.1", alias="DB_HOST")
    POSTGRES_PORT: int = Field(default=5432, alias="DB_PORT")
    POSTGRES_USER: str = Field(default="postgres", alias="DB_USER")
    POSTGRES_PASSWORD: str = Field(default="postgres123", alias="DB_PASSWORD")
    POSTGRES_DB: str = Field(default="gis_sumbar", alias="DB_NAME")
    DB_POOL_SIZE: int = Field(default=20, alias="DB_POOL_SIZE")
    DB_MAX_OVERFLOW: int = Field(default=10, alias="DB_MAX_OVERFLOW")

    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:8082",
        "http://127.0.0.1:8082",
        "https://gis-kebencanaan.sumbarprov.go.id"
    ]

    # JWT & Auth Security
    JWT_SECRET_KEY: str = Field(
        default="gis_sumbar_2026_kriptografis_kunci_rahasia_pusdalops_bpbd_99x7f2",
        alias="JWT_SECRET",
        min_length=32
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60 * 12, alias="ACCESS_TOKEN_EXPIRE_MINUTES") # 12 Jam shift Pusdalops
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Routing Services (OSRM & Valhalla)
    OSRM_URL: str = Field(default="http://127.0.0.1:5000", alias="OSRM_URL")
    OSRM_FALLBACK_URL: str = "https://router.project-osrm.org"
    VALHALLA_URL: str = Field(default="http://127.0.0.1:8002", alias="VALHALLA_URL")

    # BMKG Real-Time Endpoints
    BMKG_AUTOGEMPA_URL: str = "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json"
    BMKG_GEMPATERKINI_URL: str = "https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json"
    BMKG_GEMPADIRASAKAN_URL: str = "https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json"

    @property
    def sync_database_url(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def async_database_url(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()

