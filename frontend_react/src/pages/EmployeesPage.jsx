// LOCATION: frontend_react/src/pages/EmployeesPage.jsx
import React, { useState } from 'react';
import { useEmployees, useBannedUsers, useEmployeeMutations } from '../queries/employeeQueries';
import { useToast } from '../context/ToastContext';

const getTimePassed = (dateString) => {
  const days = Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};

// Helper to get role
const getUserRole = () => {
  try {
    const token = localStorage.getItem('org_token');
    if (!token) return null;
    return JSON.parse(atob(token.split('.')[1])).role;
  } catch (e) {
    return null;
  }
};

export default function EmployeesPage() {
  const [viewMode, setViewMode] = useState('active'); 
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const { data: employees = [], isLoading: loadingActive, error: activeError } = useEmployees();
  const { data: bannedUsers = [], isLoading: loadingBanned, error: bannedError } = useBannedUsers();
  const { removeMember, isRemoving, unbanMember, isUnbanning } = useEmployeeMutations();
  const showToast = useToast();
  
  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
  const currentUserId = userInfo.user_id;
  const currentUserRole = getUserRole(); // 'owner' | 'manager'

  const handleRemove = async (userId) => {
    try {
      await removeMember(userId);
      showToast('Employee removed and added to Ban List.', 'success');
      setConfirmDeleteId(null);
    } catch (err) {
      showToast(err.message || 'Failed to remove employee.', 'error');
    }
  };

  const handleUnban = async (userId) => {
    try {
      await unbanMember(userId);
      showToast('User successfully unbanned! They can now rejoin.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to unban user.', 'error');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 lg:p-6 space-y-6 text-gray-100">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1C2541]/40 border border-[#3A506B]/20 p-4 rounded-xl shadow-lg">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide">Workspace Employees</h2>
          <p className="text-xs text-gray-400 mt-1">Manage personnel, view roles, and handle bans.</p>
        </div>
        <div className="bg-[#0B132B] p-1 rounded-lg border border-[#3A506B]/40 flex">
          <button 
            onClick={() => setViewMode('active')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              viewMode === 'active' ? 'bg-[#00B4D8] text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Active Roster
          </button>
          
          {/* ONLY OWNERS CAN SEE THE BANNED USERS TAB */}
          {currentUserRole === 'owner' && (
            <button 
              onClick={() => setViewMode('banned')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                viewMode === 'banned' ? 'bg-rose-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              Banned Users
            </button>
          )}
        </div>
      </div>

      <div className="bg-[#1C2541] border border-[#3A506B]/30 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B132B]/60 text-[#48CAE4] text-xs font-bold uppercase tracking-wider border-b border-[#3A506B]/30">
                <th className="p-4 w-16">ID</th>
                <th className="p-4">Personnel</th>
                {viewMode === 'active' ? (
                  <>
                    <th className="p-4">Role</th>
                    <th className="p-4">Email</th>
                  </>
                ) : (
                  <th className="p-4">Ban Details</th>
                )}
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-[#3A506B]/20 text-sm">
              
              {viewMode === 'active' && (
                loadingActive ? (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-400 italic animate-pulse">Fetching workspace roster...</td></tr>
                ) : activeError ? (
                  <tr><td colSpan="5" className="p-8 text-center text-rose-400 italic">{activeError.message}</td></tr>
                ) : employees.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-500 italic">No active employees found.</td></tr>
                ) : (
                  employees.map((emp) => {
                    const isSelf = emp.user_id === currentUserId;
                    const isConfirming = confirmDeleteId === emp.user_id;
                    
                    // A Manager CANNOT remove an Owner or another Manager
                    const canRemove = currentUserRole === 'owner' || (currentUserRole === 'manager' && emp.role === 'employee');

                    return (
                      <tr key={emp.user_id} className="hover:bg-[#253154]/40 transition-colors">
                        <td className="p-4 font-mono text-xs text-gray-400">#{emp.user_id}</td>
                        <td className="p-4">
                          <div className="font-semibold text-white">{emp.name || 'N/A'}</div>
                          <div className="text-xs text-gray-400 font-mono">@{emp.username}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            emp.role === 'owner' ? 'bg-[#F6AE2D]/10 text-[#F6AE2D] border border-[#F6AE2D]/30' :
                            emp.role === 'manager' ? 'bg-[#48CAE4]/10 text-[#48CAE4] border border-[#00B4D8]/30' :
                            'bg-gray-700/30 text-gray-300 border border-gray-600/30'
                          }`}>
                            {emp.role}
                          </span>
                        </td>
                        <td className="p-4 text-gray-300 text-xs">{emp.user_gmail || 'Not provided'}</td>
                        <td className="p-4 text-right">
                          {isSelf ? (
                            <span className="text-xs text-gray-500 italic mr-2">It's you</span>
                          ) : !canRemove ? (
                            <span className="text-xs text-gray-600 italic mr-2">Protected</span>
                          ) : isConfirming ? (
                             <div className="flex justify-end items-center gap-2">
                               <span className="text-xs text-rose-400 font-medium mr-1">Ban?</span>
                               <button
                                 onClick={() => handleRemove(emp.user_id)}
                                 disabled={isRemoving}
                                 className="bg-rose-500 hover:bg-rose-600 text-white text-xs px-2 py-1 rounded font-bold transition-colors disabled:opacity-50"
                               >
                                 Yes
                               </button>
                               <button
                                 onClick={() => setConfirmDeleteId(null)}
                                 className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-2 py-1 rounded font-bold transition-colors"
                               >
                                 No
                               </button>
                             </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(emp.user_id)}
                              className="text-gray-400 hover:text-rose-400 text-xs font-semibold transition-colors"
                            >
                              Remove & Ban
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )
              )}

              {viewMode === 'banned' && (
                loadingBanned ? (
                  <tr><td colSpan="4" className="p-8 text-center text-gray-400 italic animate-pulse">Loading banned users...</td></tr>
                ) : bannedError ? (
                  <tr><td colSpan="4" className="p-8 text-center text-rose-400 italic">Access Denied: Only Owners can view the Ban List.</td></tr>
                ) : bannedUsers.length === 0 ? (
                  <tr><td colSpan="4" className="p-8 text-center text-gray-500 italic">Ban list is currently empty.</td></tr>
                ) : (
                  bannedUsers.map((user) => (
                    <tr key={user.user_id} className="hover:bg-[#253154]/40 transition-colors">
                      <td className="p-4 font-mono text-xs text-gray-400">#{user.user_id}</td>
                      <td className="p-4">
                        <div className="font-semibold text-white">{user.name || 'N/A'}</div>
                        <div className="text-xs text-gray-400 font-mono">@{user.username}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs text-rose-400 font-medium">{user.reason}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          Banned {getTimePassed(user.banned_at)} 
                          <span className="text-gray-600 ml-1">({new Date(user.banned_at).toLocaleDateString()})</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleUnban(user.user_id)}
                          disabled={isUnbanning}
                          className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-all disabled:opacity-50"
                        >
                          Unban
                        </button>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}