import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 bg-[#1C2541] border-r border-[#3A506B]/20 flex-col p-4 space-y-2 shrink-0">
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">
        Navigation Menu
      </div>
      <NavLink
        to="/products"
        className={({ isActive }) =>
          `flex items-center px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 ${
            isActive ? 'bg-[#00B4D8] text-white shadow-lg shadow-[#00B4D8]/20' : 'text-gray-400 hover:bg-[#0B132B]/50 hover:text-white'
          }`
        }
      >
        <span className="mr-3">📦</span> Inventory Catalog
      </NavLink>
      <NavLink
        to="/sales"
        className={({ isActive }) =>
          `flex items-center px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 ${
            isActive ? 'bg-[#00B4D8] text-white shadow-lg shadow-[#00B4D8]/20' : 'text-gray-400 hover:bg-[#0B132B]/50 hover:text-white'
          }`
        }
      >
        <span className="mr-3">💰</span> Sales Metrics
      </NavLink>
      <NavLink
        to="/analytics"
        className={({ isActive }) =>
          `flex items-center px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 ${
            isActive ? 'bg-[#00B4D8] text-white shadow-lg shadow-[#00B4D8]/20' : 'text-gray-400 hover:bg-[#0B132B]/50 hover:text-white'
          }`
        }
      >
        <span className="mr-3">📊</span> Advanced Analytics
      </NavLink>
      <NavLink
        to="/employees"
        className={({ isActive }) =>
          `flex items-center px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 ${
            isActive ? 'bg-[#00B4D8] text-white shadow-lg shadow-[#00B4D8]/20' : 'text-gray-400 hover:bg-[#0B132B]/50 hover:text-white'
          }`
        }
      >
        <span className="mr-3">👥</span> Employees
      </NavLink>
      <NavLink
        to="/logs"
        className={({ isActive }) =>
          `flex items-center px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 ${
            isActive ? 'bg-[#00B4D8] text-white shadow-lg shadow-[#00B4D8]/20' : 'text-gray-400 hover:bg-[#0B132B]/50 hover:text-white'
          }`
        }
      >
        <span className="mr-3">📋</span> Audit Logs
      </NavLink>
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `flex items-center px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 ${
            isActive ? 'bg-[#00B4D8] text-white shadow-lg shadow-[#00B4D8]/20' : 'text-gray-400 hover:bg-[#0B132B]/50 hover:text-white'
          }`
        }
      >
        <span className="mr-3">🏢</span> Organization Profile
      </NavLink>
    </aside>
  );
}