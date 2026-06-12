import apiClient from './apiClient';

export const workspaceApi = {
    createOrg: (orgName, ownerGmail) =>
        apiClient('/org/create', { method: 'POST', data: { org_name: orgName, owner_gmail: ownerGmail || null }, requireAuth: true }),

    joinOrg: (joinCode) =>
        apiClient('/org/join', { method: 'POST', data: { join_code: joinCode}, requireAuth: true }),

    selectWorkspace: (orgId) =>
        apiClient('/auth/workspace/select', { method: 'POST', data: { org_id: parseInt(orgId, 10) }, requireAuth: true }),

    getOrgProfile: () =>
        apiClient('/org/profile', { method: 'GET', requireAuth: true }),

    leaveOrg: () => 
    apiClient('/org/logout', { method: 'POST', requireAuth: true })
};
