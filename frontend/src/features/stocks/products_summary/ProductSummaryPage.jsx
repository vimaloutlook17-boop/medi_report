import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ToExcelButton from '../../../components/ToExcelButton';
import Loader from '../../../components/Loader';
import { useAuth } from '../../../AuthContext';
import * as XLSX from 'xlsx';
import NavigationTabs from '../../../components/NavigationTabs';
import PaginationControls from '../../../components/PaginationControls';
import { apiConfig } from '../../../config';


export default function ProductSummaryPage() {
  const { token } = useAuth();
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('-- Select --');
  const dropdownRef = useRef(null);
  
  const [productOptions, setProductOptions] = useState(['-- Select --']);

  const [focusedIndex, setFocusedIndex] = useState(-1);

  const filteredOptions = productOptions.filter(opt => opt.toLowerCase().includes(productSearch.toLowerCase()));

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProductDropdownOpen(false);
        setFocusedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!token) return;
    // Fetch dropdown products dynamically
    fetch(`${apiConfig.base_url}/stocks/products-summary/products`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProductOptions(['-- Select --', ...data.map(item => item.name)]);
        }
      })
      .catch(err => console.error("Error fetching products dropdown:", err));
  }, [token]);

  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    let url = `/api/stocks/products-summary/master-list?page=${page}&size=${size}`;
    if (selectedProduct && selectedProduct !== '-- Select --') {
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
      .catch(err => console.error("Error fetching master list:", err))
      .finally(() => setLoading(false));
  }, [page, size, token, selectedProduct]);

  return (
    <div className="px-[15px] pt-[15px] pb-0 bg-white min-h-full">
      <style>{`
        .select2-custom-scrollbar::-webkit-scrollbar {
          width: 14px;
        }
        .select2-custom-scrollbar::-webkit-scrollbar-track {
          background: #f8f9fa;
          border-left: 1px solid #e5e5e5;
        }
        .select2-custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #8c8c8c;
          border-radius: 10px;
          border: 3px solid #f8f9fa;
        }
        .select2-custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #666;
        }
        .select2-custom-scrollbar::-webkit-scrollbar-button:single-button {
          background-color: #f8f9fa;
          display: block;
          height: 14px;
          border-left: 1px solid #e5e5e5;
        }
        .select2-custom-scrollbar::-webkit-scrollbar-button:single-button:vertical:decrement {
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%238c8c8c'><polygon points='50,30 15,80 85,80'/></svg>");
          background-size: 8px;
          background-position: center;
          background-repeat: no-repeat;
        }
        .select2-custom-scrollbar::-webkit-scrollbar-button:single-button:vertical:increment {
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%238c8c8c'><polygon points='50,70 15,20 85,20'/></svg>");
          background-size: 8px;
          background-position: center;
          background-repeat: no-repeat;
        }
        .select2-custom-scrollbar::-webkit-scrollbar-button:single-button:vertical:decrement:hover,
        .select2-custom-scrollbar::-webkit-scrollbar-button:single-button:vertical:increment:hover {
          background-color: #eee;
        }
      `}</style>
      
      {/* Tabs Row Container */}
      <NavigationTabs activeTabLabel="Products Summary" />

      {/* Title */}
      <h3 className="text-[25.2px] text-[#323F52] font-medium mt-[15px] mb-[28px]">PRODUCT SUMMARY</h3>

      {/* Top Filter Row */}
      <div className="flex flex-wrap mx-[-15px] px-[5px] pb-[14.4px]">
        <div className="flex items-center w-1/3 p-[7.2px]">
          <span className="text-[#212529] text-[12.96px] mr-[5px]">Product</span>
          
          {/* Select2 Look-alike Custom Component */}
          <div className="relative flex-1" ref={dropdownRef}>
            <div 
              className="w-full h-[32px] border border-[#aaa] rounded-[4px] bg-white text-[#444444] text-[12.96px] flex items-center pl-[8px] pr-[20px] cursor-pointer"
              onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
            >
              <span className="truncate">{selectedProduct}</span>
              <span className="absolute right-0 top-0 h-full w-[20px] flex items-center justify-center">
                <span className="border-t-[5px] border-t-[#888] border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent"></span>
              </span>
            </div>
            
            {isProductDropdownOpen && (
              <div className="absolute top-[100%] mt-[1px] left-0 w-full bg-white border border-[#aaa] shadow-[0_4px_5px_rgba(0,0,0,0.15)] z-50 rounded-[4px] overflow-hidden">
                <div className="p-[4px]">
                  <input 
                    type="text" 
                    className="w-full border border-[#aaa] h-[26px] px-[4px] outline-none focus:border-[#5897fb] focus:shadow-[0_0_5px_rgba(0,0,0,0.3)] text-[12.96px]"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setFocusedIndex(0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setFocusedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setFocusedIndex(prev => (prev > 0 ? prev - 1 : prev));
                      } else if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
                        e.preventDefault();
                        setSelectedProduct(filteredOptions[focusedIndex]);
                        setIsProductDropdownOpen(false);
                        setProductSearch('');
                        setFocusedIndex(-1);
                        setPage(0);
                      }
                    }}
                    autoFocus
                  />
                </div>
                <ul className="max-h-[200px] overflow-y-auto m-0 p-0 list-none select2-custom-scrollbar">
                  {filteredOptions.map((opt, i) => (
                    <li 
                      key={i}
                      className={`px-[8px] py-[4px] text-[12.96px] cursor-pointer ${
                        focusedIndex === i ? 'bg-[#5897fb] text-white' : 'text-[#444] hover:bg-[#5897fb] hover:text-white'
                      }`}
                      onMouseEnter={() => setFocusedIndex(i)}
                      onClick={() => {
                        setSelectedProduct(opt);
                        setIsProductDropdownOpen(false);
                        setProductSearch('');
                        setFocusedIndex(-1);
                        setPage(0);
                      }}
                    >
                      {opt}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls Row (Total, Per Page, Pagination, Page Input, Excel) */}
      <div className="flex flex-wrap items-center justify-start mb-[15px]">
        
        {/* Total Product */}
        <h6 className="text-[#323F52] text-[14.4px] font-medium m-0 my-[7.2px] mr-[30px]">
          Total Product :<span id="count_item" style={{ color: '#0000FF' }}>{totalCount}</span>
        </h6>

        {/* Form Inline wrapper mimicking older layout */}
        <div className="flex items-center text-[#212529] text-[12.96px]">
          
          {/* Records Per Page */}
          <h6 className="text-[#323F52] text-[15.84px] ml-0" style={{ margin: '0px 0px 7.2px 0px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Records Per Page</h6>
          <select 
            value={size}
            onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
            className="appearance-none ml-[7.2px] py-[5.4px] pr-[25.2px] pl-[10.8px] text-[14.4px] text-[#495057] bg-white border border-[#ced4da] rounded-[3.2px] h-[34.4px] outline-none bg-no-repeat cursor-pointer shadow-[inset_0_1px_1px_rgba(0,0,0,0.075)] focus:border-[#66afe9]"
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

          <div className="flex items-center ml-[10px]">
            <PaginationControls page={page} setPage={setPage} size={size} totalCount={totalCount} />
          </div>

          {/* Page Selector */}
          <h6 className="text-[#323F52] text-[15.84px] ml-[10px]" style={{ margin: '0px 3.6px 7.2px 10px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Page</h6>
          <select 
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            className="appearance-none py-[5.4px] pr-[25.2px] pl-[10.8px] text-[14.4px] text-[#495057] bg-white border border-[#ced4da] rounded-[3.2px] h-[34.4px] outline-none cursor-pointer bg-no-repeat"
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

          {/* Excel Button */}
          <ToExcelButton className="ml-[14.4px]" onClick={() => {
            // 1. Format the visible data into exactly what we want in Excel
            const exportData = data.map(row => ({
              'Product': row.product || '',
              'Total Qty': row.qty !== null && row.qty !== undefined ? row.qty : ''
            }));
            
            // 2. Convert to worksheet and create workbook
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            
            // Calculate the maximum width needed for the Product column
            const maxProductLength = Math.max(
              ...exportData.map(row => (row['Product'] ? row['Product'].length : 0)),
              15 // minimum width just in case
            );
  
            // Set the column widths (wch = width in characters)
            worksheet['!cols'] = [
              { wch: maxProductLength + 5 }, // Column A (Product) - Add a little padding
              { wch: 15 }                    // Column B (Total Qty)
            ];
  
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Product Summary");
            
            // 3. Trigger actual .xlsx download
            XLSX.writeFile(workbook, "exported_table.xlsx");
          }} />
        </div>
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
              <th className="p-[4px] font-bold text-[#212529] text-[12.96px] font-['Arial',sans-serif] w-[25%]">Product</th>
              <th className="p-[4px] font-bold text-[#212529] text-[12.96px] font-['Arial',sans-serif] w-[37.5%]">Total Qty</th>
              <th className="p-[4px] font-bold text-[#212529] text-[12.96px] font-['Arial',sans-serif] w-[37.5%]">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-[10.8px] text-center text-[#212529] text-[12.96px]">No products found.</td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={row.id} className="border-t border-[#dee2e6]">
                  <td className={idx % 2 === 0 ? "p-[10.8px] text-[#007BFF] text-[12.96px] uppercase hover:underline cursor-pointer border-r border-[#dee2e6] bg-[#F9F9F9]" : "p-[10.8px] text-[#007BFF] text-[12.96px] uppercase hover:underline cursor-pointer border-r border-[#dee2e6] bg-[#FFFFFF]"}>
                    <Link to={`/stocks/product-summary-details/${row.id}?name=${encodeURIComponent(row.product || '')}&qty=${row.qty || 0}`} className="text-[#007BFF] hover:underline">
                      {row.product}
                    </Link>
                  </td>
                  <td className={idx % 2 === 0 ? "p-[10.8px] text-[#212529] text-[12.96px] border-r border-[#dee2e6] bg-[#F9F9F9]" : "p-[10.8px] text-[#212529] text-[12.96px] border-r border-[#dee2e6] bg-[#FFFFFF]"}>{row.qty}</td>
                  <td className={idx % 2 === 0 ? "p-[10.8px] text-[#212529] text-[12.96px] uppercase bg-[#F9F9F9]" : "p-[10.8px] text-[#212529] text-[12.96px] uppercase bg-[#FFFFFF]"}>{row.status}</td>
                </tr>
              ))
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
