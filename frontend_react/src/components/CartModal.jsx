// src/components/CartModal.jsx
import React from 'react';

export default function CartModal({ isOpen, cartItems, setCartItems, onClose, onSubmit, loading }) {
  if (!isOpen) return null;

  const handleQuantityChange = (productId, val, maxStock) => {
    const cleanQty = parseInt(val, 10);
    
    setCartItems(prev => prev.map(item => {
      if (item.product_id !== productId) return item;

      // Real-time stock constraint ceiling tracker
      if (cleanQty > maxStock) {
        return { ...item, quantity: maxStock }; // Caps quantity cleanly at maximum stock limits
      }
      
      // Keep literal string input state mapping alive for raw adjustments
      return { ...item, quantity: isNaN(cleanQty) ? '' : cleanQty };
    }));
  };

  const handleRemoveRow = (productId) => {
    setCartItems(cartItems.filter(item => item.product_id !== productId));
  };

  const handleCheckoutClick = (e) => {
    e.preventDefault();

    // STRICT BUSINESS RULE: Verify all entries are explicitly greater than 0
    const hasInvalidQty = cartItems.some(item => {
      const qty = parseInt(item.quantity, 10);
      return isNaN(qty) || qty <= 0;
    });

    if (hasInvalidQty) {
      alert("Validation Error: Sales volume allocations cannot be zero or negative! Please correct item quantities before authorizing checkout.");
      return;
    }

    onSubmit(cartItems);
  };

  const totalTransactionAmount = cartItems.reduce((sum, item) => {
    const qty = parseInt(item.quantity, 10) || 0;
    return sum + (parseFloat(item.mrp) * qty);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1C2541] border border-[#3A506B]/50 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header Container Panel Component Block */}
        <div className="p-5 border-b border-[#3A506B]/30 flex justify-between items-center bg-[#0B132B]/40">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">Checkout Register Cart</h2>
            <p className="text-xs text-gray-400">Review selected lines and input target quantities for checkout invoice processing.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer text-xl">&times;</button>
        </div>

        {/* Modal Main Body Scroll View Core Layout Table Frame */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500 italic">
              Your cart has no active lines. Close modal and select products to continue.
            </div>
          ) : (
            <div className="border border-[#3A506B]/30 rounded-lg overflow-hidden bg-[#0B132B]/30">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#0B132B]/60 text-[#48CAE4] text-xs font-bold uppercase tracking-wider border-b border-[#3A506B]/30">
                    <th className="p-3 w-16">ID</th>
                    <th className="p-3">Product Spec</th>
                    <th className="p-3 w-28 text-center">Warehouse Stock</th>
                    <th className="p-3 w-32">Stock Sold</th>
                    <th className="p-3 w-24 text-right">Line Total</th>
                    <th className="p-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3A506B]/20">
                  {cartItems.map((item) => {
                    const qtyValue = item.quantity === '' ? '' : item.quantity;
                    const lineAmount = parseFloat(item.mrp) * (parseInt(qtyValue, 10) || 0);

                    return (
                      <tr key={item.product_id} className="hover:bg-[#253154]/20 transition-colors">
                        <td className="p-3 font-mono text-xs text-gray-400">#{item.product_id}</td>
                        <td className="p-3">
                          <div className="font-semibold text-white">{item.product_name}</div>
                          <div className="text-xs text-[#48CAE4]">${parseFloat(item.mrp).toFixed(2)} per unit</div>
                        </td>
                        <td className="p-3 text-center text-gray-300 font-medium">{item.stock}</td>
                        
                        {/* INPUT BLOCK CELL WITH IN-LINE LIMIT CAP CONSTRAINT INTERCEPT SYSTEM */}
                        <td className="p-3">
                          <input
                            type="number"
                            min="1"
                            max={item.stock}
                            placeholder="Qty"
                            value={qtyValue}
                            onChange={(e) => handleQuantityChange(item.product_id, e.target.value, item.stock)}
                            className="w-full bg-[#0B132B] border border-[#3A506B]/50 rounded px-2 py-1.5 text-white font-bold text-sm focus:outline-none focus:border-[#00B4D8]"
                          />
                        </td>
                        
                        <td className="p-3 text-right text-emerald-400 font-mono font-bold">
                          ${lineAmount.toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          <button 
                            onClick={() => handleRemoveRow(item.product_id)}
                            className="text-gray-500 hover:text-rose-400 cursor-pointer text-xs font-bold transition-colors"
                          >
                            &times;
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Action Footnotes Toolbar Control Frame Segment Footer */}
        <div className="p-5 border-t border-[#3A506B]/30 bg-[#0B132B]/40 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex justify-between w-full sm:w-auto gap-4 items-baseline">
            <span className="text-sm text-gray-400 font-medium">Grand Invoice Value:</span>
            <span className="text-xl font-black text-[#48CAE4]">${totalTransactionAmount.toFixed(2)}</span>
          </div>

          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs border border-[#3A506B]/60 text-gray-300 rounded-lg font-medium cursor-pointer hover:bg-white/5"
            >
              Back to Catalog
            </button>
            <button
              type="button"
              onClick={handleCheckoutClick}
              disabled={cartItems.length === 0 || loading}
              className="px-5 py-2.5 text-xs bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-md transition-all cursor-pointer"
            >
              {loading ? "Authorizing Receipt Ledger..." : "Commit Transaction"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}