import aiomysql
import os
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
else:
    load_dotenv()

db_pool = None

async def init_db():
    global db_pool
    db_pool = await aiomysql.create_pool(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        db=os.getenv("DB_NAME", "main_medi"),
        autocommit=True,
        cursorclass=aiomysql.DictCursor
    )

async def close_db():
    global db_pool
    if db_pool:
        db_pool.close()
        await db_pool.wait_closed()

async def get_db():
    async with db_pool.acquire() as conn:
        yield conn
