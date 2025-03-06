module.exports = (sequelize, DataTypes) => {
  const WorkspaceSubscription = sequelize.define(
    'WorkspaceSubscription',
    {
      subscriptionId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'subscription_id',
      },
      workspaceId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
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
      planId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'plan_id',
        references: {
          model: {
            tableName: 'subscription_plans',
            schema: 'billing'
          },
          key: 'plan_id',
        },
        onDelete: 'CASCADE',
      },
      billingInformation: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: 'billing_information',
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'start_date',
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'end_date',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      }
    },
    {
      tableName: 'workspace_subscriptions',
      schema: 'billing',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  WorkspaceSubscription.associate = (models) => {
    // WorkspaceSubscription belongs to a Workspace
    WorkspaceSubscription.belongsTo(models.Workspace, {
      foreignKey: 'workspace_id',
      as: 'workspace',
      onDelete: 'CASCADE',
    });

    // WorkspaceSubscription belongs to a SubscriptionPlan
    WorkspaceSubscription.belongsTo(models.SubscriptionPlan, {
      foreignKey: 'plan_id',
      as: 'plan',
      onDelete: 'CASCADE',
    });

    // WorkspaceSubscription can have many PaymentTransactions
    WorkspaceSubscription.hasMany(models.PaymentTransaction, {
      foreignKey: 'subscription_id',
      as: 'transactions',
    });
  };

  return WorkspaceSubscription;
}; 