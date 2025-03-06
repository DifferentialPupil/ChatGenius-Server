const express = require('express');
const { 
    createWorkspace, 
    getAllWorkspaces,
    getAllUserWorkspaces, 
    getWorkspaceById,
    updateWorkspace, 
    getWorkspaceUsers,
    inviteUsers,
    removeUser,
    getWorkspaceSettings,
    updateWorkspaceSettings,
    getAllWorkspaceData
} = require('../controllers/workspaces');

const router = express.Router();

// Workspace routes
router.post('/', createWorkspace);
router.get('/', getAllWorkspaces);
router.get('/me', getAllUserWorkspaces);
router.get('/:workspaceId', getWorkspaceById);
router.patch('/:workspaceId', updateWorkspace);
router.get('/:workspaceId/data', getAllWorkspaceData);

// Workspace members routes
router.get('/:workspaceId/users', getWorkspaceUsers);
router.post('/:workspaceId/users/invite', inviteUsers);
router.delete('/:workspaceId/users/:userId', removeUser);

// Workspace settings routes
router.get('/:workspaceId/settings', getWorkspaceSettings);
router.patch('/:workspaceId/settings', updateWorkspaceSettings);

module.exports = router;