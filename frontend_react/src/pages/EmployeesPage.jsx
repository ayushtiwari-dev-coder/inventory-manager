// LOCATION: frontend_react/src/pages/EmployeesPage.jsx

import React, { useState } from 'react';
import { useEmployees, useEmployeeMutations } from '../queries/employeeQueries';
import { useToast } from '../context/ToastContext';

export default function EmployeesPage() {
  const { data: employees = [], isLoading, error } = useEmployees();
  const { removeMember, isRemoving } = useEmployeeMutations();
  const showToast = useToast();
  
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  
  // Fetch current user ID to prevent self-deletion
  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
  const currentUserId = userInfo.user_id;

  const handleRemove = async (userId) => {
    try {
      await removeMember(userId);
      showToast('Employee successfully removed from workspace.', 'success');
      setConfirmDeleteId(null);
    } catch (err) {
      showToast(err.message || 'Failed to remove employee.', 'error');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 lg:p-6 space-y-6 text-gray-100">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1C2541]/40 border border-[#3A506B]/20 p-4 rounded-xl shadow-lg">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide">Workspace Employees</h2>
          <p className="text-xs text-gray-400 mt-1">Manage personnel, view roles, and remove members.</p>
        </div>
      </div>

      {/* TABLE DATA SECTION */}
      <div className="bg-[#1C2541] border border-[#3A506B]/30 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B132B]/60 text-[#48CAE4] text-xs font-bold uppercase tracking-wider border-b border-[#3A506B]/30">
                <th className="p-4 w-16">ID</th>
                <th className="p-4">Personnel</th>
                <th className="p-4">Role</th>
                <th className="p-4">Email</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3A506B]/20 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400 italic animate-pulse">
                    Fetching workspace roster...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-rose-400 italic">
                    {error.message}
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 italic">
                    No active employees found.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const isSelf = emp.user_id === currentUserId;
                  const isConfirming = confirmDeleteId === emp.user_id;

                  return (
                    <tr key={emp.user_id} className="hover:bg-[#253154]/40 transition-colors">
                      <td className="p-4 font-mono text-xs text-gray-400">
                        #{emp.user_id}
                      </td>
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
                      <td className="p-4 text-gray-300 text-xs">
                        {emp.user_gmail || 'Not provided'}
                      </td>
                      <td className="p-4 text-right">
                        {isSelf ? (
                          <span className="text-xs text-gray-500 italic mr-2">It's you</span>
                        ) : isConfirming ? (
                           <div className="flex justify-end items-center gap-2">
                             <span className="text-xs text-rose-400 font-medium mr-1">Remove?</span>
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
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}