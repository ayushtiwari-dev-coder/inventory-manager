// LOCATION: frontend_react\src\pages\SalesPage.jsx

import React, { useState } from 'react';
import { useRecentSales, useRevenueSummary } from '../queries/salesQueries';

export default function SalesPage() {
  // Timeframe switch status state: daily, weekly, monthly, 3monthly
  const [timeframe, setTimeframe] = useState('daily');

  // --- TANSTACK QUERY HOOK INTEGRATIONS ---
  const { data: recentSales = [], isLoading: salesLoading } = useRecentSales();
  const { data: currentSummary = { total_transactions: 0, total_revenue: 0, total_profit: 0 }, isLoading: summaryLoading } = useRevenueSummary(timeframe);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 lg:p-6 space-y-6 text-gray-100">

      {/* TIMEFRAME SWITCHER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1C2541]/40 border border-[#3A506B]/20 p-4 rounded-xl shadow-lg">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">Reporting Stream Scope</h3>
          <p className="text-xs text-gray-400">Toggle timeframe scopes dynamically to adjust database aggregates.</p>
        </div>

        <div className="flex bg-[#0B132B] p-1 rounded-lg border border-[#3A506B]/40">
          {[
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' },
            { label: '3 Months', value: '3monthly' }
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTimeframe(opt.value)}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${timeframe === opt.value
                  ? 'bg-[#00B4D8] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* METRIC CARD BOXES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Revenue Box */}
        <div className="bg-[#1C2541] border border-[#3A506B]/30 p-6 rounded-xl shadow-xl flex flex-col justify-between min-h-140px">
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Revenue</div>
            <div className="text-4xl font-black text-[#48CAE4] mt-2">
              ${parseFloat(currentSummary.total_revenue || 0).toFixed(2)}
            </div>
          </div>
          <div className="text-xs text-gray-500 border-t border-[#3A506B]/20 pt-2 mt-4">
            {summaryLoading ? 'Syncing...' : `${currentSummary.total_transactions || 0} invoice checkout transactions tracked`}
          </div>
        </div>

        {/* Total Profit Box */}
        <div className="bg-[#1C2541] border border-[#3A506B]/30 p-6 rounded-xl shadow-xl flex flex-col justify-between min-h-140px">
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Profit</div>
            <div className="text-4xl font-black text-emerald-400 mt-2">
              ${parseFloat(currentSummary.total_profit || 0).toFixed(2)}
            </div>
          </div>
          <div className="text-xs text-gray-500 border-t border-[#3A506B]/20 pt-2 mt-4">
            Net:net operation yields across the chosen timeline processing index.
          </div>
        </div>
      </div>

      {/* HISTORICAL ACTIVITY STREAM TABLE */}
      <div className="bg-[#1C2541] border border-[#3A506B]/30 rounded-xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[#3A506B]/30 bg-[#0B132B]/20">
          <h3 className="text-base font-bold text-white tracking-wide">Recent Checkout History</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#0B132B]/60 text-[#48CAE4] text-xs font-bold uppercase tracking-wider border-b border-[#3A506B]/30">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Product Spec Line</th>
                <th className="p-4 text-center w-32">Volume Counts</th>
                <th className="p-4 text-right w-44">Line Revenue</th>
                <th className="p-4 text-right w-40">Handler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3A506B]/20 font-sans">
              {salesLoading && recentSales.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 italic animate-pulse">
                    Streaming pipeline registers...
                  </td>
                </tr>
              ) : recentSales.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 italic">
                    No matching checkout records found inside this company workspace.
                  </td>
                </tr>
              ) : (
                recentSales.map((sale, idx) => (
                  <tr key={idx} className="hover:bg-[#253154]/40 transition-colors">
                    <td className="p-4 font-mono text-xs text-gray-400">
                      {new Date(sale.sale_time.replace(' ', 'T') + 'Z').toLocaleString()}
                    </td>
                    <td className="p-4 font-medium text-white">
                      {sale.product_name}
                    </td>
                    <td className="p-4 text-center font-bold">
                      <span className="bg-[#3A506B]/30 text-gray-200 px-2.5 py-1 rounded-md text-xs font-bold">
                        {sale.quantity} units
                      </span>
                    </td>
                    <td className="p-4 text-right text-[#48CAE4] font-mono font-bold">
                      ${parseFloat(sale.item_sale).toFixed(2)}
                    </td>
                    <td className="p-4 text-right font-mono text-xs text-gray-400">
                      @{sale.sold_by}
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