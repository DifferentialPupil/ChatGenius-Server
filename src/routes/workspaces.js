const express = require('express');
const { createWorkspace, getAllWorkspaces, updateWorkspace } = require('../controllers/workspaces');

const router = express.Router();

router.post('/', createWorkspace);
router.get('/', getAllWorkspaces);
router.patch('/', updateWorkspace);

module.exports = router;