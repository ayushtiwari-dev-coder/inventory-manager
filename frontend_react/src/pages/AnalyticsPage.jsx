// LOCATION: frontend_react\src\pages\AnalyticsPage.jsx

import React, { useState } from 'react';
import { useSalesTrend, useTopProfitable, useLeastSold } from '../queries/analyticsQueries';

export default function AnalyticsPage() {
  // TIMELINE TIMEFRAME HORIZON SWITCHER: 3, 6, 12, or 24 months
  const [graphMonths, setGraphMonths] = useState(3);

  // --- TANSTACK QUERY HOOK INTEGRATIONS ---
  const { data: activeTrend, isLoading: trendLoading } = useSalesTrend(graphMonths);
  const { data: topProducts = [], isLoading: topLoading } = useTopProfitable();
  const { data: leastProducts = [], isLoading: leastLoading } = useLeastSold();

  // Chronological timeline coordinate extractions
  const trendDatesArray = [...(activeTrend?.dates || [])].reverse();
  const trendRevenueArray = [...(activeTrend?.revenue || [])].reverse();
  const trendProfitArray = [...(activeTrend?.profit || [])].reverse();

  // SVG Native Chart Rendering Config Layout Dimensions
  const width = 600;
  const height = 220;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Aggregate ceilings calculation for plotting vectors accurately
  const maxVal = Math.max(...trendRevenueArray, ...trendProfitArray, 1) * 1.2;

  const getSvgCoordinates = (dataArray) => {
    if (!dataArray || dataArray.length === 0) return "";
    return dataArray.map((val, i) => {
      const x = padding + (i / (dataArray.length - 1 || 1)) * chartWidth;
      const y = height - padding - (val / maxVal) * chartHeight;
      return `${x},${y}`;
    }).join(" ");
  };

  const revenuePoints = getSvgCoordinates(trendRevenueArray);
  const profitPoints = getSvgCoordinates(trendProfitArray);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 lg:p-6 space-y-6 text-gray-100">
      
      {/* TIMELINE TIMEFRAME HORIZON SWITCHER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1C2541]/40 border border-[#3A506B]/20 p-4 rounded-xl shadow-lg">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">Historical Chart Horizon</h3>
          <p className="text-xs text-gray-400">Toggle rolling matrix filters to re-index database records natively.</p>
        </div>

        <div className="flex bg-[#0B132B] p-1 rounded-lg border border-[#3A506B]/40">
          {[
            { label: '3 Months', value: 3 },
            { label: '6 Months', value: 6 },
            { label: '1 Year', value: 12 },
            { label: '2 Years', value: 24 }
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setGraphMonths(opt.value)}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                graphMonths === opt.value ? 'bg-[#00B4D8] text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG LINE CHART CANVAS */}
      <div className="bg-[#1C2541] border border-[#3A506B]/30 rounded-xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-[#3A506B]/20">
          <h3 className="text-sm font-bold text-[#48CAE4] uppercase tracking-wider">Financial Revenue & Profit Trend Analysis</h3>
          <div className="flex gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#00B4D8] inline-block" />
              <span className="text-gray-400">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 inline-block" />
              <span className="text-gray-400">Net Profit</span>
            </div>
          </div>
        </div>

        {trendLoading ? (
          <div className="h-64 flex items-center justify-center italic text-gray-400 animate-pulse">Compiling historical timeline arrays...</div>
        ) : trendDatesArray.length === 0 ? (
          <div className="h-64 flex items-center justify-center italic text-gray-500">No transactional ledger records found inside this company scope.</div>
        ) : (
          <div className="w-full space-y-2">
            <div className="w-full bg-[#0B132B]/30 p-2 rounded-xl border border-[#3A506B]/10">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#3A506B" strokeWidth="0.5" strokeDasharray="4" opacity="0.2" />
                <line x1={padding} y1={padding + chartHeight / 2} x2={width - padding} y2={padding + chartHeight / 2} stroke="#3A506B" strokeWidth="0.5" strokeDasharray="4" opacity="0.2" />
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#3A506B" strokeWidth="1" opacity="0.5" />

                {revenuePoints && <polyline fill="none" stroke="#00B4D8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={revenuePoints} />}
                {profitPoints && <polyline fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={profitPoints} />}

                {trendDatesArray.map((_, i) => {
                  const x = padding + (i / (trendDatesArray.length - 1 || 1)) * chartWidth;
                  const revY = height - padding - (trendRevenueArray[i] / maxVal) * chartHeight;
                  const profY = height - padding - (trendProfitArray[i] / maxVal) * chartHeight;
                  return (
                    <g key={i} className="group/node cursor-pointer">
                      <circle cx={x} cy={revY} r="3.5" fill="#1C2541" stroke="#00B4D8" strokeWidth="2" />
                      <circle cx={x} cy={profY} r="3.5" fill="#1C2541" stroke="#10B981" strokeWidth="2" />
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="flex justify-between px-6 text-[10px] text-gray-500 font-mono pt-2">
              {trendDatesArray.map((date, idx) => (
                <span key={idx} className="min-w-45px text-center transform -rotate-12">{date.substring(5)}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TWO-COLUMN RANKING LEADERBOARD TABLES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Highest Yielding Products Widget */}
        <div className="bg-[#1C2541] border border-[#3A506B]/30 rounded-xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-[#3A506B]/30 bg-[#0B132B]/20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#48CAE4]">Highest Yielding Products</h3>
          </div>
          <div className="p-4 space-y-4 max-h-350px overflow-y-auto">
            {topLoading ? (
              <div className="text-center py-8 italic text-gray-500 animate-pulse">Syncing...</div>
            ) : topProducts.length === 0 ? (
              <div className="text-center py-8 italic text-gray-500">No logs found.</div>
            ) : (
              topProducts.map((p, index) => (
                <div key={index} className="flex flex-col gap-1 border-b border-[#3A506B]/10 pb-2 last:border-0">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-white">{p.product_name}</span>
                    <span className="text-emerald-400 font-mono font-bold">${parseFloat(p.total_profit).toFixed(2)} profit</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Rank #{index + 1}</span>
                    <span>Units Sold: {p.total_quantity}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Least Sold Inventory Items Widget */}
        <div className="bg-[#1C2541] border border-[#3A506B]/30 rounded-xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-[#3A506B]/30 bg-[#0B132B]/20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400">Least Sold Inventory Items</h3>
          </div>
          <div className="p-4 space-y-4 max-h-350px overflow-y-auto">
            {leastLoading ? (
              <div className="text-center py-8 italic text-gray-500 animate-pulse">Syncing...</div>
            ) : leastProducts.length === 0 ? (
              <div className="text-center py-8 italic text-gray-500">No logs found.</div>
            ) : (
              leastProducts.map((p, index) => (
                <div key={index} className="flex flex-col gap-1 border-b border-[#3A506B]/10 pb-2 last:border-0">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-white">{p.product_name}</span>
                    <span className="text-gray-400 font-mono">{parseInt(p.total_quantity, 10)} units moved</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>Low Velocity Log</span>
                    <span className="text-rose-400 font-mono">Yielded: ${parseFloat(p.total_profit).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}