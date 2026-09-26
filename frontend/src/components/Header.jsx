import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-title">ERP System - Manufacturing & Supply</div>
      <div className="header-user-info">
        <div className="user-badge">
          <span className="user-name">{user?.name}</span>
          <span className="user-role">
            <StatusBadge status={user?.role} />
          </span>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={logout} title="Logout">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </header>
  );
};
