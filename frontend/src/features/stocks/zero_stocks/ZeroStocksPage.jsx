import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ToCsvButton from '../../../components/ToCsvButton';
import ToExcelButton from '../../../components/ToExcelButton';

export default function ZeroStocksPage() {
  const [data] = useState([
    { id: 1, item: '', stock: '0' },
    { id: 2, item: 'AC New', stock: '-34' },
    { id: 3, item: 'GAPMOX CV 228.5 DRY SYRUP', stock: '0' },
    { id: 4, item: 'Granola Bars', stock: '0' },
    { id: 5, item: '3 WAY CATHETER 18', stock: '0' },
    { id: 6, item: '18 G EPIDURAL CATHETER', stock: '-1' },
    { id: 7, item: 'CHROMIC 2 100CM QN 4228 RB', stock: '0' },
    { id: 8, item: 'ADRENALLINE', stock: '0' },
    { id: 9, item: 'ADENOSINE 6 MG', stock: '0' },
  ]);

  const tabs = [
    { label: 'Stocks', path: '/stocks/product-summary' },
    { label: 'Products Summary', path: '/stocks/product-summary' },
    { label: 'Low Demand Stock', path: '#' },
    { label: 'Zero Stocks', path: '/stocks/zero-stocks', active: true },
    { label: 'Age Wise Stocks', path: '#' },
    { label: 'Low Quantity', path: '#' },
    { label: 'Expired', path: '#' },
    { label: 'Most Wanted', path: '#' },
    { label: 'Approved', path: '#' },
    { label: 'Purchase Return Items', path: '#' },
    { label: 'Stock Report', path: '#' },
    { label: 'Stock Report Batch Wise', path: '/stocks/stock-report-batch-wise' },
    { label: 'Category Wise Product', path: '#' },
    { label: 'Transaction Report', path: '#' },
    { label: 'ProductWise Customer', path: '/sales/product-wise-customer' },
  ];

  const sortIcon = (
    <svg className="w-[10px] h-[12px] text-[#212529]" fill="currentColor" viewBox="0 0 320 512">
      <path d="M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41zm238-64H41c-21.4 0-32.1-25.9-17-41l119-119c9.4-9.4 24.6-9.4 33.9 0l119 119c15.1 15.1 4.4 41-17 41z"/>
    </svg>
  );

  return (
    <div className="px-[15px] pt-[15px] pb-0 bg-white min-h-full">
      {/* Tabs Row Container */}
      <div className="mb-[20px]">
        <ul className="flex flex-wrap m-0 p-0 list-none text-[12.96px] text-[#212529] font-sans border-b border-[#ddd]">
          {tabs.map((tab, i) => (
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
      <h3 className="text-[25.2px] text-[#323F52] font-medium mt-[15px] mb-[15px]">ZERO STOCK PRODUCTS</h3>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center justify-start mb-[15px] text-[#212529] text-[12.96px]">
        {/* Pagination Left */}
        <div className="flex mx-[3.6px] h-[28.09px]">
          <button className="flex items-center justify-center w-[25.33px] text-[#777] cursor-not-allowed">
            <svg width="12" height="11" viewBox="0 0 12 11" fill="currentColor"><path d="M5.5 0L0 5.5L5.5 11V0ZM12 0L6.5 5.5L12 11V0Z" /></svg>
          </button>
          <button className="flex items-center justify-center w-[25.33px] text-[#777] cursor-not-allowed">
            <svg width="5.5" height="11" viewBox="0 0 5.5 11" fill="currentColor"><path d="M5.5 0L0 5.5L5.5 11V0Z" /></svg>
          </button>
        </div>

        {/* Pagination Text */}
        <span className="font-bold text-[12.96px] text-[#212529] mx-[10px]">
          1 to 10 (24)
        </span>

        {/* Pagination Right */}
        <div className="flex mx-[3.6px] h-[28.09px]">
          <button className="flex items-center justify-center w-[25.33px] text-[#212529] hover:text-[#000] cursor-pointer transition-colors">
            <svg width="5.5" height="11" viewBox="0 0 5.5 11" fill="currentColor"><path d="M0 0L5.5 5.5L0 11V0Z" /></svg>
          </button>
          <button className="flex items-center justify-center w-[25.33px] text-[#212529] hover:text-[#000] cursor-pointer transition-colors">
            <svg width="12" height="11" viewBox="0 0 12 11" fill="currentColor"><path d="M0 0L5.5 5.5L0 11V0ZM6.5 0L12 5.5L6.5 11V0Z" /></svg>
          </button>
        </div>

        {/* Dropdowns */}
        <select 
          className="appearance-none m-[7.2px] py-[5.4px] pr-[25.2px] pl-[10.8px] text-[14.4px] text-[#495057] bg-white border border-[#ced4da] rounded-[3.2px] h-[34.4px] outline-none bg-no-repeat cursor-pointer"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'%3e%3cpath fill='%23343a40' d='M2 0L0 2h4zm0 5L0 3h4z'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 10px center',
            backgroundSize: '8px 10px'
          }}
        >
          <option>10</option>
        </select>
        
        <select 
          className="appearance-none m-[7.2px] py-[5.4px] pr-[25.2px] pl-[10.8px] text-[14.4px] text-[#495057] bg-white border border-[#ced4da] rounded-[3.2px] h-[34.4px] outline-none bg-no-repeat cursor-pointer"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'%3e%3cpath fill='%23343a40' d='M2 0L0 2h4zm0 5L0 3h4z'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 10px center',
            backgroundSize: '8px 10px'
          }}
        >
          <option>1</option>
        </select>

        {/* Action Buttons */}
        <ToCsvButton className="ml-[7.2px]" />
        <ToExcelButton className="ml-[7.2px]" />
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto border border-[#ddd] rounded-t-[3px] mt-[10px]">
        <table className="w-full text-left border-collapse text-[12.96px]">
          <thead>
            <tr className="bg-[#EEEEEE] text-[#212529] font-['Arial',sans-serif] text-[12.96px]">
              <th className="tablesorter-header tablesorter-headerUnSorted p-[4px] border-b border-r border-[#ddd] font-bold w-[79.38px] align-middle text-center">
                <div className="tablesorter-header-inner p-[4px] flex justify-center items-center w-full">S.No</div>
              </th>
              <th className="tablesorter-header tablesorter-headerUnSorted p-[4px] border-b border-r border-[#ddd] font-bold align-middle cursor-pointer hover:bg-[#e6e6e6]">
                <div className="tablesorter-header-inner p-[4px] relative flex justify-center items-center w-full">
                  <span>Item Name</span>
                  <div className="absolute right-1">{sortIcon}</div>
                </div>
              </th>
              <th className="tablesorter-header tablesorter-headerUnSorted p-[4px] border-b border-[#ddd] font-bold align-middle cursor-pointer hover:bg-[#e6e6e6]">
                <div className="tablesorter-header-inner p-[4px] relative flex justify-center items-center w-full">
                  <span>Stock</span>
                  <div className="absolute right-1">{sortIcon}</div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="font-sans">
            {data.map((row, idx) => (
              <tr key={row.id} className="bg-white hover:bg-[#66a3ff] transition-colors">
                <td className="p-[10.8px] border-t border-r border-[#ddd] text-[#212529] text-left">{row.id}</td>
                <td className="p-[10.8px] border-t border-r border-[#ddd] text-[#212529]">{row.item}</td>
                <td className="p-[10.8px] border-t border-[#ddd] text-[#212529] text-right">{row.stock}</td>
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
