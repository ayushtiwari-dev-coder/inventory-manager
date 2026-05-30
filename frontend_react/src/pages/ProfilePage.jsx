import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { workspaceApi } from '../services/workspaceApi';
import { useToast } from '../context/ToastContext';

export default function ProfilePage() {
    const { data: profileRes, loading, execute: fetchProfile } = useApi(workspaceApi.getOrgProfile);
    const showToast = useToast();
    const [copiedField, setCopiedField] = useState(null);

    // Extract basic user info cached locally during login
    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleCopy = async (code, fieldName) => {
        if (!code) return;
        try {
            await navigator.clipboard.writeText(code);
            setCopiedField(fieldName);
            showToast(`${fieldName} successfully copied to clipboard!`, 'success');
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            showToast("Failed to copy credential token.", 'error');
        }
    };

    if (loading) {
        return <div className="text-center p-8 italic text-gray-400 animate-pulse">Retrieving system identity configurations...</div>;
    }

    const orgData = profileRes?.data || {};

    return (
        <div className="w-full max-w-3xl mx-auto p-4 lg:p-6 space-y-6 text-gray-100">
            {/* Header Toolbar */}
            <div className="bg-[#1C2541]/40 border border-[#3A506B]/20 p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold text-white tracking-wide">Workspace & Identity Profile</h2>
                <p className="text-xs text-gray-400 mt-1">Manage personal metrics and access invitations for this tenant namespace.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Session Metadata Card */}
                <div className="bg-[#1C2541] border border-[#3A506B]/30 p-6 rounded-xl shadow-xl space-y-4">
                    <h3 className="text-sm font-bold text-[#48CAE4] uppercase tracking-wider border-b border-[#3A506B]/20 pb-2">User Credentials</h3>
                    <div>
                        <label className="block text-[10px] uppercase font-semibold text-gray-500">Operator Display Name</label>
                        <p className="text-sm font-medium text-white">{userInfo.name || 'N/A'}</p>
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-semibold text-gray-500">System Username</label>
                        <p className="text-sm font-mono text-gray-300">@{userInfo.username || 'username'}</p>
                    </div>
                </div>

                {/* Organization Details Card */}
                <div className="bg-[#1C2541] border border-[#3A506B]/30 p-6 rounded-xl shadow-xl space-y-4">
                    <h3 className="text-sm font-bold text-[#48CAE4] uppercase tracking-wider border-b border-[#3A506B]/20 pb-2">Tenant Details</h3>
                    <div>
                        <label className="block text-[10px] uppercase font-semibold text-gray-500">Organization Name</label>
                        <p className="text-sm font-bold text-white">{orgData.org_name || 'Loading...'}</p>
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-semibold text-gray-500">Internal System ID</label>
                        <p className="text-sm font-mono text-gray-400">#Workspace-{orgData.org_id || '0000'}</p>
                    </div>
                </div>
            </div>

            {/* Secure Invite Codes Panels Container */}
            <div className="bg-[#1C2541] border border-[#3A506B]/30 p-6 rounded-xl shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#3A506B]/20 pb-2">Workspace Join Codes</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                    Provide these unique tokens to team members to safely link them into your organizational boundaries.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Manager Invite Input Row */}
                    <div className="bg-[#0B132B] border border-[#3A506B]/40 p-4 rounded-lg flex flex-col justify-between gap-2">
                        <div>
                            <span className="text-xs font-bold text-teal-400 uppercase tracking-wide">Manager Assignment Code</span>
                            <p className="text-[11px] text-gray-500 mt-0.5">Grants full inventory creation, adjustments, and deletion profiles.</p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="flex-1 text-center font-mono text-lg font-black tracking-widest bg-[#1C2541] py-2 border border-[#3A506B]/30 text-white rounded uppercase">
                                {orgData.manager_join_code || '------'}
                            </span>
                            <button
                                onClick={() => handleCopy(orgData.manager_join_code, 'Manager Code')}
                                className="px-4 py-2 text-xs font-bold bg-[#00B4D8] text-white rounded hover:bg-[#0077B6] transition-colors cursor-pointer"
                            >
                                {copiedField === 'Manager Code' ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    {/* Employee Invite Input Row */}
                    <div className="bg-[#0B132B] border border-[#3A506B]/40 p-4 rounded-lg flex flex-col justify-between gap-2">
                        <div>
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Employee Assignment Code</span>
                            <p className="text-[11px] text-gray-500 mt-0.5">Limits access strictly to catalog views and generating transaction sales.</p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="flex-1 text-center font-mono text-lg font-black tracking-widest bg-[#1C2541] py-2 border border-[#3A506B]/30 text-white rounded uppercase">
                                {orgData.employee_join_code || '------'}
                            </span>
                            <button
                                onClick={() => handleCopy(orgData.employee_join_code, 'Employee Code')}
                                className="px-4 py-2 text-xs font-bold bg-[#00B4D8] text-white rounded hover:bg-[#0077B6] transition-colors cursor-pointer"
                            >
                                {copiedField === 'Employee Code' ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}