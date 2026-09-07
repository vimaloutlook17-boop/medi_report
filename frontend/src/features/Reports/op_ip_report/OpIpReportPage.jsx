import React, { useState, useEffect } from 'react';

import { useAuth } from '../../../AuthContext';
import PaginationControls from '../../../components/PaginationControls';
import { ApplyFilterButton, ResetButton } from '../../../components/FilterButtons';
import ToPdfButton from '../../../components/ToPdfButton';
import ToCsvButton from '../../../components/ToCsvButton';

export default function OpIpReportPage() {
  const { token } = useAuth();
  
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const [dateFilter, setDateFilter] = useState('Today');
  const [visitType, setVisitType] = useState('ALL');
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [uhid, setUhid] = useState('');
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [data, setData] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchReport = (customParams = null) => {
    if (!token) return;
    setLoading(true);
    
    // Ensure we don't treat the React click event object as our customParams!
    const params = (customParams && !customParams.nativeEvent) ? customParams : {
      from_date: fromDate,
      to_date: toDate,
      type: visitType === 'ALL' ? '' : visitType,
      search_uhid: uhid,
      search_patient_id: patientId,
      search_patient_name: patientName,
      page,
      size
    };

    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        query.append(key, params[key]);
      }
    });

    fetch(`/api/reports/op-ip/list?${query.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(resData => {
        setData(resData.result || []);
        setGrandTotal(resData.total || 0);
        setTotalElements(resData.numrows || 0);
      })
      .catch(err => console.error("Error fetching op_ip_report:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport();
  }, [page, size, token]);

  const handleApplyFilter = () => {
    setPage(0);
    fetchReport({
      from_date: fromDate,
      to_date: toDate,
      type: visitType === 'ALL' ? '' : visitType,
      search_uhid: uhid,
      search_patient_id: patientId,
      search_patient_name: patientName,
      page: 0,
      size
    });
  };

  const handleResetFilter = () => {
    setDateFilter('Today');
    setVisitType('ALL');
    setPatientName('');
    setPatientId('');
    setUhid('');
    setFromDate(todayStr);
    setToDate(todayStr);
    setPage(0);
    
    fetchReport({
      from_date: todayStr,
      to_date: todayStr,
      type: '',
      search_uhid: '',
      search_patient_id: '',
      search_patient_name: '',
      page: 0,
      size
    });
  };

  const handleDateFilterChange = (val) => {
    setDateFilter(val);
    if (val === 'Custom Date') return;

    const dateNow = new Date();
    let fd = new Date();
    let td = new Date();
    
    if (val === 'Today') {
      // Keep today
    } else if (val === 'Yesterday') {
      fd.setDate(fd.getDate() - 1);
      td.setDate(td.getDate() - 1);
    } else if (val === 'Last 7 Days') {
      fd.setDate(fd.getDate() - 7);
    } else if (val === 'Current Month') {
      fd = new Date(dateNow.getFullYear(), dateNow.getMonth(), 1);
    } else if (val === 'Last Month') {
      fd = new Date(dateNow.getFullYear(), dateNow.getMonth() - 1, 1);
      td = new Date(dateNow.getFullYear(), dateNow.getMonth(), 0);
    }
    
    const fdStr = `${fd.getFullYear()}-${String(fd.getMonth() + 1).padStart(2, '0')}-${String(fd.getDate()).padStart(2, '0')}`;
    const tdStr = `${td.getFullYear()}-${String(td.getMonth() + 1).padStart(2, '0')}-${String(td.getDate()).padStart(2, '0')}`;
    
    setFromDate(fdStr);
    setToDate(tdStr);
  };

  const handleExportCSV = () => {
    let csvContent = "S.No,Bill No,UHID / Patient ID,Date & Time,Patient Name,Visit Type,Bill Amount\n";
    data.forEach((row, idx) => {
      const pName = row.customer_name || '';
      const pId = `${row.uhid_values || ''} / ${row.customer_id || ''}`;
      csvContent += `${page * size + idx + 1},${row.bill_id || ''},"${pId}","${row.bill_date || ''}","${pName}",${row.patient_type || ''},${row.after_final_dis || 0}\n`;
    });
    csvContent += `,,,,,,Total: ${grandTotal}\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "OPIP_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Search Patient Name" className="w-full border border-[#ced4da] rounded-[3px] px-[10.8px] py-[4px] h-[34.4px] text-[14.4px] text-[#495057] placeholder-[#999] bg-white outline-none focus:border-[#80bdff] focus:ring-[3px] focus:ring-[#80bdff]/50" />
              </div>
              <div className="w-full md:w-1/2 lg:w-1/6 px-[6px] mt-2">
                <label className="inline-block text-[14px] leading-[20px] font-medium subpixel-antialiased text-[#212529] mb-[4px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Search Patient ID</label>
                <input type="text" value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="Search Patient ID" className="w-full border border-[#ced4da] rounded-[3px] px-[10.8px] py-[4px] h-[34.4px] text-[14.4px] text-[#495057] placeholder-[#999] bg-white outline-none focus:border-[#80bdff] focus:ring-[3px] focus:ring-[#80bdff]/50" />
              </div>
              <div className="w-full md:w-1/2 lg:w-1/6 px-[6px] mt-2">
                <label className="inline-block text-[14px] leading-[20px] font-medium subpixel-antialiased text-[#212529] mb-[4px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Search UHID</label>
                <input type="text" value={uhid} onChange={(e) => setUhid(e.target.value)} placeholder="Search UHID" className="w-full border border-[#ced4da] rounded-[3px] px-[10.8px] py-[4px] h-[34.4px] text-[14.4px] text-[#495057] placeholder-[#999] bg-white outline-none focus:border-[#80bdff] focus:ring-[3px] focus:ring-[#80bdff]/50" />
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
                  onChange={(e) => handleDateFilterChange(e.target.value)}
                  className="w-full border border-[#ced4da] rounded-[3px] px-[10.8px] py-[4px] h-[34.4px] text-[14.4px] text-[#495057] bg-white outline-none focus:border-[#80bdff] focus:ring-[3px] focus:ring-[#80bdff]/50 appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:9px_9px] cursor-pointer" style={{backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 320 512\'%3e%3cpath fill=\'%23888\' d=\'M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z\'/%3e%3c/svg%3e")'}}
                >
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Current Month">Current Month</option>
                  <option value="Last Month">Last Month</option>
                  <option value="Custom Date">Custom Date</option>
                </select>
              </div>
              <div className="w-full md:w-1/2 lg:w-1/6 px-[6px] mt-2">
                <label className="inline-block text-[14px] leading-[20px] font-medium subpixel-antialiased text-[#212529] mb-[4px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>From Date</label>
                <input 
                  type={dateFilter === 'Custom Date' ? 'date' : 'text'} 
                  value={dateFilter === 'Custom Date' ? fromDate : fromDate.split('-').reverse().join('-')} 
                  onChange={(e) => setFromDate(e.target.value)} 
                  disabled={dateFilter !== 'Custom Date'}
                  className={`w-full border border-[#ced4da] rounded-[3px] px-[10.8px] py-[4px] h-[34.4px] text-[14.4px] text-[#495057] outline-none ${dateFilter === 'Custom Date' ? 'bg-white' : 'bg-[#e9ecef]'}`}
                />
              </div>

              <div className="w-full md:w-1/2 lg:w-1/6 px-[6px] mt-2">
                <label className="inline-block text-[14px] leading-[20px] font-medium subpixel-antialiased text-[#212529] mb-[4px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>To Date</label>
                <input 
                  type={dateFilter === 'Custom Date' ? 'date' : 'text'} 
                  value={dateFilter === 'Custom Date' ? toDate : toDate.split('-').reverse().join('-')} 
                  onChange={(e) => setToDate(e.target.value)} 
                  disabled={dateFilter !== 'Custom Date'}
                  className={`w-full border border-[#ced4da] rounded-[3px] px-[10.8px] py-[4px] h-[34.4px] text-[14.4px] text-[#495057] outline-none ${dateFilter === 'Custom Date' ? 'bg-white' : 'bg-[#e9ecef]'}`}
                />
              </div>
              <div className="w-full md:w-1/2 lg:w-1/4 px-[6px] mt-2 patients-filter-actions">
                <label className="inline-block text-[14px] leading-[20px] font-medium subpixel-antialiased text-[#212529] mb-[4px] opacity-0 pointer-events-none" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Actions</label>
                <div className="flex gap-[6px]">
                  <ApplyFilterButton onClick={handleApplyFilter} />
                  <ResetButton onClick={handleResetFilter} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="flex items-center mt-[14.4px] mb-[8px] h-[34.4px]">
          <PaginationControls
            page={page}
            setPage={setPage}
            size={size}
            setSize={setSize}
            totalElements={totalElements}
            totalPages={Math.ceil(totalElements / size)}
          />
          <div className="flex items-center ml-2">
            <ToCsvButton onClick={handleExportCSV} />
            <ToPdfButton onClick={() => {}} />
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
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-[10.8px] text-center border-r border-[#dee2e6] align-middle">Loading...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-[10.8px] text-center border-r border-[#dee2e6] align-middle">No Records Found</td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={idx} className="bg-white text-[#212529] border-b border-[#dee2e6]">
                    <td className="p-[10.8px] text-center border-r border-[#dee2e6] align-middle">{page * size + idx + 1}</td>
                    <td className="p-[10.8px] text-center border-r border-[#dee2e6] align-middle">{row.bill_id}</td>
                    <td className="p-[10.8px] text-center border-r border-[#dee2e6] align-middle">{(row.uhid_values || '') + " / " + (row.customer_id || '')}</td>
                    <td className="p-[10.8px] text-center border-r border-[#dee2e6] align-middle">{row.bill_date ? new Date(row.bill_date).toLocaleString() : ''}</td>
                    <td className="p-[10.8px] text-left border-r border-[#dee2e6] align-middle">{(row.customer_name || '') + (row.age ? ` (${row.age}${row.age_type || ''})` : '')}</td>
                    <td className="p-[10.8px] text-center border-r border-[#dee2e6] align-middle">{row.patient_type}</td>
                    <td className="p-[10.8px] text-right align-middle">{parseFloat(row.after_final_dis || 0).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div className="text-right text-[#212529] mb-12 mt-4">
          <b className="text-[14.4px] font-bold">Total : {parseFloat(grandTotal).toFixed(2)}</b>
        </div>

      </div>
    </div>
  );
}
