import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0B132B] flex flex-col">
      <header className="bg-[#1C2541] border-b border-[#3A506B]/30 px-6 py-4 flex justify-between items-center">
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

      <main className="flex-1 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}