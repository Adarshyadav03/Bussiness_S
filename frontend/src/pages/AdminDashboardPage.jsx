import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSalesOrdersApi } from '../services/salesOrderApi';
import { getInventoryApi } from '../services/inventoryApi';
import { ShoppingCart, Boxes, CheckCircle, Truck, Clock, Shield } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const AdminDashboardPage = () => {
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [ordersRes, invRes] = await Promise.all([
          getSalesOrdersApi(),
          getInventoryApi(),
        ]);
        setOrders(ordersRes.data || []);
        setInventory(invRes.data || []);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const confirmedOrders = orders.filter((o) => o.status === 'CONFIRMED');
  const dispatchedOrders = orders.filter((o) => o.status === 'DISPATCHED');

  return (
    <div>
      <div className="card-header">
        <div>
          <h2 className="card-title">Admin Operations Dashboard</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Fulfill orders, check PostgreSQL inventory locks, reserve stock, and process dispatches
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/admin/sales-orders" className="btn btn-primary">
            <ShoppingCart size={16} /> Manage Sales Orders
          </Link>
          <Link to="/admin/inventory" className="btn btn-secondary">
            <Boxes size={16} /> Manage Inventory
          </Link>
        </div>
      </div>

      {/* KPI STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#0369a1', fontSize: '0.875rem', fontWeight: 600 }}>Pending Confirmation</span>
            <Clock size={20} color="#0284c7" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0369a1', marginTop: '0.5rem' }}>
            {pendingOrders.length}
          </div>
        </div>

        <div className="card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#15803d', fontSize: '0.875rem', fontWeight: 600 }}>Stock Reserved (Confirmed)</span>
            <CheckCircle size={20} color="#16a34a" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#15803d', marginTop: '0.5rem' }}>
            {confirmedOrders.length}
          </div>
        </div>

        <div className="card" style={{ background: '#faf5ff', borderColor: '#e9d5ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#6b21a8', fontSize: '0.875rem', fontWeight: 600 }}>Dispatched Orders</span>
            <Truck size={20} color="#9333ea" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#6b21a8', marginTop: '0.5rem' }}>
            {dispatchedOrders.length}
          </div>
        </div>

        <div className="card" style={{ background: '#fffbe6', borderColor: '#ffe58f' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#b78103', fontSize: '0.875rem', fontWeight: 600 }}>Catalog Products</span>
            <Boxes size={20} color="#d48806" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#b78103', marginTop: '0.5rem' }}>
            {inventory.length}
          </div>
        </div>
      </div>

      {/* RECENT PENDING ORDERS TABLE */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', color: '#0f172a' }}>Orders Requiring Admin Action</h3>
          <Link to="/admin/sales-orders" style={{ fontSize: '0.875rem', color: '#2563eb', fontWeight: 600 }}>
            View All Sales Orders &rarr;
          </Link>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '1.5rem' }}>Loading orders...</p>
        ) : pendingOrders.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
            No pending orders waiting for confirmation.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Order Date</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>{o.order_number}</strong></td>
                    <td>{o.customer?.company_name}</td>
                    <td>{new Date(o.order_date).toLocaleDateString()}</td>
                    <td>₹{o.total_amount.toLocaleString()}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td>
                      <Link to="/admin/sales-orders" className="btn btn-primary btn-sm">
                        Check Stock & Confirm
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
