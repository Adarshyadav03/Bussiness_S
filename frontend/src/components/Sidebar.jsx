import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  FileText,
  DollarSign,
  ShoppingCart,
  Boxes,
  Factory,
} from 'lucide-react';

export const Sidebar = () => {
  const { user, isAdmin } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Factory size={24} color="#38bdf8" />
        <span>PERN ERP</span>
      </div>
      <nav className="sidebar-nav">
        <NavLink
          to="/enquiries"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <FileText size={18} />
          <span>Enquiries</span>
        </NavLink>

        <NavLink
          to="/quotations"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <DollarSign size={18} />
          <span>Quotations</span>
        </NavLink>

        <NavLink
          to="/sales-orders"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <ShoppingCart size={18} />
          <span>Sales Orders</span>
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/inventory"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Boxes size={18} />
            <span>Inventory</span>
          </NavLink>
        )}
      </nav>
    </aside>
  );
};
