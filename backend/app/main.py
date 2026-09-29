import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.routers import health, wilayah, auth, routing, posko, jalan, eksternal, admin, bencana, tiles, sitrep, cascading_wilayah, chatbot, proximity, inarisk_proxy, events
from app.services.bmkg_service import start_bmkg_scheduler, sync_gempa_bmkg
from app.services.bmkg_weather_service import sync_bmkg_weather_alerts
from app.routers.tiles import start_tiles_scheduler

logger = logging.getLogger("main")

# Rate limiter global dengan identifikasi remote address client
limiter = Limiter(key_func=get_remote_address, default_limits=["240/minute"])

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup:
    # 1. Jalankan scheduler background BMKG (sensor gempa & cuaca aktif)
    start_bmkg_scheduler()
    asyncio.create_task(sync_gempa_bmkg())
    asyncio.create_task(sync_bmkg_weather_alerts())
    
    # 2. Jalankan background worker tile & refresh materialized view CONCURRENTLY
    asyncio.create_task(start_tiles_scheduler(interval_seconds=900))
    
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API Sistem Informasi Geografis Kebencanaan Provinsi Sumatera Barat (BPBD Sumbar & LPPM)",
    version="1.4.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# Middleware Keamanan Header HTTP Tambahan (Defense-in-Depth)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Konfigurasi CORS Ketat
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handler Rate Limit Terstandarisasi
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "error": {
                "code": "RATE_LIMIT_EXCEEDED",
                "message": "Batas frekuensi permintaan terlampaui. Silakan tunggu beberapa detik.",
                "detail": str(exc.detail)
            }
        },
    )

# Error Handler Terstandarisasi sesuai 03-backend-api.md
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_error = errors[0] if errors else {}
    field = ".".join(str(loc) for loc in first_error.get("loc", []))
    msg = first_error.get("msg", "Data masukan tidak valid.")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": f"Kesalahan validasi pada field '{field}': {msg}",
            }
        },
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Internal server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Terjadi kesalahan internal pada server sistem kebencanaan.",
            }
        },
    )

# Daftarkan Seluruh Router (Fase 1, 2, 3, 4, & CRUD Posko/Bencana)
app.include_router(health.router, prefix="/api")
app.include_router(wilayah.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(routing.router, prefix="/api")
app.include_router(posko.router, prefix="/api")
app.include_router(jalan.router, prefix="/api")
app.include_router(eksternal.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(bencana.router, prefix="/api")
app.include_router(tiles.router, prefix="/api")
app.include_router(sitrep.router, prefix="/api")
app.include_router(sitrep.public_router, prefix="/api")
app.include_router(sitrep.laporan_router, prefix="/api")
app.include_router(chatbot.router, prefix="/api")
app.include_router(proximity.router, prefix="/api")
app.include_router(inarisk_proxy.router, prefix="/api")
app.include_router(events.router, prefix="/api")
# Router Cascading Wilayah Relasional (Provinsi -> Kota -> Kecamatan)
# Disediakan pada prefix '/api' (standar RESTful) dan root '/' (kompatibilitas Vite dev proxy)
app.include_router(cascading_wilayah.router, prefix="/api")
app.include_router(cascading_wilayah.router, include_in_schema=False)

# Mount Direktori Penyimpanan Statis (Foto Laporan Warga & Dokumen PDF SITREP)
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.get("/", include_in_schema=False)
async def root():
    return {
        "message": "GIS Kebencanaan Sumatera Barat API Running (Fase 4 - Pengerasan Produksi)",
        "docs": "/docs",
        "health": "/api/health"
    }
