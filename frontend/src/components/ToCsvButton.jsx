import React from 'react';

export default function ToCsvButton({ className = "", onClick }) {
  return (
    <button 
      id="csv"
      onClick={onClick}
      className={`bg-[#17A2B8] hover:bg-[#138496] text-[#FFFFFF] rounded-[3px] text-[12.6px] py-[3.6px] px-[7.2px] h-[28.09px] border border-transparent flex items-center justify-center transition-colors ${className}`}
    >
      TO CSV
    </button>
  );
}
