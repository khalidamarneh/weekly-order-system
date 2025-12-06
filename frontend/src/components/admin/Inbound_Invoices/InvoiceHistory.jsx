// frontend/src/components/admin/sales/InvoiceHistory.jsx
import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  SearchIcon,
  ArrowLeftIcon,
  ShoppingCartIcon,
  DocumentDuplicateIcon,
  CurrencyDollarIcon,
  PrinterIcon,
  MailIcon
} from '@heroicons/react/outline';
import api from '../../../services/api';

const InvoiceHistory = ({ isDarkMode, setActiveTab }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [fieldToUpdate, setFieldToUpdate] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

const fetchInvoices = async () => {
  try {
    setLoading(true);
    const response = await api.get('/api/outbound-invoices');
    
    // Process the invoices to ensure proper data structure
    const processedInvoices = response.data.map(invoice => {
      const processedItems = (invoice.items || []).map(item => {
        return {
          ...item,
          // Ensure product data is accessible
          name: item.product?.name || item.name || 'Unnamed Product',
          partNo: item.product?.partNo || item.partNo || 'N/A',
          product: item.product || null
        };
      });
      
      return {
        ...invoice,
        // Preserve customer data from both direct fields and relation
        customerName: invoice.customer?.name || invoice.customerName,
        customerEmail: invoice.customer?.email || invoice.customerEmail,
        customerPhone: invoice.customer?.phone || invoice.customerPhone,
        customerAddress: invoice.customer?.address || invoice.customerAddress,
        items: processedItems
      };
    });
    
    setInvoices(processedInvoices);
    
  } catch (error) {
    console.error('Error fetching invoices:', error);
  } finally {
    setLoading(false);
  }
};

//////////////////////////////////////////

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DRAFT': return ClockIcon;
      case 'SENT': return EyeIcon;
      case 'VIEWED': return EyeIcon;
      case 'PARTIALLY_PAID': return CurrencyDollarIcon;
      case 'PAID': return CheckCircleIcon;
      case 'OVERDUE': return XCircleIcon;
      case 'CANCELLED': return XCircleIcon;
      default: return DocumentTextIcon;
    }
  };

  const getStatusColor = (status, type = 'status') => {
    if (type === 'payment') {
      switch (status) {
        case 'PENDING': return isDarkMode ? 'text-yellow-400 bg-yellow-900' : 'text-yellow-600 bg-yellow-100';
        case 'PARTIALLY_PAID': return isDarkMode ? 'text-blue-400 bg-blue-900' : 'text-blue-600 bg-blue-100';
        case 'PAID': return isDarkMode ? 'text-green-400 bg-green-900' : 'text-green-600 bg-green-100';
        case 'OVERDUE': return isDarkMode ? 'text-red-400 bg-red-900' : 'text-red-600 bg-red-100';
        case 'CANCELLED': return isDarkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-100';
        default: return isDarkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-100';
      }
    }
    
    switch (status) {
      case 'DRAFT': return isDarkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-100';
      case 'SENT': return isDarkMode ? 'text-blue-400 bg-blue-900' : 'text-blue-600 bg-blue-100';
      case 'VIEWED': return isDarkMode ? 'text-indigo-400 bg-indigo-900' : 'text-indigo-600 bg-indigo-100';
      case 'PARTIALLY_PAID': return isDarkMode ? 'text-yellow-400 bg-yellow-900' : 'text-yellow-600 bg-yellow-100';
      case 'PAID': return isDarkMode ? 'text-green-400 bg-green-900' : 'text-green-600 bg-green-100';
      case 'OVERDUE': return isDarkMode ? 'text-red-400 bg-red-900' : 'text-red-600 bg-red-100';
      case 'CANCELLED': return isDarkMode ? 'text-red-400 bg-red-900' : 'text-red-600 bg-red-100';
      default: return isDarkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status, type = 'status') => {
    if (type === 'payment') {
      switch (status) {
        case 'PENDING': return 'Pending';
        case 'PARTIALLY_PAID': return 'Partial';
        case 'PAID': return 'Paid';
        case 'OVERDUE': return 'Overdue';
        case 'CANCELLED': return 'Cancelled';
        default: return status;
      }
    }
    
    switch (status) {
      case 'DRAFT': return 'Draft';
      case 'SENT': return 'Sent';
      case 'VIEWED': return 'Viewed';
      case 'PARTIALLY_PAID': return 'Partial';
      case 'PAID': return 'Paid';
      case 'OVERDUE': return 'Overdue';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchesPaymentStatus = paymentStatusFilter === 'all' || inv.paymentStatus === paymentStatusFilter;

    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const handleViewEdit = (invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleBackToList = () => {
    setSelectedInvoice(null);
    setStatusModalOpen(false);
  };

  const openStatusModal = (status, field) => {
    setNewStatus(status);
    setFieldToUpdate(field);
    setStatusNote('');
    setStatusModalOpen(true);
  };

  const handleStatusChange = async () => {
    try {
      await api.put(`/api/outbound-invoices/${selectedInvoice.id}/status`, { 
        [fieldToUpdate]: newStatus,
        note: statusNote 
      });
      setStatusModalOpen(false);
      setSelectedInvoice(null);
      fetchInvoices();
      alert(`Status updated to ${newStatus} successfully`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handlePrintInvoice = (invoice) => {
    const itemsHtml = invoice.items?.map((item, idx) => `
      <tr style="background:${idx % 2 === 0 ? '#fff' : '#f8faf0'}">
        <td style="padding:8px;text-align:center">${idx + 1}</td>
        <td style="padding:8px">
          <strong>${item.name}</strong>
          ${item.partNo && item.partNo !== 'N/A' ? `<br/><small>Part No: ${item.partNo}</small>` : ''}
          ${item.description ? `<br/><small>${item.description}</small>` : ''}
        </td>
        <td style="padding:8px;text-align:center">${item.quantity}</td>
        <td style="padding:8px;text-align:center">${formatCurrency(item.unitPrice)}</td>
        <td style="padding:8px;text-align:center">${formatCurrency(item.totalPrice)}</td>
      </tr>
    `).join('') || '';

    const discountRow = invoice.discount ? `<tr><td colspan="4"></td><td style="text-align:right;padding:8px">Discount</td><td style="text-align:center;padding:8px">-${formatCurrency(invoice.discount)}</td></tr>` : '';
    const taxRow = invoice.taxAmount ? `<tr><td colspan="4"></td><td style="text-align:right;padding:8px">Tax (${invoice.taxRate || 0}%)</td><td style="text-align:center;padding:8px">${formatCurrency(invoice.taxAmount)}</td></tr>` : '';

    const html = `<!doctype html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin:20px; color:#222; }
          h1 { margin:0 0 6px 0; }
          .top { display:flex; justify-content:space-between; align-items:flex-start; gap:20px; }
          table { width:100%; border-collapse:collapse; margin-top:20px; }
          th { background:#3b82f6; color:#fff; padding:8px; text-align:center; }
          td { padding:8px; border-bottom:1px solid #eee; }
          .company-header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #3b82f6; }
          .product-details { font-size: 12px; color: #666; margin-top: 2px; }
        </style>
      </head>
      <body>
        <div class="company-header">
          <h1>Your Company</h1>
          <div>123 Business St, City</div>
        </div>

        <div class="top">
          <div>
            <strong>Bill To:</strong><br/>
            ${invoice.customerName || '-'}<br/>
            ${invoice.customerEmail || ''}<br/>
            ${invoice.customerPhone || ''}<br/>
            ${invoice.customerAddress || ''}
          </div>
          <div style="text-align:right">
            <div style="font-weight:700">INVOICE</div>
            <div style="font-size:18px;margin-top:6px">${invoice.invoiceNumber}</div>
            <div style="margin-top:6px">Issue Date: ${formatDate(invoice.issueDate)}</div>
            <div style="margin-top:6px">Due Date: ${formatDate(invoice.dueDate)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th style="text-align:left">Product Details</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr><td colspan="3"></td><td style="text-align:right;padding:8px">Subtotal</td><td style="text-align:center;padding:8px">${formatCurrency(invoice.subtotal)}</td></tr>
            ${discountRow}
            ${taxRow}
            <tr style="font-weight:700;background:#dbeafe"><td colspan="3"></td><td style="text-align:right;padding:8px">Grand Total</td><td style="text-align:center;padding:8px">${formatCurrency(invoice.totalAmount)}</td></tr>
          </tbody>
        </table>
      </body>
      </html>`;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.print();
  };

  const handleSendInvoice = async (invoice) => {
    try {
      await api.put(`/api/outbound-invoices/${invoice.id}/status`, { 
        status: 'SENT'
      });
      fetchInvoices();
      alert('Invoice marked as sent');
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert('Failed to send invoice');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // ----- DETAIL VIEW -----
  if (selectedInvoice) {
    const StatusIcon = getStatusIcon(selectedInvoice.status);
    const PaymentStatusIcon = getStatusIcon(selectedInvoice.paymentStatus);

    return (
      <div className="space-y-6">
        <button
          onClick={handleBackToList}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Go Back
        </button>

        <div className={`p-6 rounded-lg border transition-all hover:shadow-md ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${getStatusColor(selectedInvoice.status).split(' ')[1]}`}>
                <StatusIcon className={`h-6 w-6 ${getStatusColor(selectedInvoice.status).split(' ')[0]}`} />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedInvoice.customerName}
                </h2>
                <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Invoice: {selectedInvoice.invoiceNumber}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Invoice Status:</label>
                <select
                  value={selectedInvoice.status}
                  onChange={(e) => openStatusModal(e.target.value, 'status')}
                  className={`px-3 py-2 border rounded-lg ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="SENT">Sent</option>
                  <option value="VIEWED">Viewed</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Payment Status:</label>
                <select
                  value={selectedInvoice.paymentStatus}
                  onChange={(e) => openStatusModal(e.target.value, 'paymentStatus')}
                  className={`px-3 py-2 border rounded-lg ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="PENDING">Pending</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Actions:</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePrintInvoice(selectedInvoice)}
                    className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                      isDarkMode 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <PrinterIcon className="h-4 w-4" />
                    Print
                  </button>
                  {selectedInvoice.status === 'DRAFT' && (
                    <button
                      onClick={() => handleSendInvoice(selectedInvoice)}
                      className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                        isDarkMode 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      <MailIcon className="h-4 w-4" />
                      Send
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Invoice Information</h3>
              <div className="space-y-1">
                <p><strong>Invoice Number:</strong> {selectedInvoice.invoiceNumber}</p>
                <p><strong>Created At:</strong> {formatDate(selectedInvoice.createdAt)}</p>
                <p><strong>Issue Date:</strong> {formatDate(selectedInvoice.issueDate)}</p>
                <p><strong>Due Date:</strong> {formatDate(selectedInvoice.dueDate)}</p>
              </div>
            </div>

            <div>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Customer Information</h3>
              <div className="space-y-1">
                <p><strong>Name:</strong> {selectedInvoice.customerName}</p>
                <p><strong>Email:</strong> {selectedInvoice.customerEmail || 'N/A'}</p>
                <p><strong>Phone:</strong> {selectedInvoice.customerPhone || 'N/A'}</p>
                {selectedInvoice.customerAddress && (
                  <p><strong>Address:</strong> {selectedInvoice.customerAddress}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Financial Details</h3>
              <div className="space-y-1">
                <p><strong>Subtotal:</strong> {formatCurrency(selectedInvoice.subtotal)}</p>
                <p><strong>Tax Rate:</strong> {selectedInvoice.taxRate || 0}%</p>
                <p><strong>Tax Amount:</strong> {formatCurrency(selectedInvoice.taxAmount)}</p>
                <p><strong>Discount:</strong> {formatCurrency(selectedInvoice.discount)}</p>
                <p><strong>Total Amount:</strong> {formatCurrency(selectedInvoice.totalAmount)}</p>
                <p><strong>Balance Due:</strong> {formatCurrency(selectedInvoice.balanceDue)}</p>
                <p><strong>Amount Paid:</strong> {formatCurrency(selectedInvoice.paidAmount)}</p>
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex gap-4 mb-6">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              getStatusColor(selectedInvoice.status)
            }`}>
              {getStatusText(selectedInvoice.status)}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              getStatusColor(selectedInvoice.paymentStatus, 'payment')
            }`}>
              Payment: {getStatusText(selectedInvoice.paymentStatus, 'payment')}
            </span>
            {selectedInvoice.shipmentStatus && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                getStatusColor(selectedInvoice.shipmentStatus)
              }`}>
                Shipment: {getStatusText(selectedInvoice.shipmentStatus)}
              </span>
            )}
          </div>

          {/* Notes Section */}
          {selectedInvoice.notes && (
            <div className="mb-6">
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notes</h3>
              <p className={`p-3 rounded border ${
                isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                {selectedInvoice.notes}
              </p>
            </div>
          )}

          {/* Terms Section */}
          {selectedInvoice.terms && (
            <div className="mb-6">
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Terms & Conditions</h3>
              <p className={`p-3 rounded border ${
                isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                {selectedInvoice.terms}
              </p>
            </div>
          )}

          {/* Items Table */}
          <div className="mb-6">
            <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Items ({selectedInvoice.items?.length || 0})
            </h3>
            <div className="overflow-x-auto">
              <table className={`min-w-full border ${
                isDarkMode ? 'border-gray-600' : 'border-gray-300'
              }`}>
                <thead className={isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}>
                  <tr>
                    <th className="px-4 py-2 border">#</th>
                    <th className="px-4 py-2 border text-left">Product Details</th>
                    <th className="px-4 py-2 border">Part No</th>
                    <th className="px-4 py-2 border">Quantity</th>
                    <th className="px-4 py-2 border">Unit Price</th>
                    <th className="px-4 py-2 border">Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items?.map((item, idx) => (
                    <tr key={item.id || idx} className={
                      idx % 2 === 0 ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-50') : ''
                    }>
                      <td className="px-4 py-2 border text-center">{idx + 1}</td>
                      <td className="px-4 py-2 border">
                        <div className="font-medium">{item.name}</div>
                      </td>
                      <td className="px-4 py-2 border text-center font-mono">{item.partNo}</td>
                      <td className="px-4 py-2 border text-center">{item.quantity}</td>
                      <td className="px-4 py-2 border text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-2 border text-right font-medium">
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                  {(!selectedInvoice.items || selectedInvoice.items.length === 0) && (
                    <tr>
                      <td colSpan="6" className="px-4 py-4 border text-center text-gray-500">
                        No items found for this invoice
                      </td>
                    </tr>
                  )}
                </tbody>
                {/* Totals Section */}
                <tfoot className={isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                  <tr>
                    <td colSpan="5" className="px-4 py-2 border text-right font-semibold">
                      Subtotal:
                    </td>
                    <td className="px-4 py-2 border text-right font-semibold">
                      {formatCurrency(selectedInvoice.subtotal)}
                    </td>
                  </tr>
                  {selectedInvoice.discount > 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-2 border text-right">
                        Discount:
                      </td>
                      <td className="px-4 py-2 border text-right">
                        -{formatCurrency(selectedInvoice.discount)}
                      </td>
                    </tr>
                  )}
                  {selectedInvoice.taxAmount > 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-2 border text-right">
                        Tax ({selectedInvoice.taxRate || 0}%):
                      </td>
                      <td className="px-4 py-2 border text-right">
                        {formatCurrency(selectedInvoice.taxAmount)}
                      </td>
                    </tr>
                  )}
                  <tr className={isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}>
                    <td colSpan="5" className="px-4 py-2 border text-right font-bold text-lg">
                      Grand Total:
                    </td>
                    <td className="px-4 py-2 border text-right font-bold text-lg">
                      {formatCurrency(selectedInvoice.totalAmount)}
                    </td>
                  </tr>
                  {selectedInvoice.paidAmount > 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-2 border text-right font-semibold">
                        Amount Paid:
                      </td>
                      <td className="px-4 py-2 border text-right font-semibold text-green-600">
                        {formatCurrency(selectedInvoice.paidAmount)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan="5" className="px-4 py-2 border text-right font-semibold">
                      Balance Due:
                    </td>
                    <td className="px-4 py-2 border text-right font-semibold">
                      {formatCurrency(selectedInvoice.balanceDue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Status Note Modal */}
        {statusModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className={`rounded-lg p-6 w-96 ${
              isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            }`}>
              <h3 className="text-lg font-semibold mb-4">Add note for status "{getStatusText(newStatus, fieldToUpdate === 'paymentStatus' ? 'payment' : 'status')}"</h3>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Optional note..."
                rows="4"
                className={`w-full border rounded-lg p-2 mb-4 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setStatusModalOpen(false)}
                  className={`px-4 py-2 rounded ${
                    isDarkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusChange}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----- LIST VIEW -----
  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Invoice History
          </h2>
          <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Track and manage all your invoices
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-2 border rounded-lg w-full lg:w-64 ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 border rounded-lg ${
              isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
            }`}
          >
            <option value="all">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="VIEWED">Viewed</option>
            <option value="PARTIALLY_PAID">Partial</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className={`px-3 py-2 border rounded-lg ${
              isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
            }`}
          >
            <option value="all">All Payment</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIALLY_PAID">Partial</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {filteredInvoices.length === 0 && (
          <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No invoices found.
          </p>
        )}

        {filteredInvoices.map((inv) => {
          const StatusIcon = getStatusIcon(inv.status);
          const PaymentStatusIcon = getStatusIcon(inv.paymentStatus);
          
          return (
            <div
              key={inv.id}
              className={`p-4 border rounded-lg flex justify-between items-center cursor-pointer transition hover:shadow-md ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center gap-4 flex-1" onClick={() => handleViewEdit(inv)}>
                <div className={`p-2 rounded-full ${getStatusColor(inv.status).split(' ')[1]}`}>
                  <StatusIcon className={`h-5 w-5 ${getStatusColor(inv.status).split(' ')[0]}`} />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <p className="font-medium">{inv.customerName}</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      getStatusColor(inv.status)
                    }`}>
                      {getStatusText(inv.status)}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      getStatusColor(inv.paymentStatus, 'payment')
                    }`}>
                      {getStatusText(inv.paymentStatus, 'payment')}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {inv.invoiceNumber} • {formatDate(inv.createdAt)}
                    </p>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Total: {formatCurrency(inv.totalAmount)}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Due: {formatDate(inv.dueDate)}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Items: {inv.items?.length || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrintInvoice(inv)}
                  className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
                >
                  Print
                </button>
                <button
                  onClick={() => handleViewEdit(inv)}
                  className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-sm"
                >
                  View
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InvoiceHistory;