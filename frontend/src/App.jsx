import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProductSummaryPage from './features/stocks/products_summary/ProductSummaryPage';
import StockReportBatchWisePage from './features/stocks/stock_report_batch_wise/StockReportBatchWisePage';
import ZeroStocksPage from './features/stocks/zero_stocks/ZeroStocksPage';

export default function App() {
  return (
    <Router>
      <div className="flex h-screen bg-[#f4f6f9] overflow-hidden text-[13px] text-[#333] font-sans antialiased">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          
          {/* The actual page content area */}
          <div className="flex-1 overflow-auto bg-white">
            <Routes>
              <Route path="/" element={<ProductSummaryPage />} />
              <Route path="/stock-report-batch-wise" element={<StockReportBatchWisePage />} />
              <Route path="/zero-stocks" element={<ZeroStocksPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}
