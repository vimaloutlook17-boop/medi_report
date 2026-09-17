import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { useAuth } from '../../../AuthContext';
import { apiConfig } from '../../../config';
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

  const [patientOptions, setPatientOptions] = useState([]);
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [patientFocusedIndex, setPatientFocusedIndex] = useState(-1);
  const patientContainerRef = useRef(null);

  const [patientIdOptions, setPatientIdOptions] = useState([]);
  const [isPatientIdDropdownOpen, setIsPatientIdDropdownOpen] = useState(false);
  const [patientIdFocusedIndex, setPatientIdFocusedIndex] = useState(-1);
  const patientIdContainerRef = useRef(null);

  const [uhidOptions, setUhidOptions] = useState([]);
  const [isUhidDropdownOpen, setIsUhidDropdownOpen] = useState(false);
  const [uhidFocusedIndex, setUhidFocusedIndex] = useState(-1);
  const uhidContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (patientContainerRef.current && !patientContainerRef.current.contains(e.target)) {
        setIsPatientDropdownOpen(false);
      }
      if (patientIdContainerRef.current && !patientIdContainerRef.current.contains(e.target)) {
        setIsPatientIdDropdownOpen(false);
      }
      if (uhidContainerRef.current && !uhidContainerRef.current.contains(e.target)) {
        setIsUhidDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchPatients = async (query) => {
    if (!query || query.trim().length < 2) {
      setPatientOptions([]);
      setIsPatientDropdownOpen(false);
      return;
    }
    try {
      const response = await fetch(`${apiConfig.base_url}/reports/op-ip/search-patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: query.trim() })
      });
      const result = await response.json();
      if (result.status === 'success') {
        setPatientOptions(result.data || []);
        setIsPatientDropdownOpen((result.data || []).length > 0);
      }
    } catch (e) {
      console.error("Error searching patients:", e);
    }
  };

  const handlePatientNameChange = (e) => {
    const val = e.target.value;
    setPatientName(val);
    setPatientFocusedIndex(-1);
    if (val.trim().length >= 2) {
      searchPatients(val);
    } else {
      setPatientOptions([]);
      setIsPatientDropdownOpen(false);
    }
  };

  const selectPatient = (opt) => {
    setPatientName(opt.customer_name);
    if (opt.customer_id) {
      setPatientId(opt.customer_id.toString());
    }
    setIsPatientDropdownOpen(false);
    setPatientFocusedIndex(-1);
  };

  const handlePatientNameKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isPatientDropdownOpen && patientOptions.length > 0) {
        setIsPatientDropdownOpen(true);
      }
      setPatientFocusedIndex(prev => Math.min(prev + 1, patientOptions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setPatientFocusedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (isPatientDropdownOpen && patientFocusedIndex >= 0 && patientFocusedIndex < patientOptions.length) {
        e.preventDefault();
        selectPatient(patientOptions[patientFocusedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsPatientDropdownOpen(false);
    }
  };

  const searchPatientsById = async (query) => {
    if (!query || query.trim().length < 1) {
      setPatientIdOptions([]);
      setIsPatientIdDropdownOpen(false);
      return;
    }
    try {
      const response = await fetch(`${apiConfig.base_url}/reports/op-ip/search-patients-by-id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: query.trim() })
      });
      const result = await response.json();
      if (result.status === 'success') {
        setPatientIdOptions(result.data || []);
        setIsPatientIdDropdownOpen((result.data || []).length > 0);
      }
    } catch (e) {
      console.error("Error searching patients by id:", e);
    }
  };

  const handlePatientIdChange = (e) => {
    const val = e.target.value;
    setPatientId(val);
    setPatientIdFocusedIndex(-1);
    if (val.trim().length >= 1) {
      searchPatientsById(val);
    } else {
      setPatientIdOptions([]);
      setIsPatientIdDropdownOpen(false);
    }
  };

  const selectPatientById = (opt) => {
    if (opt.customer_id) {
      setPatientId(opt.customer_id.toString());
    }
    if (opt.customer_name) {
      setPatientName(opt.customer_name);
    }
    setIsPatientIdDropdownOpen(false);
    setPatientIdFocusedIndex(-1);
  };

  const handlePatientIdKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isPatientIdDropdownOpen && patientIdOptions.length > 0) {
        setIsPatientIdDropdownOpen(true);
      }
      setPatientIdFocusedIndex(prev => Math.min(prev + 1, patientIdOptions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setPatientIdFocusedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (isPatientIdDropdownOpen && patientIdFocusedIndex >= 0 && patientIdFocusedIndex < patientIdOptions.length) {
        e.preventDefault();
        selectPatientById(patientIdOptions[patientIdFocusedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsPatientIdDropdownOpen(false);
    }
  };

  const searchPatientsByUhid = async (query) => {
    if (!query || query.trim().length < 1) {
      setUhidOptions([]);
      setIsUhidDropdownOpen(false);
      return;
    }
    try {
      const response = await fetch(`${apiConfig.base_url}/reports/op-ip/search-patients-by-uhid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: query.trim() })
      });
      const result = await response.json();
      if (result.status === 'success') {
        setUhidOptions(result.data || []);
        setIsUhidDropdownOpen((result.data || []).length > 0);
      }
    } catch (e) {
      console.error("Error searching patients by uhid:", e);
    }
  };

  const handleUhidChange = (e) => {
    const val = e.target.value;
    setUhid(val);
    setUhidFocusedIndex(-1);
    if (val.trim().length >= 1) {
      searchPatientsByUhid(val);
    } else {
      setUhidOptions([]);
      setIsUhidDropdownOpen(false);
    }
  };

  const selectPatientByUhid = (opt) => {
    if (opt.uhid_values) {
      setUhid(opt.uhid_values.toString());
    }
    if (opt.customer_name) {
      setPatientName(opt.customer_name);
    }
    if (opt.customer_id) {
      setPatientId(opt.customer_id.toString());
    }
    setIsUhidDropdownOpen(false);
    setUhidFocusedIndex(-1);
  };

  const handleUhidKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isUhidDropdownOpen && uhidOptions.length > 0) {
        setIsUhidDropdownOpen(true);
      }
      setUhidFocusedIndex(prev => Math.min(prev + 1, uhidOptions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setUhidFocusedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (isUhidDropdownOpen && uhidFocusedIndex >= 0 && uhidFocusedIndex < uhidOptions.length) {
        e.preventDefault();
        selectPatientByUhid(uhidOptions[uhidFocusedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsUhidDropdownOpen(false);
    }
  };
  
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
    setPatientOptions([]);
    setIsPatientDropdownOpen(false);
    setPatientFocusedIndex(-1);
    setPatientIdOptions([]);
    setIsPatientIdDropdownOpen(false);
    setPatientIdFocusedIndex(-1);
    setUhidOptions([]);
    setIsUhidDropdownOpen(false);
    setUhidFocusedIndex(-1);
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

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = String(hours).padStart(2, '0');
    return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`;
  };

  const formatVisitType = (type) => {
    if (type === 'OUT') return 'OP';
    if (type === 'IN') return 'IP';
    return type || '';
  };

  const handleExportCSV = () => {
    const wsData = [
      ["S.No", "Bill No", "UHID / Patient ID", "Date & Time", "Patient Name", "Visit Type", "Bill Amount"]
    ];

    data.forEach((row, idx) => {
      const pName = row.customer_name || '';
      const pId = row.uhid_values || row.customer_id || '';
      wsData.push([
        page * size + idx + 1,
        row.invoice_no || row.bill_id || '',
        pId,
        formatDateTime(row.bill_date),
        pName,
        formatVisitType(row.patient_type),
        parseFloat(row.after_final_dis || 0)
      ]);
    });

    wsData.push(["Total", "", "", "", "", "", parseFloat(grandTotal)]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths to prevent text from being cut off in Excel
    ws['!cols'] = [
      { wch: 8 },  // S.No
      { wch: 12 }, // Bill No
      { wch: 20 }, // UHID / Patient ID
      { wch: 22 }, // Date & Time
      { wch: 35 }, // Patient Name
      { wch: 12 }, // Visit Type
      { wch: 15 }  // Bill Amount
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "OPIP Report");
    XLSX.writeFile(wb, "OPIP_Report.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`OP/IP Wise Report - ${fromDate.split('-').reverse().join('-')} to ${toDate.split('-').reverse().join('-')}`, 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Type: ${visitType}`, 180, 15);
    
    const headers = [['S.No', 'Bill No', 'UHID / Patient ID', 'Date & Time', 'Patient Name', 'Visit Type', 'Bill Amount']];
    
    const tableData = data.map((row, idx) => {
      const pName = (row.customer_name || '') + (row.age ? ` (${row.age}${row.age_type || ''})` : '');
      const pId = row.uhid_values || row.customer_id || '';
      return [
        page * size + idx + 1,
        row.invoice_no || row.bill_id || '',
        pId,
        formatDateTime(row.bill_date),
        pName,
        formatVisitType(row.patient_type),
        parseFloat(row.after_final_dis || 0).toFixed(2)
      ];
    });
    
    const footData = [
      ['Total', '', '', '', '', '', parseFloat(grandTotal).toFixed(2)]
    ];

    autoTable(doc, {
      head: headers,
      body: tableData,
      foot: footData,
      showFoot: 'lastPage',
      startY: 22,
      theme: 'grid',
      styles: { 
        fontSize: 8, 
        cellPadding: 3, 
        lineColor: [210, 210, 210], 
        lineWidth: 0.1,
        textColor: [80, 80, 80]
      },
      headStyles: { 
        fillColor: [245, 245, 245], 
        textColor: [0, 0, 0], 
        fontStyle: 'bold'
      },
      footStyles: { 
        fillColor: [26, 188, 156], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold'
      },
      didParseCell: function(data) {
        if (data.section === 'foot') {
          // Remove all borders in the footer to create a solid green block
          data.cell.styles.lineWidth = 0;
          if (data.column.index === 0) {
            data.cell.styles.halign = 'left';
          }
        }
      }
    });

    doc.save('OPIP_Report.pdf');
  };

  return (
    <div id="layoutSidenav_content" className="ml-[-216px] pl-[216px] text-[#212529] font-sans text-[12.96px] bg-white min-h-screen">
      <div className="px-[14.4px] pt-[15px]">

        {/* Header */}
        <h3 className="text-[25.2px] font-medium text-[#323F52] mb-[12px] pt-[5px] uppercase">
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
                <div className="relative" ref={patientContainerRef}>
                  <input 
                    type="text" 
                    value={patientName} 
                    onChange={handlePatientNameChange}
                    onKeyDown={handlePatientNameKeyDown}
                    onFocus={() => {
                      if (patientOptions.length > 0) setIsPatientDropdownOpen(true);
                    }}
                    placeholder="Search Patient Name" 
                    className="w-full border border-[#ced4da] rounded-[3px] px-[10.8px] py-[4px] h-[34.4px] text-[14.4px] text-[#495057] placeholder-[#999] bg-white outline-none focus:border-[#80bdff] focus:ring-[3px] focus:ring-[#80bdff]/50" 
                  />
                  {isPatientDropdownOpen && patientOptions.length > 0 && (
                    <div 
                      className="absolute top-[100%] left-0 w-full bg-white border border-[#ced4da] rounded-b-[3px] shadow-lg z-[9999] mt-[1px] max-h-[220px] overflow-y-auto"
                      style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                    >
                      {patientOptions.map((opt, idx) => {
                        const isFocused = idx === patientFocusedIndex;
                        const displayText = [opt.customer_name, opt.customer_id, opt.phone].filter(v => v !== null && v !== undefined && v !== '').join(' | ');
                        return (
                          <div
                            key={idx}
                            ref={el => {
                              if (el && isFocused) {
                                el.scrollIntoView({ block: 'nearest' });
                              }
                            }}
                            className={`px-[10.8px] py-[6px] cursor-pointer border-b border-[#e5e5e5] last:border-b-0 text-[14px] select-none transition-colors ${
                              isFocused ? 'bg-[#d9d9d9] text-[#212529]' : 'bg-white text-[#212529] hover:bg-[#d9d9d9]'
                            }`}
                            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                            onMouseEnter={() => setPatientFocusedIndex(idx)}
                            onClick={() => selectPatient(opt)}
                          >
                            {displayText}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full md:w-1/2 lg:w-1/6 px-[6px] mt-2">
                <label className="inline-block text-[14px] leading-[20px] font-medium subpixel-antialiased text-[#212529] mb-[4px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Search Patient ID</label>
                <div className="relative" ref={patientIdContainerRef}>
                  <input 
                    type="text" 
                    value={patientId} 
                    onChange={handlePatientIdChange}
                    onKeyDown={handlePatientIdKeyDown}
                    onFocus={() => {
                      if (patientIdOptions.length > 0) setIsPatientIdDropdownOpen(true);
                    }}
                    placeholder="Search Patient ID" 
                    className="w-full border border-[#ced4da] rounded-[3px] px-[10.8px] py-[4px] h-[34.4px] text-[14.4px] text-[#495057] placeholder-[#999] bg-white outline-none focus:border-[#80bdff] focus:ring-[3px] focus:ring-[#80bdff]/50" 
                  />
                  {isPatientIdDropdownOpen && patientIdOptions.length > 0 && (
                    <div 
                      className="absolute top-[100%] left-0 w-full bg-white border border-[#ced4da] rounded-b-[3px] shadow-lg z-[9999] mt-[1px] max-h-[220px] overflow-y-auto"
                      style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                    >
                      {patientIdOptions.map((opt, idx) => {
                        const isFocused = idx === patientIdFocusedIndex;
                        const displayText = [opt.customer_id, opt.customer_name, opt.phone].filter(v => v !== null && v !== undefined && v !== '').join(' | ');
                        return (
                          <div
                            key={idx}
                            ref={el => {
                              if (el && isFocused) {
                                el.scrollIntoView({ block: 'nearest' });
                              }
                            }}
                            className={`px-[10.8px] py-[6px] cursor-pointer border-b border-[#e5e5e5] last:border-b-0 text-[14px] select-none transition-colors ${
                              isFocused ? 'bg-[#d9d9d9] text-[#212529]' : 'bg-white text-[#212529] hover:bg-[#d9d9d9]'
                            }`}
                            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                            onMouseEnter={() => setPatientIdFocusedIndex(idx)}
                            onClick={() => selectPatientById(opt)}
                          >
                            {displayText}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full md:w-1/2 lg:w-1/6 px-[6px] mt-2">
                <label className="inline-block text-[14px] leading-[20px] font-medium subpixel-antialiased text-[#212529] mb-[4px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Search UHID</label>
                <div className="relative" ref={uhidContainerRef}>
                  <input 
                    type="text" 
                    value={uhid} 
                    onChange={handleUhidChange}
                    onKeyDown={handleUhidKeyDown}
                    onFocus={() => {
                      if (uhidOptions.length > 0) setIsUhidDropdownOpen(true);
                    }}
                    placeholder="Search UHID" 
                    className="w-full border border-[#ced4da] rounded-[3px] px-[10.8px] py-[4px] h-[34.4px] text-[14.4px] text-[#495057] placeholder-[#999] bg-white outline-none focus:border-[#80bdff] focus:ring-[3px] focus:ring-[#80bdff]/50" 
                  />
                  {isUhidDropdownOpen && uhidOptions.length > 0 && (
                    <div 
                      className="absolute top-[100%] left-0 w-full bg-white border border-[#ced4da] rounded-b-[3px] shadow-lg z-[9999] mt-[1px] max-h-[220px] overflow-y-auto"
                      style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                    >
                      {uhidOptions.map((opt, idx) => {
                        const isFocused = idx === uhidFocusedIndex;
                        const displayText = [opt.uhid_values, opt.customer_name, opt.phone].filter(v => v !== null && v !== undefined && v !== '').join(' | ');
                        return (
                          <div
                            key={idx}
                            ref={el => {
                              if (el && isFocused) {
                                el.scrollIntoView({ block: 'nearest' });
                              }
                            }}
                            className={`px-[10.8px] py-[6px] cursor-pointer border-b border-[#e5e5e5] last:border-b-0 text-[14px] select-none transition-colors ${
                              isFocused ? 'bg-[#d9d9d9] text-[#212529]' : 'bg-white text-[#212529] hover:bg-[#d9d9d9]'
                            }`}
                            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                            onMouseEnter={() => setUhidFocusedIndex(idx)}
                            onClick={() => selectPatientByUhid(opt)}
                          >
                            {displayText}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
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
            totalCount={totalElements}
          />
          
          {/* Page Size & Input with Scroll Icons */}
          <div className="flex items-center h-full ml-[7.2px]">
            <div className="relative w-[60px] h-[34.4px] mx-[3.6px]">
              <select 
                value={size >= 999999 ? 'All' : size} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'All') setSize(999999);
                  else setSize(parseInt(val));
                  setPage(0);
                }}
                className="form-control-sm custom-select mb-2 mb-sm-0 border border-[#ced4da] rounded-[3px] py-[5.4px] pl-[10px] pr-[20px] h-full text-[14.4px] text-[#495057] bg-white outline-none w-full appearance-none cursor-pointer"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="All">All</option>
              </select>
              <svg className="w-[8px] h-[12px] text-[#6c757d] absolute right-[6px] top-1/2 -translate-y-1/2 pointer-events-none" fill="currentColor" viewBox="0 0 320 512"><path d="M137.4 41.4c12.5-12.5 32.8-12.5 45.3 0l128 128c9.2 9.2 11.9 22.9 6.9 34.9s-16.6 19.8-29.6 19.8H32c-12.9 0-24.6-7.8-29.6-19.8s-2.2-25.7 6.9-34.9l128-128zm0 429.3l-128-128c-9.2-9.2-11.9-22.9-6.9-34.9s16.6-19.8 29.6-19.8h256c12.9 0 24.6 7.8 29.6 19.8s2.2 25.7-6.9 34.9l-128 128c-12.5 12.5-32.8 12.5-45.3 0z"/></svg>
            </div>
            
            <div className="relative w-[52.8px] h-[34.4px] mx-[3.6px]">
              <select
                value={page + 1}
                onChange={(e) => setPage(parseInt(e.target.value) - 1)}
                className="form-control-sm custom-select mb-2 mb-sm-0 border border-[#ced4da] rounded-[3px] py-[5.4px] pl-[10px] pr-[20px] h-full text-[14.4px] text-[#495057] bg-white outline-none w-full appearance-none cursor-pointer"
              >
                {Array.from({ length: Math.ceil(totalElements / size) || 1 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
              <svg className="w-[8px] h-[12px] text-[#212529] absolute right-[6px] top-1/2 -translate-y-1/2 pointer-events-none" fill="currentColor" viewBox="0 0 320 512"><path d="M137.4 41.4c12.5-12.5 32.8-12.5 45.3 0l128 128c9.2 9.2 11.9 22.9 6.9 34.9s-16.6 19.8-29.6 19.8H32c-12.9 0-24.6-7.8-29.6-19.8s-2.2-25.7 6.9-34.9l128-128zm0 429.3l-128-128c-9.2-9.2-11.9-22.9-6.9-34.9s16.6-19.8 29.6-19.8h256c12.9 0 24.6 7.8 29.6 19.8s2.2 25.7-6.9 34.9l-128 128c-12.5 12.5-32.8 12.5-45.3 0z"/></svg>
            </div>
          </div>

          <div className="flex items-center ml-auto gap-[6px]">
            <ToCsvButton onClick={handleExportCSV} />
            <ToPdfButton onClick={handleExportPDF} />
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
                    <td className="p-[10.8px] text-center border-r border-[#dee2e6] align-middle">{row.invoice_no || row.bill_id}</td>
                    <td className="p-[10.8px] text-center border-r border-[#dee2e6] align-middle">{row.uhid_values || row.customer_id || ''}</td>
                    <td className="p-[10.8px] text-center border-r border-[#dee2e6] align-middle">{formatDateTime(row.bill_date)}</td>
                    <td className="p-[10.8px] text-left border-r border-[#dee2e6] align-middle">{(row.customer_name || '') + (row.age ? ` (${row.age}${row.age_type || ''})` : '')}</td>
                    <td className="p-[10.8px] text-center border-r border-[#dee2e6] align-middle">{formatVisitType(row.patient_type)}</td>
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
