import sys
sys.path.insert(0, 'backend')
import asyncio
from app.core.database import AsyncSessionLocal
from app.services.routing_service import kalkulasi_evakuasi_darurat, OFFICIAL_DETOUR_CORRIDORS

async def test():
    print("Testing Detour Corridors count:", len(OFFICIAL_DETOUR_CORRIDORS))
    async with AsyncSessionLocal() as session:
        # 1. Test Protokol Tsunami (Titik Pantai Padang)
        res_tsunami = await kalkulasi_evakuasi_darurat(
            db=session,
            lat=-0.933,
            lon=100.354,
            jenis_bencana="tsunami",
            moda="mobil"
        )
        print("Tsunami Flow Result:")
        print(" - Alur:", res_tsunami["alur"])
        print(" - Posko:", res_tsunami["posko"]["nama"])
        print(" - Profil Elevasi:", res_tsunami["profil_elevasi"])
        print(" - Warnings:", res_tsunami["hazard_warnings"])

        # 2. Test Protokol Galodo (Bukik Batabuah / Lereng Marapi)
        res_galodo = await kalkulasi_evakuasi_darurat(
            db=session,
            lat=-0.355,
            lon=100.445,
            jenis_bencana="galodo",
            moda="jalan_kaki"
        )
        print("\nGalodo Flow Result:")
        print(" - Alur:", res_galodo["alur"])
        print(" - Posko:", res_galodo["posko"]["nama"])
        print(" - Warnings:", res_galodo["hazard_warnings"])

        # 3. Test Protokol Sesar Darat (Bukittinggi Ngarai Sianok)
        res_sesar = await kalkulasi_evakuasi_darurat(
            db=session,
            lat=-0.305,
            lon=100.369,
            jenis_bencana="sesar",
            moda="mobil"
        )
        print("\nSesar Flow Result:")
        print(" - Alur:", res_sesar["alur"])
        print(" - Posko:", res_sesar["posko"]["nama"])
        print(" - Warnings:", res_sesar["hazard_warnings"])

if __name__ == "__main__":
    asyncio.run(test())
