import React from 'react';

export default function Loader() {
  return (
    <div className="flex justify-center items-center w-full h-full">
      <style>{`
        .lds-spinner {
          display: inline-block;
          position: relative;
          width: 50px;
          height: 50px;
        }
        .lds-spinner div {
          transform-origin: 25px 25px;
          animation: lds-spinner 1s linear infinite;
        }
        .lds-spinner div:after {
          content: " ";
          display: block;
          position: absolute;
          top: 4px;
          left: 21px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #325a9b; /* Matching the deep blue from the screenshot */
        }
        .lds-spinner div:nth-child(1) { transform: rotate(0deg); animation-delay: -0.875s; }
        .lds-spinner div:nth-child(2) { transform: rotate(45deg); animation-delay: -0.75s; }
        .lds-spinner div:nth-child(3) { transform: rotate(90deg); animation-delay: -0.625s; }
        .lds-spinner div:nth-child(4) { transform: rotate(135deg); animation-delay: -0.5s; }
        .lds-spinner div:nth-child(5) { transform: rotate(180deg); animation-delay: -0.375s; }
        .lds-spinner div:nth-child(6) { transform: rotate(225deg); animation-delay: -0.25s; }
        .lds-spinner div:nth-child(7) { transform: rotate(270deg); animation-delay: -0.125s; }
        .lds-spinner div:nth-child(8) { transform: rotate(315deg); animation-delay: 0s; }
        
        @keyframes lds-spinner {
          0% { opacity: 1; }
          100% { opacity: 0.15; }
        }
      `}</style>
      <div className="lds-spinner">
        <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
      </div>
    </div>
  );
}
