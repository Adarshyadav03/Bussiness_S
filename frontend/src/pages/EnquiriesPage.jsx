import React, { useState, useEffect } from 'react';
import { getEnquiriesApi, createEnquiryApi } from '../services/enquiryApi';
import { getCustomersApi, createCustomerApi } from '../services/customerApi';
import { getProductsApi } from '../services/productApi';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Plus, Trash2, Eye, FilePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EnquiriesPage = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isSalesUser } = useAuth();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // New Customer inline option
  const [customerMode, setCustomerMode] = useState('select'); // 'select' or 'new'
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustomer, setNewCustomer] = useState({
    company_name: '',
    contact_person: '',
    mobile: '',
    email: '',
    city: '',
  });

  // Enquiry Details Form
  const [requiredDate, setRequiredDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);

  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [enqRes, custRes, prodRes] = await Promise.all([
        getEnquiriesApi(),
        getCustomersApi(),
        getProductsApi(),
      ]);
      setEnquiries(enqRes.data || []);
      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItem = () => {
    setItems([...items, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleCreateEnquiry = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      let customerId = selectedCustomerId;

      // If creating new customer inline
      if (customerMode === 'new') {
        const custRes = await createCustomerApi(newCustomer);
        customerId = custRes.data.id;
      }

      if (!customerId) {
        alert('Please select or create a customer');
        return;
      }

      // Filter valid items
      const validItems = items
        .filter((i) => i.product_id && Number(i.quantity) > 0)
        .map((i) => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity),
        }));

      if (validItems.length === 0) {
        alert('Please add at least one product with quantity > 0');
        return;
      }

      await createEnquiryApi({
        customer_id: Number(customerId),
        required_date: new Date(requiredDate).toISOString(),
        notes,
        items: validItems,
      });

      setIsCreateOpen(false);
      // Reset form
      setSelectedCustomerId('');
      setRequiredDate('');
      setNotes('');
      setItems([{ product_id: '', quantity: 1 }]);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create enquiry');
    }
  };

  return (
    <div>
      <div className="card-header">
        <div>
          <h2 className="card-title">Customer Enquiries</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Manage incoming sales requests and customer requirements
          </p>
        </div>
        {isSalesUser && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setError(null);
              setIsCreateOpen(true);
            }}
          >
            <Plus size={18} /> Create Enquiry
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>Loading enquiries...</p>
        ) : enquiries.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            {isSalesUser
              ? "No enquiries recorded yet. Click '+ Create Enquiry' to start."
              : 'No enquiries recorded yet.'}
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Enquiry Number</th>
                  <th>Customer</th>
                  <th>Enquiry Date</th>
                  <th>Required Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.map((enq) => (
                  <tr key={enq.id}>
                    <td>
                      <strong>{enq.enquiry_number}</strong>
                    </td>
                    <td>{enq.customer?.company_name}</td>
                    <td>{new Date(enq.enquiry_date).toLocaleDateString()}</td>
                    <td>{new Date(enq.required_date).toLocaleDateString()}</td>
                    <td>
                      <StatusBadge status={enq.status} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setSelectedEnquiry(enq);
                            setIsViewOpen(true);
                          }}
                        >
                          <Eye size={14} /> View
                        </button>
                        {isSalesUser && enq.status === 'NEW' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() =>
                              navigate('/quotations', { state: { createFromEnquiry: enq } })
                            }
                          >
                            <FilePlus size={14} /> Create Quotation
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

      {/* CREATE ENQUIRY MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Enquiry"
      >
        <form onSubmit={handleCreateEnquiry}>
          <h4 style={{ marginBottom: '0.75rem', color: '#1e293b' }}>1. Customer Details</h4>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ marginRight: '1rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="custMode"
                value="select"
                checked={customerMode === 'select'}
                onChange={() => setCustomerMode('select')}
              />{' '}
              Select Existing Customer
            </label>
            <label style={{ cursor: 'pointer' }}>
              <input
                type="radio"
                name="custMode"
                value="new"
                checked={customerMode === 'new'}
                onChange={() => setCustomerMode('new')}
              />{' '}
              Add New Customer
            </label>
          </div>

          {customerMode === 'select' ? (
            <div className="form-group">
              <label className="form-label">Select Customer</label>
              <select
                className="form-select"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.contact_person} - {c.city})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                marginBottom: '1rem',
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: '6px',
              }}
            >
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newCustomer.company_name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, company_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input
                  type="text"
                  className="form-input"
                  value={newCustomer.contact_person}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, contact_person: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile</label>
                <input
                  type="text"
                  className="form-input"
                  value={newCustomer.mobile}
                  onChange={(e) => setNewCustomer({ ...newCustomer, mobile: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-input"
                  value={newCustomer.city}
                  onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                  required
                />
              </div>
            </div>
          )}

          <h4 style={{ margin: '1.25rem 0 0.75rem', color: '#1e293b' }}>2. Enquiry Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Required By Date</label>
              <input
                type="date"
                className="form-input"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Notes / Instructions</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Urgent requirement"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <h4 style={{ margin: '1.25rem 0 0.75rem', color: '#1e293b' }}>3. Products Required</h4>
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}
            >
              <select
                className="form-select"
                style={{ flex: 3 }}
                value={item.product_id}
                onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                required
              >
                <option value="">-- Select Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.product_code} - {p.product_name} (₹{p.base_price})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                className="form-input"
                style={{ flex: 1 }}
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                required
              />
              {items.length > 1 && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => handleRemoveItem(idx)}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '0.5rem' }}
            onClick={handleAddItem}
          >
            <Plus size={14} /> Add Product
          </button>

          <div className="modal-footer" style={{ marginTop: '1.5rem', padding: 0 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Enquiry
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW ENQUIRY MODAL */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={`Enquiry Details - ${selectedEnquiry?.enquiry_number}`}
      >
        {selectedEnquiry && (
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
                <strong>Customer:</strong> {selectedEnquiry.customer?.company_name}
                <br />
                <strong>Contact:</strong> {selectedEnquiry.customer?.contact_person} (
                {selectedEnquiry.customer?.mobile})
                <br />
                <strong>City:</strong> {selectedEnquiry.customer?.city}
              </div>
              <div>
                <strong>Enquiry Date:</strong>{' '}
                {new Date(selectedEnquiry.enquiry_date).toLocaleDateString()}
                <br />
                <strong>Required Date:</strong>{' '}
                {new Date(selectedEnquiry.required_date).toLocaleDateString()}
                <br />
                <strong>Status:</strong> <StatusBadge status={selectedEnquiry.status} />
              </div>
            </div>

            {selectedEnquiry.notes && (
              <p style={{ marginBottom: '1rem', fontStyle: 'italic' }}>
                <strong>Notes:</strong> {selectedEnquiry.notes}
              </p>
            )}

            <h4 style={{ marginBottom: '0.5rem' }}>Products Requested</h4>
            <table className="table">
              <thead>
                <tr>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {selectedEnquiry.items?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product?.product_code}</td>
                    <td>{item.product?.product_name}</td>
                    <td>{item.product?.category}</td>
                    <td>{item.product?.unit}</td>
                    <td>
                      <strong>{item.quantity}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
};
