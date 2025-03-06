module.exports = (sequelize, DataTypes) => {
  const ConversationParticipant = sequelize.define(
    'ConversationParticipant',
    {
      participantId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'participant_id',
      },
      conversationId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'conversation_id',
        references: {
          model: {
            tableName: 'conversations',
            schema: 'messaging'
          },
          key: 'conversation_id',
        },
        onDelete: 'CASCADE',
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
        references: {
          model: {
            tableName: 'users',
            schema: 'core'
          },
          key: 'user_id',
        },
        onDelete: 'CASCADE',
      }
    },
    {
      tableName: 'conversation_participants',
      schema: 'messaging',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false, // There's no updated_at field in this table according to the schema
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['conversation_id', 'user_id'],
        },
      ],
    }
  );

  ConversationParticipant.associate = (models) => {
    // ConversationParticipant belongs to a Conversation
    ConversationParticipant.belongsTo(models.Conversation, {
      foreignKey: 'conversation_id',
      as: 'conversation',
      onDelete: 'CASCADE',
    });

    // ConversationParticipant belongs to a User
    ConversationParticipant.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  return ConversationParticipant;
};