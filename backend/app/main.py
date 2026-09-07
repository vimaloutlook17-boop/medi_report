import uvicorn
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.api.purchase import router as purchase_router
from app.api.stocks.router import router as stocks_router
from app.api.sales.router import router as sales_router
from app.api.auth_router import router as auth_api_router
from app.api.reports.router import router as reports_router

from contextlib import asynccontextmanager
from app.database import init_db, close_db
from fastapi.middleware.cors import CORSMiddleware
import logging
import re

class TokenMaskFilter(logging.Filter):
    # Masks sensitive token parameters in Uvicorn terminal logs
    def filter(self, record):
        if record.args and len(record.args) >= 3 and isinstance(record.args[2], str):
            if 'token=' in record.args[2]:
                new_args = list(record.args)
                new_args[2] = re.sub(r'(token=)[^& ]+', r'\g<1>***MASKED***', new_args[2])
                record.args = tuple(new_args)
        return True

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Apply token masking to terminal logs
    logging.getLogger("uvicorn.access").addFilter(TokenMaskFilter())
    
    await init_db()
    yield
    await close_db()

app = FastAPI(title='Medi API', lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include section-wise routers
app.include_router(auth_api_router, prefix='/api/auth', tags=['Authentication'])
app.include_router(purchase_router.router, prefix='/api/purchase', tags=['Purchase'])
app.include_router(stocks_router, prefix='/api/stocks')
app.include_router(sales_router, prefix='/api/sales')
app.include_router(reports_router, prefix='/api/reports')

@app.get('/api')
def read_root():
    return {'message': 'Welcome to Medi API (Python Backend)'}

# Mount the static files from the frontend build directory
# We assume the frontend is built into the 'frontend/dist' directory at the same level as 'backend'
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'frontend', 'dist')

if os.path.isdir(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{catchall:path}")
    def serve_react_app(catchall: str):
        # Serve index.html for any unmatched route to support SPA navigation
        # But ensure we don't accidentally intercept actual API calls (handled by order/prefixes)
        if catchall.startswith("api/"):
            return {"detail": "Not Found"}
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path, headers={"Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache", "Expires": "0"})
        return {"detail": "Frontend build not found. Please run 'npm run build' in the frontend directory."}
else:
    @app.get("/{catchall:path}")
    def missing_frontend(catchall: str):
        if catchall.startswith("api/"):
            return {"detail": "Not Found"}
        return {"detail": f"Frontend build directory not found at {frontend_dist}. Please run 'npm run build'."}


if __name__ == '__main__':
    import os
    from dotenv import load_dotenv
    dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    if os.path.exists(dotenv_path):
        load_dotenv(dotenv_path)
    host = os.getenv('HOST', os.getenv('BACKEND_HOST', '0.0.0.0'))
    port = int(os.getenv('PORT', '8000'))
    uvicorn.run('app.main:app', host=host, port=port, reload=True)
