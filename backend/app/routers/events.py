import asyncio
import json
import logging
from typing import AsyncGenerator, Set
from datetime import datetime, timezone
from fastapi import APIRouter, Request, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.core.dependencies import get_current_user_optional, require_role
from app.models.pengguna import Pengguna

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/events", tags=["Real-Time EWS Event Stream (SSE)"])

class EventBroadcaster:
    """
    Real-Time Event Broadcaster Hub menggunakan Server-Sent Events (SSE).
    Mendistribusikan notifikasi darurat (Gempa BMKG, Laporan Masuk, Verifikasi Bencana)
    ke seluruh client terkoneksi (Operator Pusdalops & Peta Publik Warga) secara asinkron.
    """
    def __init__(self):
        self._subscribers: Set[asyncio.Queue] = set()
        self._lock = asyncio.Lock()
        self._total_broadcasts: int = 0
        self._created_at: datetime = datetime.now(timezone.utc)

    async def register(self) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        async with self._lock:
            self._subscribers.add(queue)
            logger.info(f"[SSE] Client connected. Total active subscribers: {len(self._subscribers)}")
        return queue

    async def unregister(self, queue: asyncio.Queue):
        async with self._lock:
            self._subscribers.discard(queue)
            logger.info(f"[SSE] Client disconnected. Total active subscribers: {len(self._subscribers)}")

    async def broadcast(self, event_type: str, data: dict):
        """
        Menyalurkan event ke semua subscriber queue yang aktif.
        """
        self._total_broadcasts += 1
        payload = {
            "type": event_type,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        raw_message = f"event: {event_type}\ndata: {json.dumps(payload, default=str)}\n\n"

        async with self._lock:
            subscribers = list(self._subscribers)

        for queue in subscribers:
            try:
                queue.put_nowait(raw_message)
            except asyncio.QueueFull:
                logger.warning("[SSE] Subscriber queue full, dropping oldest message.")
                try:
                    queue.get_nowait()
                    queue.put_nowait(raw_message)
                except Exception:
                    pass
            except Exception as e:
                logger.error(f"[SSE] Error delivering message to queue: {e}")

    async def subscribe(self, request: Request) -> AsyncGenerator[str, None]:
        queue = await self.register()
        try:
            # 1. Kirim sambutan awal (handshake success)
            init_payload = {
                "type": "connected",
                "data": {
                    "status": "ready",
                    "server_time": datetime.now(timezone.utc).isoformat(),
                    "message": "Terhubung ke Event Stream Pusdalops BPBD Sumbar."
                }
            }
            yield f"event: connected\ndata: {json.dumps(init_payload)}\n\n"

            # 2. Loop streaming dengan keepalive heartbeat
            while True:
                # Periksa apakah koneksi client masih aktif
                if await request.is_disconnected():
                    break

                try:
                    # Tunggu pesan baru maksimal 15 detik sebelum mengirim heartbeat
                    message = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield message
                except asyncio.TimeoutError:
                    # Heartbeat comment untuk mencegah timeout Nginx / browser
                    yield ": keep-alive\n\n"
        finally:
            await self.unregister(queue)

    @property
    def stats(self) -> dict:
        return {
            "active_subscribers": len(self._subscribers),
            "total_broadcasts": self._total_broadcasts,
            "uptime_since": self._created_at.isoformat()
        }

# Singleton Broadcaster Hub
broadcaster = EventBroadcaster()

@router.get("/stream")
async def event_stream(request: Request):
    """
    Endpoint Server-Sent Events (SSE) Publik & Pusdalops.
    Menerima aliran data real-time:
    - 'gempa_baru': Gempa BMKG terkini / segmen sesar lokal Sumbar
    - 'laporan_baru': Laporan kedaruratan baru dari warga (untuk antrean operator)
    - 'laporan_diverifikasi': Laporan terkonfirmasi siap tampil di peta publik
    - 'peringatan_dini': Peringatan darurat cuaca ekstrem / tsunami
    """
    return StreamingResponse(
        broadcaster.subscribe(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no", # Nonaktifkan buffering Nginx
            "Access-Control-Allow-Origin": "*",
        }
    )

@router.get("/status")
async def get_stream_status():
    """
    Melihat status kesehatan dan jumlah subscriber aktif pada Event Stream Hub.
    """
    return {
        "status": "healthy",
        **broadcaster.stats
    }

class BroadcastPayload(BaseModel):
    event_type: str
    data: dict

@router.post("/broadcast", status_code=status.HTTP_202_ACCEPTED)
async def manual_broadcast(
    payload: BroadcastPayload,
    current_user: Pengguna = Depends(require_role(["admin", "pimpinan"]))
):
    """
    Admin/Pimpinan: Memicu siaran darurat publik secara manual (Peringatan Dini / Evakuasi).
    """
    await broadcaster.broadcast(payload.event_type, payload.data)
    return {
        "status": "success",
        "message": f"Event '{payload.event_type}' berhasil disiarkan ke seluruh subscriber.",
        "active_subscribers": broadcaster.stats["active_subscribers"]
    }
