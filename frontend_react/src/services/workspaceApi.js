import apiClient from './apiClient';

export const workspaceApi = {
    createOrg: (orgName, ownerGmail) =>
        apiClient('/org/create', { method: 'POST', data: { org_name: orgName, owner_gmail: ownerGmail || null }, requireAuth: true }),

    joinOrg: (joinCode) =>
        apiClient('/org/join', { method: 'POST', data: { join_code: joinCode}, requireAuth: true }),

    selectWorkspace: (orgId) =>
        apiClient('/auth/workspace/select', { method: 'POST', data: { org_id: parseInt(orgId, 10) }, requireAuth: true }),

    // NEW: Fetches organization metadata and secure join codes
    getOrgProfile: () =>
        apiClient('/org/profile', { method: 'GET', requireAuth: true })
};