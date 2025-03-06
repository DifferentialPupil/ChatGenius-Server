const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Reaction = sequelize.define(
    'Reaction',
    {
      reactionId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'reaction_id',
      },
      messageId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'message_id',
        references: {
          model: {
            tableName: 'messages',
            schema: 'messaging'
          },
          key: 'message_id',
        },
        onDelete: 'CASCADE',
      },
      directMessageId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'direct_message_id',
        references: {
          model: {
            tableName: 'direct_messages',
            schema: 'messaging'
          },
          key: 'direct_message_id',
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
      },
      emoji: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'emoji',
      }
    },
    {
      tableName: 'reactions',
      schema: 'messaging',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['user_id', 'message_id', 'emoji'],
          where: { message_id: { [Op.ne]: null } }
        },
        {
          unique: true,
          fields: ['user_id', 'direct_message_id', 'emoji'],
          where: { direct_message_id: { [Op.ne]: null } }
        }
      ],
      validate: {
        eitherMessageOrDirectMessage() {
          if ((this.messageId === null && this.directMessageId === null) || 
              (this.messageId !== null && this.directMessageId !== null)) {
            throw new Error('Either messageId or directMessageId must be provided, but not both');
          }
        }
      }
    }
  );

  Reaction.associate = (models) => {
    // Reaction can belong to a Message
    Reaction.belongsTo(models.Message, {
      foreignKey: 'message_id',
      as: 'message',
      onDelete: 'CASCADE',
    });

    // Reaction can belong to a DirectMessage
    Reaction.belongsTo(models.DirectMessage, {
      foreignKey: 'direct_message_id',
      as: 'directMessage',
      onDelete: 'CASCADE',
    });

    // Reaction belongs to a User
    Reaction.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  return Reaction;
}; 