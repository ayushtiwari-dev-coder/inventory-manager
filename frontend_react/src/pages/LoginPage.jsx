import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/authApi';
import { workspaceApi } from '../services/workspaceApi';
import { useApi } from '../hooks/useApi';
import { useToast } from '../context/ToastContext';
import { validateUsername, validatePassword } from '../utils/validators';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { execute: runLogin, loading } = useApi(authApi.login);
  const { execute: autoSelectWorkspace } = useApi(workspaceApi.selectWorkspace);
  const showToast = useToast();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    const uErr = validateUsername(username);
    if (uErr) return showToast(uErr, 'error');
    const pErr = validatePassword(password);
    if (pErr) return showToast(pErr, 'error');

    // LOCATION: frontend_react\src\pages\LoginPage.jsx

    try {
      const response = await runLogin(username, password);
      showToast('Access Granted! Welcome back.', 'success');

      localStorage.setItem('global_token', response.global_token);
      localStorage.setItem('user_info', JSON.stringify(response.data));


      navigate('/workspaces');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B132B] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1C2541] border border-[#3A506B]/30 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-center mb-6 text-white tracking-wide">Sign In</h2>
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="chacha" className="w-full bg-[#0B132B] border border-[#3A506B]/40 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#48CAE4]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-[#0B132B] border border-[#3A506B]/40 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#48CAE4]" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#00B4D8] hover:bg-[#0077B6] py-3 rounded-lg font-medium text-white transition-all shadow-lg mt-2 cursor-pointer disabled:opacity-50">
            {loading ? 'Processing network requests...' : 'Sign In'}
          </button>
        </form>
        <div className="mt-6 text-center text-sm border-t border-[#3A506B]/20 pt-4">
          <Link to="/register" className="text-[#48CAE4] hover:underline">Don't have an account? Create Account</Link>
        </div>
      </div>
    </div>
  );
}