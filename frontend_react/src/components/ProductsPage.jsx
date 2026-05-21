import React, { useState, useEffect, useMemo } from 'react';
import ProductFormModal from './ProductFormModal';
import { validateProductInput } from '../utils/validators';
import { authAPI } from '../services/apiService';

export default function ProductsPage({ triggerToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inlineDeleteId, setInlineDeleteId] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [modalState, setModalState] = useState({ isOpen: false, mode: 'add', currentProduct: null });
  const [formFields, setFormFields] = useState({ name: '', sellingPrice: '', costPrice: '', stock: '' });

  // Real Database Synchronization Hooks
  const syncInventoryFromDatabase = async () => {
    setLoading(true);
    try {
      const response = await authAPI.getProducts();
      if (response.products) {
        setProducts(response.products);
      }
    } catch (err) {
      triggerToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncInventoryFromDatabase();
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const error = validateProductInput(modalState.mode, formFields);
    if (error) return setValidationError(error);

    setLoading(true);
    try {
      if (modalState.mode === 'add') {
        const payload = {
          product_name: formFields.name.trim(),
          selling_price: parseFloat(formFields.sellingPrice),
          cost_price: parseFloat(formFields.costPrice),
          stock: parseInt(formFields.stock, 10)
        };
        await authAPI.addProduct(payload);
        triggerToast(`Product successfully added to database ledger!`, 'success');
      } else {
        const payload = {
          product_id: modalState.currentProduct.product_id,
          selling_price: parseFloat(formFields.sellingPrice),
          cost_price: parseFloat(formFields.costPrice),
          stock_change: parseInt(formFields.stock, 10)
        };
        await authAPI.editProduct(modalState.currentProduct.product_id, payload);
        triggerToast("Inventory item specs scaled successfully.", "success");
      }
      closeModal();
      syncInventoryFromDatabase();
    } catch (err) {
      setValidationError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    setLoading(true);
    try {
      await authAPI.deleteProduct(productId);
      triggerToast("Item safely detached from active transaction view.", "success");
      setInlineDeleteId(null);
      syncInventoryFromDatabase();
    } catch (err) {
      triggerToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode, product = null) => {
    setValidationError('');
    if (mode === 'edit' && product) {
      setModalState({ isOpen: true, mode: 'edit', currentProduct: product });
      setFormFields({
        name: product.product_name,
        sellingPrice: product.mrp.toString(),
        costPrice: product.cost_price ? product.cost_price.toString() : '0',
        stock: '0'
      });
    } else {
      setModalState({ isOpen: true, mode: 'add', currentProduct: null });
      setFormFields({ name: '', sellingPrice: '', costPrice: '', stock: '' });
    }
  };

  const closeModal = () => {
    setModalState({ isOpen: false, mode: 'add', currentProduct: null });
    setValidationError('');
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
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <input type="text" placeholder="Search active stock items by name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#1C2541] border border-[#3A506B]/40 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00B4D8] transition-colors" />
        </div>
        <div className="flex gap-3">
          <button onClick={() => alert("Sale process configuration initializing in next phase...")} className="border border-[#00B4D8] text-[#00B4D8] hover:bg-[#00B4D8]/10 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer">
            Start Sale
          </button>
          <button onClick={() => openModal('add')} className="bg-[#00B4D8] hover:bg-[#0096B1] text-white px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wide cursor-pointer transition-colors">
            + Add Product
          </button>
        </div>
      </div>

      <div className="bg-[#1C2541] border border-[#3A506B]/30 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B132B]/60 text-[#48CAE4] text-xs font-bold uppercase tracking-wider border-b border-[#3A506B]/30">
                <th className="p-4 w-20">ID</th>
                <th className="p-4">Product Name</th>
                <th className="p-4">Selling Price</th>
                <th className="p-4 w-32">Remaining Stock</th>
                <th className="p-4 text-right w-48">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3A506B]/20 text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400 italic">No active inventory logs matched entry params.</td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isLowStock = product.stock <= 5;
                  const isConfirmingDelete = inlineDeleteId === product.product_id;
                  return (
                    <tr key={product.product_id} className="hover:bg-[#253154]/40 transition-colors">
                      <td className="p-4 font-mono text-xs text-gray-400">#{product.product_id}</td>
                      <td className="p-4 font-medium text-white">{product.product_name}</td>
                      <td className="p-4 text-[#48CAE4] font-medium">${parseFloat(product.mrp).toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${isLowStock ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {product.stock} {isLowStock && ' ⚠️'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {isConfirmingDelete ? (
                          <div className="flex justify-end items-center gap-2">
                            <span className="text-xs text-rose-400 font-medium mr-1">Delete?</span>
                            <button onClick={() => handleDeleteProduct(product.product_id)} className="bg-rose-500 hover:bg-rose-600 text-white text-xs px-2 py-1 rounded font-bold cursor-pointer transition-colors">Yes</button>
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

      <ProductFormModal isOpen={modalState.isOpen} mode={modalState.mode} formFields={formFields} setFormFields={setFormFields} validationError={validationError} onClose={closeModal} onSubmit={handleFormSubmit} loading={loading} />
    </div>
  );
}