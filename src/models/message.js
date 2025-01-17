module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define(
    'message',
    {
      messageid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'messageid',
      },
      channelid: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'channelid',
      },
      senderid: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'senderid',
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'content',
      },
      fileid: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'fileid',
      }
    },
    {
      tableName: 'messages',
      timestamps: true,    // Uses createdAt/updatedAt by default
      createdAt: 'createdat',
      updatedAt: 'updatedat',
      underscored: false,  // Switch to true if you prefer snake_case columns
    }
  );

  // Example associations (if defined in your project):
  /*
  Message.associate = (models) => {
    // A message belongs to a channel
    Message.belongsTo(models.Channel, {
      foreignKey: 'channelId',
      onDelete: 'CASCADE',
    });

    // A message belongs to a user (sender)
    Message.belongsTo(models.User, {
      foreignKey: 'senderId',
      onDelete: 'CASCADE',
    });
  };
  */

  return Message;
};