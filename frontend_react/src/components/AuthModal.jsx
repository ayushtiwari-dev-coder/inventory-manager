import React, { useState } from 'react';
import { validateAuthInput } from '../utils/validators';
import { authAPI } from '../services/apiService';
import { clearFormInputs, INITIAL_AUTH_STATE } from '../utils/formHelpers';

export default function AuthModal({ view, setView, triggerToast }) {
  const isLogin = view === 'login';
  const [formData, setFormData] = useState(INITIAL_AUTH_STATE);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleViewToggle = (targetView) => {
    clearFormInputs(setFormData, INITIAL_AUTH_STATE);
    setView(targetView);
  };

  const handleAuthSubmit = async (e) => {
    if (e) e.preventDefault();
    const localError = validateAuthInput(view, formData);
    if (localError) return triggerToast(localError, 'error');

    setLoading(true);
    try {
      if (isLogin) {
        const response = await authAPI.login(formData.username, formData.password);
        if (response.status === 'success') {
          triggerToast('Access Granted! Welcome back.', 'success');
          localStorage.setItem('global_token', response.global_token);
          localStorage.setItem('user_info', JSON.stringify(response.data));
          
          if (response.data.workspaces && response.data.workspaces.length > 0) {
            const primaryWorkspace = response.data.workspaces[0];
            const workspaceSelection = await authAPI.selectWorkspace(primaryWorkspace.org_id);

            if (workspaceSelection.status === 'success') {
              localStorage.setItem('org_token', workspaceSelection.org_token);
              clearFormInputs(setFormData, INITIAL_AUTH_STATE);
              setView('authenticated');
            }
          } else {
            clearFormInputs(setFormData, INITIAL_AUTH_STATE);
            setView('workspace_setup');
          }
        }
      } else {
        const response = await authAPI.register(formData.name, formData.username, formData.password, formData.masterCode);
        if (response.status === 'success') {
          triggerToast('Account verified! Performing secure auto-login...', 'success');
          const loginRes = await authAPI.login(formData.username, formData.password);
          localStorage.setItem('global_token', loginRes.global_token);
          localStorage.setItem('user_info', JSON.stringify(loginRes.data));
          clearFormInputs(setFormData, INITIAL_AUTH_STATE);
          setView('workspace_setup');
        }
      }
    } catch (apiError) {
      triggerToast(apiError.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-[#1C2541] border border-[#3A506B]/30 rounded-2xl p-8 shadow-2xl">
      <h2 className="text-2xl font-bold text-center mb-6 text-white tracking-wide">
        {isLogin ? 'Sign In' : 'Create Account'}
      </h2>
      <form onSubmit={handleAuthSubmit} className="space-y-4">
        {!isLogin && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
              <input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="e.g. Chacha Developer" className="w-full bg-[#0B132B] border border-[#3A506B]/40 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#48CAE4]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1">Secret Entry Code</label>
              <input type="password" value={formData.masterCode} onChange={(e) => handleInputChange('masterCode', e.target.value)} placeholder="Developer Master Code" className="w-full bg-[#0B132B] border border-[#00B4D8]/50 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#48CAE4]" />
            </div>
          </>
        )}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Username</label>
          <input type="text" value={formData.username} onChange={(e) => handleInputChange('username', e.target.value)} placeholder="chacha" className="w-full bg-[#0B132B] border border-[#3A506B]/40 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#48CAE4]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Password</label>
          <input type="password" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} placeholder="••••••••" className="w-full bg-[#0B132B] border border-[#3A506B]/40 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#48CAE4]" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-[#00B4D8] hover:bg-[#0077B6] py-3 rounded-lg font-medium text-white transition-all shadow-lg mt-2 cursor-pointer disabled:opacity-50">
          {loading ? 'Processing network requests...' : isLogin ? 'Sign In' : 'Register Secure Account'}
        </button>
      </form>
      <div className="mt-6 text-center text-sm border-t border-[#3A506B]/20 pt-4">
        <button onClick={() => handleViewToggle(isLogin ? 'register' : 'login')} className="text-[#48CAE4] hover:underline cursor-pointer">
          {isLogin ? "Don't have an account? Create Account" : "Already have an account? Just log in"}
        </button>
      </div>
    </div>
  );
}