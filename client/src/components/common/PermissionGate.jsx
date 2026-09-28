import React from 'react';

/**
 * PermissionGate conditionally renders UI elements based on user permissions or roles.
 * Usage:
 * <PermissionGate permission="invoice.create">
 *   <button>Create Invoice</button>
 * </PermissionGate>
 */
export default function PermissionGate({ currentUser, permission, role, fallback = null, children }) {
  if (!currentUser) return fallback;

  // CEO bypasses all permission checks
  if (currentUser.role === 'CEO') {
    return <>{children}</>;
  }

  // Check role match
  if (role) {
    const rolesArray = Array.isArray(role) ? role : [role];
    if (rolesArray.includes(currentUser.role)) {
      return <>{children}</>;
    }
    return fallback;
  }

  // Check granular permission
  if (permission) {
    const userPermissions = currentUser.permissions || [];
    if (userPermissions.includes(permission)) {
      return <>{children}</>;
    }
    return fallback;
  }

  return <>{children}</>;
}
