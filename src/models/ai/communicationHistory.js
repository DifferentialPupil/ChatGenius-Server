module.exports = (sequelize, DataTypes) => {
  const CommunicationHistory = sequelize.define(
    'CommunicationHistory',
    {
      communicationId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'communication_id',
      },
      avatarId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'avatar_id',
        references: {
          model: {
            tableName: 'avatars',
            schema: 'ai'
          },
          key: 'avatar_id',
        },
        onDelete: 'CASCADE',
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'type',
      },
      prompt: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'prompt',
      },
      response: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'response',
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'timestamp',
      },
      feedback: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'feedback',
      },
      contextSlackConversation: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: 'context_slack_conversation',
      }
    },
    {
      tableName: 'communication_history',
      schema: 'ai',
      timestamps: false, // Using timestamp field instead
      underscored: true,
    }
  );

  CommunicationHistory.associate = (models) => {
    // CommunicationHistory belongs to an Avatar
    CommunicationHistory.belongsTo(models.Avatar, {
      foreignKey: 'avatar_id',
      as: 'avatar',
      onDelete: 'CASCADE',
    });
  };

  return CommunicationHistory;
}; 