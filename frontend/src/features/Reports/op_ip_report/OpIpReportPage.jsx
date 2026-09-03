import React, { useState } from 'react';

import { useAuth } from '../../../AuthContext';

export default function OpIpReportPage() {
  const { token } = useAuth();
  const [dateFilter, setDateFilter] = useState('Today');
  const [visitType, setVisitType] = useState('ALL');

  return (
    <div id="layoutSidenav_content" className="ml-[-216px] pl-[216px] text-[#212529] font-sans text-[12.96px] bg-white min-h-screen">
      <div className="px-[14.4px] pt-[15px]">

        {/* Header */}
        <h3 className="text-[25.2px] font-medium text-[#323F52] mb-[24px] pt-[14.4px] uppercase">
          OP/IP WISE BILL LIST
        </h3>

        {/* Filters Box */}
      <div className="border border-[#dee2e6] rounded-[3px] mb-4">
        <div className="px-[14.4px] py-[9.6px] flex items-center gap-2 bg-transparent">
          <svg className="w-[14.4px] h-[14.4px] fill-current text-[#212529]" viewBox="0 0 512 512"><path d="M3.9 54.9C10.5 40.9 24.5 32 40 32H472c15.5 0 29.5 8.9 36.1 22.9s4.6 30.5-5.2 42.5L320 320.9V448c0 12.1-6.8 23.2-17.7 28.6s-23.8 4.3-33.5-3l-64-48c-8.1-6-12.8-15.5-12.8-25.6V320.9L9 97.3C-.7 85.4-2.8 68.8 3.9 54.9z"/></svg>
          <span className="font-bold text-[14.4px] text-[#212529]">Filters</span>
        </div>
        <div className="px-[14.4px] pb-[14.4px]">
          <div className="flex flex-wrap mx-[-6px]">
            <div className="w-full md:w-1/2 lg:w-1/6 px-[6px] mt-2">
              <label className="inline-block text-[14px] leading-[20px] font-medium subpixel-antialiased text-[#212529] mb-[4px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Search Patient Name</label>
              <input type="text" placeholder="Search Patient Name" className="w-full border border-[#ced4da] rounded-[3px] px-[10.8px] py-[4px] h-[34.4px] text-[14.4px] text-[#495057] placeholder-[#999] bg-white outline-none focus:border-[#80bdff] focus:ring-[3px] focus:ring-[#80bdff]/50" />
            </div>
            <div className="w-full md:w-1/2 lg:w-1/6 px-[6px] mt-2">
              <label className="inline-block text-[14px] leading-[20px] font-medium subpixel-antialiased text-[#212529] mb-[4px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Search Patient ID</label>
              <input type="text" placeholder="Search Patient ID" className="w-full border border-[#ced4da] rounded-[3px] px-[10.8px] py-[4px] h-[34.4px] text-[14.4px] text-[#495057] placeholder-[#999] bg-white outline-none focus:border-[#80bdff] focus:ring-[3px] focus:ring-[#80bdff]/50" />
            </div>
            <div className="w-full md:w-1/2 lg:w-1/6 px-[6px] mt-2">
              <label className="inline-block text-[14px] leading-[20px] font-medium subpixel-antialiased text-[#212529] mb-[4px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Search UHID</label>
              <input type="text" placeholder="Search UHID" className="w-full border border-[#ced4da] rounded-[3px] px-[10.8px] py-[4px] h-[34.4px] text-[14.4px] text-[#495057] placeholder-[#999] bg-white outline-none focus:border-[#80bdff] focus:ring-[3px] focus:ring-[#80bdff]/50" />
            </div>
            <div className="w-full md:w-1/2 lg:w-1/6 px-[6px] mt-2">
              <label className="inline-block text-[14px] leading-[20px] font-medium subpixel-antialiased text-[#212529] mb-[4px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Visit Type</label>
              <select 
                value={visitType}
                onChange={(e) => setVisitType(e.target.value)}
                className="w-full border border-[#ced4da] rounded-[3px] px-[10.8px] py-[4px] h-[34.4px] text-[14.4px] text-[#495057] bg-white outline-none focus:border-[#80bdff] focus:ring-[3px] focus:ring-[#80bdff]/50 appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:9px_9px] cursor-pointer" style={{backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 320 512\'%3e%3cpath fill=\'%23888\' d=\'M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z\'/%3e%3c/svg%3e")'}}
              >
                <option>ALL</option>
                <option>OP</option>
                <option>IP</option>
                <option>WALK-IN</option>
              </select>
            </div>
            <div className="w-full md:w-1/2 lg:w-1/6 px-[6px] mt-2">
              <label className="inline-block text-[14px] leading-[20px] font-medium subpixel-antialiased text-[#212529] mb-[4px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Date Filter</label>
              <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full border border-[#ced4da] rounded-[3px] px-[10.8px] py-[4px] h-[34.4px] text-[14.4px] text-[#495057] bg-white outline-none focus:border-[#80bdff] focus:ring-[3px] focus:ring-[#80bdff]/50 appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:9px_9px] cursor-pointer" style={{backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 320 512\'%3e%3cpath fill=\'%23888\' d=\'M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z\'/%3e%3c/svg%3e")'}}
              >
                <option>Today</option>
                <option>Yesterday</option>
                <option>Last 7 Days</option>
                <option>Current Month</option>
                <option>Last Month</option>
                <option>Custom Date</option>
              </select>
            </div>
            <div className="w-full md:w-1/2 lg:w-1/6 px-[6px] mt-2">
              <label className="inline-block text-[14px] leading-[20px] font-medium subpixel-antialiased text-[#212529] mb-[4px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>From Date</label>
              <input type="text" defaultValue="31-08-2026" className="w-full border border-[#ced4da] rounded-[3px] px-[10.8px] py-[4px] h-[34.4px] text-[14.4px] text-[#495057] bg-[#e9ecef] outline-none" readOnly />
            </div>

            <div className="w-full md:w-1/2 lg:w-1/6 px-[6px] mt-2">
              <label className="inline-block text-[14px] leading-[20px] font-medium subpixel-antialiased text-[#212529] mb-[4px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>To Date</label>
              <input type="text" defaultValue="31-08-2026" className="w-full border border-[#ced4da] rounded-[3px] px-[10.8px] py-[4px] h-[34.4px] text-[14.4px] text-[#495057] bg-[#e9ecef] outline-none" readOnly />
            </div>
            <div className="w-full md:w-1/2 lg:w-1/4 px-[6px] mt-2 patients-filter-actions">
              <label className="inline-block text-[14px] leading-[20px] font-medium subpixel-antialiased text-[#212529] mb-[4px] opacity-0 pointer-events-none" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Actions</label>
              <div className="flex gap-[6px]">
                <button id="applyFilterBtn" type="button" className="flex-1 bg-[#007bff] hover:bg-[#0069d9] border border-[#007bff] text-white h-[34px] rounded-[3px] text-[14.4px] font-normal flex items-center justify-center gap-1.5 px-[5px] py-[4px]">
                  <svg className="w-[14.4px] h-[14.4px] fill-current" viewBox="0 0 512 512"><path d="M3.9 54.9C10.5 40.9 24.5 32 40 32H472c15.5 0 29.5 8.9 36.1 22.9s4.6 30.5-5.2 42.5L320 320.9V448c0 12.1-6.8 23.2-17.7 28.6s-23.8 4.3-33.5-3l-64-48c-8.1-6-12.8-15.5-12.8-25.6V320.9L9 97.3C-.7 85.4-2.8 68.8 3.9 54.9z"/></svg>
                  Apply Filters
                </button>
                <button id="clearFilterBtn" type="button" className="flex-1 bg-[#6c757d] hover:bg-[#5a6268] border border-[#6c757d] text-white h-[34px] rounded-[3px] text-[14.4px] font-normal flex items-center justify-center gap-1.5 px-[5px] py-[4px]">
                  <svg className="w-[14.4px] h-[14.4px] fill-current" viewBox="0 0 512 512"><path d="M212.333 224.333H12c-6.627 0-12-5.373-12-12V12C0 5.373 5.373 0 12 0h48c6.627 0 12 5.373 12 12v78.112C117.773 39.279 184.26 7.47 258.175 8.007c136.906.994 246.448 111.623 246.157 248.532C504.041 393.258 393.12 504 256.333 504c-64.089 0-122.496-24.313-166.51-64.215-5.099-4.622-5.334-12.554-.467-17.42l33.967-33.967c4.474-4.474 11.662-4.717 16.401-.525C170.76 415.336 211.58 432 256.333 432c97.268 0 176-78.716 176-176 0-97.267-78.716-176-176-176-58.496 0-110.28 28.476-142.274 72.333h98.274c6.627 0 12 5.373 12 12v48C224.333 218.96 218.96 224.333 212.333 224.333z"/></svg>
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex items-center mt-[14.4px] mb-[8px] h-[34.4px] form-inline ts-pager tablesorter-pager">
        {/* Left Pagination Group */}
        <div className="flex items-center">
          <button type="button" className="btn btn-secondary first disabled bg-[#6c757d] text-white w-[28.6px] h-[27.7px] px-[7.2px] py-[3.6px] border border-[#6c757d] rounded-l-[3px] opacity-65 flex justify-center items-center cursor-not-allowed">
            <svg className="fill-current w-[11px] h-[10px]" viewBox="0 0 11 10"><polygon points="11,0 11,10 5.5,5" /><polygon points="5.5,0 5.5,10 0,5" /></svg>
          </button>
          <button type="button" className="btn btn-secondary prev disabled bg-[#6c757d] text-white w-[22.3px] h-[27.7px] px-[7.2px] py-[3.6px] border border-[#6c757d] rounded-r-[3px] border-l border-l-[#545b62] opacity-65 flex justify-center items-center cursor-not-allowed">
            <svg className="fill-current w-[5.5px] h-[10px]" viewBox="0 0 5.5 10"><polygon points="5.5,0 5.5,10 0,5" /></svg>
          </button>
        </div>

        {/* Pagination Text */}
        <div className="flex items-center mx-[7.2px]">
          <span className="text-[#212529] font-normal text-[12.96px] leading-none">1 to 1 (1)</span>
        </div>

        {/* Right Pagination Group */}
        <div className="flex items-center">
          <button type="button" className="btn btn-secondary next disabled bg-[#6c757d] text-white w-[22.3px] h-[27.7px] px-[7.2px] py-[3.6px] border border-[#6c757d] rounded-l-[3px] opacity-65 flex justify-center items-center cursor-not-allowed">
            <svg className="fill-current w-[5.5px] h-[10px]" viewBox="0 0 5.5 10"><polygon points="0,0 0,10 5.5,5" /></svg>
          </button>
          <button type="button" className="btn btn-secondary last disabled bg-[#6c757d] text-white w-[28.6px] h-[27.7px] px-[7.2px] py-[3.6px] border border-[#6c757d] rounded-r-[3px] border-l border-l-[#545b62] opacity-65 flex justify-center items-center cursor-not-allowed">
            <svg className="fill-current w-[11px] h-[10px]" viewBox="0 0 11 10"><polygon points="0,0 0,10 5.5,5" /><polygon points="5.5,0 5.5,10 11,5" /></svg>
          </button>
        </div>

        {/* Page Size & Input with Scroll Icons */}
        <div className="flex items-center h-full">
          <div className="relative w-[91.2px] h-[34.4px] mx-[3.6px]">
            <select className="form-control-sm custom-select px-4 mx-lg-1 pagenum mb-2 mb-sm-0 border border-[#ced4da] rounded-[3px] py-[5.4px] px-[21.6px] h-full text-[14.4px] text-[#495057] bg-white outline-none w-full appearance-none cursor-pointer">
              <option>10</option>
            </select>
            <svg className="w-[8px] h-[12px] text-[#6c757d] absolute right-[6px] top-1/2 -translate-y-1/2 pointer-events-none" fill="currentColor" viewBox="0 0 320 512"><path d="M137.4 41.4c12.5-12.5 32.8-12.5 45.3 0l128 128c9.2 9.2 11.9 22.9 6.9 34.9s-16.6 19.8-29.6 19.8H32c-12.9 0-24.6-7.8-29.6-19.8s-2.2-25.7 6.9-34.9l128-128zm0 429.3l-128-128c-9.2-9.2-11.9-22.9-6.9-34.9s16.6-19.8 29.6-19.8h256c12.9 0 24.6 7.8 29.6 19.8s2.2 25.7-6.9 34.9l-128 128c-12.5 12.5-32.8 12.5-45.3 0z"/></svg>
          </div>
          
          <div className="relative w-[60px] h-[34.4px] mx-[3.6px]">
            <input type="text" defaultValue="1" className="border border-[#ced4da] rounded-[3px] pl-2 pr-5 h-full outline-none text-[#495057] text-[14.4px] w-full text-center appearance-none" />
            <svg className="w-[8px] h-[12px] text-[#212529] absolute right-[6px] top-1/2 -translate-y-1/2 pointer-events-none" fill="currentColor" viewBox="0 0 320 512"><path d="M137.4 41.4c12.5-12.5 32.8-12.5 45.3 0l128 128c9.2 9.2 11.9 22.9 6.9 34.9s-16.6 19.8-29.6 19.8H32c-12.9 0-24.6-7.8-29.6-19.8s-2.2-25.7 6.9-34.9l128-128zm0 429.3l-128-128c-9.2-9.2-11.9-22.9-6.9-34.9s16.6-19.8 29.6-19.8h256c12.9 0 24.6 7.8 29.6 19.8s2.2 25.7-6.9 34.9l-128 128c-12.5 12.5-32.8 12.5-45.3 0z"/></svg>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center">
          <button id="toprint" type="button" className="form-control-sm btn btn-sm btn-info ml-2 bg-[#17a2b8] hover:bg-[#138496] border border-[#17a2b8] text-white px-[7.2px] py-[3.6px] ml-[7.2px] rounded-[3px] text-[12.6px] font-normal">TO Print</button>
        </div>
      </div>

      {/* Main Table */}
      <div>
        <table className="w-full text-left border-collapse text-[12.96px] border border-[#dee2e6]">
          <thead className="bg-[#EEEEEE] text-[#212529] font-[Arial] border-b border-[#dee2e6]">
            <tr>
              <th className="font-bold text-center border-r border-[#dee2e6] align-middle">
                <div className="tablesorter-header-inner p-[10.8px]">S.No</div>
              </th>
              <th className="font-bold text-center border-r border-[#dee2e6] align-middle">
                <div className="tablesorter-header-inner p-[10.8px]">Bill No</div>
              </th>
              <th className="font-bold text-center border-r border-[#dee2e6] align-middle">
                <div className="tablesorter-header-inner p-[10.8px]">UHID / Patient ID</div>
              </th>
              <th className="font-bold text-center border-r border-[#dee2e6] align-middle">
                <div className="tablesorter-header-inner p-[10.8px]">Date & Time</div>
              </th>
              <th className="font-bold text-center border-r border-[#dee2e6] align-middle">
                <div className="tablesorter-header-inner p-[10.8px]">Patient Name</div>
              </th>
              <th className="font-bold text-center border-r border-[#dee2e6] align-middle">
                <div className="tablesorter-header-inner p-[10.8px]">Visit Type</div>
              </th>
              <th className="font-bold text-center align-middle">
                <div className="tablesorter-header-inner p-[10.8px]">Bill Amount</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white text-[#212529] border-b border-[#dee2e6]">
              <td className="p-[10.8px] text-left border-r border-[#dee2e6] align-middle">1</td>
              <td className="p-[10.8px] text-left border-r border-[#dee2e6] align-middle">258</td>
              <td className="p-[10.8px] text-left border-r border-[#dee2e6] align-middle">804</td>
              <td className="p-[10.8px] text-left border-r border-[#dee2e6] align-middle">31/08/2026 11:18 AM</td>
              <td className="p-[10.8px] text-left border-r border-[#dee2e6] align-middle">KARTHIKA KUMAR (23)</td>
              <td className="p-[10.8px] text-left border-r border-[#dee2e6] align-middle">WALK-IN</td>
              <td className="p-[10.8px] text-right align-middle">413</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="text-right text-[#212529] mb-12 mt-4">
        <b className="text-[14.4px] font-bold">Total : 413.00</b>
      </div>

    </div>
      </div>
  );
}
