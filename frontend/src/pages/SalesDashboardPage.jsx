import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEnquiriesApi } from '../services/enquiryApi';
import { getQuotationsApi } from '../services/quotationApi';
import { FileText, DollarSign, Plus, ArrowRightCircle, CheckCircle, Clock } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const SalesDashboardPage = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSalesData = async () => {
      try {
        const [enqRes, quoteRes] = await Promise.all([
          getEnquiriesApi(),
          getQuotationsApi(),
        ]);
        setEnquiries(enqRes.data || []);
        setQuotations(quoteRes.data || []);
      } catch (err) {
        console.error('Failed to load sales dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    loadSalesData();
  }, []);

  const newEnquiries = enquiries.filter((e) => e.status === 'NEW');
  const draftQuotations = quotations.filter((q) => q.status === 'DRAFT');
  const sentQuotations = quotations.filter((q) => q.status === 'SENT');
  const acceptedQuotations = quotations.filter((q) => q.status === 'ACCEPTED' && !q.sales_order);

  return (
    <div>
      <div className="card-header">
        <div>
          <h2 className="card-title">Sales User Dashboard</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Manage Customer Enquiries, Price Quotations, Customer Acceptances, and Order Conversions
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/sales/enquiries" className="btn btn-primary">
            <Plus size={16} /> Create Enquiry
          </Link>
          <Link to="/sales/quotations" className="btn btn-secondary">
            <Plus size={16} /> Create Quotation
          </Link>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#1d4ed8', fontSize: '0.875rem', fontWeight: 600 }}>Total Enquiries</span>
            <FileText size={20} color="#2563eb" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1d4ed8', marginTop: '0.5rem' }}>
            {enquiries.length}
          </div>
        </div>

        <div className="card" style={{ background: '#fffbe6', borderColor: '#ffe58f' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#b78103', fontSize: '0.875rem', fontWeight: 600 }}>Quotations Sent</span>
            <Clock size={20} color="#d48806" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#b78103', marginTop: '0.5rem' }}>
            {sentQuotations.length}
          </div>
        </div>

        <div className="card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#15803d', fontSize: '0.875rem', fontWeight: 600 }}>Customer Accepted</span>
            <CheckCircle size={20} color="#16a34a" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#15803d', marginTop: '0.5rem' }}>
            {acceptedQuotations.length}
          </div>
        </div>

        <div className="card" style={{ background: '#faf5ff', borderColor: '#e9d5ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#6b21a8', fontSize: '0.875rem', fontWeight: 600 }}>Draft Quotations</span>
            <DollarSign size={20} color="#9333ea" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#6b21a8', marginTop: '0.5rem' }}>
            {draftQuotations.length}
          </div>
        </div>
      </div>

      {/* ACCEPTED QUOTATIONS READY FOR CONVERSION */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', color: '#0f172a' }}>Accepted Quotations Ready to Convert to Sales Orders</h3>
          <Link to="/sales/quotations" style={{ fontSize: '0.875rem', color: '#2563eb', fontWeight: 600 }}>
            View All Quotations &rarr;
          </Link>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '1.5rem' }}>Loading quotations...</p>
        ) : acceptedQuotations.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
            No pending accepted quotations ready for conversion.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Quotation No</th>
                  <th>Customer</th>
                  <th>Grand Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {acceptedQuotations.map((q) => (
                  <tr key={q.id}>
                    <td><strong>{q.quotation_number}</strong></td>
                    <td>{q.customer?.company_name}</td>
                    <td>₹{q.grand_total.toLocaleString()}</td>
                    <td><StatusBadge status={q.status} /></td>
                    <td>
                      <Link to="/sales/quotations" className="btn btn-success btn-sm">
                        <ArrowRightCircle size={14} /> Convert to Sales Order
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
