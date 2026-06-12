// LOCATION: frontend_react\src\pages\WorkspacePage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workspaceApi } from '../services/workspaceApi';
import { useApi } from '../hooks/useApi';
import { useToast } from '../context/ToastContext';
import { useSelectWorkspace } from '../queries/workspaceQueries';
import { validateOrgName, validateEmail } from '../utils/validators';
import WorkspacePicker from '../components/WorkspacePicker';
import { authApi } from '../services/authApi';

export default function WorkspacePage() {
  // Navigation views: 'picker', 'create', 'join'
  const [mode, setMode] = useState('picker');
  const [orgName, setOrgName] = useState('');
  const [ownerGmail, setOwnerGmail] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const showToast = useToast();
  const navigate = useNavigate();

  // Extract user metrics cache profiles securely from local memory
  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
  const workspaces = userInfo.workspaces || [];

  // React Query mutation execution engine
  const { mutateAsync: selectOrg, isPending: switchingContext } = useSelectWorkspace();

  // Keep stable useApi hooks for your post forms
  const { execute: runCreate, loading: createLoading } = useApi(workspaceApi.createOrg);
  const { execute: runJoin, loading: joinLoading } = useApi(workspaceApi.joinOrg);

  // --- ACTIONS ---
  const handleSelectWorkspace = async (orgId) => {
    try {
      const response = await selectOrg(orgId);
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      userInfo.current_role = response?.role || response?.data?.role || workspaces.find(w => w.org_id === orgId)?.role;
      localStorage.setItem('user_info', JSON.stringify(userInfo));

      showToast('Connected to organization tenant namespace!', 'success');
      navigate('/products');
    } catch (err) {
      showToast(err.message || 'Failed to establish workspace tunnel.', 'error');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const orgErr = validateOrgName(orgName); 
    if (orgErr) return showToast(orgErr, 'error');
    const emailErr = validateEmail(ownerGmail); 
    if (emailErr) return showToast(emailErr, 'error');

    try {
      const createRes = await runCreate(orgName, ownerGmail);
      showToast(`Organization "${orgName}" initialized successfully!`, 'success');
      
      
      const currentUserInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      if (!currentUserInfo.workspaces) currentUserInfo.workspaces = [];
      
      currentUserInfo.workspaces.push({
        org_id: createRes.org_id,
        org_name: orgName,
        role: 'owner'
      });
      currentUserInfo.current_role = 'owner';
      localStorage.setItem('user_info', JSON.stringify(currentUserInfo));
      
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
      
      // We removed the 'if (token)' check! The cookie is handled silently.
      const currentUserInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      if (!currentUserInfo.workspaces) currentUserInfo.workspaces = [];
      
      currentUserInfo.workspaces.push({
        org_id: response.org_id,
        org_name: response.org_name || `Workspace #${response.org_id}`,
        role: response.role 
      });
      currentUserInfo.current_role = response.role;
      localStorage.setItem('user_info', JSON.stringify(currentUserInfo));
      
      showToast('Connected to organization tenant namespace!', 'success');
      navigate('/products');
      
    } catch (err) {
      showToast(err.message || 'An error occurred while joining.', 'error');
    }
  };

const handleGlobalLogout = async () => {
  try { 
    await authApi.logout(); 
  } catch(e) {}
  
  localStorage.clear();
  showToast('Logged out from global session.', 'info');
  navigate('/login');
};
  const handleBackToPicker = () => {
    setOrgName('');
    setJoinCode('');
    setMode('picker'); // Simple callback router links back to your component
  };

  return (
    <div className="min-h-screen bg-[#0B132B] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1C2541] border border-[#3A506B]/30 rounded-2xl p-8 shadow-2xl">

        {/* VIEW 1: RENDER PICKER COMPONENT */}
        {mode === 'picker' && (
          <WorkspacePicker
            userInfo={userInfo}
            workspaces={workspaces}
            switchingContext={switchingContext}
            onSelectWorkspace={handleSelectWorkspace}
            onActionClick={(targetMode) => setMode(targetMode)}
            onGlobalLogout={handleGlobalLogout}
          />
        )}

        {/* VIEW 2: LAUNCH FORM REGISTRATION */}
        {mode === 'create' && (
          <div>
            <button onClick={handleBackToPicker} className="text-sm text-[#48CAE4] hover:underline mb-4 inline-block cursor-pointer">
              &larr; Back to profile selector
            </button>
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
        )}

        {/* VIEW 3: JOIN FORM DESK */}
        {mode === 'join' && (
          <div>
            <button onClick={handleBackToPicker} className="text-sm text-[#48CAE4] hover:underline mb-4 inline-block cursor-pointer">
              &larr; Back to profile selector
            </button>
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