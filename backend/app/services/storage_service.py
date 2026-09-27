import os
import re
import uuid
import base64
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Direktori dasar upload file
BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
LAPORAN_DIR = UPLOAD_DIR / "laporan"

# Pastikan folder target selalu ada
LAPORAN_DIR.mkdir(parents=True, exist_ok=True)

# Batasan ukuran file (maksimal 8 MB untuk foto lapangan)
MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024

# MIME type yang diizinkan untuk bukti visual bencana
ALLOWED_MIME_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
}

def save_base64_image(base64_str: str, subfolder: str = "laporan") -> Optional[str]:
    """
    Menyimpan foto Base64 ke disk penyimpanan lokal yang aman (atau MinIO/S3 adapter).
    
    1. Memvalidasi format data URI (data:image/webp;base64,...).
    2. Memeriksa ukuran file maksimum (8MB).
    3. Menghasilkan nama file UUIDv4 acak untuk mencegah path traversal.
    4. Mengembalikan relative URL (/uploads/{subfolder}/{filename}) untuk disajikan via HTTP.
    """
    if not base64_str or not base64_str.strip():
        return None

    try:
        # 1. Parsing format data URI jika ada
        ext = ".webp"  # default
        data_clean = base64_str.strip()

        if ";base64," in data_clean:
            header, encoded = data_clean.split(";base64,", 1)
            # Ekstrak MIME type dari header
            match = re.search(r"data:([a-zA-Z0-9/+-]+)", header)
            if match:
                mime_type = match.group(1).lower()
                if mime_type not in ALLOWED_MIME_TYPES:
                    logger.warning(f"Format MIME ditolak: {mime_type}")
                    return None
                ext = ALLOWED_MIME_TYPES[mime_type]
            data_clean = encoded

        # 2. Decode Base64 ke bytes
        image_bytes = base64.b64decode(data_clean)

        # 3. Validasi batas ukuran
        if len(image_bytes) > MAX_FILE_SIZE_BYTES:
            logger.warning(f"Ukuran file melampaui batas: {len(image_bytes)} bytes > {MAX_FILE_SIZE_BYTES} bytes")
            return None

        # 4. Validasi Magic Bytes Ketat (Strict Rejection untuk JPEG, PNG, WEBP)
        if ext in [".jpg", ".jpeg"] and not image_bytes.startswith(b"\xff\xd8"):
            logger.warning("Magic bytes JPEG tidak valid. Unggahan ditolak.")
            return None
        elif ext == ".png" and not image_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
            logger.warning("Magic bytes PNG tidak valid. Unggahan ditolak.")
            return None
        elif ext == ".webp" and (b"WEBP" not in image_bytes[:16] and not image_bytes.startswith(b"RIFF")):
            logger.warning("Magic bytes WEBP tidak valid. Unggahan ditolak.")
            return None

        # 5. Tulis file dengan nama UUID yang aman
        target_dir = UPLOAD_DIR / subfolder
        target_dir.mkdir(parents=True, exist_ok=True)

        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = target_dir / filename

        with open(filepath, "wb") as f:
            f.write(image_bytes)

        relative_url = f"/uploads/{subfolder}/{filename}"
        logger.info(f"Berhasil menyimpan foto bencana: {relative_url} ({len(image_bytes)} bytes)")
        return relative_url

    except Exception as e:
        logger.error(f"Gagal memproses dan menyimpan foto base64: {e}", exc_info=True)
        return None
