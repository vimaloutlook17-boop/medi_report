import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function NavigationTabs({ activeTabLabel }) {
  const location = useLocation();
  
  const tabs = [
    { label: 'Stocks', path: '/stocks/product-summary' },
    { label: 'Products Summary', path: '/stocks/product-summary' },
    { label: 'Low Demand Stock', path: '#' },
    { label: 'Zero Stocks', path: '/stocks/zero-stocks' },
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
  ];

  return (
    <div className="mb-[20px]">
      <ul className="nav nav-tabs flex flex-wrap m-0 p-0 list-none text-[12.96px] text-[#212529] font-sans border-b border-[#ddd]">
        {tabs.map((tab, i) => {
          // Check if active based on label explicitly passed, or path
          const isActive = activeTabLabel === tab.label || (activeTabLabel === undefined && location.pathname === tab.path && tab.path !== '#');
          return (
            <li key={i} className="nav-item mr-[2px] mb-[-1px]">
              {isActive ? (
                <span className="nav-link active inline-block px-[14.4px] py-[7.2px] text-[#555] bg-white border border-[#ddd] border-b-transparent rounded-t-[4px] cursor-default relative z-10">
                  {tab.label}
                </span>
              ) : (
                <Link 
                  to={tab.path} 
                  className="nav-link inline-block px-[14.4px] py-[7.2px] border border-transparent rounded-t-[4px] text-[#007BFF] hover:bg-transparent hover:text-[#212529] hover:border-[#ddd] relative hover:z-10 transition-colors"
                >
                  {tab.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
