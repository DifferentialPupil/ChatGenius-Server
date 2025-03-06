module.exports = (sequelize, DataTypes) => {
  const SubscriptionPlan = sequelize.define(
    'SubscriptionPlan',
    {
      planId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'plan_id',
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
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'price',
      },
      billingInterval: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'monthly',
        field: 'billing_interval',
      },
      features: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: 'features',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      }
    },
    {
      tableName: 'subscription_plans',
      schema: 'billing',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  SubscriptionPlan.associate = (models) => {
    // SubscriptionPlan can have many WorkspaceSubscriptions
    SubscriptionPlan.hasMany(models.WorkspaceSubscription, {
      foreignKey: 'plan_id',
      as: 'subscriptions',
    });
  };

  return SubscriptionPlan;
}; 