import uvicorn
from fastapi import FastAPI
from app.api.purchase import router as purchase_router
from app.api.stocks.router import router as stocks_router

app = FastAPI(title='Medi API')

# Include section-wise routers
app.include_router(purchase_router.router, prefix='/api/purchase', tags=['Purchase'])
app.include_router(stocks_router, prefix='/api/stocks')

@app.get('/')
def read_root():
    return {'message': 'Welcome to Medi API (Python Backend)'}


if __name__ == '__main__':
    uvicorn.run('app.main:app', host='0.0.0.0', port=8000, reload=True)
