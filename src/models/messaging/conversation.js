module.exports = (sequelize, DataTypes) => {
  const Conversation = sequelize.define(
    'Conversation',
    {
      conversationId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'conversation_id',
      }
    },
    {
      tableName: 'conversations',
      schema: 'messaging',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  Conversation.associate = (models) => {
    // Conversation can have many participants
    Conversation.belongsToMany(models.User, {
      through: models.ConversationParticipant,
      foreignKey: 'conversation_id',
      otherKey: 'user_id',
      as: 'participants',
    });

    // Conversation can have many direct messages
    Conversation.hasMany(models.DirectMessage, {
      foreignKey: 'conversation_id',
      as: 'messages',
    });
  };

  return Conversation;
}; 