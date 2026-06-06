import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

export default function MobileBottomBar() {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mobileLinkStyle = ({ isActive }) =>
    `flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold tracking-wide transition-colors ${
      isActive ? 'text-[#48CAE4]' : 'text-gray-400 hover:text-white'
    }`;

  return (
    <div className="md:hidden w-full bg-[#1C2541]/95 border-t border-[#3A506B]/40 pb-2 pt-1 flex justify-around items-end fixed bottom-0 left-0 right-0 z-50 backdrop-blur-lg">
      <NavLink to="/products" className={mobileLinkStyle} onClick={() => setIsMoreOpen(false)}>
        <span className="text-lg mb-0.5">📦</span> Catalog
      </NavLink>
      
      <NavLink to="/sales" className={mobileLinkStyle} onClick={() => setIsMoreOpen(false)}>
        <span className="text-lg mb-0.5">💰</span> Sales
      </NavLink>
      
      <NavLink to="/analytics" className={mobileLinkStyle} onClick={() => setIsMoreOpen(false)}>
        <span className="text-lg mb-0.5">📊</span> Analytics
      </NavLink>

      <NavLink to="/employees" className={mobileLinkStyle} onClick={() => setIsMoreOpen(false)}>
        <span className="text-lg mb-0.5">👥</span> Team
      </NavLink>

      <div className="flex-1 relative flex justify-center">
        <button 
          onClick={() => setIsMoreOpen(!isMoreOpen)} 
          className={`flex flex-col items-center justify-center w-full py-1 text-[10px] font-bold tracking-wide transition-colors ${isMoreOpen ? 'text-[#48CAE4]' : 'text-gray-400 hover:text-white'}`}
        >
          <span className="text-lg mb-0.5">⚙️</span> More
        </button>

        {isMoreOpen && (
          <>
            <div className="fixed inset-0 z-40 bottom-16" onClick={() => setIsMoreOpen(false)} />
            <div className="absolute bottom-[110%] right-2 mb-2 bg-[#1C2541] border border-[#3A506B]/80 rounded-xl shadow-2xl flex flex-col w-44 overflow-hidden z-50 animate-fade-in-up">
              <NavLink 
                to="/logs" 
                onClick={() => setIsMoreOpen(false)} 
                className={({ isActive }) => `px-4 py-3 border-b border-[#3A506B]/40 text-sm font-bold transition-colors ${isActive ? 'bg-[#00B4D8]/20 text-[#48CAE4]' : 'text-white hover:bg-[#253154]'}`}
              >
                📋 Audit Logs
              </NavLink>
              <NavLink 
                to="/profile" 
                onClick={() => setIsMoreOpen(false)} 
                className={({ isActive }) => `px-4 py-3 text-sm font-bold transition-colors ${isActive ? 'bg-[#00B4D8]/20 text-[#48CAE4]' : 'text-white hover:bg-[#253154]'}`}
              >
                🏢 Org Profile
              </NavLink>
            </div>
          </>
        )}
      </div>
    </div>
  );
}