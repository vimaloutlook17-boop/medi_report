import uvicorn
from fastapi import FastAPI
from app.api.purchase import router as purchase_router
from app.api.stocks.router import router as stocks_router
from app.api.sales.router import router as sales_router
from app.api.auth_router import router as auth_api_router

from contextlib import asynccontextmanager
from app.database import init_db, close_db
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
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

@app.get('/')
def read_root():
    return {'message': 'Welcome to Medi API (Python Backend)'}


if __name__ == '__main__':
    uvicorn.run('app.main:app', host='0.0.0.0', port=8000, reload=True)
