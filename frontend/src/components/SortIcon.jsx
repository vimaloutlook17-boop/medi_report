import React from 'react';

export default function SortIcon({ className = "w-[16px] h-[18px] text-[#212529]" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="5 10 12 3 19 10"></polyline>
      <polyline points="5 14 12 21 19 14"></polyline>
    </svg>
  );
}
