import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workspaceApi } from '../services/workspaceApi';
import { useApi } from '../hooks/useApi';
import { useToast } from '../context/ToastContext';
import { validateOrgName, validateEmail } from '../utils/validators';

export default function WorkspacePage() {
  const [mode, setMode] = useState('choice');
  const [orgName, setOrgName] = useState('');
  const [ownerGmail, setOwnerGmail] = useState('');
  const [joinCode, setJoinCode] = useState('');
  
  const { execute: runCreate, loading: createLoading } = useApi(workspaceApi.createOrg);
  const { execute: runJoin, loading: joinLoading } = useApi(workspaceApi.joinOrg);
  const { execute: runSelect } = useApi(workspaceApi.selectWorkspace);
  
  const showToast = useToast();
  const navigate = useNavigate();

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const orgErr = validateOrgName(orgName); if (orgErr) return showToast(orgErr, 'error');
    const emailErr = validateEmail(ownerGmail); if (emailErr) return showToast(emailErr, 'error');

    try {
      const createRes = await runCreate(orgName, ownerGmail);
      showToast(`Organization "${orgName}" initialized! Minting credentials...`, 'success');
      
      // const selectRes = await runSelect(createRes.org_id);
      localStorage.setItem('org_token', createRes.org_token);
      navigate('/products');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleJoinSubmit = async (e) => {
  e.preventDefault();
  if (joinCode.trim().length !== 6) return showToast("Join code must be exactly 6 characters.", 'error');

  try {
    const response = await runJoin(joinCode.toUpperCase());
    
    // Fallback checking to handle BOTH snake_case and camelCase payloads safely
    const token = response?.orgToken || response?.org_token || response?.data?.org_token;
    
    if (token) {
      localStorage.setItem('org_token', token);
      showToast('Connected to organization tenant namespace!', 'success');
      navigate('/products');
    } else {
      showToast('Failed to acquire a secure workspace access token.', 'error');
    }
  } catch (err) {
    showToast(err.message || 'An error occurred while joining.', 'error');
  }
};

  if (mode === 'choice') {
    return (
      <div className="min-h-screen bg-[#0B132B] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1C2541] border border-[#3A506B]/30 rounded-2xl p-8 shadow-2xl text-center">
          <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">Setup Your Workspace</h2>
          <p className="text-gray-400 text-sm mb-8">Choose to join an existing organization or launch a brand new database hub.</p>
          <div className="space-y-4">
            <button onClick={() => setMode('create')} className="w-full bg-[#00B4D8] hover:bg-[#0077B6] py-4 rounded-xl font-semibold text-white transition-all shadow-lg cursor-pointer">Create New Organization</button>
            <div className="text-gray-500 font-bold text-xs uppercase tracking-widest my-2">OR</div>
            <button onClick={() => setMode('join')} className="w-full bg-transparent border border-[#3A506B] text-gray-200 hover:bg-[#3A506B]/30 py-4 rounded-xl font-semibold transition-all cursor-pointer">Join with Invite Code</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B132B] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1C2541] border border-[#3A506B]/30 rounded-2xl p-8 shadow-2xl">
        <button onClick={() => { setMode('choice'); setOrgName(''); setJoinCode(''); }} className="text-sm text-[#48CAE4] hover:underline mb-4 inline-block cursor-pointer">← Back to options</button>
        
        {mode === 'create' ? (
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Create Organization</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Organization Name</label>
                <input type="text" required value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. Chacha Electronics" className="w-full bg-[#0B132B] border border-[#3A506B]/40 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#48CAE4]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Owner Contact Email (Optional)</label>
                <input type="email" value={ownerGmail} onChange={(e) => setOwnerGmail(e.target.value)} placeholder="owner@gmail.com" className="w-full bg-[#0B132B] border border-[#3A506B]/40 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#48CAE4]" />
              </div>
              <button type="submit" disabled={createLoading} className="w-full bg-[#00B4D8] hover:bg-[#0077B6] py-3 rounded-lg font-medium text-white transition-all shadow-lg disabled:opacity-50 cursor-pointer">
                {createLoading ? 'Provisioning database layers...' : 'Launch Workspace'}
              </button>
            </form>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Join Workspace</h2>
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">6-Character Invite Code</label>
                <input type="text" maxLength={6} required value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="X7Y2Z9" className="w-full bg-[#0B132B] border border-[#3A506B]/40 rounded-lg p-2.5 text-white text-center font-mono text-lg tracking-widest focus:outline-none focus:border-[#48CAE4] uppercase" />
              </div>
              <button type="submit" disabled={joinLoading} className="w-full bg-[#00B4D8] hover:bg-[#0077B6] py-3 rounded-lg font-medium text-white transition-all shadow-lg disabled:opacity-50 cursor-pointer">
                {joinLoading ? 'Authenticating token scope...' : 'Connect to Organization'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}