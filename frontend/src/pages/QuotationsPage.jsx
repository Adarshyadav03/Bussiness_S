import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getQuotationsApi,
  createQuotationApi,
  updateQuotationStatusApi,
  convertQuotationToOrderApi,
} from '../services/quotationApi';
import { getEnquiriesApi } from '../services/enquiryApi';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Plus, Eye, Send, CheckCircle, XCircle, ArrowRightCircle } from 'lucide-react';

export const QuotationsPage = () => {
  const [quotations, setQuotations] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  // Create Quotation Form
  const [selectedEnquiryId, setSelectedEnquiryId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [items, setItems] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [qRes, eRes] = await Promise.all([getQuotationsApi(), getEnquiriesApi()]);
      setQuotations(qRes.data || []);
      setEnquiries(eRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Pre-fill if navigated from Enquiry page with state
  useEffect(() => {
    if (location.state?.createFromEnquiry) {
      const enq = location.state.createFromEnquiry;
      setSelectedEnquiryId(enq.id);
      populateItemsFromEnquiry(enq);
      setIsCreateOpen(true);
    }
  }, [location.state]);

  const populateItemsFromEnquiry = (enq) => {
    if (!enq || !enq.items) return;
    const formatted = enq.items.map((i) => ({
      product_id: i.product_id,
      product_code: i.product?.product_code,
      product_name: i.product?.product_name,
      quantity: i.quantity,
      unit_price: i.product?.base_price || 1000,
      discount_percent: 0,
      gst_percent: 18,
    }));
    setItems(formatted);
  };

  const handleEnquirySelect = (enqId) => {
    setSelectedEnquiryId(enqId);
    const found = enquiries.find((e) => e.id === Number(enqId));
    if (found) {
      populateItemsFromEnquiry(found);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = Number(value);
    setItems(updated);
  };

  // Real-time calculation helper for Quotation form
  const calculateLineAmount = (item) => {
    const qty = Number(item.quantity || 0);
    const price = Number(item.unit_price || 0);
    const disc = Number(item.discount_percent || 0);
    const gst = Number(item.gst_percent || 18);

    const base = qty * price;
    const afterDisc = base - base * (disc / 100);
    const lineTotal = afterDisc + afterDisc * (gst / 100);
    return Number(lineTotal.toFixed(2));
  };

  const calculateGrandTotal = () => {
    return items.reduce((acc, curr) => acc + calculateLineAmount(curr), 0).toFixed(2);
  };

  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const validUntilDate = validUntil
        ? new Date(validUntil).toISOString()
        : new Date(Date.now() + 7 * 86400000).toISOString();

      await createQuotationApi({
        enquiry_id: Number(selectedEnquiryId),
        valid_until: validUntilDate,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount_percent: i.discount_percent,
          gst_percent: i.gst_percent,
        })),
      });

      setIsCreateOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create quotation');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateQuotationStatusApi(id, status);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Status change failed');
    }
  };

  const handleConvertToSalesOrder = async (id) => {
    if (!window.confirm('Convert this accepted quotation to a Sales Order?')) return;
    try {
      await convertQuotationToOrderApi(id);
      alert('Quotation converted to Sales Order successfully!');
      navigate('/sales-orders');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to convert quotation to Sales Order');
    }
  };

  return (
    <div>
      <div className="card-header">
        <div>
          <h2 className="card-title">Quotations</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Generate, send, and convert price quotations into Sales Orders
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setError(null);
            setIsCreateOpen(true);
          }}
        >
          <Plus size={18} /> Create Quotation
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>Loading quotations...</p>
        ) : quotations.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            No quotations created yet. Click '+ Create Quotation' to start.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Quotation No</th>
                  <th>Customer</th>
                  <th>Enquiry Ref</th>
                  <th>Grand Total</th>
                  <th>Valid Until</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => (
                  <tr key={q.id}>
                    <td>
                      <strong>{q.quotation_number}</strong>
                    </td>
                    <td>{q.customer?.company_name}</td>
                    <td>{q.enquiry?.enquiry_number}</td>
                    <td>
                      <strong>₹{q.grand_total.toLocaleString()}</strong>
                    </td>
                    <td>{new Date(q.valid_until).toLocaleDateString()}</td>
                    <td>
                      <StatusBadge status={q.status} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setSelectedQuotation(q);
                            setIsViewOpen(true);
                          }}
                        >
                          <Eye size={14} /> View
                        </button>

                        {q.status === 'DRAFT' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleStatusChange(q.id, 'SENT')}
                          >
                            <Send size={14} /> Send
                          </button>
                        )}

                        {q.status === 'SENT' && (
                          <>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleStatusChange(q.id, 'ACCEPTED')}
                            >
                              <CheckCircle size={14} /> Accept
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleStatusChange(q.id, 'REJECTED')}
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </>
                        )}

                        {q.status === 'ACCEPTED' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleConvertToSalesOrder(q.id)}
                          >
                            <ArrowRightCircle size={14} /> Convert to Order
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

      {/* CREATE QUOTATION MODAL WITH REALTIME CALCULATOR */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Price Quotation"
      >
        <form onSubmit={handleCreateQuotation}>
          <div className="form-group">
            <label className="form-label">Select Customer Enquiry Reference</label>
            <select
              className="form-select"
              value={selectedEnquiryId}
              onChange={(e) => handleEnquirySelect(e.target.value)}
              required
            >
              <option value="">-- Choose Enquiry --</option>
              {enquiries.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.enquiry_number} - {e.customer?.company_name} ({e.status})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Valid Until Date</label>
            <input
              type="date"
              className="form-input"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              required
            />
          </div>

          <h4 style={{ margin: '1.25rem 0 0.75rem', color: '#1e293b' }}>
            Item Pricing & Tax Calculator
          </h4>
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: '#f8fafc',
                padding: '0.75rem',
                borderRadius: '6px',
                marginBottom: '0.75rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>
                {item.product_code} - {item.product_name}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.25fr 1fr 1fr 1.25fr',
                  gap: '0.5rem',
                  alignItems: 'center',
                }}
              >
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>
                    Discount %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-input"
                    value={item.discount_percent}
                    onChange={(e) => handleItemChange(idx, 'discount_percent', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>
                    GST %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-input"
                    value={item.gst_percent}
                    onChange={(e) => handleItemChange(idx, 'gst_percent', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>
                    Line Amount
                  </label>
                  <div style={{ fontWeight: 700, paddingTop: '0.5rem', color: '#15803d' }}>
                    ₹{calculateLineAmount(item).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div
            style={{
              marginTop: '1.25rem',
              padding: '1rem',
              background: '#eff6ff',
              borderRadius: '6px',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e3a8a' }}>
              Calculated Grand Total:
            </span>
            <span style={{ fontSize: '1.375rem', fontWeight: 700, color: '#1d4ed8' }}>
              ₹{Number(calculateGrandTotal()).toLocaleString()}
            </span>
          </div>

          <div className="modal-footer" style={{ marginTop: '1.5rem', padding: 0 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Generate Quotation
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW QUOTATION DETAILS MODAL */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={`Quotation Details - ${selectedQuotation?.quotation_number}`}
      >
        {selectedQuotation && (
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
                <strong>Customer:</strong> {selectedQuotation.customer?.company_name}
                <br />
                <strong>Enquiry Ref:</strong> {selectedQuotation.enquiry?.enquiry_number}
              </div>
              <div>
                <strong>Valid Until:</strong>{' '}
                {new Date(selectedQuotation.valid_until).toLocaleDateString()}
                <br />
                <strong>Status:</strong> <StatusBadge status={selectedQuotation.status} />
              </div>
            </div>

            <h4 style={{ marginBottom: '0.5rem' }}>Line Items Breakdown</h4>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Discount</th>
                  <th>GST</th>
                  <th>Line Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedQuotation.items?.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.product?.product_code} - {item.product?.product_name}
                    </td>
                    <td>{item.quantity}</td>
                    <td>₹{item.unit_price.toLocaleString()}</td>
                    <td>{item.discount_percent}%</td>
                    <td>{item.gst_percent}%</td>
                    <td>
                      <strong>₹{item.line_amount.toLocaleString()}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div
              style={{
                marginTop: '1rem',
                textAlign: 'right',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#16a34a',
              }}
            >
              Grand Total: ₹{selectedQuotation.grand_total.toLocaleString()}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
