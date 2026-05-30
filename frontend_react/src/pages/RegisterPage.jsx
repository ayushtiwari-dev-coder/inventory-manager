import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/authApi';
import { useApi } from '../hooks/useApi';
import { useToast } from '../context/ToastContext';
import { validateName, validateUsername, validatePassword } from '../utils/validators';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [masterCode, setMasterCode] = useState('');
  const { execute: runRegister, loading } = useApi(authApi.register);
  const { execute: runLogin } = useApi(authApi.login);
  const showToast = useToast();
  const navigate = useNavigate();

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    const nErr = validateName(name); if (nErr) return showToast(nErr, 'error');
    const uErr = validateUsername(username); if (uErr) return showToast(uErr, 'error');
    const pErr = validatePassword(password); if (pErr) return showToast(pErr, 'error');
    if (!masterCode) return showToast("Master code required.", 'error');

    try {
      const response =await runRegister(name, username, password, masterCode);
      showToast('Account verified! Performing secure auto-login...', 'success');
      
      // const loginRes = await runLogin(username, password);
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
        <h2 className="text-2xl font-bold text-center mb-6 text-white tracking-wide">Create Account</h2>
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Chacha Developer" className="w-full bg-[#0B132B] border border-[#3A506B]/40 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#48CAE4]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1">Secret Entry Code</label>
            <input type="password" value={masterCode} onChange={(e) => setMasterCode(e.target.value)} placeholder="Developer Master Code" className="w-full bg-[#0B132B] border border-[#00B4D8]/50 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#48CAE4]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="chacha" className="w-full bg-[#0B132B] border border-[#3A506B]/40 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#48CAE4]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-[#0B132B] border border-[#3A506B]/40 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#48CAE4]" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#00B4D8] hover:bg-[#0077B6] py-3 rounded-lg font-medium text-white transition-all shadow-lg mt-2 cursor-pointer disabled:opacity-50">
            {loading ? 'Processing network requests...' : 'Register Secure Account'}
          </button>
        </form>
        <div className="mt-6 text-center text-sm border-t border-[#3A506B]/20 pt-4">
          <Link to="/login" className="text-[#48CAE4] hover:underline">Already have an account? Just log in</Link>
        </div>
      </div>
    </div>
  );
}