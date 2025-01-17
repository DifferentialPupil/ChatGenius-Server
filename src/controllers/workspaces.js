const { Workspace } = require('../models')

exports.createWorkspace = async (req, res) => {
    const { name, logoUrl } = req.body
    const workspace = await Workspace.create({ name, logoUrl })
    res.status(201).json(workspace)
}

exports.getAllWorkspaces = async (req, res) => {
    const workspaces = await Workspace.findAll()
    res.status(200).json(workspaces)
}

exports.updateWorkspace = async (req, res) => {
    console.log(req.body)
    const { workspaceid, name, logoUrl } = req.body

    if (await workspaceExists(workspaceid)) {
        await Workspace.update({ name, logoUrl }, { where: { workspaceid: workspaceid } })
        res.status(200).json({ message: 'Workspace updated successfully' })
        return
    }

    res.status(400).json({ error: 'Workspace does not exist' })
}

async function workspaceExists(workspaceid) {
    return await Workspace.findOne({ where: { workspaceid: workspaceid } })
}