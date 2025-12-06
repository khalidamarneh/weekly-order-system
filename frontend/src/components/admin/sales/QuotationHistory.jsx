// src/components/admin/sales/QuotationHistory.jsx
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
  DocumentDuplicateIcon
} from '@heroicons/react/outline';
import api from '../../../services/api';
import SalesInboundOrders from './SalesInboundOrders';

const QuotationHistory = ({ isDarkMode, setActiveTab }) => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [showOrderConversion, setShowOrderConversion] = useState(false);
  const [showOrderList, setShowOrderList] = useState(false);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/quotations');
      setQuotations(response.data);
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DRAFT': return ClockIcon;
      case 'SENT': return EyeIcon;
      case 'VIEWED': return EyeIcon;
      case 'ACCEPTED': return CheckCircleIcon;
      case 'REJECTED': return XCircleIcon;
      case 'EXPIRED': return DocumentTextIcon;
      default: return DocumentTextIcon;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT': return isDarkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-100';
      case 'SENT': return isDarkMode ? 'text-blue-400 bg-blue-900' : 'text-blue-600 bg-blue-100';
      case 'VIEWED': return isDarkMode ? 'text-indigo-400 bg-indigo-900' : 'text-indigo-600 bg-indigo-100';
      case 'ACCEPTED': return isDarkMode ? 'text-green-400 bg-green-900' : 'text-green-600 bg-green-100';
      case 'REJECTED': return isDarkMode ? 'text-red-400 bg-red-900' : 'text-red-600 bg-red-100';
      case 'EXPIRED': return isDarkMode ? 'text-yellow-400 bg-yellow-900' : 'text-yellow-600 bg-yellow-100';
      default: return isDarkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'DRAFT': return 'Draft';
      case 'SENT': return 'Sent';
      case 'VIEWED': return 'Viewed';
      case 'ACCEPTED': return 'Accepted';
      case 'REJECTED': return 'Rejected';
      case 'EXPIRED': return 'Expired';
      default: return status;
    }
  };

  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.quotationId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const calculateGrandTotal = (quotation) => {
    const itemsTotal = quotation.items?.reduce((sum, item) => sum + (item.totalPrice || 0), 0) || 0;
    const taxAmount = quotation.taxRate ? (itemsTotal * quotation.taxRate) / 100 : 0;
    const discountAmount = quotation.discount ? (itemsTotal * quotation.discount) / 100 : 0;
    const shippingAmount = quotation.shippingCost || 0;
    
    return itemsTotal + taxAmount - discountAmount + shippingAmount;
  };

  const handleViewEdit = (quotation) => {
    setSelectedQuotation(quotation);
  };

  const handleBackToList = () => {
    setSelectedQuotation(null);
    setStatusModalOpen(false);
    setShowOrderConversion(false);
    setShowOrderList(false);
  };

  const openStatusModal = (status) => {
    setNewStatus(status);
    setStatusNote('');
    setStatusModalOpen(true);
  };

  const handleStatusChange = async () => {
    try {
      await api.put(`/api/quotations/${selectedQuotation.id}/status`, { 
        status: newStatus,
        note: statusNote 
      });
      setStatusModalOpen(false);
      setSelectedQuotation(null);
      fetchQuotations();
      alert(`Status updated to ${newStatus} successfully`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
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
  if (selectedQuotation && !showOrderConversion) {
    const StatusIcon = getStatusIcon(selectedQuotation.status);
    const grandTotal = calculateGrandTotal(selectedQuotation);
    const itemsTotal = selectedQuotation.items?.reduce((sum, item) => sum + (item.totalPrice || 0), 0) || 0;
    const taxAmount = selectedQuotation.taxRate ? (itemsTotal * selectedQuotation.taxRate) / 100 : 0;
    const discountAmount = selectedQuotation.discount ? (itemsTotal * selectedQuotation.discount) / 100 : 0;
    const hasOrderConversions = selectedQuotation.orderConversions && selectedQuotation.orderConversions.length > 0;

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
              <div className={`p-3 rounded-full ${getStatusColor(selectedQuotation.status).split(' ')[1]}`}>
                <StatusIcon className={`h-6 w-6 ${getStatusColor(selectedQuotation.status).split(' ')[0]}`} />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedQuotation.customerName || 'Unnamed Customer'}
                </h2>
                <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Status: <span className="font-medium">{getStatusText(selectedQuotation.status)}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Update Status:</label>
                <select
                  value={selectedQuotation.status}
                  onChange={(e) => openStatusModal(e.target.value)}
                  className={`px-3 py-2 border rounded-lg ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="SENT">Sent</option>
                  <option value="VIEWED">Viewed</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>

              {/* Order Conversion Button - Only show for accepted quotations */}
              {selectedQuotation.status === 'ACCEPTED' && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Order Actions:</label>
                  <button
                    onClick={() => setShowOrderConversion(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                      isDarkMode 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    <ShoppingCartIcon className="h-5 w-5" />
                    Create Sales Order
                  </button>
                </div>
              )}

              {/* View Orders Button - Show if quotation has been converted to orders */}
              {hasOrderConversions && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Existing Orders:</label>
                  <button
                    onClick={() => setShowOrderList(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                      isDarkMode 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <DocumentDuplicateIcon className="h-5 w-5" />
                    View Orders ({selectedQuotation.orderConversions.length})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quotation Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quotation Information</h3>
              <div className="space-y-1">
                <p><strong>Quotation ID:</strong> {selectedQuotation.quotationId}</p>
                <p><strong>Created At:</strong> {formatDate(selectedQuotation.createdAt)}</p>
                <p><strong>Offer Date:</strong> {formatDate(selectedQuotation.offerDate)}</p>
                {selectedQuotation.expiryDate && (
                  <p><strong>Expiry Date:</strong> {formatDate(selectedQuotation.expiryDate)}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Customer Information</h3>
              <div className="space-y-1">
                <p><strong>Name:</strong> {selectedQuotation.customerName || 'N/A'}</p>
                <p><strong>Email:</strong> {selectedQuotation.customerEmail || 'N/A'}</p>
                <p><strong>Phone:</strong> {selectedQuotation.customerPhone || 'N/A'}</p>
                {selectedQuotation.customerAddress && (
                  <p><strong>Address:</strong> {selectedQuotation.customerAddress}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Financial Details</h3>
              <div className="space-y-1">
                <p><strong>Tax Rate:</strong> {selectedQuotation.taxRate || 0}%</p>
                <p><strong>Discount:</strong> {selectedQuotation.discount || 0}%</p>
                <p><strong>Shipping Cost:</strong> {formatCurrency(selectedQuotation.shippingCost || 0)}</p>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {selectedQuotation.notes && (
            <div className="mb-6">
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notes</h3>
              <p className={`p-3 rounded border ${
                isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                {selectedQuotation.notes}
              </p>
            </div>
          )}

          {/* Items Table */}
          <div className="mb-6">
            <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Items</h3>
            <div className="overflow-x-auto">
              <table className={`min-w-full border ${
                isDarkMode ? 'border-gray-600' : 'border-gray-300'
              }`}>
                <thead className={isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}>
                  <tr>
                    <th className="px-4 py-2 border">#</th>
                    <th className="px-4 py-2 border">Name</th>
                    <th className="px-4 py-2 border">Part No</th>
                    <th className="px-4 py-2 border">Qty</th>
                    <th className="px-4 py-2 border">Unit Price</th>
                    <th className="px-4 py-2 border">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedQuotation.items?.map((item, idx) => (
                    <tr key={item.id} className={
                      idx % 2 === 0 ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-50') : ''
                    }>
                      <td className="px-4 py-2 border text-center">{idx + 1}</td>
                      <td className="px-4 py-2 border">{item.name}</td>
                      <td className="px-4 py-2 border">{item.partNo}</td>
                      <td className="px-4 py-2 border text-center">{item.quantity}</td>
                      <td className="px-4 py-2 border text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-2 border text-right">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
                {/* Totals Section */}
                <tfoot className={isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                  <tr>
                    <td colSpan="5" className="px-4 py-2 border text-right font-semibold">
                      Subtotal:
                    </td>
                    <td className="px-4 py-2 border text-right font-semibold">
                      {formatCurrency(itemsTotal)}
                    </td>
                  </tr>
                  {selectedQuotation.taxRate > 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-2 border text-right">
                        Tax ({selectedQuotation.taxRate}%):
                      </td>
                      <td className="px-4 py-2 border text-right">
                        {formatCurrency(taxAmount)}
                      </td>
                    </tr>
                  )}
                  {selectedQuotation.discount > 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-2 border text-right">
                        Discount ({selectedQuotation.discount}%):
                      </td>
                      <td className="px-4 py-2 border text-right">
                        -{formatCurrency(discountAmount)}
                      </td>
                    </tr>
                  )}
                  {selectedQuotation.shippingCost > 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-2 border text-right">
                        Shipping:
                      </td>
                      <td className="px-4 py-2 border text-right">
                        {formatCurrency(selectedQuotation.shippingCost)}
                      </td>
                    </tr>
                  )}
                  <tr className={isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}>
                    <td colSpan="5" className="px-4 py-2 border text-right font-bold text-lg">
                      Grand Total:
                    </td>
                    <td className="px-4 py-2 border text-right font-bold text-lg">
                      {formatCurrency(grandTotal)}
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
              <h3 className="text-lg font-semibold mb-4">Add note for status "{getStatusText(newStatus)}"</h3>
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

        {/* Order List Modal */}
        {showOrderList && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Orders Created from Quotation
                  </h3>
                  <button
                    onClick={() => setShowOrderList(false)}
                    className={`p-2 rounded-lg ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    }`}
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {selectedQuotation.orderConversions.map((conversion) => (
                    <div
                      key={conversion.id}
                      className={`p-4 border rounded-lg ${
                        isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {conversion.orderNumber}
                          </h4>
                          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                            Created: {new Date(conversion.convertedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              // Navigate to order details in InboundOrderStatus
                              console.log('View order:', conversion.orderId);
                              alert(`Navigate to order: ${conversion.orderNumber}`);
                            }}
                            className={`px-3 py-1 rounded text-sm ${
                              isDarkMode 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            View Order
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----- ORDER CONVERSION VIEW -----
  if (selectedQuotation && showOrderConversion) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setShowOrderConversion(false)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Quotation
        </button>

        <SalesInboundOrders
          isDarkMode={isDarkMode}
          quotation={selectedQuotation}
          onOrderCreated={(order) => {
            setShowOrderConversion(false);
            setSelectedQuotation(null);
            fetchQuotations();
          }}
          onCancel={() => setShowOrderConversion(false)}
        />
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
            Quotation History
          </h2>
          <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Track and manage all your quotations
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search quotations..."
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
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      {/* Quotations List */}
      <div className="space-y-4">
        {filteredQuotations.length === 0 && (
          <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No quotations found.
          </p>
        )}

        {filteredQuotations.map((q) => {
          const StatusIcon = getStatusIcon(q.status);
          const grandTotal = calculateGrandTotal(q);
          
          return (
            <div
              key={q.id}
              className={`p-4 border rounded-lg flex justify-between items-center cursor-pointer transition hover:shadow-md ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center gap-4 flex-1" onClick={() => handleViewEdit(q)}>
                <div className={`p-2 rounded-full ${getStatusColor(q.status).split(' ')[1]}`}>
                  <StatusIcon className={`h-5 w-5 ${getStatusColor(q.status).split(' ')[0]}`} />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <p className="font-medium">{q.customerName || 'Unnamed Customer'}</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      getStatusColor(q.status)
                    }`}>
                      {getStatusText(q.status)}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {q.quotationId} • {formatDate(q.createdAt)}
                    </p>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Total: {formatCurrency(grandTotal)}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <button
                  onClick={() => handleViewEdit(q)}
                  className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
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

export default QuotationHistory;