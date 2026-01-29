
import React from 'react';
import { AuthManager } from '../../services/AuthManager';
import { AccountManager } from '../../services/AccountManager';
import { Permission } from '../../types';

interface CanProps {
  perform: Permission;
  onOwnerId?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * A declarative wrapper for UI trimming. 
 * Renders children only if the current user has the specified permission.
 */
export const Can: React.FC<CanProps> = ({ perform, onOwnerId, fallback = null, children }) => {
  const user = AuthManager.getCurrentUser();
  
  if (!user) return <>{fallback}</>;
  
  const allowed = AccountManager.hasPermission(user, perform, onOwnerId);
  
  return allowed ? <>{children}</> : <>{fallback}</>;
};
