module.exports = (sequelize, DataTypes) => {
  const Channel = sequelize.define(
    'Channel',
    {
      channelId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'channel_id',
      },
      workspaceId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'workspace_id',
        references: {
          model: {
            tableName: 'workspaces',
            schema: 'core'
          },
          key: 'workspace_id',
        },
        onDelete: 'CASCADE',
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'name',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'description',
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_public',
      },
      topic: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'topic',
      },
      createdByUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'created_by_user_id',
        references: {
          model: {
            tableName: 'users',
            schema: 'core'
          },
          key: 'user_id',
        },
        onDelete: 'SET NULL',
      }
    },
    {
      tableName: 'channels',
      schema: 'messaging',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  Channel.associate = (models) => {
    // Channel belongs to a Workspace
    Channel.belongsTo(models.Workspace, {
      foreignKey: 'workspace_id',
      as: 'workspace',
      onDelete: 'CASCADE',
    });

    // Channel belongs to a User (creator)
    Channel.belongsTo(models.User, {
      foreignKey: 'created_by_user_id',
      as: 'creator',
      onDelete: 'SET NULL',
    });

    // Channel can have many ChannelMembers
    Channel.hasMany(models.ChannelMember, {
      foreignKey: 'channel_id',
      as: 'members',
    });

    // Channel can have many Users through ChannelMembers
    Channel.belongsToMany(models.User, {
      through: models.ChannelMember,
      foreignKey: 'channel_id',
      otherKey: 'user_id',
      as: 'users',
    });

    // Channel can have many Messages
    Channel.hasMany(models.Message, {
      foreignKey: 'channel_id',
      as: 'messages',
    });

    // Channel can have many PinnedItems
    Channel.hasMany(models.PinnedItem, {
      foreignKey: 'channel_id',
      as: 'pinnedItems',
    });
  };

  return Channel;
}; 