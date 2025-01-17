const { sequelize } = require('../middleware/database')
const { DataTypes } = require('sequelize')

const User = require('./user')
const Channel = require('./channel')
const Message = require('./message')
const ChannelMember = require('./channelmember')
const Workspace = require('./workspace')
const WorkspaceMember = require('./workspacemember')

const db = {
    sequelize,
    User: User(sequelize, DataTypes),
    Channel: Channel(sequelize, DataTypes),
    Message: Message(sequelize, DataTypes),
    ChannelMember: ChannelMember(sequelize, DataTypes),
    Workspace: Workspace(sequelize, DataTypes),
    WorkspaceMember: WorkspaceMember(sequelize, DataTypes)
}

// Model associations can be added here

module.exports = db