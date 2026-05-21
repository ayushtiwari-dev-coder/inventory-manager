import React, { useState } from 'react';
import { validateWorkspaceInput } from '../utils/validators';
import { authAPI } from '../services/apiService';

export default function WorkspaceSelector({ setView, triggerToast }) {
  const [mode, setMode] = useState('choice'); 
  const [orgName, setOrgName] = useState('');
  const [ownerGmail, setOwnerGmail] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const clearInputs = () => {
    setOrgName('');
    setOwnerGmail('');
    setJoinCode('');
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const error = validateWorkspaceInput('create', { orgName, ownerGmail });
    if (error) return triggerToast(error, 'error');

    setLoading(true);
    try {
      const response = await authAPI.createOrg(orgName, ownerGmail);
      if (response.status === 'success') {
        triggerToast(`Organization "${orgName}" initialized successfully!`, 'success');
        if (response.org_token) localStorage.setItem('org_token', response.org_token);
        clearInputs();
        setView('authenticated');
      }
    } catch (err) {
      triggerToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    const error = validateWorkspaceInput('join', { joinCode });
    if (error) return triggerToast(error, 'error');

    setLoading(true);
    try {
      const response = await authAPI.joinOrg(joinCode.toUpperCase());
      if (response.status === 'success') {
        triggerToast('Connected to organization tenant namespace!', 'success');
        if (response.org_token) localStorage.setItem('org_token', response.org_token);
        clearInputs();
        setView('authenticated');
      }
    } catch (err) {
      triggerToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'choice') {
    return (
      <div className="max-w-md w-full bg-[#1C2541] border border-[#3A506B]/30 rounded-2xl p-8 shadow-2xl text-center">
        <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">Setup Your Workspace</h2>
        <p className="text-gray-400 text-sm mb-8">Choose to join an existing organization or launch a brand new database hub.</p>
        <div className="space-y-4">
          <button onClick={() => setMode('create')} className="w-full bg-[#00B4D8] hover:bg-[#0077B6] py-4 rounded-xl font-semibold text-white transition-all shadow-lg cursor-pointer">
            Create New Organization
          </button>
          <div className="text-gray-500 font-bold text-xs uppercase tracking-widest my-2">OR</div>
          <button onClick={() => setMode('join')} className="w-full bg-transparent border border-[#3A506B] text-gray-200 hover:bg-[#3A506B]/30 py-4 rounded-xl font-semibold transition-all cursor-pointer">
            Join with Invite Code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full bg-[#1C2541] border border-[#3A506B]/30 rounded-2xl p-8 shadow-2xl">
      <button onClick={() => { setMode('choice'); clearInputs(); }} className="text-sm text-[#48CAE4] hover:underline mb-4 inline-block cursor-pointer">
        Back to options
      </button>
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
            <button type="submit" disabled={loading} className="w-full bg-[#00B4D8] hover:bg-[#0077B6] py-3 rounded-lg font-medium text-white transition-all shadow-lg disabled:opacity-50 cursor-pointer">
              {loading ? 'Provisioning database layers...' : 'Launch Workspace'}
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
            <button type="submit" disabled={loading} className="w-full bg-[#00B4D8] hover:bg-[#0077B6] py-3 rounded-lg font-medium text-white transition-all shadow-lg disabled:opacity-50 cursor-pointer">
              {loading ? 'Authenticating token scope...' : 'Connect to Organization'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}