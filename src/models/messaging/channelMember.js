module.exports = (sequelize, DataTypes) => {
  const ChannelMember = sequelize.define(
    'ChannelMember',
    {
      channelMemberId: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        field: 'channel_member_id',
      },
      channelId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'channel_id',
        references: {
          model: {
            tableName: 'channels',
            schema: 'messaging'
          },
          key: 'channel_id',
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
      role: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'member',
        field: 'role',
      },
    },
    {
      tableName: 'channel_members',
      schema: 'messaging',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['channel_id', 'user_id'],
        },
      ],
    }
  );

  ChannelMember.associate = (models) => {
    // ChannelMember belongs to a Channel
    ChannelMember.belongsTo(models.Channel, {
      foreignKey: 'channel_id',
      as: 'channel',
      onDelete: 'CASCADE',
    });

    // ChannelMember belongs to a User
    ChannelMember.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  return ChannelMember;
}; 