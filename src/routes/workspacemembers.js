const express = require('express')
const router = express.Router()
const workspaceMembersController = require('../controllers/workspacemembers')

// Get all workspace members (admin access)
router.get('/', workspaceMembersController.getAllWorkspaceMembers)

// Get current user's workspace memberships
router.get('/me', workspaceMembersController.getMyWorkspaceMemberships)

// Check if current user is a member of a specific workspace
router.get('/check/:workspaceId', workspaceMembersController.checkWorkspaceMembership)

// Check if current user is an admin of a specific workspace
router.get('/checkadmin/:workspaceId', workspaceMembersController.checkWorkspaceAdmin)

// Get current user's profile in the context of a workspace
router.get('/profile/:workspaceId', workspaceMembersController.getMyWorkspaceProfile)

// Get all members of a specific workspace
router.get('/workspace/:workspaceId', workspaceMembersController.getWorkspaceMembersByWorkspaceId)

// Get all workspaces a specific user is a member of
router.get('/user/:userId', workspaceMembersController.getWorkspaceMembersByUserId)

// Get a specific workspace member by workspace and user IDs
router.get('/workspace/:workspaceId/user/:userId', workspaceMembersController.getWorkspaceMemberByWorkspaceAndUser)

// Get a specific workspace member by ID
router.get('/:workspaceMemberId', workspaceMembersController.getWorkspaceMemberById)

// Add a single member to a workspace
router.post('/', workspaceMembersController.addWorkspaceMember)

// Bulk add members to a workspace
router.post('/bulk', workspaceMembersController.bulkAddWorkspaceMembers)

// Update a workspace member's role
router.patch('/:workspaceMemberId', workspaceMembersController.updateWorkspaceMember)

// Remove a member from a workspace
router.delete('/:workspaceMemberId', workspaceMembersController.removeWorkspaceMember)

module.exports = router