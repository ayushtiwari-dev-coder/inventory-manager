// LOCATION: frontend_react\src\pages\LogsPage.jsx

import React from 'react';
import { useLogsQuery } from '../queries/useLogsQuery';

const getActionColor = (actionType) => {
  switch (actionType) {
    case 'DELETE_PRODUCT':
    case 'DELETE_ORGANIZATION':
    case 'REMOVE_MEMBER':
      return 'bg-rose-900/40 text-rose-400 border border-rose-700/30';
    case 'RECORD_SALE':
      return 'bg-[#00B4D8]/10 text-[#48CAE4] border border-[#00B4D8]/30';
    case 'ADD_PRODUCT':
    case 'CREATE_ORGANIZATION':
    case 'JOIN_ORGANIZATION':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    case 'UPDATE_PRODUCT':
    case 'CHANGE_MEMBER_ROLE':
      return 'bg-[#F6AE2D]/10 text-[#F6AE2D] border border-[#F6AE2D]/30';
    default:
      return 'bg-gray-800 text-gray-400 border border-gray-700/40';
  }
};

const formatKey = (key) => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// Smart formatter that handles strings, arrays of items, and nested objects
const FormatDetails = ({ details }) => {
  try {
    const parsed = typeof details === 'string' ? JSON.parse(details) : details;

    // Fallback if it's just a raw primitive
    if (typeof parsed !== 'object' || parsed === null) {
      return <span className="text-gray-300">{String(parsed)}</span>;
    }

    return (
      <div className="flex flex-col gap-3">
        {Object.entries(parsed).map(([key, value]) => {
          const cleanKey = formatKey(key);

          return (
            <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 text-xs">
              <span className="text-gray-400 font-semibold min-w-110px pt-0.5">
                {cleanKey}:
              </span>
              
              <div className="flex-1">
                {/* 1. Handle Arrays (Like 'items' in a Sale) */}
                {Array.isArray(value) ? (
                  <div className="flex flex-col gap-1.5 mt-1 sm:mt-0">
                    {value.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="bg-[#1C2541]/60 p-2 rounded-md border border-[#3A506B]/40 text-[11px] flex flex-wrap gap-x-4 gap-y-1"
                      >
                        {typeof item === 'object' && item !== null ? (
                          Object.entries(item).map(([k, v]) => (
                            <span key={k} className="whitespace-nowrap">
                              <span className="text-gray-500">{formatKey(k)}:</span>{' '}
                              <span className="text-gray-200">{String(v)}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-200">{String(item)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) 
                
                
                : typeof value === 'object' && value !== null ? (
                  <pre className="text-gray-300 text-[10px] bg-[#1C2541]/40 p-2 rounded-md border border-[#3A506B]/30 whitespace-pre-wrap">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ) 
                
                
                : (
                  <span className="text-white wrap-break-word font-medium pt-0.5 inline-block">
                    {String(value)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  } catch {
    // Ultimate fallback if parsing completely fails
    return <span className="text-gray-300">{details}</span>;
  }
};

export default function LogsPage() {
  const { data: logs = [], isLoading, error } = useLogsQuery(100);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 lg:p-6 space-y-6 text-gray-100">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1C2541]/40 border border-[#3A506B]/20 p-4 rounded-xl shadow-lg">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide">Organization Audit Logs</h2>
          <p className="text-xs text-gray-400 mt-1">Real-time transaction history and system tracking ledger.</p>
        </div>
      </div>

      {/* TABLE DATA SECTION */}
      <div className="bg-[#1C2541] border border-[#3A506B]/30 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B132B]/60 text-[#48CAE4] text-xs font-bold uppercase tracking-wider border-b border-[#3A506B]/30">
                <th className="p-4 w-48">Timestamp</th>
                <th className="p-4 w-48">Action Type</th>
                <th className="p-4 w-48">Initiated By</th>
                <th className="p-4">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3A506B]/20 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-400 italic animate-pulse">
                    Retrieving operational logs...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-rose-400 italic">
                    System error pulling logs: {error.message}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500 italic">
                    No logged operations found in this organization.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#253154]/40 transition-colors">
                    <td className="p-4 font-mono text-xs text-gray-400 align-top">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 align-top">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold inline-block tracking-wider ${getActionColor(log.action_type)}`}>
                        {log.action_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-white align-top">
                      @{log.username}
                    </td>
                    <td className="p-4">
                      <div className="bg-[#0B132B]/50 p-4 rounded-lg border border-[#3A506B]/30">
                        <FormatDetails details={log.details} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}