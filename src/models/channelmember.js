module.exports = (sequelize, DataTypes) => {
  const ChannelMember = sequelize.define(
    'channelmember',
    {
      channelMemberid: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        field: 'channelmemberid',
      },
      channelid: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'channelid',
      },
      userid: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'userid',
      },
      role: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'member',
        field: 'role',
      },
    },
    {
      tableName: 'channelmembers',
      timestamps: true,
      createdAt: 'createdat',
      updatedAt: 'updatedat',
      indexes: [
        {
          unique: true,
          fields: ['channelid', 'userid'],
        },
      ],
    }
  );

  // ChannelMember.associate = (models) => {
  //   ChannelMember.belongsTo(models.Channel, {
  //     foreignKey: 'channelid',
  //     onDelete: 'CASCADE',
  //   });

  //   ChannelMember.belongsTo(models.User, {
  //     foreignKey: 'userid',
  //     onDelete: 'CASCADE',
  //   });
  // };

  return ChannelMember;
};