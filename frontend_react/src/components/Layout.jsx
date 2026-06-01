import React from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('org_token');
    navigate('/workspaces');
  };

  return (
    <div className="min-h-screen bg-[#0B132B] flex flex-col">
      {/* GLOBAL TOP HEADER PANEL */}
      <header className="bg-[#1C2541] border-b border-[#3A506B]/30 px-6 py-4 flex justify-between items-center z-10">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-[#48CAE4] tracking-wide">Enterprise Operations Hub</h1>
          <p className="text-[10px] text-gray-400">User: {userInfo.name || 'Operator'}</p>
        </div>

        <button
          onClick={handleLogout}
          className="bg-[#3A506B]/50 hover:bg-rose-500/20 text-gray-300 hover:text-rose-400 px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
        >
          Log Out
        </button>
      </header>

      {/* CORE FRAME LAYOUT SECTION (SIDEBAR + MAIN CONTENT LAYER) */}
      <div className="flex flex-1">

        {/* LEFT-SIDE NAVIGATION SIDEBAR PANEL */}
        <aside className="w-64 bg-[#1C2541] border-r border-[#3A506B]/20 flex flex-col p-4 space-y-2  md:flex shrink-0">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">
            Navigation Menu
          </div>

          {/* Inventory Catalog Tab Link */}
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 ${isActive
                ? 'bg-[#00B4D8] text-white shadow-lg shadow-[#00B4D8]/20'
                : 'text-gray-400 hover:bg-[#0B132B]/50 hover:text-white'
              }`
            }
          >
            <span className="mr-3">📦</span> Inventory Catalog
          </NavLink>

          {/* Sales Metrics & Analytics Tab Link */}
          <NavLink
            to="/sales"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 ${isActive
                ? 'bg-[#00B4D8] text-white shadow-lg shadow-[#00B4D8]/20'
                : 'text-gray-400 hover:bg-[#0B132B]/50 hover:text-white'
              }`
            }
          >
            <span className="mr-3">📊</span> Sales Metrics
          </NavLink>
          
          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 ${isActive
                ? 'bg-[#00B4D8] text-white shadow-lg shadow-[#00B4D8]/20'
                : 'text-gray-400 hover:bg-[#0B132B]/50 hover:text-white'
              }`
            }
          >
            <span className="mr-3">📊</span> Advanced Analytics
          </NavLink>
          {/* Inside frontend_react\src\components\Layout.jsx under the Sidebar navigation links block */}

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 ${isActive
                ? 'bg-[#00B4D8] text-white shadow-lg shadow-[#00B4D8]/20'
                : 'text-gray-400 hover:bg-[#0B132B]/50 hover:text-white'
              }`
            }
          >
            <span className="mr-3">👤</span> Organization Profile
          </NavLink>

        </aside>

        {/* MOBILE RESPONSIVE TOP BAR MENUS FOR COMPACT INTERFACES */}
        <div className="md:hidden w-full bg-[#1C2541]/60 border-b border-[#3A506B]/20 p-2 flex justify-around items-center fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md">
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `flex-1 text-center py-2 text-xs font-bold tracking-wide transition-colors ${isActive ? 'text-[#48CAE4]' : 'text-gray-400'
              }`
            }
          >
            📦 Catalog
          </NavLink>
          <NavLink
            to="/sales"
            className={({ isActive }) =>
              `flex-1 text-center py-2 text-xs font-bold tracking-wide transition-colors ${isActive ? 'text-[#48CAE4]' : 'text-gray-400'
              }`
            }
          >
            📊 Sales
          </NavLink>
            // Inside Mobile Compact Interface bottom toolbar [39, 40]:
          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `flex-1 text-center py-2 text-xs font-bold tracking-wide transition-colors ${isActive ? 'text-[#48CAE4]' : 'text-gray-400'}`}
          >
            📊 Analytics
          </NavLink>
        </div>

        {/* MAIN VIEWPORT FRAME CONTENT CONTAINER */}
        <main className="flex-1 p-4 md:p-6 mb-16 md:mb-0 overflow-y-auto">
          <Outlet />
        </main>

      </div>
    </div>
  );
}