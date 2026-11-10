import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ToCsvButton from '../../../components/ToCsvButton';
import ToExcelButton from '../../../components/ToExcelButton';
import NavigationTabs from '../../../components/NavigationTabs';
import PaginationControls from '../../../components/PaginationControls';
import Loader from '../../../components/Loader';
import SortIcon from '../../../components/SortIcon';
import SearchableSelect from '../../../components/SearchableSelect';
import { useAuth } from '../../../AuthContext';
import { apiConfig } from '../../../config';
import * as XLSX from 'xlsx';

export default function ZeroStocksPage() {
  const { token } = useAuth();
  
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  const [selectedProduct, setSelectedProduct] = useState('Search Product...');
  const [productOptions, setProductOptions] = useState([]);
  
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  // Fetch product list for dropdown
  useEffect(() => {
    if (!token) return;
    fetch(`${apiConfig.base_url}/stocks/zero-stocks?page=0&size=-1`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(result => {
        if (result && Array.isArray(result.data)) {
          setProductOptions(['Search Product...', ...result.data.map(item => item.item)]);
        }
      })
      .catch(err => console.error("Error fetching products dropdown:", err));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    
    setIsLoading(true);
    let url = `${apiConfig.base_url}/stocks/zero-stocks?page=${page}&size=${size}`;
    if (selectedProduct && selectedProduct !== 'Search Product...') {
      url += `&search=${encodeURIComponent(selectedProduct)}`;
    }

    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(resData => {
        setData(resData.data || []);
        setTotalCount(resData.total_count || 0);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch zero stocks:', err);
        setIsLoading(false);
      });
  }, [page, size, selectedProduct, token]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig && sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        // Handle numeric sorting for stock
        if (sortConfig.key === 'stock') {
          aVal = Number(aVal) || 0;
          bVal = Number(bVal) || 0;
        } else if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = (bVal || '').toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  return (
    <div className="px-[15px] pt-[15px] pb-0 bg-white min-h-full flex flex-col">
      {/* Tabs Row Container */}
      <NavigationTabs activeTabLabel="Zero Stocks" />

      {/* Title */}
      <h3 className="text-[25.2px] text-[#323F52] font-medium mt-[15px] mb-[15px]">ZERO STOCK PRODUCTS</h3>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center justify-start mb-[15px] text-[#212529] text-[12.96px]">
        
        <PaginationControls 
          page={page} 
          size={size} 
          totalCount={totalCount} 
          setPage={setPage} 
        />

        {/* Dropdowns */}
        <select 
          value={size}
          onChange={(e) => {
            setSize(Number(e.target.value));
            setPage(0);
          }}
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

        {/* Search Input */}
        <div className="relative ml-[7.2px] w-[200px]">
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
          const exportData = sortedData.map((row, idx) => ({
            "S.No": page * size + idx + 1,
            "Item Name": row.item || "-",
            "Stock": row.stock !== null ? Number(row.stock) : "-"
          }));
          const ws = XLSX.utils.json_to_sheet(exportData);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "zerostocks");
          XLSX.writeFile(wb, "zero_stocks_report.csv");
        }} />
        <ToExcelButton className="ml-[7.2px]" onClick={() => {
          const exportData = sortedData.map((row, idx) => ({
            "S.No": String(page * size + idx + 1),
            "Item Name": row.item || "-",
            "Stock": row.stock !== null ? Number(row.stock) : "-"
          }));
          const ws = XLSX.utils.json_to_sheet(exportData);
          ws['!cols'] = [{ wch: 10 }, { wch: 100 }, { wch: 15 }];
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "zerostocks");
          XLSX.writeFile(wb, "new purchase order.xlsx");
        }} />
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto border border-[#ddd] rounded-t-[3px] mt-[10px]">
        <table className="w-full text-left border-collapse text-[12.96px]">
          <thead>
            <tr className="bg-[#EEEEEE] text-[#212529] font-['Arial',sans-serif] text-[12.96px]">
              <th className="tablesorter-header tablesorter-headerUnSorted p-[4px] border-b border-r border-[#ddd] font-bold w-[79.38px] align-middle text-center">
                <div className="tablesorter-header-inner p-[4px] flex justify-center items-center w-full">S.No</div>
              </th>
              <th 
                className="tablesorter-header tablesorter-headerUnSorted p-[4px] border-b border-r border-[#ddd] font-bold align-middle cursor-pointer hover:bg-[#e6e6e6]"
                onClick={() => requestSort('item')}
              >
                <div className="tablesorter-header-inner p-[4px] relative flex justify-center items-center w-full">
                  <span>Item Name</span>
                  <div className="absolute right-1"><SortIcon /></div>
                </div>
              </th>
              <th 
                className="tablesorter-header tablesorter-headerUnSorted p-[4px] border-b border-[#ddd] font-bold align-middle cursor-pointer hover:bg-[#e6e6e6]"
                onClick={() => requestSort('stock')}
              >
                <div className="tablesorter-header-inner p-[4px] relative flex justify-center items-center w-full">
                  <span>Stock</span>
                  <div className="absolute right-1"><SortIcon /></div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="font-sans">
            {isLoading ? (
              <tr>
                <td colSpan="3" className="p-4 text-center">
                  <Loader />
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-[10.8px] text-center text-[#212529] font-bold text-[12.96px]">
                  No records found
                </td>
              </tr>
            ) : (
              sortedData.map((row, idx) => (
                <tr key={idx} className="bg-white hover:bg-[#66a3ff] transition-colors">
                  <td className="p-[10.8px] border-t border-r border-[#ddd] text-[#212529] text-center">{page * size + idx + 1}</td>
                  <td className="p-[10.8px] border-t border-r border-[#ddd] text-[#212529]">{row.item}</td>
                  <td className="p-[10.8px] border-t border-[#ddd] text-[#212529] text-right">{row.stock}</td>
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
