import React from 'react';
import { StatusBadge } from './StatusBadge';

export const InventoryStatus = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="card" style={{ marginTop: '1rem', background: '#f8fafc' }}>
      <h4 style={{ marginBottom: '1rem', color: '#1e293b' }}>Inventory Stock Availability Breakdown</h4>
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Product Code</th>
              <th>Product Name</th>
              <th>Required Qty</th>
              <th>Physical Qty</th>
              <th>Reserved Qty</th>
              <th>Available Qty</th>
              <th>Stock Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const product = item.product || {};
              const inv = product.inventory || {};
              const physical = inv.physical_quantity ?? 0;
              const reserved = inv.reserved_quantity ?? 0;
              const available = physical - reserved;
              const isAvailable = available >= item.quantity;

              return (
                <tr key={item.id || item.product_id}>
                  <td><strong>{product.product_code || `P-${item.product_id}`}</strong></td>
                  <td>{product.product_name || 'Industrial Product'}</td>
                  <td><strong>{item.quantity}</strong></td>
                  <td>{physical}</td>
                  <td>{reserved}</td>
                  <td><strong>{available}</strong></td>
                  <td>
                    <StatusBadge status={isAvailable ? 'AVAILABLE' : 'INSUFFICIENT'} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
