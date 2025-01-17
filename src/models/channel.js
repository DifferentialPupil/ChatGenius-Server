module.exports = (sequelize, DataTypes) => {
  const Channel = sequelize.define(
    'channel',
    {
      channelid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'channelid',
      },
      workspaceid: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'workspaceid',
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
      ispublic: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'ispublic',
      },
      topic: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'topic',
      },
      createdbyuserid: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'createdbyuserid',
      }
    },
    {
      tableName: 'channels',
      timestamps: true,    // Uses createdAt/updatedAt by default
      createdAt: 'createdat',
      updatedAt: 'updatedat',
      underscored: false,  // Switch to true if you prefer snake_case columns
    }
  );

  // If you have associations, define them here. For example:
  /*
  Channel.associate = (models) => {
    Channel.belongsTo(models.Workspace, {
      foreignKey: 'workspaceId',
      onDelete: 'CASCADE',
    });

    Channel.belongsTo(models.User, {
      foreignKey: 'createdByUserId',
      onDelete: 'SET NULL',
    });
  };
  */

  return Channel;
};