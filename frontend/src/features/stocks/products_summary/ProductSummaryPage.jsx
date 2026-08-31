import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function ProductSummaryPage() {
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('-- Select --');
  const dropdownRef = useRef(null);
  
  const productOptions = [
    '-- Select --',
    '10 D 200ml',
    '10 D 500ML',
    '10ML NIPRO',
    '18 G EPIDURAL CATHETER',
    '20ML DISPOVAN',
    '50ML DISPOVAN',
    'AC NEW',
    'ADENOSINE 6 MG',
    'ADRENALLINE',
    'ANOZEST CREAM',
    'AZITHRO',
    'BATODINE',
    'CALAMINE',
    'RANTAC',
    'ULTAVIR 30ML',
    'ZINC SULPHATE'
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProductDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [data] = useState([
    { id: 1, product: 'ADENOSINE 6 MG', qty: '-10', status: 'ENABLED' },
    { id: 2, product: 'AC NEW', qty: '-34', status: 'ENABLED' },
    { id: 3, product: 'ULTAVIR 30ML', qty: '-21', status: 'ENABLED' },
    { id: 4, product: 'ADRENALLINE', qty: '-5', status: 'ENABLED' },
    { id: 5, product: 'RANTAC', qty: '-10', status: 'ENABLED' },
    { id: 6, product: 'ANOZEST CREAM', qty: '-9', status: 'DISABLED' },
    { id: 7, product: 'AZITHRO', qty: '-8', status: 'DISABLED' },
  ]);

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
      <div className="mb-[20px]">
        <ul className="flex flex-wrap m-0 p-0 list-none text-[12.96px] text-[#212529] font-sans border-b border-[#ddd]">
          {[
            { label: 'Stocks', path: '/' },
            { label: 'Products Summary', path: '/', active: true },
            { label: 'Low Demand Stock', path: '#' },
            { label: 'Zero Stocks', path: '/zero-stocks' },
            { label: 'Age Wise Stocks', path: '#' },
            { label: 'Low Quantity', path: '#' },
            { label: 'Expired', path: '#' },
            { label: 'Most Wanted', path: '#' },
            { label: 'Approved', path: '#' },
            { label: 'Purchase Return Items', path: '#' },
            { label: 'Stock Report', path: '#' },
            { label: 'Stock Report Batch Wise', path: '/stock-report-batch-wise' },
            { label: 'Category Wise Product', path: '#' },
            { label: 'Transaction Report', path: '#' },
          ].map((tab, i) => (
            <li key={i} className="mr-[2px] mb-[-1px]">
              {tab.active ? (
                <span className="inline-block px-[10px] py-[7.2px] text-[#555] bg-white border border-[#ddd] border-b-transparent rounded-t-[4px] cursor-default relative z-10">
                  {tab.label}
                </span>
              ) : (
                <Link 
                  to={tab.path} 
                  className="inline-block px-[10px] py-[7.2px] border border-transparent rounded-t-[4px] text-[#007BFF] hover:bg-transparent hover:text-[#212529] hover:border-[#ddd] relative hover:z-10 transition-colors"
                >
                  {tab.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Title */}
      <h3 className="text-[25.2px] text-[#323F52] font-medium mt-[15px] mb-[28px]">PRODUCT SUMMARY</h3>

      {/* Top Filter Row */}
      <div className="flex flex-wrap mx-[-15px] px-[5px] pb-[14.4px]">
        <div className="flex items-center w-1/3 p-[7.2px]">
          <span className="text-[#212529] text-[12.96px] mr-[5px]">Product</span>
          
          {/* Select2 Look-alike Custom Component */}
          <div className="relative flex-1" ref={dropdownRef}>
            <div 
              className="w-full h-[28px] border border-[#aaa] rounded-[4px] bg-white text-[#444444] text-[12.96px] flex items-center justify-between pl-[8px] pr-[20px] cursor-pointer shadow-[inset_0_1px_1px_rgba(0,0,0,0.075)]"
              onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
            >
              <span className="truncate">{selectedProduct}</span>
              <span className="absolute right-[8px] text-[#888] text-[10px]">▼</span>
            </div>
            
            {isProductDropdownOpen && (
              <div className="absolute top-[100%] mt-[1px] left-0 w-full bg-white border border-[#aaa] shadow-md z-50 rounded-[4px] overflow-hidden">
                <div className="p-[4px]">
                  <input 
                    type="text" 
                    className="w-full border border-[#aaa] outline-none px-[4px] py-[2px] text-[12.96px] focus:border-black focus:ring-1 focus:ring-black h-[26px]"
                    autoFocus
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
                <ul className="max-h-[200px] overflow-y-auto m-0 p-0 list-none select2-custom-scrollbar">
                  {productOptions.filter(opt => opt.toLowerCase().includes(productSearch.toLowerCase())).map((opt, idx) => (
                    <li 
                      key={idx}
                      className={`px-[8px] py-[4px] text-[12.96px] cursor-pointer hover:bg-[#5897fb] hover:text-white ${selectedProduct === opt ? 'bg-[#ddd] text-[#444444]' : 'text-[#212529]'}`}
                      onClick={() => {
                        setSelectedProduct(opt);
                        setIsProductDropdownOpen(false);
                        setProductSearch('');
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
      <div className="flex flex-wrap items-center justify-start mb-[15px] text-[13px]">
        
        {/* Total Product */}
        <h6 className="text-[#323F52] text-[15.84px] font-medium m-0 my-[7.2px]">
          Total Product : <span id="count_item" style={{ color: '#0000FF' }}>677</span>
        </h6>

        {/* Product Per Page */}
        <div className="flex items-center">
          <h6 className="text-[#323F52] text-[15.84px] font-medium m-0 ml-[43.2px] mb-[7.2px]">Product Per Page</h6>
          <select 
            className="appearance-none ml-[7.2px] py-[5.4px] pr-[25.2px] pl-[10.8px] text-[14.4px] text-[#495057] bg-white border border-[#ced4da] rounded-[3.2px] h-[34.4px] outline-none bg-no-repeat cursor-pointer shadow-[inset_0_1px_1px_rgba(0,0,0,0.075)] focus:border-[#66afe9]"
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'%3e%3cpath fill='%23343a40' d='M2 0L0 2h4zm0 5L0 3h4z'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 10px center',
              backgroundSize: '8px 10px'
            }}
          >
            <option>10</option>
            <option>25</option>
            <option>50</option>
          </select>
        </div>

        {/* Pagination Buttons & Text */}
        <div className="flex items-center">
          {/* First & Prev Group */}
          <div className="flex items-center ml-[80px]">
            <button className="bg-[#6C757D] text-white w-[28.98px] h-[28.09px] py-[3.6px] px-[7.2px] rounded-l-[3px] border border-[#6c757d] hover:bg-[#5c636a] cursor-pointer flex items-center justify-center relative z-10">
              <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-[12.59px] w-auto" fill="currentColor"><path d="M11.5 280.6l192 160c20.6 17.2 52.5 2.8 52.5-24.6V256l192 160c20.6 17.2 52.5 2.8 52.5-24.6V120.6c0-27.4-31.9-41.8-52.5-24.6L256 256V120.6C256 93.2 224.1 78.8 203.5 96l-192 160c-15.4 12.8-15.4 36.4 0 49.2z"></path></svg>
            </button>
            <button className="bg-[#6C757D] text-white w-[22.69px] h-[28.09px] py-[3.6px] px-[7.2px] rounded-r-[3px] border border-[#6c757d] ml-[-1px] hover:bg-[#5c636a] cursor-pointer flex items-center justify-center relative">
              <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" className="h-[12.59px] w-auto" fill="currentColor"><path d="M34.52 239.03L228.87 44.69c9.37-9.37 24.57-9.37 33.94 0l22.67 22.67c9.36 9.36 9.37 24.52.04 33.9L131.49 256l154.02 154.75c9.34 9.38 9.32 24.54-.04 33.9l-22.67 22.67c-9.37 9.37-24.57 9.37-33.94 0L34.52 272.97c-9.37-9.37-9.37-24.57 0-33.94z"></path></svg>
            </button>
          </div>
          
          <span className="px-[5px] font-bold text-[#212529] text-[12.96px]">
            11 to 20 (677)
          </span>
          
          {/* Next & Last Group */}
          <div className="flex items-center">
            <button className="bg-[#6C757D] text-white w-[22.69px] h-[28.09px] py-[3.6px] px-[7.2px] rounded-l-[3px] border border-[#6c757d] hover:bg-[#5c636a] cursor-pointer flex items-center justify-center relative z-10">
              <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" className="h-[12.59px] w-auto" fill="currentColor"><path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"></path></svg>
            </button>
            <button className="bg-[#6C757D] text-white w-[28.98px] h-[28.09px] py-[3.6px] px-[7.2px] rounded-r-[3px] border border-[#6c757d] ml-[-1px] hover:bg-[#5c636a] cursor-pointer flex items-center justify-center relative">
              <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-[12.59px] w-auto" fill="currentColor"><path d="M500.5 231.4l-192-160C287.9 54.3 256 68.6 256 96v124.6L64.5 60.6C43.9 43.4 12 57.8 12 85.2v341.6c0 27.4 31.9 41.8 52.5 24.6L256 291.4V416c0 27.4 31.9 41.8 52.5 24.6l192-160c15.4-12.8 15.4-36.4 0-49.2z"></path></svg>
            </button>
          </div>
        </div>
        
        {/* Page Number */}
        <div className="flex items-center">
          <h5 className="text-[#323F52] text-[18px] font-medium m-0 ml-[80px] mb-[7.2px]">PAGE</h5>
          <select 
            defaultValue="2" 
            className="appearance-none m-[3.6px] py-[5.4px] pr-[25.2px] pl-[10.8px] text-[14.4px] text-[#495057] bg-white border border-[#ced4da] rounded-[3.2px] h-[34.4px] outline-none bg-no-repeat cursor-pointer shadow-[inset_0_1px_1px_rgba(0,0,0,0.075)] focus:border-[#66afe9]"
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'%3e%3cpath fill='%23343a40' d='M2 0L0 2h4zm0 5L0 3h4z'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 10px center',
              backgroundSize: '8px 10px'
            }}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </div>

        {/* Excel Button */}
        <button className="bg-[#FFC107] hover:bg-[#e0a800] text-[#212529] px-[12px] py-[3.6px] ml-[14.4px] rounded-[3px] font-medium text-[12.6px] border border-transparent h-[34.4px] flex items-center justify-center">
          TO EXCEL
        </button>
      </div>

      {/* Data Table */}
      <div className="mb-[20px] overflow-x-auto">
        <table className="w-full text-left border-collapse border border-[#dee2e6]">
          <thead>
            <tr className="bg-[#EEEEEE] border-b-[2px] border-[#dee2e6]">
              <th className="p-[4px] font-bold text-[#212529] text-[12.96px] font-['Arial',sans-serif] w-[25%]">Product</th>
              <th className="p-[4px] font-bold text-[#212529] text-[12.96px] font-['Arial',sans-serif] w-[37.5%]">Total Qty</th>
              <th className="p-[4px] font-bold text-[#212529] text-[12.96px] font-['Arial',sans-serif] w-[37.5%]">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={row.id} className="border-t border-[#dee2e6]">
                <td className={idx % 2 === 0 ? "p-[10.8px] text-[#007BFF] text-[12.96px] uppercase hover:underline cursor-pointer border-r border-[#dee2e6] bg-[#BFBFBF]" : "p-[10.8px] text-[#007BFF] text-[12.96px] uppercase hover:underline cursor-pointer border-r border-[#dee2e6] bg-[#D9D9D9]"}>{row.product}</td>
                <td className={idx % 2 === 0 ? "p-[10.8px] text-[#212529] text-[12.96px] border-r border-[#dee2e6] bg-[#F9F9F9]" : "p-[10.8px] text-[#212529] text-[12.96px] border-r border-[#dee2e6] bg-[#FFFFFF]"}>{row.qty}</td>
                <td className={idx % 2 === 0 ? "p-[10.8px] text-[#212529] text-[12.96px] uppercase bg-[#F9F9F9]" : "p-[10.8px] text-[#212529] text-[12.96px] uppercase bg-[#FFFFFF]"}>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="w-full px-[15px] mt-[40px] text-[#A2ACBA] font-sans">
        <div className="w-full text-center px-[15px] text-[10.368px]">
          Copyright © NIGSOFT Private Ltd
        </div>
      </div>
    </div>
  );
}
