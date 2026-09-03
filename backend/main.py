import os
import uvicorn
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), 'app', '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
else:
    load_dotenv()

from app.main import app

if __name__ == "__main__":
    host = os.getenv("HOST", os.getenv("BACKEND_HOST", "0.0.0.0"))
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
