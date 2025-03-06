const { sequelize } = require('../middleware/database')
const { DataTypes } = require('sequelize')

// Core Models
const User = require('./core/user')
const Workspace = require('./core/workspace')
const WorkspaceMember = require('./core/workspaceMember')
const UserStatus = require('./core/userStatus')
const WorkspaceSettings = require('./core/workspaceSettings')
const UserActivityLog = require('./core/userActivityLog')

// Messaging Models
const Channel = require('./messaging/channel')
const ChannelMember = require('./messaging/channelMember')
const Message = require('./messaging/message')
const Conversation = require('./messaging/conversation')
const ConversationParticipant = require('./messaging/conversationParticipant')
const DirectMessage = require('./messaging/directMessage')
const File = require('./messaging/file')
const Reaction = require('./messaging/reaction')
const Mention = require('./messaging/mention')
const PinnedItem = require('./messaging/pinnedItem')
const NotificationPreference = require('./messaging/notificationPreference')
const UserNotification = require('./messaging/userNotification')

// AI Models
const Avatar = require('./ai/avatar')
const CommunicationHistory = require('./ai/communicationHistory')

// Billing Models
const SubscriptionPlan = require('./billing/subscriptionPlan')
const WorkspaceSubscription = require('./billing/workspaceSubscription')
const PaymentTransaction = require('./billing/paymentTransaction')

// WebSocket Message Types
const WebSocketMessageType = require('./WebSocketMessageType')

const db = {
    sequelize,
    // Core Models
    User: User(sequelize, DataTypes),
    Workspace: Workspace(sequelize, DataTypes),
    WorkspaceMember: WorkspaceMember(sequelize, DataTypes),
    UserStatus: UserStatus(sequelize, DataTypes),
    WorkspaceSettings: WorkspaceSettings(sequelize, DataTypes),
    UserActivityLog: UserActivityLog(sequelize, DataTypes),

    // Messaging Models
    Channel: Channel(sequelize, DataTypes),
    ChannelMember: ChannelMember(sequelize, DataTypes),
    Message: Message(sequelize, DataTypes),
    Conversation: Conversation(sequelize, DataTypes),
    ConversationParticipant: ConversationParticipant(sequelize, DataTypes),
    DirectMessage: DirectMessage(sequelize, DataTypes),
    File: File(sequelize, DataTypes),
    Reaction: Reaction(sequelize, DataTypes),
    Mention: Mention(sequelize, DataTypes),
    PinnedItem: PinnedItem(sequelize, DataTypes),
    NotificationPreference: NotificationPreference(sequelize, DataTypes),
    UserNotification: UserNotification(sequelize, DataTypes),

    // AI Models
    Avatar: Avatar(sequelize, DataTypes),
    CommunicationHistory: CommunicationHistory(sequelize, DataTypes),

    // Billing Models
    SubscriptionPlan: SubscriptionPlan(sequelize, DataTypes),
    WorkspaceSubscription: WorkspaceSubscription(sequelize, DataTypes),
    PaymentTransaction: PaymentTransaction(sequelize, DataTypes),

    // WebSocket Message Types
    WebSocketMessageType
}

// Set up associations
Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db)
    }
})

module.exports = db