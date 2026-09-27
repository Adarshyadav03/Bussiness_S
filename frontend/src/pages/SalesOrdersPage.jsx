import React, { useState, useEffect } from 'react';
import {
  getSalesOrdersApi,
  getSalesOrderByIdApi,
  confirmSalesOrderApi,
  dispatchSalesOrderApi,
} from '../services/salesOrderApi';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { InventoryStatus } from '../components/InventoryStatus';
import { Eye, CheckCircle, Truck } from 'lucide-react';

export const SalesOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isAdmin } = useAuth();

  // Modals state
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Dispatch Form
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [dispatchError, setDispatchError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getSalesOrdersApi();
      setOrders(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sales orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenView = async (id) => {
    try {
      const res = await getSalesOrderByIdApi(id);
      setSelectedOrder(res.data);
      setIsViewOpen(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to fetch order details');
    }
  };

  const handleConfirmOrder = async (id) => {
    try {
      await confirmSalesOrderApi(id);
      alert('Sales Order CONFIRMED and inventory reserved successfully!');
      fetchData();
      setIsViewOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Order confirmation failed');
    }
  };

  const handleOpenDispatch = (order) => {
    setSelectedOrder(order);
    setVehicleNumber('');
    setDriverName('');
    setDispatchError(null);
    setIsDispatchOpen(true);
  };

  const handleProcessDispatch = async (e) => {
    e.preventDefault();
    setDispatchError(null);
    try {
      await dispatchSalesOrderApi(selectedOrder.id, {
        vehicle_number: vehicleNumber,
        driver_name: driverName,
      });
      alert('Order DISPATCHED successfully! Physical & reserved stock updated.');
      setIsDispatchOpen(false);
      fetchData();
      if (isViewOpen) setIsViewOpen(false);
    } catch (err) {
      setDispatchError(err.response?.data?.message || 'Dispatch processing failed');
    }
  };

  return (
    <div>
      <div className="card-header">
        <div>
          <h2 className="card-title">Sales Orders</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Monitor order processing, inventory reservation, and dispatch fulfillment
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>Loading sales orders...</p>
        ) : orders.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            No sales orders generated yet. Accept a quotation and convert it to a Sales Order.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Quotation Ref</th>
                  <th>Order Date</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.order_number}</strong>
                    </td>
                    <td>{o.customer?.company_name}</td>
                    <td>{o.quotation?.quotation_number}</td>
                    <td>{new Date(o.order_date).toLocaleDateString()}</td>
                    <td>
                      <strong>₹{o.total_amount.toLocaleString()}</strong>
                    </td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenView(o.id)}
                        >
                          <Eye size={14} /> View Details
                        </button>

                        {isAdmin && o.status === 'PENDING' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleConfirmOrder(o.id)}
                          >
                            <CheckCircle size={14} /> Confirm Order
                          </button>
                        )}

                        {isAdmin && o.status === 'CONFIRMED' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleOpenDispatch(o)}
                          >
                            <Truck size={14} /> Process Dispatch
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW ORDER DETAILS & INVENTORY BREAKDOWN MODAL */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={`Sales Order Details - ${selectedOrder?.order_number}`}
      >
        {selectedOrder && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1rem',
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: '6px',
              }}
            >
              <div>
                <strong>Customer:</strong> {selectedOrder.customer?.company_name}
                <br />
                <strong>Contact Person:</strong> {selectedOrder.customer?.contact_person}
                <br />
                <strong>Quotation Reference:</strong> {selectedOrder.quotation?.quotation_number}
              </div>
              <div>
                <strong>Order Date:</strong>{' '}
                {new Date(selectedOrder.order_date).toLocaleDateString()}
                <br />
                <strong>Total Amount:</strong> ₹{selectedOrder.total_amount.toLocaleString()}
                <br />
                <strong>Status:</strong> <StatusBadge status={selectedOrder.status} />
              </div>
            </div>

            {/* Inventory Stock Status Breakdown Component */}
            <InventoryStatus items={selectedOrder.items} />

            {/* Dispatch details if available */}
            {selectedOrder.dispatches && selectedOrder.dispatches.length > 0 && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                }}
              >
                <h4 style={{ color: '#166534', marginBottom: '0.5rem' }}>
                  Dispatch Information
                </h4>
                {selectedOrder.dispatches.map((d) => (
                  <div key={d.id} style={{ fontSize: '0.875rem' }}>
                    <strong>Dispatch No:</strong> {d.dispatch_number} |{' '}
                    <strong>Date:</strong> {new Date(d.dispatch_date).toLocaleDateString()} |{' '}
                    <strong>Vehicle:</strong> {d.vehicle_number} |{' '}
                    <strong>Driver:</strong> {d.driver_name}
                  </div>
                ))}
              </div>
            )}

            <div className="modal-footer" style={{ marginTop: '1.5rem', padding: 0 }}>
              {isAdmin && selectedOrder.status === 'PENDING' && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleConfirmOrder(selectedOrder.id)}
                >
                  <CheckCircle size={16} /> Confirm Order & Reserve Stock
                </button>
              )}

              {isAdmin && selectedOrder.status === 'CONFIRMED' && (
                <button
                  className="btn btn-success"
                  onClick={() => handleOpenDispatch(selectedOrder)}
                >
                  <Truck size={16} /> Process Dispatch
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* DISPATCH PROCESS MODAL */}
      <Modal
        isOpen={isDispatchOpen}
        onClose={() => setIsDispatchOpen(false)}
        title={`Process Dispatch - Order ${selectedOrder?.order_number}`}
      >
        <form onSubmit={handleProcessDispatch}>
          {dispatchError && <div className="alert alert-danger">{dispatchError}</div>}

          <div className="form-group">
            <label className="form-label">Vehicle Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. MH-12-AB-1234"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Driver Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Rajesh Kumar"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              required
            />
          </div>

          <div
            style={{
              padding: '1rem',
              background: '#fffbe6',
              border: '1px solid #ffe58f',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              color: '#d48806',
              marginBottom: '1rem',
            }}
          >
            <strong>Note:</strong> Dispatching will permanently decrease Physical Inventory stock
            and release Reserved Inventory stock in PostgreSQL.
          </div>

          <div className="modal-footer" style={{ padding: 0 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsDispatchOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-success">
              <Truck size={16} /> Complete Dispatch
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
