// LOCATION: frontend_react/src/components/WorkspacePicker.jsx

import React from 'react';

export default function WorkspacePicker({ 
  userInfo, 
  workspaces, 
  switchingContext, 
  onSelectWorkspace, 
  onActionClick, 
  onGlobalLogout 
}) {
  return (
    <div className="flex flex-col">
      {/* WELCOME BANNER HEADER SEGMENT */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-white tracking-wide">
          Welcome, {userInfo.name || 'User'}!
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          {workspaces.length === 0 
            ? "You aren't linked to any workspaces yet." 
            : "Select an organization hub to continue to your canvas."}
        </p>
      </div>

      {/* DYNAMIC CARD PROFILE STREAM VIEW */}
      <div className="space-y-3 max-h-240px overflow-y-auto pr-1 mb-6 scrollbar-thin">
        {workspaces.length === 0 ? (
          <div className="text-center p-6 bg-[#0B132B]/40 rounded-xl border border-dashed border-[#3A506B]/40 text-sm text-gray-400 italic">
            No active organization linkages found. Launch one below to start logs.
          </div>
        ) : (
          workspaces.map((org) => (
            <button
              key={org.org_id}
              disabled={switchingContext}
              onClick={() => onSelectWorkspace(org.org_id)}
              className="w-full flex justify-between items-center bg-[#0B132B] hover:bg-[#0B132B]/70 border border-[#3A506B]/40 hover:border-[#00B4D8] px-5 py-4 rounded-xl text-left transition-all group cursor-pointer disabled:opacity-50"
            >
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white group-hover:text-[#48CAE4] transition-colors">
                  {org.org_name}
                </span>
                <span className="text-[10px] font-mono text-gray-400 uppercase mt-0.5 tracking-wider">
                  Role: {org.role}
                </span>
              </div>
              <div className="text-[#00B4D8] opacity-0 group-hover:opacity-100 transition-opacity text-sm font-bold">
                Open &rarr;
              </div>
            </button>
          ))
        )}
      </div>

      {/* LOWER OPERATIONAL INVITE/CREATE TOOLBAR FOOTER CONTROLS */}
      <div className="pt-4 border-t border-[#3A506B]/20 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onActionClick('create')}
            className="bg-[#00B4D8] hover:bg-[#0077B6] text-white py-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer shadow-lg"
          >
            Create New Org
          </button>
          <button
            onClick={() => onActionClick('join')}
            className="bg-transparent border border-[#3A506B] text-gray-200 hover:bg-[#3A506B]/30 py-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
          >
            Join with Code
          </button>
        </div>

        <button
          onClick={onGlobalLogout}
          className="w-full text-center text-xs text-gray-500 hover:text-rose-400 font-medium pt-2 transition-colors cursor-pointer"
        >
          Sign Out from Account
        </button>
      </div>
    </div>
  );
}