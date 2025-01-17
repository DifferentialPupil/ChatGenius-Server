module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'user',
    {
      userid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'userid',
      },
      auth0id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        field: 'auth0id',
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
        field: 'username',
      },
      displayname: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'displayname',
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
      avatarurl: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'avatarurl',
      },
      status: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'status',
      }
    },
    {
      tableName: 'users',
      timestamps: true,         // Uses createdAt/updatedAt by default
      createdAt: 'createdat',
      updatedAt: 'updatedat',
      underscored: false,       // If you prefer snake_case columns, set to true
    }
  );

  // Associations can be defined here
  // For example, if you have a Workspace model:
  /*
    User.associate = (models) => {
      User.belongsTo(models.Workspace, {
        foreignKey: 'workspaceId',
        onDelete: 'CASCADE',
      });
    };
  */

  return User;
};