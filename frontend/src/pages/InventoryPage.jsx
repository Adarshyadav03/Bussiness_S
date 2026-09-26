import React, { useState, useEffect } from 'react';
import { getInventoryApi, updateInventoryApi } from '../services/inventoryApi';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Edit2, RefreshCw } from 'lucide-react';

export const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isAdmin } = useAuth();

  // Edit Physical Qty Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newPhysicalQty, setNewPhysicalQty] = useState(0);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await getInventoryApi();
      setInventory(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenEdit = (item) => {
    setSelectedProduct(item);
    setNewPhysicalQty(item.physical_quantity);
    setIsEditOpen(true);
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    try {
      await updateInventoryApi(selectedProduct.product_id, {
        physical_quantity: Number(newPhysicalQty),
      });
      alert('Inventory physical quantity updated successfully!');
      setIsEditOpen(false);
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update stock');
    }
  };

  return (
    <div>
      <div className="card-header">
        <div>
          <h2 className="card-title">Inventory Management</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Real-time physical stock, reserved stock, and net available quantities
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchInventory}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>Loading inventory...</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Physical Qty</th>
                  <th>Reserved Qty</th>
                  <th>Available Qty</th>
                  <th>Status</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {inventory.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <strong>{inv.product_code}</strong>
                    </td>
                    <td>{inv.product_name}</td>
                    <td>{inv.category}</td>
                    <td>{inv.unit}</td>
                    <td>{inv.physical_quantity}</td>
                    <td>{inv.reserved_quantity}</td>
                    <td>
                      <strong
                        style={{
                          color: inv.available_quantity > 0 ? '#15803d' : '#b91c1c',
                          fontSize: '1rem',
                        }}
                      >
                        {inv.available_quantity}
                      </strong>
                    </td>
                    <td>
                      <StatusBadge status={inv.status} />
                    </td>
                    {isAdmin && (
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(inv)}
                        >
                          <Edit2 size={14} /> Adjust Stock
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT PHYSICAL QUANTITY MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Adjust Physical Stock - ${selectedProduct?.product_name}`}
      >
        <form onSubmit={handleUpdateStock}>
          <div className="form-group">
            <label className="form-label">Product Code</label>
            <input
              type="text"
              className="form-input"
              value={selectedProduct?.product_code || ''}
              disabled
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            <div>
              <label className="form-label">Currently Reserved</label>
              <input
                type="text"
                className="form-input"
                value={selectedProduct?.reserved_quantity || 0}
                disabled
              />
            </div>
            <div>
              <label className="form-label">New Physical Quantity</label>
              <input
                type="number"
                min={selectedProduct?.reserved_quantity || 0}
                className="form-input"
                value={newPhysicalQty}
                onChange={(e) => setNewPhysicalQty(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer" style={{ padding: 0 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Update Stock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
