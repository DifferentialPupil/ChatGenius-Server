const express = require('express')
const { joinWorkspace, leaveWorkspace, getWorkspaceMembers, updateWorkspaceMemberRole } = require('../controllers/workspacemembers')

const router = express.Router()

router.post('/join', joinWorkspace)
router.post('/leave', leaveWorkspace)
router.get('/:workspaceid', getWorkspaceMembers)
router.patch('/', updateWorkspaceMemberRole)

module.exports = router