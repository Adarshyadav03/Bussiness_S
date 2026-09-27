import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  FileText,
  DollarSign,
  ShoppingCart,
  Boxes,
  Factory,
} from 'lucide-react';

export const Sidebar = () => {
  const { isAdmin } = useAuth();
  const prefix = isAdmin ? '/admin' : '/sales';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Factory size={24} color="#38bdf8" />
        <span>PERN ERP</span>
      </div>
      <nav className="sidebar-nav">
        <NavLink
          to={`${prefix}/dashboard`}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to={`${prefix}/enquiries`}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <FileText size={18} />
          <span>Enquiries</span>
        </NavLink>

        <NavLink
          to={`${prefix}/quotations`}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <DollarSign size={18} />
          <span>Quotations</span>
        </NavLink>

        <NavLink
          to={`${prefix}/sales-orders`}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <ShoppingCart size={18} />
          <span>Sales Orders</span>
        </NavLink>

        <NavLink
          to={`${prefix}/inventory`}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Boxes size={18} />
          <span>{isAdmin ? 'Inventory' : 'Stock Availability'}</span>
        </NavLink>
      </nav>
    </aside>
  );
};
