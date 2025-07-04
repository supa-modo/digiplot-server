"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create leases table
    await queryInterface.createTable("leases", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      unit_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "units",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      landlord_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      monthly_rent: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      security_deposit: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM("active", "expired", "terminated", "pending"),
        defaultValue: "pending",
        allowNull: false,
      },
      move_in_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      move_out_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      renewal_terms: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      termination_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Add indexes for better performance
    await queryInterface.addIndex("leases", ["tenant_id"]);
    await queryInterface.addIndex("leases", ["unit_id"]);
    await queryInterface.addIndex("leases", ["landlord_id"]);
    await queryInterface.addIndex("leases", ["status"]);

    // Add unique constraint for one active lease per unit
    await queryInterface.addIndex("leases", {
      fields: ["unit_id", "status"],
      unique: true,
      where: { status: "active" },
      name: "one_active_lease_per_unit",
    });

    // Add lease_id column to payments table
    await queryInterface.addColumn("payments", "lease_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "leases",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // Add index for lease_id in payments
    await queryInterface.addIndex("payments", ["lease_id"]);
  },

  async down(queryInterface, Sequelize) {
    // Remove lease_id column from payments table
    await queryInterface.removeColumn("payments", "lease_id");

    // Drop leases table
    await queryInterface.dropTable("leases");
  },
};
