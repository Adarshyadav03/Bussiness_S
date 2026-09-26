import React from 'react';
import { useAuth } from '../hooks/useAuth';

export const RoleGuard = ({ allowedRoles, children, fallback = null }) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return fallback;
  }

  return children;
};
