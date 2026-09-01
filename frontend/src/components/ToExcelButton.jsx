import React from 'react';

export default function ToExcelButton({ className = "", onClick }) {
  return (
    <button 
      id="download_excel"
      onClick={onClick}
      className={`bg-[#FFC107] hover:bg-[#e0a800] text-[#212529] rounded-[3px] text-[12.6px] py-[3.6px] px-[7.2px] h-[28.09px] border border-transparent flex items-center justify-center transition-colors ${className}`}
    >
      TO EXCEL
    </button>
  );
}
