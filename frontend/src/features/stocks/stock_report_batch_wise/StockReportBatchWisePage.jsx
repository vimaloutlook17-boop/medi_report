import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ToCsvButton from '../../../components/ToCsvButton';
import ToExcelButton from '../../../components/ToExcelButton';
import NavigationTabs from '../../../components/NavigationTabs';
import PaginationControls from '../../../components/PaginationControls';
import ToPrintButton from '../../../components/ToPrintButton';
import { useAuth } from '../../../AuthContext';
import { apiConfig } from '../../../config';
import * as XLSX from 'xlsx';
import SearchableSelect from '../../../components/SearchableSelect';
import Loader from '../../../components/Loader';

export default function StockReportBatchWisePage() {
  const { token } = useAuth();
  
  // Data state
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  
  // Search dropdown state
  const [selectedProduct, setSelectedProduct] = useState('Search Product...');
  const [productOptions, setProductOptions] = useState([]);

  // Fetch product list for dropdown
  useEffect(() => {
    if (!token) return;
    fetch(`${apiConfig.base_url}/stocks/products-summary/products`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(result => {
        if (Array.isArray(result)) {
          setProductOptions(['Search Product...', ...result.map(item => item.name)]);
        }
      })
      .catch(err => console.error("Error fetching products dropdown:", err));
  }, [token]);

  // Fetch main table data
  useEffect(() => {
    if (!token) return;
    
    setIsLoading(true);
    let url = `${apiConfig.base_url}/stocks/stock-report-batch-wise?page=${page}&size=${size}`;
    if (selectedProduct && selectedProduct !== 'Search Product...') {
      url += `&search=${encodeURIComponent(selectedProduct)}`;
    }
    
    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(result => {
        setData(result.data || []);
        setTotalCount(result.total_count || 0);
      })
      .catch(err => console.error("Error fetching batch-wise report:", err))
      .finally(() => setIsLoading(false));
  }, [page, size, token, selectedProduct]);

  // Calculations for Footer
  const totalCostOverall = data.reduce((sum, row) => sum + (row.totalqty * row.cost), 0).toFixed(2);
  const totalMrpOverall = data.reduce((sum, row) => sum + (row.totalqty * row.mrp), 0).toFixed(2);

  const handlePrint = async () => {
    try {
      let url = `${apiConfig.base_url}/stocks/stock-report-batch-wise?page=0&size=-1`;
      if (selectedProduct && selectedProduct !== 'Search Product...' && selectedProduct !== '-- Select --') {
        url += `&search=${encodeURIComponent(selectedProduct)}`;
      }
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      const printData = result.data || [];

      const shopRes = await fetch(`${apiConfig.base_url}/auth/shop-profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const shopProfile = shopRes.ok ? await shopRes.json() : {};
      const shopName = shopProfile.name || "Test Clinic";
      const shopAddress = [shopProfile.address1, shopProfile.address2].filter(Boolean).join(" ") || "line1 line2";
      const shopCity = [shopProfile.city, shopProfile.state].filter(Boolean).join(" ") || "city Tamilnadu";

      const printWindow = window.open('', '_blank');
      
      const today = new Date();
      const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

      let html = `
        <html>
          <head>
            <title>Stock Report Batch Wise</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
              .header { text-align: center; margin-bottom: 20px; }
              .header h2 { margin: 0 0 5px 0; font-size: 18px; }
              .header p { margin: 2px 0; font-size: 12px; }
              .header h3 { margin: 10px 0; font-size: 14px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #000; padding: 6px; text-align: left; font-size: 12px; }
              th { font-weight: bold; background-color: #f8f9fa; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>${shopName}</h2>
              <p>${shopAddress}<br>${shopCity}</p>
              <h3>Stock Report</h3>
              <p>Date : ${formattedDate}</p>
            </div>
            <table>
              <thead style="display: table-header-group;">
                <tr>
                  <th class="text-center">S.No</th>
                  <th>Product Name</th>
                  <th>Batch</th>
                  <th class="text-center">Total Qty</th>
                  <th class="text-right">Cost Price</th>
                  <th class="text-right">Total Cost</th>
                  <th class="text-right">MRP</th>
                  <th class="text-right">Total MRP</th>
                </tr>
              </thead>
              <tbody>
      `;

      printData.forEach((row, index) => {
        const totalQty = row.totalqty !== null ? row.totalqty : 0;
        const cost = row.cost !== null ? row.cost : 0;
        const mrp = row.mrp !== null ? row.mrp : 0;
        
        html += `
          <tr>
            <td class="text-center">${index + 1}</td>
            <td>${row.item_name || "-"}</td>
            <td>${row.batch_item || "-"}</td>
            <td class="text-center">${totalQty}</td>
            <td class="text-right">${Number(cost).toFixed(2)}</td>
            <td class="text-right">${(totalQty * cost).toFixed(2)}</td>
            <td class="text-right">${Number(mrp).toFixed(2)}</td>
            <td class="text-right">${(totalQty * mrp).toFixed(2)}</td>
          </tr>
        `;
      });

      html += `
              </tbody>
            </table>
            <script>
              // Change the URL so the printed footer doesn't show "about:blank"
              window.history.replaceState(null, '', window.location.origin + '/users/print_stock_report_batchwise.php');
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
    } catch (err) {
      console.error("Error generating print:", err);
    }
  };

  return (
    <div className="px-[15px] pt-[15px] pb-0 bg-white min-h-full">
      <style>{`
        .select2-custom-scrollbar::-webkit-scrollbar { width: 14px; }
        .select2-custom-scrollbar::-webkit-scrollbar-track { background: #f8f9fa; border-left: 1px solid #e5e5e5; }
        .select2-custom-scrollbar::-webkit-scrollbar-thumb { background-color: #8c8c8c; border-radius: 10px; border: 3px solid #f8f9fa; }
        .select2-custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #666; }
        .select2-custom-scrollbar::-webkit-scrollbar-button:single-button { background-color: #f8f9fa; display: block; height: 14px; border-left: 1px solid #e5e5e5; }
        .select2-custom-scrollbar::-webkit-scrollbar-button:single-button:vertical:decrement {
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%238c8c8c'><polygon points='50,30 15,80 85,80'/></svg>");
          background-size: 8px; background-position: center; background-repeat: no-repeat;
        }
        .select2-custom-scrollbar::-webkit-scrollbar-button:single-button:vertical:increment {
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%238c8c8c'><polygon points='50,70 15,20 85,20'/></svg>");
          background-size: 8px; background-position: center; background-repeat: no-repeat;
        }
      `}</style>

      {/* Tabs Row Container */}
      <NavigationTabs activeTabLabel="Stock Report Batch Wise" />

      {/* Title */}
      <h3 className="text-[25.2px] text-[#323F52] font-medium mt-[15px] mb-[15px]">STOCK REPORT BATCH WISE</h3>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center justify-start mb-[15px] text-[#212529] text-[12.96px]">
        
        <PaginationControls page={page} setPage={setPage} size={size} totalCount={totalCount} />

        {/* Dropdowns */}
        <select 
          value={size}
          onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
          className="appearance-none m-[7.2px] py-[5.4px] pr-[25.2px] pl-[10.8px] text-[14.4px] text-[#495057] bg-white border border-[#ced4da] rounded-[3.2px] h-[34.4px] outline-none bg-no-repeat cursor-pointer"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'%3e%3cpath fill='%23343a40' d='M2 0L0 2h4zm0 5L0 3h4z'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 10px center',
            backgroundSize: '8px 10px'
          }}
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="75">75</option>
          <option value="100">100</option>
          <option value="-1">All</option>
        </select>
        
        <select 
          value={page}
          onChange={(e) => setPage(Number(e.target.value))}
          className="appearance-none m-[7.2px] py-[5.4px] pr-[25.2px] pl-[10.8px] text-[14.4px] text-[#495057] bg-white border border-[#ced4da] rounded-[3.2px] h-[34.4px] outline-none bg-no-repeat cursor-pointer"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'%3e%3cpath fill='%23343a40' d='M2 0L0 2h4zm0 5L0 3h4z'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 10px center',
            backgroundSize: '8px 10px'
          }}
        >
          {Array.from({ length: Math.ceil(totalCount / size) || 1 }, (_, i) => (
            <option key={i} value={i}>{i + 1}</option>
          ))}
        </select>

        {/* Search Input using standard component */}
        <div className="ml-[7.2px] w-[200px]">
          <SearchableSelect
            id="productSearch"
            value={selectedProduct}
            onChange={(opt) => {
              setSelectedProduct(opt || 'Search Product...');
              setPage(0);
            }}
            options={productOptions}
            placeholder="Search Product..."
          />
        </div>

        {/* Action Buttons */}
        <ToCsvButton className="ml-[7.2px]" onClick={() => {
          const exportData = data.map((row, idx) => ({
            "S.No": page * size + idx + 1,
            "Product Name": row.item_name || "-",
            "Batch Name": row.batch_item || "-",
            "Total Qty": row.totalqty !== null ? row.totalqty : "-",
            "Cost Price": row.cost !== null ? row.cost : "-",
            "Total Cost Amount": (row.totalqty !== null && row.cost !== null) ? (row.totalqty * row.cost).toFixed(2) : "-",
            "MRP": row.mrp !== null ? row.mrp : "-",
            "Total MRP Amount": (row.totalqty !== null && row.mrp !== null) ? (row.totalqty * row.mrp).toFixed(2) : "-"
          }));
          exportData.push({
            "S.No": "Total",
            "Product Name": totalCostOverall,
            "Batch Name": "",
            "Total Qty": totalMrpOverall,
            "Cost Price": "",
            "Total Cost Amount": "",
            "MRP": "",
            "Total MRP Amount": ""
          });
          const ws = XLSX.utils.json_to_sheet(exportData);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "stockreport_batchwise");
          XLSX.writeFile(wb, "stockreport_batchwise.csv");
        }} />
        
        <ToExcelButton className="ml-[7.2px]" onClick={() => {
          const exportData = data.map((row, idx) => ({
            "S.No": page * size + idx + 1,
            "Product Name": row.item_name || "-",
            "Batch Name": row.batch_item || "-",
            "Total Qty": row.totalqty !== null ? Number(row.totalqty) : "-",
            "Cost Price": row.cost !== null ? Number(row.cost) : "-",
            "Total Cost Amount": (row.totalqty !== null && row.cost !== null) ? Number((row.totalqty * row.cost).toFixed(2)) : "-",
            "MRP": row.mrp !== null ? Number(row.mrp) : "-",
            "Total MRP Amount": (row.totalqty !== null && row.mrp !== null) ? Number((row.totalqty * row.mrp).toFixed(2)) : "-"
          }));
          const ws = XLSX.utils.json_to_sheet(exportData);
          ws['!cols'] = [
            { wch: 10 }, { wch: 30 }, { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 }
          ];
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "stockreport");
          XLSX.writeFile(wb, "stockreport.xlsx");
        }} />
        
        <ToPrintButton className="ml-[7.2px]" onClick={handlePrint} />
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto border border-[#ddd] rounded-t-[3px] mt-[10px]">
        <table className="w-full text-left border-collapse text-[12.96px]">
          <thead>
            <tr className="bg-[#EEEEEE] text-[#212529] font-['Arial',sans-serif] text-[12.96px]">
              <th className="tablesorter-header tablesorter-headerUnSorted p-[4px] border-b border-r border-[#ddd] font-bold w-[79.38px] align-middle text-center">
                <div className="tablesorter-header-inner p-[4px]">S.No</div>
              </th>
              <th className="tablesorter-header tablesorter-headerUnSorted p-[4px] border-b border-r border-[#ddd] font-bold align-middle text-center">
                <div className="tablesorter-header-inner p-[4px]">Product Name</div>
              </th>
              <th className="tablesorter-header tablesorter-headerUnSorted p-[4px] border-b border-r border-[#ddd] font-bold align-middle text-center">
                <div className="tablesorter-header-inner p-[4px]">Batch Name</div>
              </th>
              <th className="tablesorter-header tablesorter-headerUnSorted p-[4px] border-b border-r border-[#ddd] font-bold text-center align-middle">
                <div className="tablesorter-header-inner p-[4px]">Total Qty</div>
              </th>
              <th className="tablesorter-header sorter-false tablesorter-headerUnSorted p-[4px] border-b border-r border-[#ddd] font-bold text-center align-middle">
                <div className="tablesorter-header-inner p-[4px]">Cost Price</div>
              </th>
              <th className="tablesorter-header tablesorter-headerUnSorted p-[4px] border-b border-r border-[#ddd] font-bold text-center align-middle">
                <div className="tablesorter-header-inner p-[4px]">Total Cost Amount</div>
              </th>
              <th className="tablesorter-header tablesorter-headerUnSorted p-[4px] border-b border-r border-[#ddd] font-bold text-center align-middle">
                <div className="tablesorter-header-inner p-[4px]">MRP</div>
              </th>
              <th className="tablesorter-header tablesorter-headerUnSorted p-[4px] border-b border-[#ddd] font-bold text-center align-middle">
                <div className="tablesorter-header-inner p-[4px]">Total MRP Amount</div>
              </th>
            </tr>
          </thead>
          <tbody className="font-sans">
            {isLoading ? (
              <tr>
                <td colSpan="8" className="p-4 text-center">
                  <Loader />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-[10.8px] text-center text-[#212529] font-bold text-[12.96px]">
                  No records found
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
              <tr key={index} className="bg-white hover:bg-[#66a3ff] transition-colors">
                <td className="p-[10.8px] border-t border-r border-[#ddd] text-[#212529] text-center">{page * size + index + 1}</td>
                <td className="p-[10.8px] border-t border-r border-[#ddd] text-[#212529]">{row.item_name || '-'}</td>
                <td className="p-[10.8px] border-t border-r border-[#ddd] text-[#212529]">{row.batch_item || '-'}</td>
                <td className="p-[10.8px] border-t border-r border-[#ddd] text-[#212529] text-center">{row.totalqty !== null ? row.totalqty : '-'}</td>
                <td className="p-[10.8px] border-t border-r border-[#ddd] text-[#212529] text-right">{row.cost !== null ? row.cost : '-'}</td>
                <td className="p-[10.8px] border-t border-r border-[#ddd] text-[#212529] text-right">{(row.totalqty * row.cost).toFixed(2)}</td>
                <td className="p-[10.8px] border-t border-r border-[#ddd] text-[#212529] text-right">{row.mrp !== null ? row.mrp : '-'}</td>
                <td className="p-[10.8px] border-t border-[#ddd] text-[#212529] text-right">{(row.totalqty * row.mrp).toFixed(2)}</td>
              </tr>
              ))
            )}
          </tbody>
          {data.length > 0 && (
            <tfoot className="font-sans font-bold bg-white">
              <tr>
                <td colSpan="5" className="p-[10.8px] border-t border-r border-[#ddd] text-[#212529] text-right">
                  Total
                </td>
                <td className="p-[10.8px] border-t border-r border-[#ddd] text-[#212529] text-right">
                  {totalCostOverall}
                </td>
                <td className="p-[10.8px] border-t border-r border-[#ddd] text-[#212529] text-right">
                </td>
                <td className="p-[10.8px] border-t border-[#ddd] text-[#212529] text-right">
                  {totalMrpOverall}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Footer pinned to bottom with small subtle font */}
      <footer className="w-full text-center mt-auto pt-10 pb-4 text-[10.8px] text-[#6c757d] select-none font-sans">
        Copyright &copy; NIGSOFT Private Ltd
      </footer>
    </div>
  );
}
