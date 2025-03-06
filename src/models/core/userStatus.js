module.exports = (sequelize, DataTypes) => {
  const UserStatus = sequelize.define(
    'UserStatus',
    {
      userStatusId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'user_status_id',
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
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
      statusText: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'status_text',
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'expires_at',
      },
    },
    {
      tableName: 'user_statuses',
      schema: 'core',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  UserStatus.associate = (models) => {
    // A UserStatus belongs to a User
    UserStatus.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  return UserStatus;
}; 