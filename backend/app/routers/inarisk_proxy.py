import httpx
import logging
import ipaddress
import asyncio
from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException, Query, Response, status

router = APIRouter(prefix="/inarisk", tags=["InaRISK BNPB Proxy & Geocache"])
logger = logging.getLogger(__name__)

# Daftar Putih Domain Resmi (BSSN ITSA & OWASP ASVS Compliance - Anti-SSRF)
ALLOWED_DOMAINS = [
    "inarisk.bnpb.go.id",
    "inarisk1.bnpb.go.id",
    "data.bmkg.go.id",
    "magma.vsi.esdm.go.id",
    "geoportal.sumbarprov.go.id",
    "gis.bnpb.go.id"
]

# Alamat IP metadata cloud terlarang (AWS, GCP, Azure, OpenStack)
BLOCKED_METADATA_IPS = {
    "169.254.169.254",
    "100.100.100.200",
    "169.254.170.2",
    "fd00:ec2::254"
}

async def is_safe_url(target_url: str) -> bool:
    """
    Validasi keamanan URL tujuan untuk mencegah Server-Side Request Forgery (SSRF).
    1. Memeriksa whitelist domain resmi kebencanaan Indonesia.
    2. Melakukan resolusi DNS asinkron (non-blocking) untuk SEMUA record A/AAAA.
    3. Memblokir seluruh alamat IP privat / loopback / link-local / cloud metadata (RFC 1918/RFC 3927).
    """
    try:
        parsed = urlparse(target_url)
        if parsed.scheme not in ["http", "https"]:
            logger.warning(f"SSRF Blocked: Skema '{parsed.scheme}' tidak diizinkan (hanya http/https).")
            return False

        hostname = parsed.hostname
        if not hostname:
            return False

        # 1. Cek domain whitelist
        is_whitelisted = any(
            hostname == domain or hostname.endswith("." + domain)
            for domain in ALLOWED_DOMAINS
        )
        if not is_whitelisted:
            logger.warning(f"SSRF Blocked: Domain {hostname} tidak terdaftar di whitelist resmi.")
            return False

        # 2. Resolusi DNS Asinkron (Non-blocking ke event loop asyncio)
        loop = asyncio.get_running_loop()
        try:
            addr_info = await loop.getaddrinfo(hostname, None)
        except Exception as dns_err:
            logger.warning(f"SSRF Check: Gagal resolusi DNS untuk host {hostname}: {dns_err}")
            return False

        # 3. Validasi SEMUA IP yang dihasilkan (IPv4 & IPv6)
        for entry in addr_info:
            ip_str = entry[4][0]
            if ip_str in BLOCKED_METADATA_IPS:
                logger.warning(f"SSRF Blocked: Host {hostname} terpetakan ke Cloud Metadata IP: {ip_str}")
                return False

            ip = ipaddress.ip_address(ip_str)
            if (
                ip.is_private
                or ip.is_loopback
                or ip.is_link_local
                or ip.is_reserved
                or ip.is_multicast
                or ip.is_unspecified
            ):
                logger.warning(f"SSRF Blocked: Host {hostname} mengarah ke IP terlarang/privat: {ip_str}")
                return False

        return True
    except Exception as e:
        logger.error(f"Error validating proxy URL: {e}")
        return False

@router.get("/proxy")
async def proxy_inarisk_service(
    target_url: str = Query(..., description="URL layanan ArcGIS REST atau WMS resmi InaRISK BNPB")
):
    """
    Reverse-Proxy Aman untuk Layanan Spasial InaRISK BNPB.
    Menghilangkan batasan CORS browser dan mengisolasi server internal dari eksploitasi SSRF.
    Enforces validasi SSL/TLS resmi (verify=True).
    """
    if not (await is_safe_url(target_url)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "SSRF_FORBIDDEN",
                    "message": "Akses ke URL target ditolak. Hanya domain resmi BNPB, BMKG, dan ESDM yang diizinkan."
                }
            }
        )

    headers = {
        "User-Agent": "gis-kebencanaan-sumbar-proxy/1.4",
        "Accept": "application/json, image/png, image/jpeg, */*"
    }

    try:
        # Enforce SSL/TLS certificate verification untuk produksi
        async with httpx.AsyncClient(timeout=15.0, verify=True) as client:
            resp = await client.get(target_url, headers=headers)
            content_type = resp.headers.get("content-type", "application/json")
            return Response(
                content=resp.content,
                status_code=resp.status_code,
                media_type=content_type
            )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail={"error": {"code": "INARISK_TIMEOUT", "message": "Server spasial InaRISK BNPB mengalami waktu habis (timeout)."}}
        )
    except httpx.RequestError as req_err:
        logger.error(f"Proxy request connection error: {req_err}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": {"code": "PROXY_FAILED", "message": "Gagal terhubung ke layanan spasial eksternal."}}
        )
    except Exception as e:
        logger.error(f"Proxy request unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "INTERNAL_PROXY_ERROR", "message": "Terjadi kesalahan internal pada reverse proxy."}}
        )

@router.get("/layers")
async def get_inarisk_layers_catalog():
    """
    Katalog Layanan REST InaRISK BNPB Terverifikasi untuk Wilayah Sumatera Barat.
    """
    return {
        "status": "ok",
        "catalog": [
            {
                "id": "inarisk_tsunami_sumbar",
                "name": "Kawasan Bahaya Tsunami InaRISK (Pesisir Sumbar)",
                "type": "ArcGIS REST",
                "url": "https://inarisk.bnpb.go.id:6443/arcgis/rest/services/inaRISK/layer_bahaya_tsunami/MapServer",
                "atribusi": "Direktorat Pemetaan Risiko Bencana BNPB"
            },
            {
                "id": "inarisk_banjir_bandang",
                "name": "Kawasan Rawan Banjir Bandang & Galodo",
                "type": "ArcGIS REST",
                "url": "https://inarisk.bnpb.go.id:6443/arcgis/rest/services/inaRISK/layer_bahaya_banjir_bandang/MapServer",
                "atribusi": "Direktorat Pemetaan Risiko Bencana BNPB"
            },
            {
                "id": "inarisk_longsor",
                "name": "Kerentanan Gerakan Tanah & Longsor Lereng",
                "type": "ArcGIS REST",
                "url": "https://inarisk.bnpb.go.id:6443/arcgis/rest/services/inaRISK/layer_bahaya_tanah_longsor/MapServer",
                "atribusi": "Pusat Vulkanologi dan Mitigasi Bencana Geologi (PVMBG) / BNPB"
            }
        ]
    }
