// src/pages/ProductsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { productApi } from '../services/productApi';
import { salesApi } from '../services/salesApi';
import { useApi } from '../hooks/useApi';
import { useToast } from '../context/ToastContext';
import { validateProductInput } from '../utils/validators';
import ProductFormModal from '../components/ProductFormModal';
import CartModal from '../components/CartModal'; // We will build this next!

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [inlineDeleteId, setInlineDeleteId] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false, mode: 'add', currentProduct: null });
  const [formFields, setFormFields] = useState({ name: '', sellingPrice: '', costPrice: '', stock: '' });
  const [modalValidationError, setModalValidationError] = useState('');

  // POS (Point of Sale) State Controls
  const [isSelling, setIsSelling] = useState(false);
  const [cart, setCart] = useState([]); // Array of chosen products
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  const showToast = useToast();

  // Async Layer Hooks via useApi State Machines
  const { data: productsData, loading: fetchLoading, execute: fetchInventory } = useApi(productApi.getProducts);
  const { loading: addLoading, execute: runAddProduct } = useApi(productApi.addProduct);
  const { loading: editLoading, execute: runEditProduct } = useApi(productApi.editProduct);
  const { execute: runDeleteProduct } = useApi(productApi.deleteProduct);
  const { loading: checkoutLoading, execute: runCheckout } = useApi(salesApi.recordSale);

  const products = productsData?.products || [];

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Lock out the parent application layout shell when selling is active
  useEffect(() => {
    if (isSelling) {
      document.body.classList.add('pos-locked');
      // Optional: Hide global logout if layout senses this class attribute
    } else {
      document.body.classList.remove('pos-locked');
    }
    return () => document.body.classList.remove('pos-locked');
  }, [isSelling]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const error = validateProductInput(modalState.mode, formFields);
    if (error) return setModalValidationError(error);

    try {
      if (modalState.mode === 'add') {
        await runAddProduct({
          product_name: formFields.name.trim(),
          selling_price: parseFloat(formFields.sellingPrice),
          cost_price: parseFloat(formFields.costPrice),
          stock: parseInt(formFields.stock, 10)
        });
        showToast('Product successfully added to database ledger!', 'success');
      } else {
        await runEditProduct({
          product_id: modalState.currentProduct.product_id,
          selling_price: parseFloat(formFields.sellingPrice),
          cost_price: parseFloat(formFields.costPrice),
          stock_change: parseInt(formFields.stock, 10)
        });
        showToast('Inventory item specs scaled successfully.', 'success');
      }
      closeModal();
      fetchInventory();
    } catch (err) {
      setModalValidationError(err.message);
    }
  };

  const handleDelete = async (productId) => {
    try {
      await runDeleteProduct(productId);
      showToast('Item safely detached from active transaction view.', 'success');
      setInlineDeleteId(null);
      fetchInventory();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Cart Operation Management Handlers
  const handleToggleSelectProduct = (product) => {
    const isInCart = cart.some(item => item.product_id === product.product_id);
    if (isInCart) {
      setCart(cart.filter(item => item.product_id !== product.product_id));
      showToast(`Removed "${product.product_name}" from draft basket.`, 'info');
    } else {
      // Stage product into cart with a default quantity of 1
      setCart([...cart, { ...product, quantity: 1 }]);
      showToast(`Added "${product.product_name}" to draft basket.`, 'success');
    }
  };

  const handleCheckoutSubmit = async (cartItems) => {
    try {
      // Map frontend elements cleanly to backend structural List[SaleItem] array
      const itemsPayload = cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }));

      await runCheckout(itemsPayload);
      showToast("Transaction authorized and committed successfully!", "success");
      
      // Clear out cart and exit POS workflow cleanly
      setCart([]);
      setIsCartModalOpen(false);
      setIsSelling(false);
      fetchInventory(); // Reload table row numbers
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openModal = (mode, product = null) => {
    setModalValidationError('');
    if (mode === 'edit' && product) {
      setModalState({ isOpen: true, mode: 'edit', currentProduct: product });
      const currentCost = product.cost_price !== undefined && product.cost_price !== null 
        ? product.cost_price.toString() 
        : product.mrp.toString();

      setFormFields({
        name: product.product_name,
        sellingPrice: product.mrp.toString(),
        costPrice: currentCost,
        stock: '0'
      });
    } else {
      setModalState({ isOpen: true, mode: 'add', currentProduct: null });
      setFormFields({ name: '', sellingPrice: '', costPrice: '', stock: '' });
    }
  };

  const closeModal = () => {
    setModalState({ isOpen: false, mode: 'add', currentProduct: null });
    setModalValidationError('');
  };

  const filteredProducts = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return products;
    return products.filter(p => 
      p.product_id?.toString().includes(query) ||
      p.product_name?.toLowerCase().includes(query)
    );
  }, [searchTerm, products]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 lg:p-6 text-gray-100">
      
      {/* Dynamic Master Control Toolbar Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6 bg-[#1C2541]/40 border border-[#3A506B]/20 p-4 rounded-xl shadow-lg">
        <div className="relative flex-1 max-w-md">
          <input 
            type="text" 
            placeholder="Search active stock items by name or ID..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full bg-[#0B132B] border border-[#3A506B]/40 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00B4D8] transition-colors" 
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Active Status Display Badge Context Indicator */}
          {isSelling && (
            <span className="animate-pulse bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
              🔴 Live Session Locked
            </span>
          )}

          {!isSelling ? (
            <>
              <button 
                onClick={() => setIsSelling(true)} 
                className="border border-[#00B4D8] text-[#00B4D8] hover:bg-[#00B4D8]/10 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                Start Sale
              </button>
              <button 
                onClick={() => openModal('add')} 
                className="bg-[#00B4D8] hover:bg-[#0096B1] text-white px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wide cursor-pointer transition-colors"
              >
                + Add Product
              </button>
            </>
          ) : (
            <>
              <button 
                disabled={cart.length === 0}
                onClick={() => setIsCartModalOpen(true)}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-colors shadow-lg ${
                  cart.length === 0 
                    ? 'bg-gray-700/50 text-gray-400 border border-gray-600/30 cursor-not-allowed' 
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer'
                }`}
              >
                View Cart ({cart.length})
              </button>
              <button 
                onClick={() => { setIsSelling(false); setCart([]); }} 
                className="bg-transparent border border-gray-500 text-gray-300 hover:bg-white/5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Cancel Sale
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Stock Inventory Ledger Sheet Canvas Frame Grid Layout */}
      <div className="bg-[#1C2541] border border-[#3A506B]/30 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B132B]/60 text-[#48CAE4] text-xs font-bold uppercase tracking-wider border-b border-[#3A506B]/30">
                <th className="p-4 w-20">ID</th>
                <th className="p-4">Product Name</th>
                <th className="p-4">Cost Price</th>
                <th className="p-4">Selling Price</th>
                <th className="p-4 w-32">Remaining Stock</th>
                <th className="p-4 text-right w-48">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3A506B]/20 text-sm">
              {fetchLoading ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-400 italic">Syncing inventory...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-400 italic">No active inventory logs matched entry params.</td></tr>
              ) : (
                filteredProducts.map((product) => {
                  const isLowStock = product.stock <= 5;
                  const isConfirmingDelete = inlineDeleteId === product.product_id;
                  const isItemAdded = cart.some(item => item.product_id === product.product_id);

                  return (
                    <tr key={product.product_id} className={`transition-colors ${isItemAdded ? 'bg-[#48CAE4]/5 hover:bg-[#48CAE4]/10' : 'hover:bg-[#253154]/40'}`}>
                      <td className="p-4 font-mono text-xs text-gray-400">#{product.product_id}</td>
                      <td className="p-4 font-medium text-white">{product.product_name}</td>
                      <td className="p-4 text-gray-400">${parseFloat(product.cost_price || 0).toFixed(2)}</td>
                      <td className="p-4 text-[#48CAE4] font-medium">${parseFloat(product.mrp).toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${product.stock === 0 ? 'bg-rose-900/40 text-rose-400 border border-rose-700/30' : isLowStock ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {product.stock} {product.stock === 0 ? '🚫 Out of Stock' : isLowStock ? '⚠️' : ''}
                        </span>
                      </td>
                      
                      {/* DYNAMIC ACTIONS INTERCHANGE GRID ELEMENT CHANNEL INTERACTION CELL */}
                      <td className="p-4 text-right">
                        {isSelling ? (
                          <button
                            disabled={product.stock <= 0}
                            onClick={() => handleToggleSelectProduct(product)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              product.stock <= 0
                                ? 'bg-gray-800 text-gray-600 border border-gray-700/40 cursor-not-allowed'
                                : isItemAdded
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                                : 'bg-[#00B4D8]/10 text-[#48CAE4] border border-[#00B4D8]/30 hover:bg-[#00B4D8]/20'
                            }`}
                          >
                            {isItemAdded ? 'Deselect' : 'Select Item'}
                          </button>
                        ) : isConfirmingDelete ? (
                          <div className="flex justify-end items-center gap-2">
                            <span className="text-xs text-rose-400 font-medium mr-1">Delete?</span>
                            <button onClick={() => handleDelete(product.product_id)} className="bg-rose-500 hover:bg-rose-600 text-white text-xs px-2 py-1 rounded font-bold cursor-pointer transition-colors">Yes</button>
                            <button onClick={() => setInlineDeleteId(null)} className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-2 py-1 rounded font-bold cursor-pointer transition-colors">No</button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-4">
                            <button onClick={() => openModal('edit', product)} className="text-gray-300 hover:text-[#00B4D8] text-xs font-semibold cursor-pointer transition-colors">Edit</button>
                            <button onClick={() => setInlineDeleteId(product.product_id)} className="text-gray-400 hover:text-rose-400 text-xs font-semibold cursor-pointer transition-colors">Delete</button>
                          </div>
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

      {/* Reusable Operational Window Panels Primitives Frames Modals */}
      <ProductFormModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        formFields={formFields}
        setFormFields={setFormFields}
        validationError={modalValidationError}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
        loading={modalState.mode === 'add' ? addLoading : editLoading} 
      />

      <CartModal
        isOpen={isCartModalOpen}
        cartItems={cart}
        setCartItems={setCart}
        onClose={() => setIsCartModalOpen(false)}
        onSubmit={handleCheckoutSubmit}
        loading={checkoutLoading}
      />
    </div>
  );
}