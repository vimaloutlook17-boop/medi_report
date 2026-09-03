import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProductSummaryPage from './features/stocks/products_summary/ProductSummaryPage';
import ProductSummaryDetailsPage from './features/stocks/products_summary/ProductSummaryDetailsPage';
import StockReportBatchWisePage from './features/stocks/stock_report_batch_wise/StockReportBatchWisePage';
import ZeroStocksPage from './features/stocks/zero_stocks/ZeroStocksPage';

import ProductWiseCustomerList from './features/sales/product_wise_customer/ProductWiseCustomerList';
import ProductWiseUniqueCustomerList from './features/sales/product_wise_unique_customer/ProductWiseUniqueCustomerList';
import CustomerWiseProductList from './features/sales/customer_wise_product/CustomerWiseProductList';

import CollectionReportPage from './features/Reports/collection_report/CollectionReportPage';
import OpIpReportPage from './features/Reports/op_ip_report/OpIpReportPage';

import AuthHandler from './features/auth/AuthHandler';
import { AuthProvider } from './AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex h-screen bg-[#f4f6f9] overflow-hidden text-[13px] text-[#333] font-sans antialiased">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          
          {/* The actual page content area */}
          <div className="flex-1 overflow-auto bg-white">
            <Routes>
              {/* Redirect root to a default page */}
              <Route path="/" element={<Navigate to="/stocks/product-summary" replace />} />

              {/* Auth Module */}
              <Route path="/auth" element={<AuthHandler />} />

              {/* Stocks Module */}
              <Route path="/stocks/product-summary" element={<ProductSummaryPage />} />
              <Route path="/stocks/product-summary-details/:id" element={<ProductSummaryDetailsPage />} />
              <Route path="/stocks/stock-report-batch-wise" element={<StockReportBatchWisePage />} />
              <Route path="/stocks/zero-stocks" element={<ZeroStocksPage />} />

              {/* Stocks Direct Alias Routes */}
              <Route path="/stock-report-batch-wise" element={<StockReportBatchWisePage />} />
              <Route path="/zero-stocks" element={<ZeroStocksPage />} />

              {/* Sales Module */}
              <Route path="/sales/product-wise-customer" element={<ProductWiseCustomerList />} />
              <Route path="/sales/product-wise-unique-customer" element={<ProductWiseUniqueCustomerList />} />
              <Route path="/sales/customer-wise-product" element={<CustomerWiseProductList />} />

              {/* Sales Direct Alias Routes */}
              <Route path="/product-wise-customer" element={<ProductWiseCustomerList />} />
              <Route path="/product-wise-unique-customer" element={<ProductWiseUniqueCustomerList />} />
              <Route path="/customer-wise-product" element={<CustomerWiseProductList />} />

              {/* Reports Module */}
              <Route path="/reports/collection_report" element={<CollectionReportPage />} />
              <Route path="/reports/op_ip_report" element={<OpIpReportPage />} />
            </Routes>
          </div>
        </div>
      </div>
      </Router>
    </AuthProvider>
  );
}

