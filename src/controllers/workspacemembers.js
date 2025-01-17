const { WorkspaceMember } = require('../models')

exports.joinWorkspace = async (req, res) => {
    const { workspaceid, userid, role } = req.body

    if (workspaceid === undefined || userid === undefined || role === undefined) {
        res.status(400).json({ error: 'Workspace ID, User ID, and Role are required' })
        return
    }

    if (role !== 'Admin' && role !== 'Member') {
        res.status(400).json({ error: 'Invalid role' })
        return
    }

    if (await workspaceMemberExists(workspaceid, userid)) {
        res.status(400).json({ error: 'User already exists in workspace' })
        return
    }

    const workspaceMember = await WorkspaceMember.create({ workspaceid, userid, role })
    res.status(201).json(workspaceMember)
}

exports.leaveWorkspace = async (req, res) => {
    const { workspaceid, userid } = req.body

    if (workspaceid === undefined || userid === undefined) {
        res.status(400).json({ error: 'Workspace ID and User ID are required' })
        return
    }

    if (await workspaceMemberExists(workspaceid, userid)) {
        const workspaceMember = await WorkspaceMember.destroy({ where: { workspaceid, userid } })
        res.status(200).json(workspaceMember)
        return
    }

    res.status(400).json({ error: 'User does not exist in workspace' })
}

exports.getWorkspaceMembers = async (req, res) => {
    const { workspaceid } = req.params
    const workspaceMembers = await WorkspaceMember.findAll({ where: { workspaceid } })
    res.status(200).json(workspaceMembers)
}

exports.updateWorkspaceMemberRole = async (req, res) => {
    const { workspaceid, userid, role } = req.body

    if (workspaceid === undefined || userid === undefined || role === undefined) {
        res.status(400).json({ error: 'Workspace ID, User ID, and Role are required' })
        return
    }

    if (role !== 'Admin' && role !== 'Member') {
        res.status(400).json({ error: 'Invalid role' })
        return
    }

    if (await workspaceMemberExists(workspaceid, userid)) {
        const workspaceMember = await WorkspaceMember.update({ role }, { where: { workspaceid, userid } })
        res.status(200).json(workspaceMember)
        return
    }

    res.status(400).json({ error: 'User does not exist in workspace' })
}

async function workspaceMemberExists(workspaceid, userid) {
    return await WorkspaceMember.findOne({ where: { workspaceid, userid } })
}