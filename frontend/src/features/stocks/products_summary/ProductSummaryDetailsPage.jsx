import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import ToExcelButton from '../../../components/ToExcelButton';
import Loader from '../../../components/Loader';
import PaginationControls from '../../../components/PaginationControls';
import { useAuth } from '../../../AuthContext';

const formatDateTime = (dateStr) => {
  if (!dateStr || String(dateStr).startsWith('0000-00-00')) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  
  const pad = (n) => n.toString().padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  
  let hours = d.getHours();
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  
  return `${day}-${month}-${year} ${pad(hours)}:${minutes}:${seconds} ${ampm}`;
};

export default function ProductSummaryDetailsPage() {
  const { token } = useAuth();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const productName = searchParams.get('name') || '';
  const availableStock = searchParams.get('qty') || '0';

  const [transactions, setTransactions] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);


  const exportToExcel = () => {
    const exportData = [];
    exportData.push({
      "Date": "-",
      "Type": "Stock Quantity Bf",
      "Purchase Qty": openingBalance,
      "Sale Qty": "",
      "Purchase Return Qty": "",
      "Sale Return Qty": "",
      "Created / Updated": ""
    });

    transactions.forEach(row => {
      exportData.push({
        "Date": formatDateTime(row.invoicedate) || '-',
        "Type": (row.type || row.vendorname || '').toUpperCase(),
        "Purchase Qty": row.purchaseqty || '',
        "Sale Qty": row.saleqty || '',
        "Purchase Return Qty": row.purchase_returnqty || '',
        "Sale Return Qty": row.returnqty || '',
        "Created / Updated": row.created_by || '-'
      });
    });

    exportData.push({
      "Date": "Total",
      "Type": "",
      "Purchase Qty": totalPurchase,
      "Sale Qty": totalSale,
      "Purchase Return Qty": totalPurchaseReturn,
      "Sale Return Qty": totalSaleReturn,
      "Created / Updated": ""
    });

    exportData.push({
      "Date": "Stock Qty:",
      "Type": finalStockQty,
      "Purchase Qty": "",
      "Sale Qty": "",
      "Purchase Return Qty": "",
      "Sale Return Qty": "",
      "Created / Updated": ""
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths to prevent squishing
    worksheet['!cols'] = [
      { wch: 25 }, // Date
      { wch: 22 }, // Type
      { wch: 15 }, // Purchase Qty
      { wch: 15 }, // Sale Qty
      { wch: 22 }, // Purchase Return Qty
      { wch: 20 }, // Sale Return Qty
      { wch: 20 }  // Created / Updated
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Summary");
    XLSX.writeFile(workbook, "table_export.xlsx");
  };

  useEffect(() => {

    if (!id || !token) return;
    setLoading(true);
    fetch(`/api/stocks/products-summary/?product_id=${id}&page=${page}&size=${size}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setTransactions(data.data || []);
        setOpeningBalance(data.final_qty_before_date || 0);
        setTotalCount(data.total_count || 0);
      })
      .catch(err => console.error("Error fetching details:", err))
      .finally(() => setLoading(false));
  }, [id, page, size, token]);

  const totalPages = Math.ceil(totalCount / size);

  // Calculate totals
  let totalPurchase = 0;
  let totalSale = 0;
  let totalPurchaseReturn = 0;
  let totalSaleReturn = 0;

  transactions.forEach(row => {
    totalPurchase += Number(row.purchaseqty) || 0;
    totalSale += Number(row.saleqty) || 0;
    totalPurchaseReturn += Number(row.purchase_returnqty) || 0;
    totalSaleReturn += Number(row.returnqty) || 0;
  });

  const finalStockQty = (Number(openingBalance) || 0) + totalPurchase - totalSale + totalSaleReturn - totalPurchaseReturn;

  return (
    <div className="px-[15px] pt-[15px] pb-0 bg-white min-h-full flex flex-col">
      <style>{`
        .select2-custom-scrollbar::-webkit-scrollbar { width: 14px; }
        .select2-custom-scrollbar::-webkit-scrollbar-track { background: #f8f9fa; border-left: 1px solid #e5e5e5; }
        .select2-custom-scrollbar::-webkit-scrollbar-thumb { background-color: #8c8c8c; border-radius: 10px; border: 3px solid #f8f9fa; }
        .select2-custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #666; }
      `}</style>
      
      {/* Title */}
      <h3 className="text-[25.2px] text-[#323F52] font-medium mt-[15px] mb-[28px]">PRODUCT SUMMARY</h3>


      {/* Info Row */}
      <div className="flex items-center text-[12.96px] text-[#212529] mb-[20px] px-[5px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
        <div className="mr-[50px]">
          Product Name : <b>{productName}</b>
        </div>
        <div>
          Available Stock : <b>{availableStock}</b>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center justify-start mb-[15px] text-[13px]">
        {/* Records Per Page */}
        <div className="flex items-center">
          <h6 className="text-[#323F52] text-[15.84px] ml-0" style={{ margin: '0px 0px 7.2px 0px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Records Per Page</h6>
          <select 
            value={size}
            onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
            className="appearance-none py-[5.4px] pr-[25.2px] pl-[10.8px] text-[14.4px] text-[#495057] bg-white border border-[#ced4da] rounded-[3.2px] h-[34.4px] outline-none cursor-pointer bg-no-repeat"
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
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center ml-[70px]">
          <PaginationControls page={page} setPage={setPage} size={size} totalCount={totalCount} />
        </div>

        {/* Excel Button */}
        <ToExcelButton onClick={exportToExcel} className="ml-[14.4px]" />
      </div>

        {/* Data Table */}
        <div className="mb-[20px] overflow-x-auto relative min-h-[150px]">
          {loading && (
            <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
              <Loader />
            </div>
          )}
          <table className="w-full text-left border-collapse border border-[#dee2e6]">
            <thead>
              <tr className="bg-[#EEEEEE] border-b-[2px] border-[#dee2e6]">
                <th className="font-bold text-[#212529] text-[12.96px]" style={{ padding: '4px' }}>Date</th>
                <th className="font-bold text-[#212529] text-[12.96px]" style={{ padding: '4px' }}>Type</th>
                <th className="font-bold text-[#212529] text-[12.96px]" style={{ padding: '4px' }}>Purchase Qty</th>
                <th className="font-bold text-[#212529] text-[12.96px]" style={{ padding: '4px' }}>Sale Qty</th>
                <th className="font-bold text-[#212529] text-[12.96px]" style={{ padding: '4px' }}>Purchase Return Qty</th>
                <th className="font-bold text-[#212529] text-[12.96px]" style={{ padding: '4px' }}>Sale Return Qty</th>
                <th className="font-bold text-[#212529] text-[12.96px]" style={{ padding: '4px' }}>Created / Updated</th>
              </tr>
            </thead>
            <tbody>
              {/* Stock Quantity Before (Opening Balance) Row */}
              <tr className="bg-[#C0C0C0] border-t border-[#dee2e6]">
                <td colSpan="7" className="p-[10.8px] text-center text-[#212529] text-[12.96px]">
                  Stock Quantity Bf : {transactions.length === 0 ? availableStock : openingBalance}
                </td>
              </tr>

                {transactions.length === 0 ? (
                  <tr className="bg-[#E9ECEF] border-t border-[#dee2e6]">
                    <td colSpan="7" className="p-[10.8px] text-center text-[#212529] text-[12.96px]">No Data Found</td>
                  </tr>
                ) : (
                  <>
                    {transactions.map((row, idx) => (
                      <tr key={idx} className="border-t border-[#dee2e6]">
                        <td className={idx % 2 === 0 ? "p-[10.8px] text-[#212529] text-[12.96px] border-r border-[#dee2e6] bg-[#F9F9F9]" : "p-[10.8px] text-[#212529] text-[12.96px] border-r border-[#dee2e6] bg-[#FFFFFF]"}>
                          {formatDateTime(row.invoicedate)}
                        </td>
                        <td className={idx % 2 === 0 ? "p-[10.8px] text-[#212529] text-[12.96px] uppercase border-r border-[#dee2e6] bg-[#F9F9F9]" : "p-[10.8px] text-[#212529] text-[12.96px] uppercase border-r border-[#dee2e6] bg-[#FFFFFF]"}>
                          {row.type || '-'}
                        </td>
                        <td className={idx % 2 === 0 ? "p-[10.8px] text-[#212529] text-[12.96px] border-r border-[#dee2e6] bg-[#F9F9F9]" : "p-[10.8px] text-[#212529] text-[12.96px] border-r border-[#dee2e6] bg-[#FFFFFF]"}>
                          {row.purchaseqty || ''}
                        </td>
                        <td className={idx % 2 === 0 ? "p-[10.8px] text-[#212529] text-[12.96px] border-r border-[#dee2e6] bg-[#F9F9F9]" : "p-[10.8px] text-[#212529] text-[12.96px] border-r border-[#dee2e6] bg-[#FFFFFF]"}>
                          {row.saleqty || ''}
                        </td>
                        <td className={idx % 2 === 0 ? "p-[10.8px] text-[#212529] text-[12.96px] border-r border-[#dee2e6] bg-[#F9F9F9]" : "p-[10.8px] text-[#212529] text-[12.96px] border-r border-[#dee2e6] bg-[#FFFFFF]"}>
                          {row.purchase_returnqty || ''}
                        </td>
                        <td className={idx % 2 === 0 ? "p-[10.8px] text-[#212529] text-[12.96px] border-r border-[#dee2e6] bg-[#F9F9F9]" : "p-[10.8px] text-[#212529] text-[12.96px] border-r border-[#dee2e6] bg-[#FFFFFF]"}>
                          {row.returnqty || ''}
                        </td>
                        <td className={idx % 2 === 0 ? "p-[10.8px] text-[#212529] text-[12.96px] bg-[#F9F9F9]" : "p-[10.8px] text-[#212529] text-[12.96px] bg-[#FFFFFF]"}>
                          {row.created_by || '-'}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-[#FFFFFF] border-t border-[#dee2e6]">
                      <td colSpan="2" className="p-[10.8px] text-[#212529] text-[12.96px] text-right font-bold border-r border-[#dee2e6]">
                        Total
                      </td>
                      <td className="p-[10.8px] text-[#212529] text-[12.96px] font-bold border-r border-[#dee2e6]">
                        {totalPurchase || 0}
                      </td>
                      <td className="p-[10.8px] text-[#212529] text-[12.96px] font-bold border-r border-[#dee2e6]">
                        {totalSale || 0}
                      </td>
                      <td className="p-[10.8px] text-[#212529] text-[12.96px] font-bold border-r border-[#dee2e6]">
                        {totalPurchaseReturn || 0}
                      </td>
                      <td className="p-[10.8px] text-[#212529] text-[12.96px] font-bold border-r border-[#dee2e6]">
                        {totalSaleReturn || 0}
                      </td>
                      <td className="p-[10.8px] text-[#212529] text-[12.96px] border-r border-[#dee2e6]"></td>
                    </tr>
                    <tr className="bg-[#C0C0C0] border-t border-[#dee2e6]">
                      <td colSpan="5" className="p-[10.8px] text-[#212529] text-[12.96px] text-right font-bold border-r border-[#dee2e6]">
                        Stock Qty:
                      </td>
                      <td colSpan="2" className="p-[10.8px] text-[#212529] text-[12.96px] text-left font-bold border-r border-[#dee2e6]">
                        {finalStockQty}
                      </td>
                    </tr>
                  </>
                  )}
            </tbody>
          </table>
      </div>
      
      {/* Footer pinned to bottom with small subtle font */}
      <footer className="w-full text-center mt-auto pt-10 pb-4 text-[10.8px] text-[#6c757d] select-none font-sans">
        Copyright &copy; NIGSOFT Private Ltd
      </footer>
    </div>
  );
}
