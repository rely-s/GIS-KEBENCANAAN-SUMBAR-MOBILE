import sys
sys.path.insert(0, 'backend')
import asyncio
from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def test():
    async with AsyncSessionLocal() as s:
        res = await s.execute(text("SELECT 1"))
        print("DB CONNECTIVITY OK:", res.scalar())
        # Cek tabel-tabel utama
        t_res = await s.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"))
        tables = [r[0] for r in t_res.fetchall()]
        print("Tables in public schema:", len(tables), tables)

if __name__ == "__main__":
    asyncio.run(test())
