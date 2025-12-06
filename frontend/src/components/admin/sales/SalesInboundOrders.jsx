// frontend/src/components/admin/sales/SalesInboundOrders.jsx
import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  DocumentDuplicateIcon,
  ShoppingCartIcon,
  ArrowLeftIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon
} from '@heroicons/react/outline';
import api from '../../../services/api';

const SalesInboundOrders = ({ isDarkMode, quotation, onOrderCreated, onCancel }) => {
  const [orderItems, setOrderItems] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({});
  const [orderNotes, setOrderNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (quotation) {
      // Initialize order items from quotation items
      const initialItems = quotation.items.map(item => ({
        ...item,
        id: `temp-${Date.now()}-${Math.random()}`,
        originalQuantity: item.quantity,
        edited: false
      }));
      
      setOrderItems(initialItems);
      setCustomerInfo({
        name: quotation.customerName,
        email: quotation.customerEmail,
        phone: quotation.customerPhone
      });
      setOrderNotes(quotation.notes || '');
    }
  }, [quotation]);

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 0) return;
    
    setOrderItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            quantity: parseInt(newQuantity) || 0,
            totalPrice: (item.unitPrice * (parseInt(newQuantity) || 0)),
            edited: true 
          }
        : item
    ));
  };

  const handlePriceChange = (itemId, newPrice) => {
    if (newPrice < 0) return;
    
    setOrderItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            unitPrice: parseFloat(newPrice) || 0,
            totalPrice: ((parseFloat(newPrice) || 0) * item.quantity),
            edited: true 
          }
        : item
    ));
  };

  const handleAddItem = () => {
    const newItem = {
      id: `temp-${Date.now()}-${Math.random()}`,
      name: 'New Product',
      partNo: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      isNew: true,
      edited: true
    };
    setOrderItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (itemId) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleCustomerInfoChange = (field, value) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = subtotal * (quotation.taxRate / 100);
    const grandTotal = subtotal + taxAmount;

    return {
      subtotal,
      taxAmount,
      grandTotal,
      itemCount: orderItems.reduce((sum, item) => sum + item.quantity, 0)
    };
  };

  const generateOrderNumber = () => {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const customerInitials = customerInfo.name
      ? customerInfo.name.split(' ').map(word => word[0]).join('').toUpperCase()
      : 'CUST';
    
    return `SaleOrder-${quotation.quotationId}-${customerInitials}-${dateStr}`;
  };

  const createSalesOrder = async () => {
    try {
      setSaving(true);
      
      const { subtotal, taxAmount, grandTotal } = calculateTotals();
      const orderNumber = generateOrderNumber();

      const orderData = {
        orderNumber,
        quotationId: quotation.id,
        quotationNumber: quotation.quotationId,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        notes: orderNotes,
        items: orderItems.map(item => ({
          productId: item.productId,
          name: item.name,
          partNo: item.partNo,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          image: item.image
        })),
        subtotal,
        taxRate: quotation.taxRate,
        taxAmount,
        total: grandTotal,
        status: 'SUBMITTED',
        internalStatus: 'PENDING'
      };

      const response = await api.post('/api/sales/convert-to-order', orderData);
      
      // Update the original quotation status to ACCEPTED
      await api.put(`/api/quotations/${quotation.id}/status`, {
        status: 'ACCEPTED',
        note: `Converted to order: ${orderNumber}`
      });

      if (onOrderCreated) {
        onOrderCreated(response.data);
      }

      alert(`Order created successfully: ${orderNumber}`);
      
    } catch (error) {
      console.error('Error creating sales order:', error);
      alert('Failed to create sales order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const { subtotal, taxAmount, grandTotal, itemCount } = calculateTotals();

  if (!quotation) {
    return (
      <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          No quotation selected for order conversion.
        </p>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onCancel}
            className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Convert Quotation to Sales Order
            </h2>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              Finalize order details before creating sales order
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
            Original: <strong>{quotation.quotationId}</strong>
          </p>
          <p className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>
            New: <strong>{generateOrderNumber()}</strong>
          </p>
        </div>
      </div>

      {/* Customer Information */}
      <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Customer Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Customer Name *
            </label>
            <input
              type="text"
              value={customerInfo.name || ''}
              onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 ${
                isDarkMode 
                  ? 'bg-gray-600 border-gray-500 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Email
            </label>
            <input
              type="email"
              value={customerInfo.email || ''}
              onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 ${
                isDarkMode 
                  ? 'bg-gray-600 border-gray-500 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Phone
            </label>
            <input
              type="tel"
              value={customerInfo.phone || ''}
              onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 ${
                isDarkMode 
                  ? 'bg-gray-600 border-gray-500 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Order Items ({itemCount} items)
          </h3>
          <button
            onClick={handleAddItem}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-200"}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Product</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Part No</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Quantity</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Unit Price</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className={isDarkMode ? "divide-gray-700" : "divide-gray-200"}>
              {orderItems.map((item, index) => (
                <tr key={item.id} className={isDarkMode ? "hover:bg-gray-750" : "hover:bg-gray-50"}>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => setOrderItems(prev => 
                        prev.map(i => i.id === item.id 
                          ? { ...i, name: e.target.value, edited: true }
                          : i
                        )
                      )}
                      className={`w-full border rounded px-2 py-1 ${
                        isDarkMode 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={item.partNo}
                      onChange={(e) => setOrderItems(prev => 
                        prev.map(i => i.id === item.id 
                          ? { ...i, partNo: e.target.value, edited: true }
                          : i
                        )
                      )}
                      className={`w-full border rounded px-2 py-1 ${
                        isDarkMode 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className={`p-1 rounded ${
                          isDarkMode 
                            ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                        }`}
                      >
                        <MinusIcon className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        className={`w-16 text-center border rounded px-2 py-1 ${
                          isDarkMode 
                            ? 'bg-gray-600 border-gray-500 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        min="0"
                      />
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className={`p-1 rounded ${
                          isDarkMode 
                            ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                        }`}
                      >
                        <PlusIcon className="h-3 w-3" />
                      </button>
                    </div>
                    {item.originalQuantity !== item.quantity && (
                      <div className={`text-xs mt-1 ${
                        item.quantity > item.originalQuantity ? 'text-green-500' : 'text-red-500'
                      }`}>
                        Original: {item.originalQuantity}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handlePriceChange(item.id, e.target.value)}
                      className={`w-24 text-right border rounded px-2 py-1 ${
                        isDarkMode 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      min="0"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                      ${item.totalPrice.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className={`p-1 rounded ${
                        isDarkMode 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Notes */}
      <div className="mb-6">
        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Order Notes
        </label>
        <textarea
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          rows="3"
          className={`w-full border rounded-lg px-3 py-2 ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
          placeholder="Add any additional notes for this order..."
        />
      </div>

      {/* Totals and Actions */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-300 dark:border-gray-600">
        <div className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <div>Subtotal: ${subtotal.toFixed(2)}</div>
          <div>Tax ({quotation.taxRate}%): ${taxAmount.toFixed(2)}</div>
          <div className="text-xl text-green-600 dark:text-green-400">
            Grand Total: ${grandTotal.toFixed(2)}
          </div>
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={onCancel}
            className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 ${
              isDarkMode 
                ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            <XCircleIcon className="h-5 w-5" />
            <span>Cancel</span>
          </button>
          
          <button
            onClick={createSalesOrder}
            disabled={saving || !customerInfo.name}
            className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 ${
              (saving || !customerInfo.name)
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5" />
                <span>Create Sales Order</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesInboundOrders;