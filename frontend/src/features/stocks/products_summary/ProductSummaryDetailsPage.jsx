import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import ToExcelButton from '../../../components/ToExcelButton';
import PaginationControls from '../../../components/PaginationControls';
import { useAuth } from '../../../AuthContext';

export default function ProductSummaryDetailsPage() {
  const { token } = useAuth();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const productName = searchParams.get('name') || '';
  const availableStock = searchParams.get('qty') || '0';

  const [dateFilter, setDateFilter] = useState('current_month');
  const [transactions, setTransactions] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id || !token) return;
    setLoading(true);
    fetch(`/api/stocks/products-summary?product_id=${id}&date_filter=${dateFilter}&page=${page}&size=${size}`, {
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
  }, [id, dateFilter, page, size, token]);

  const totalPages = Math.ceil(totalCount / size);

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
          </select>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center ml-[70px]">
          <PaginationControls page={page} setPage={setPage} size={size} totalCount={totalCount} />
        </div>

        {/* Excel Button */}
        <ToExcelButton className="ml-[14.4px]" />
      </div>

      {/* Data Table */}
      <div className="mb-[20px] overflow-x-auto">
        <table className="w-full text-left border-collapse border border-[#dee2e6]">
          <thead>
            <tr className="bg-[#EEEEEE] border-b-[2px] border-[#dee2e6]">
              <th className="font-bold text-[#212529] text-[12.96px]" style={{ padding: '4px', fontFamily: 'Arial, sans-serif' }}>Date</th>
              <th className="font-bold text-[#212529] text-[12.96px]" style={{ padding: '4px', fontFamily: 'Arial, sans-serif' }}>Type</th>
              <th className="font-bold text-[#212529] text-[12.96px]" style={{ padding: '4px', fontFamily: 'Arial, sans-serif' }}>Purchase Qty</th>
              <th className="font-bold text-[#212529] text-[12.96px]" style={{ padding: '4px', fontFamily: 'Arial, sans-serif' }}>Sale Qty</th>
              <th className="font-bold text-[#212529] text-[12.96px]" style={{ padding: '4px', fontFamily: 'Arial, sans-serif' }}>Purchase Return Qty</th>
              <th className="font-bold text-[#212529] text-[12.96px]" style={{ padding: '4px', fontFamily: 'Arial, sans-serif' }}>Sale Return Qty</th>
              <th className="font-bold text-[#212529] text-[12.96px]" style={{ padding: '4px', fontFamily: 'Arial, sans-serif' }}>Created / Updated</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="p-[10.8px] text-center text-[#212529] text-[12.96px]">Loading...</td>
              </tr>
            ) : (
              <>
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
                  transactions.map((row, idx) => (
                    <tr key={idx} className="border-t border-[#dee2e6]">
                      <td className={idx % 2 === 0 ? "p-[10.8px] text-[#212529] text-[12.96px] border-r border-[#dee2e6] bg-[#F9F9F9]" : "p-[10.8px] text-[#212529] text-[12.96px] border-r border-[#dee2e6] bg-[#FFFFFF]"}>
                        {new Date(row.invoicedate).toLocaleDateString()}
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
                        {new Date(row.created_date_time).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
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
