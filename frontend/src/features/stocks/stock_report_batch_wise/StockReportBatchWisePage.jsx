import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function StockReportBatchWisePage() {
  const data = [
    { id: 1, product: '10 D 200ml', batch: '987654321io', qty: 45, cost: '2.00', totalCost: '90.00', mrp: '6.00', totalMrp: '270.00' },
    { id: 2, product: '10 D 200ml', batch: 'noiuytre', qty: 50, cost: '2.00', totalCost: '100.00', mrp: '6.00', totalMrp: '300.00' },
    { id: 3, product: '10 D 500ML', batch: 'no09876', qty: 30, cost: '2.00', totalCost: '60.00', mrp: '4.00', totalMrp: '120.00' },
    { id: 4, product: '5 D 500ML', batch: '12226087', qty: 1, cost: '0.00', totalCost: '0.00', mrp: '37.99', totalMrp: '37.99' },
    { id: 5, product: '5ML NIPRO', batch: '24D2K27', qty: 20, cost: '0.00', totalCost: '0.00', mrp: '19.50', totalMrp: '390.00' },
    { id: 6, product: '66666', batch: '6456456', qty: 30, cost: '40.00', totalCost: '1,200.00', mrp: '50.00', totalMrp: '1,500.00' },
    { id: 7, product: '7777777', batch: 'NEWBATCH0001', qty: 20, cost: '7.90', totalCost: '158.00', mrp: '8.90', totalMrp: '178.00' },
    { id: 8, product: 'AC New', batch: 'batch001', qty: 6, cost: '2.03', totalCost: '12.18', mrp: '4.56', totalMrp: '27.36' },
  ];

  return (
    <div className="px-[15px] pt-[15px] pb-0 bg-white min-h-full">
      
      {/* Tabs Row Container */}
      <div className="mb-[20px]">
        <ul className="flex flex-wrap m-0 p-0 list-none text-[12.96px] text-[#212529] font-sans border-b border-[#ddd]">
          {[
            { label: 'Stocks', path: '/' },
            { label: 'Products Summary', path: '/' },
            { label: 'Low Demand Stock', path: '#' },
            { label: 'Zero Stocks', path: '/zero-stocks' },
            { label: 'Age Wise Stocks', path: '#' },
            { label: 'Low Quantity', path: '#' },
            { label: 'Expired', path: '#' },
            { label: 'Most Wanted', path: '#' },
            { label: 'Approved', path: '#' },
            { label: 'Purchase Return Items', path: '#' },
            { label: 'Stock Report', path: '#' },
            { label: 'Stock Report Batch Wise', path: '/stock-report-batch-wise', active: true },
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
      <h3 className="text-[25.2px] text-[#323F52] font-medium mt-[15px] mb-[15px]">STOCK REPORT BATCH WISE</h3>

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
          1 to 10 (715)
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

        {/* Search Input (Select2 Mock) */}
        <div className="relative ml-[7.2px] w-[200px]">
          <div className="w-full h-[28.09px] border border-[#aaa] rounded-[4px] bg-white flex items-center justify-between pl-[8px] pr-[20px] cursor-pointer shadow-[inset_0_1px_1px_rgba(0,0,0,0.075)]">
            <span className="text-[#999999] text-[12.96px] truncate select2-selection__placeholder">
              Search Product...
            </span>
            <span className="absolute right-[8px] top-[50%] translate-y-[-50%] text-[#888] text-[10px] pointer-events-none">
              ▼
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <button className="bg-[#17A2B8] hover:bg-[#138496] text-[#FFFFFF] px-[7.2px] py-[3.6px] ml-[7.2px] rounded-[3px] text-[12.6px] h-[28.09px] border border-[#17A2B8] flex items-center justify-center">TO CSV</button>
        <button className="bg-[#FFC107] hover:bg-[#e0a800] text-[#212529] px-[7.2px] py-[3.6px] ml-[7.2px] rounded-[3px] text-[12.6px] h-[28.09px] border border-[#FFC107] flex items-center justify-center">TO EXCEL</button>
        <button className="bg-[#28A745] hover:bg-[#218838] text-[#FFFFFF] px-[7.2px] py-[3.6px] ml-[7.2px] rounded-[3px] text-[12.6px] h-[28.09px] border border-[#28A745] flex items-center justify-center">TO PRINT</button>
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
            {data.map((row, index) => (
              <tr key={row.id} className="bg-white hover:bg-[#66a3ff] transition-colors">
                <td className="p-[10.8px] border-t border-r border-[#ddd] text-[#212529]">{row.id}</td>
                <td className="p-[10.8px] border-t border-r border-[#ddd] text-[#212529]">{row.product}</td>
                <td className="p-[10.8px] border-t border-r border-[#ddd] text-[#212529]">{row.batch}</td>
                <td className="p-[10.8px] border-t border-r border-[#ddd] text-[#212529] text-center">{row.qty}</td>
                <td className="p-[10.8px] border-t border-r border-[#ddd] text-[#212529] text-right">{row.cost}</td>
                <td className="p-[10.8px] border-t border-r border-[#ddd] text-[#212529] text-right">{row.totalCost}</td>
                <td className="p-[10.8px] border-t border-r border-[#ddd] text-[#212529] text-right">{row.mrp}</td>
                <td className="p-[10.8px] border-t border-[#ddd] text-[#212529] text-right">{row.totalMrp}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="font-sans font-bold bg-white">
            <tr>
              <td colSpan="5" className="p-[10.8px] border-t border-r border-[#ddd] text-[#212529] text-right">
                Total
              </td>
              <td className="p-[10.8px] border-t border-r border-[#ddd] text-[#212529] text-right">
                1771.68
              </td>
              <td className="p-[10.8px] border-t border-r border-[#ddd] text-[#212529] text-right">
              </td>
              <td className="p-[10.8px] border-t border-[#ddd] text-[#212529] text-right">
                29378.81
              </td>
            </tr>
          </tfoot>
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
