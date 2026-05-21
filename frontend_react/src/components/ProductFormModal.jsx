import React from 'react';

export default function ProductFormModal({ 
  isOpen, 
  mode, 
  formFields, 
  setFormFields, 
  validationError, 
  onClose, 
  onSubmit, 
  loading 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1C2541] border border-[#3A506B]/50 rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-[#3A506B]/30 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">
            {mode === 'add' ? 'Register New Inventory Item' : 'Modify Existing Product Spec'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer text-xl">&times;</button>
        </div>
        
        {/* Form Body */}
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {validationError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-lg font-medium">
              {validationError}
            </div>
          )}

          {/* Product Name Field */}
          <div>
            <label className="block text-xs font-bold text-[#48CAE4] uppercase tracking-wider mb-1.5">Product Identification Name</label>
            <input
              type="text"
              disabled={mode === 'edit'}
              value={formFields.name}
              onChange={(e) => setFormFields(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Logitech MX Master 3S"
              className="w-full bg-[#0B132B] border border-[#3A506B]/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00B4D8] disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Pricing Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">Cost Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={formFields.costPrice}
                onChange={(e) => setFormFields(prev => ({ ...prev, costPrice: e.target.value }))}
                placeholder="0.00"
                className="w-full bg-[#0B132B] border border-[#3A506B]/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00B4D8]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">Selling Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={formFields.sellingPrice}
                onChange={(e) => setFormFields(prev => ({ ...prev, sellingPrice: e.target.value }))}
                placeholder="0.00"
                className="w-full bg-[#0B132B] border border-[#3A506B]/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00B4D8]"
              />
            </div>
          </div>

          {/* Stock Allocation Field */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              {mode === 'add' ? 'Initial Stock Level Allocation' : 'Stock Correction Offset (+ / -)'}
            </label>
            <input
              type="number"
              value={formFields.stock}
              onChange={(e) => setFormFields(prev => ({ ...prev, stock: e.target.value }))}
              placeholder={mode === 'add' ? '0' : 'e.g. 25 or -10'}
              className="w-full bg-[#0B132B] border border-[#3A506B]/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00B4D8]"
            />
            {mode === 'edit' && (
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                Entering <span className="text-emerald-400 font-bold">20</span> increases stock. Entering <span className="text-rose-400 font-bold">-5</span> decreases stock.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#3A506B]/30 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs border border-[#3A506B]/60 text-gray-300 rounded-lg font-medium cursor-pointer hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs bg-[#00B4D8] text-white rounded-lg font-medium cursor-pointer hover:bg-[#0096B1] disabled:opacity-50"
            >
              {loading ? 'Processing...' : mode === 'add' ? 'Commit Product' : 'Apply Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}