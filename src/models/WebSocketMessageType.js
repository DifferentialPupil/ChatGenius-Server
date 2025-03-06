/**
 * Enum for the different websocket message types that can be received.
 */
const WebSocketMessageType = {
    // Message Events
    NEW_MESSAGE: 'new_message',
    MESSAGE_UPDATED: 'message_updated',
    MESSAGE_DELETED: 'message_deleted',
    
    // Direct Message Events
    NEW_DIRECT_MESSAGE: 'new_direct_message',

    // Channel Events
    CHANNEL_CREATED: 'channel_created',
    CHANNEL_UPDATED: 'channel_updated',
    CHANNEL_DELETED: 'channel_deleted',
    CHANNEL_MEMBER_ADDED: 'channel_member_added',
    CHANNEL_MEMBER_REMOVED: 'channel_member_removed',
    
    // Reaction Events
    NEW_REACTION: 'new_reaction',
    REACTION_REMOVED: 'reaction_removed',
    
    // Thread Events
    NEW_THREAD_REPLY: 'new_thread_reply',
    
    // Pin Events
    NEW_PIN: 'new_pin',
    PIN_REMOVED: 'pin_removed',

    // User Events
    USER_STATUS_UPDATE: 'user_status_update',
    USER_ONLINE: 'user_online',
    USER_OFFLINE: 'user_offline',
    
    // Typing Indicators
    TYPING_START: 'typing_start',
    TYPING_STOP: 'typing_stop',
    
    // Notification Events
    NEW_NOTIFICATION: 'new_notification',
    
    // Workspace Events
    WORKSPACE_CREATED: 'workspace_created',
    WORKSPACE_UPDATED: 'workspace_updated',
    WORKSPACE_DELETED: 'workspace_deleted'
};

module.exports = WebSocketMessageType;