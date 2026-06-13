import React from 'react';

export default function AboutPage() {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 lg:p-6 space-y-6 text-gray-100">
      
      {/* Header */}
      <div className="bg-[#1C2541]/40 border border-[#3A506B]/20 p-6 rounded-xl shadow-lg text-center">
        <h2 className="text-2xl font-black text-white tracking-wide mb-2">About InvenTrack</h2>
        <p className="text-sm text-gray-400">A 2.5-month journey from a simple terminal script to a full SaaS platform.</p>
      </div>

      {/* The Journey (Timeline Points) */}
      <div className="space-y-4">
        
        <div className="bg-[#1C2541] border border-[#3A506B]/30 p-5 rounded-xl shadow-md">
          <h3 className="text-lg font-bold text-[#48CAE4] mb-1">💻 Version 0: The CLI Beginnings</h3>
          <p className="text-sm text-gray-300">It all started entirely as a Command Line Interface (CLI). No graphical interface, just pure terminal logic to track basic inventory.</p>
        </div>
        
        <div className="bg-[#1C2541] border border-[#3A506B]/30 p-5 rounded-xl shadow-md">
          <h3 className="text-lg font-bold text-[#48CAE4] mb-1">🖥️ Version 1: The First Interface</h3>
          <p className="text-sm text-gray-300">Moved to a visual user interface for a single user and a single inventory. Sales were strictly processed one item at a time.</p>
        </div>

        <div className="bg-[#1C2541] border border-[#3A506B]/30 p-5 rounded-xl shadow-md">
          <h3 className="text-lg font-bold text-[#48CAE4] mb-1">🛒 Version 2: The Cart Evolution</h3>
          <p className="text-sm text-gray-300">Introduced a fully functional Point-of-Sale (POS) cart system. This allowed multiple different products to be queued and checked out simultaneously.</p>
        </div>

        <div className="bg-[#1C2541] border border-[#3A506B]/30 p-5 rounded-xl shadow-md">
          <h3 className="text-lg font-bold text-[#48CAE4] mb-1">🚀 Version 3: The SaaS Era (Current)</h3>
          <p className="text-sm text-gray-300">Transformed the architecture into a full Multi-Tenant application. Features now include isolated organization hubs, hierarchy-based role access, and real-time analytics.</p>
        </div>

        <div className="bg-[#1C2541] border border-[#3A506B]/30 p-5 rounded-xl shadow-md">
          <h3 className="text-lg font-bold text-[#48CAE4] mb-1">🔓 Open Source & Free</h3>
          <p className="text-sm text-gray-300">This entire project is public and open-source on GitHub. The code is completely free to be viewed, used, learned from, and modified by anyone.</p>
        </div>

      </div>

      {/* Developer / Contact Section */}
      <div className="bg-[#1C2541]/80 border border-[#3A506B]/50 p-6 rounded-xl shadow-lg text-center mt-8">
        <h3 className="text-xl font-bold text-white mb-1">Developed and Managed by Ayush Tiwari</h3>
        <p className="text-xs text-gray-400 mb-6">Let's connect! Feel free to reach out via email or check out my code.</p>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <a 
            href="https://github.com/ayushtiwari-dev-coder" 
            target="_blank" 
            rel="noreferrer" 
            className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors border border-gray-600 w-full sm:w-auto shadow-md"
          >
            <span>🐙</span> GitHub Profile
          </a>
          <a 
            href="mailto:ayushtiwari24512@gmail.com" 
            className="flex items-center justify-center gap-2 bg-[#00B4D8] hover:bg-[#0096B1] text-white px-6 py-2.5 rounded-lg font-medium transition-colors w-full sm:w-auto shadow-md"
          >
            <span>📧</span> Email Me
          </a>
        </div>
      </div>

    </div>
  );
}