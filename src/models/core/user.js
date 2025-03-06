module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      userId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'user_id',
      },
      auth0Id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        field: 'auth0_id',
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
        field: 'username',
      },
      displayName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'display_name',
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
        field: 'email',
      },
      avatarUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'avatar_url',
      },
      status: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'status',
      }
    },
    {
      tableName: 'users',
      schema: 'core',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  User.associate = (models) => {
    // A user can belong to many workspaces through workspace_members
    User.belongsToMany(models.Workspace, {
      through: models.WorkspaceMember,
      foreignKey: 'user_id',
      otherKey: 'workspace_id',
    });

    // A user can be a member of many channels
    User.belongsToMany(models.Channel, {
      through: models.ChannelMember,
      foreignKey: 'user_id',
      otherKey: 'channel_id',
    });

    // A user can have a status
    User.hasOne(models.UserStatus, {
      foreignKey: 'user_id',
      as: 'userStatus',
    });

    // A user can have an AI avatar
    User.hasOne(models.Avatar, {
      foreignKey: 'user_id',
      as: 'avatar',
    });

    // A user can have notification preferences
    User.hasOne(models.NotificationPreference, {
      foreignKey: 'user_id',
      as: 'notificationPreferences',
    });

    // A user can send many messages
    User.hasMany(models.Message, {
      foreignKey: 'sender_id',
      as: 'sentMessages',
    });

    // A user can send many direct messages
    User.hasMany(models.DirectMessage, {
      foreignKey: 'sender_id',
      as: 'sentDirectMessages',
    });

    // A user can upload many files
    User.hasMany(models.File, {
      foreignKey: 'user_id',
      as: 'uploadedFiles',
    });

    // A user can have many reactions
    User.hasMany(models.Reaction, {
      foreignKey: 'user_id',
      as: 'reactions',
    });

    // A user can have many mentions
    User.hasMany(models.Mention, {
      foreignKey: 'user_id',
      as: 'mentions',
    });

    // A user can pin many items
    User.hasMany(models.PinnedItem, {
      foreignKey: 'pinned_by_user_id',
      as: 'pinnedItems',
    });

    // A user can receive many notifications
    User.hasMany(models.UserNotification, {
      foreignKey: 'user_id',
      as: 'notifications',
    });

    // A user can participate in many conversations
    User.belongsToMany(models.Conversation, {
      through: models.ConversationParticipant,
      foreignKey: 'user_id',
      otherKey: 'conversation_id',
    });

    // A user can create many channels
    User.hasMany(models.Channel, {
      foreignKey: 'created_by_user_id',
      as: 'createdChannels',
    });
  };

  return User;
}; 