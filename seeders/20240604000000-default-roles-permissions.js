'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Define modules and their actions
    const modules = {
      dashboard: [
        { action: 'view', description: 'View dashboard' },
        { action: 'view_admin', description: 'View admin dashboard with all metrics' }
      ],
      user_management: [
        { action: 'view', description: 'View users' },
        { action: 'create', description: 'Create users' },
        { action: 'update', description: 'Update users' },
        { action: 'delete', description: 'Delete users' },
        { action: 'activate', description: 'Activate/Deactivate users' }
      ],
      property_management: [
        { action: 'view', description: 'View properties' },
        { action: 'create', description: 'Create properties' },
        { action: 'update', description: 'Update properties' },
        { action: 'delete', description: 'Delete properties' },
        { action: 'approve', description: 'Approve/Reject property listings' }
      ],
      owner_management: [
        { action: 'view', description: 'View property owners' },
        { action: 'activate', description: 'Activate/Deactivate property owners' }
      ],
      subscription_plans: [
        { action: 'view', description: 'View subscription plans' },
        { action: 'create', description: 'Create subscription plans' },
        { action: 'update', description: 'Update subscription plans' },
        { action: 'delete', description: 'Delete subscription plans' }
      ],
      payment_reports: [
        { action: 'view', description: 'View payment reports' }
      ],
      review_management: [
        { action: 'view', description: 'View reviews' },
        { action: 'moderate', description: 'Moderate reviews' },
        { action: 'reply', description: 'Reply to reviews' }
      ],
      role_permission: [
        { action: 'view', description: 'View roles and permissions' },
        { action: 'create', description: 'Create roles and permissions' },
        { action: 'update', description: 'Update roles and permissions' },
        { action: 'delete', description: 'Delete roles and permissions' },
        { action: 'assign', description: 'Assign roles to users' }
      ],
      notification_center: [
        { action: 'view', description: 'View notifications' },
        { action: 'send', description: 'Send notifications' }
      ],
      cms: [
        { action: 'view', description: 'View CMS pages' },
        { action: 'update', description: 'Update CMS pages' }
      ],
      settings: [
        { action: 'view', description: 'View settings' },
        { action: 'update', description: 'Update settings' }
      ],
      booking: [
        { action: 'view', description: 'View bookings' },
        { action: 'create', description: 'Create booking requests' },
        { action: 'update', description: 'Update booking status' },
        { action: 'delete', description: 'Cancel bookings' }
      ],
      profile: [
        { action: 'view', description: 'View own profile' },
        { action: 'update', description: 'Update own profile' }
      ],
      wishlist: [
        { action: 'view', description: 'View wishlists' },
        { action: 'create', description: 'Add to wishlist' },
        { action: 'delete', description: 'Remove from wishlist' }
      ]
    };

    // Generate all permissions
    const permissions = [];
    const permissionIds = {};

    Object.entries(modules).forEach(([module, actions]) => {
      actions.forEach(({ action, description }) => {
        const id = uuidv4();
        permissionIds[`${module}_${action}`] = id;
        
        permissions.push({
          id,
          name: `${module.replace('_', ' ')} - ${action.replace('_', ' ')}`,
          module,
          action,
          description,
          isSystem: true,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
    });

    // Create default roles
    const roles = [
      {
        id: uuidv4(),
        name: 'Super Admin',
        description: 'Has full control over the system, users, properties, settings, and permissions.',
        isSystem: true,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Property Owner',
        description: 'Manages their own properties, bookings, payments, and profile.',
        isSystem: true,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'End User',
        description: 'Can search, view, book, and review properties.',
        isSystem: true,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Define role-permission mappings
    const rolePermissions = [];

    // Super Admin - gets all permissions
    permissions.forEach(permission => {
      rolePermissions.push({
        id: uuidv4(),
        roleId: roles[0].id, // Super Admin role
        permissionId: permission.id,
        createdAt: new Date()
      });
    });

    // Property Owner permissions
    const propertyOwnerPermissions = [
      'dashboard_view',
      'property_management_view',
      'property_management_create',
      'property_management_update',
      'property_management_delete',
      'booking_view',
      'booking_update',
      'payment_reports_view',
      'review_management_view',
      'review_management_reply',
      'notification_center_view',
      'profile_view',
      'profile_update'
    ];

    propertyOwnerPermissions.forEach(permKey => {
      rolePermissions.push({
        id: uuidv4(),
        roleId: roles[1].id, // Property Owner role
        permissionId: permissionIds[permKey],
        createdAt: new Date()
      });
    });

    // End User permissions
    const endUserPermissions = [
      'property_management_view',
      'booking_view',
      'booking_create',
      'booking_delete',
      'review_management_view',
      'notification_center_view',
      'profile_view',
      'profile_update',
      'wishlist_view',
      'wishlist_create',
      'wishlist_delete'
    ];

    endUserPermissions.forEach(permKey => {
      rolePermissions.push({
        id: uuidv4(),
        roleId: roles[2].id, // End User role
        permissionId: permissionIds[permKey],
        createdAt: new Date()
      });
    });

    // Insert data into tables
    await queryInterface.bulkInsert('Permissions', permissions);
    await queryInterface.bulkInsert('Roles', roles);
    await queryInterface.bulkInsert('RolePermissions', rolePermissions);

    // Assign Super Admin role to any existing admin users
    const admins = await queryInterface.sequelize.query(
      `SELECT id FROM Users WHERE userType = 'admin'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (admins.length > 0) {
      const userRoles = admins.map(admin => ({
        id: uuidv4(),
        userId: admin.id,
        roleId: roles[0].id, // Super Admin role
        createdAt: new Date()
      }));

      await queryInterface.bulkInsert('UserRoles', userRoles);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('UserRoles', null, {});
    await queryInterface.bulkDelete('RolePermissions', null, {});
    await queryInterface.bulkDelete('Roles', null, {});
    await queryInterface.bulkDelete('Permissions', null, {});
  }
}; 