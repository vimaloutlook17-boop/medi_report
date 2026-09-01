import React from 'react';

export default function ToPrintButton({ className = "", onClick }) {
  return (
    <button 
      id="print"
      onClick={onClick}
      className={`bg-[#28A745] hover:bg-[#218838] text-[#FFFFFF] rounded-[3px] text-[12.6px] py-[3.6px] px-[7.2px] h-[28.09px] border border-transparent flex items-center justify-center transition-colors ${className}`}
    >
      TO PRINT
    </button>
  );
}
