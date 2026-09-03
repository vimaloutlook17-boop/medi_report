import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ToCsvButton from '../../../components/ToCsvButton';
import ToExcelButton from '../../../components/ToExcelButton';
import NavigationTabs from '../../../components/NavigationTabs';
import PaginationControls from '../../../components/PaginationControls';
import ToPrintButton from '../../../components/ToPrintButton';

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
      <NavigationTabs activeTabLabel="Stock Report Batch Wise" />

      {/* Title */}
      <h3 className="text-[25.2px] text-[#323F52] font-medium mt-[15px] mb-[15px]">STOCK REPORT BATCH WISE</h3>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center justify-start mb-[15px] text-[#212529] text-[12.96px]">
        
        <PaginationControls page={0} size={10} totalCount={715} />

        {/* Dropdowns */}
        <select 
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
          <option value="1000000">All</option>
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
        <ToCsvButton className="ml-[7.2px]" />
        <ToExcelButton className="ml-[7.2px]" />
        <ToPrintButton className="ml-[7.2px]" />
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

      {/* Footer pinned to bottom with small subtle font */}
      <footer className="w-full text-center mt-auto pt-10 pb-4 text-[10.8px] text-[#6c757d] select-none font-sans">
        Copyright &copy; NIGSOFT Private Ltd
      </footer>
    </div>
  );
}
