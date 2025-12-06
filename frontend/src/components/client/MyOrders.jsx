// frontend/src/components/client/MyOrders.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { PrinterIcon, ShareIcon, TrashIcon, PhotographIcon } from '@heroicons/react/outline';

// Define BACKEND_URL constant (same as ClientClick)
const BACKEND_URL = 'http://localhost:5000';

const MyOrders = ({ isDarkMode, orderControl }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deletedOrderIds, setDeletedOrderIds] = useState([]);

  useEffect(() => {
    // Load deleted order IDs from localStorage
    const savedDeletedIds = localStorage.getItem('deletedOrderIds');
    if (savedDeletedIds) {
      setDeletedOrderIds(JSON.parse(savedDeletedIds));
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/client/orders');
      setOrders(response.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete order from frontend only (not from backend)
  const deleteOrder = (orderId) => {
    if (window.confirm('Are you sure you want to remove this order from your view? This action cannot be undone.')) {
      const newDeletedIds = [...deletedOrderIds, orderId];
      setDeletedOrderIds(newDeletedIds);
      localStorage.setItem('deletedOrderIds', JSON.stringify(newDeletedIds));
      
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null);
      }
    }
  };

  // Filter out deleted orders
  const filteredOrders = orders.filter(order => !deletedOrderIds.includes(order.id));

  // Calculate order total if prices are visible
  const calculateOrderTotal = (order) => {
    if (!orderControl?.showSalePrice || !order.items) return null;
    return order.items.reduce((total, item) => {
      const itemPrice = item.unitPrice || item.product?.salePrice || 0;
      return total + (itemPrice * item.quantity);
    }, 0);
  };

  // Share order function
  const shareOrder = (order) => {
    const orderTotal = calculateOrderTotal(order);
    const orderText = `Order #${order.orderNumber || order.id}\n` +
      `Date: ${new Date(order.createdAt).toLocaleDateString()}\n` +
      `Status: ${order.status}\n` +
      `Items: ${order.items.reduce((total, item) => total + item.quantity, 0)}\n` +
      `Total: $${orderTotal?.toFixed(2) || '0.00'}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Order ${order.orderNumber || order.id}`,
        text: orderText,
        url: window.location.href
      }).catch(err => {
        console.log('Error sharing:', err);
        fallbackShare(orderText);
      });
    } else {
      fallbackShare(orderText);
    }
  };

  const fallbackShare = (text) => {
    // For WhatsApp sharing
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Simple print function - THIS ALREADY CALLS DEVICE PRINTER!
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const orderTotal = calculateOrderTotal(selectedOrder);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order ${selectedOrder.orderNumber || selectedOrder.id}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            margin: 0;
          }
          h2 { 
            color: #333; 
            margin-bottom: 10px; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px; 
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
          }
          th { 
            background-color: #f5f5f5; 
          }
          .total-row { 
            background-color: #f5f5f5; 
            font-weight: bold; 
          }
          @media print {
            body { 
              padding: 15mm; 
            }
            @page {
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <h2>Order #${selectedOrder.orderNumber || selectedOrder.id}</h2>
        <p>Placed on ${new Date(selectedOrder.createdAt).toLocaleString()}</p>
        
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Quantity</th>
              ${orderControl?.showSalePrice ? '<th>Price</th><th>Total</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${selectedOrder.items.map((item, index) => {
              const itemPrice = item.unitPrice || item.product?.salePrice || 0;
              const itemTotal = itemPrice * item.quantity;
              return `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.product?.name || item.description || 'Unlisted Item'}</td>
                  <td>${item.quantity}</td>
                  ${orderControl?.showSalePrice ? `
                    <td>$${itemPrice.toFixed(2)}</td>
                    <td>$${itemTotal.toFixed(2)}</td>
                  ` : ''}
                </tr>
              `;
          }).join('')}
            
          ${orderControl?.showSalePrice && orderTotal !== null ? `
            <tr class="total-row">
              <td colspan="3" style="text-align: right;">Grand Total:</td>
              <td colspan="2">$${orderTotal.toFixed(2)}</td>
            </tr>
          ` : ''}
        </tbody>
      </table>
    </body>
    </html>
  `);

    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // === If an order is selected, show ONLY details (not both) ===
  if (selectedOrder) {
    const orderTotal = calculateOrderTotal(selectedOrder);

    return (
      <div className={`rounded-xl shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Order #{selectedOrder.orderNumber || selectedOrder.id}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              title="Print Order"
            >
              <PrinterIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => shareOrder(selectedOrder)}
              className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              title="Share Order"
            >
              <ShareIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => deleteOrder(selectedOrder.id)}
              className={`p-2 rounded-lg ${isDarkMode ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-red-200 hover:bg-red-300 text-red-700'}`}
              title="Delete Order from View"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
        </p>

        {/* Items Table with Row Numbers - UPDATED TO MATCH DRAFT ORDER STYLE */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className={isDarkMode ? "bg-yellow-600" : "bg-yellow-400"}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wider">Product</th>
                {orderControl?.showSalePrice && <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wider">Unit Price</th>}
                <th className="px-4 py-3 text-center text-sm font-bold uppercase tracking-wider">Qty</th>
                {orderControl?.showSalePrice && <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wider">Total</th>}
                <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wider">Image</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {selectedOrder.items.map((item, index) => {
                const isUnlisted = !item.product;
                const itemPrice = item.unitPrice || item.product?.salePrice || 0;
                const itemTotal = itemPrice * item.quantity;
                
                return (
                  <tr key={item.id} className={isDarkMode ? "hover:bg-gray-750" : "hover:bg-gray-50"}>
                    {/* Row Number */}
                    <td className="px-4 py-3">
                      <span className={`font-medium ${isUnlisted ? 'text-red-500' : (isDarkMode ? 'text-gray-300' : 'text-gray-700')}`}>
                        {index + 1}
                      </span>
                    </td>
                    
                    {/* Product Info */}
                    <td className="px-4 py-3">
                      <div>
                        <div className={`font-medium ${isUnlisted ? 'text-red-500' : (isDarkMode ? 'text-white' : 'text-gray-900')}`}>
                          {item.product?.name || item.description || 'Unlisted Item'}
                        </div>
                        {item.product?.partNo && (
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Part #: {item.product.partNo}
                          </div>
                        )}
                        {isUnlisted && (
                          <div className={`text-xs italic ${isUnlisted ? 'text-red-400' : (isDarkMode ? 'text-gray-400' : 'text-gray-500')}`}>
                            Unlisted Item
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Unit Price */}
                    {orderControl?.showSalePrice && (
                      <td className="px-4 py-3">
                        <span className={isUnlisted ? 'text-red-400' : (isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
                          {isUnlisted ? '-' : `$${itemPrice.toFixed(2)}`}
                        </span>
                      </td>
                    )}

                    {/* Quantity */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <span className={`w-8 text-center font-medium ${isUnlisted ? 'text-red-500' : (isDarkMode ? 'text-white' : 'text-gray-900')}`}>
                          {item.quantity}
                        </span>
                      </div>
                    </td>

                    {/* Total Price */}
                    {orderControl?.showSalePrice && (
                      <td className="px-4 py-3">
                        <span className={`font-medium ${isUnlisted ? 'text-red-400' : (isDarkMode ? 'text-green-400' : 'text-green-600')}`}>
                          {isUnlisted ? '-' : `$${itemTotal.toFixed(2)}`}
                        </span>
                      </td>
                    )}

                    {/* Image Preview Column */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {(item.imagePath || item.product?.imagePath) ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const imagePath = item.imagePath || item.product?.imagePath;
                            const imageUrl = imagePath.startsWith('/')
                              ? `${BACKEND_URL}${imagePath}`
                              : imagePath.startsWith('http')
                              ? imagePath
                              : `${BACKEND_URL}/uploads/${imagePath}`;
                            window.open(imageUrl, '_blank', 'width=600,height=600');
                          }}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isUnlisted 
                              ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800' 
                              : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800'
                          } transition-colors`}
                        >
                          <PhotographIcon className="w-3 h-3 mr-1" />
                          View
                        </button>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isUnlisted 
                            ? 'bg-red-50 text-red-600 dark:bg-red-900 dark:text-red-300' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          No Image
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              
              {/* Grand Total Row */}
              {orderControl?.showSalePrice && orderTotal !== null && (
                <tr className={isDarkMode ? "bg-gray-700" : "bg-gray-100"}>
                  <td colSpan={3} className="px-4 py-3 text-right font-bold">
                    Grand Total:
                  </td>
                  <td className="px-4 py-3 font-bold text-center">
                    {selectedOrder.items.reduce((total, item) => total + item.quantity, 0)}
                  </td>
                  <td className="px-4 py-3 font-bold">
                    <span className={isDarkMode ? 'text-green-400' : 'text-green-600'}>
                      ${orderTotal.toFixed(2)}
                    </span>
                  </td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Back button */}
        <button
          onClick={() => setSelectedOrder(null)}
          className={`mt-6 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            isDarkMode
              ? 'bg-gray-600 hover:bg-gray-700 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
          }`}
        >
          ← Back to My Orders
        </button>
      </div>
    );
  }

  // === If no order is selected, show ONLY the list (not both) ===
  return (
    <div className={`rounded-xl shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        My Orders
      </h2>

      {filteredOrders.length === 0 ? (
        <div className={`text-center py-12 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            {orders.length === 0 ? 'You have no submitted orders yet.' : 'All orders have been hidden. Refresh to see them again.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className={isDarkMode ? "bg-yellow-600" : "bg-yellow-400"}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wider">Order #</th>
                <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wider">Items</th>
                {orderControl?.showSalePrice && (
                  <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wider">Total</th>
                )}
                <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {filteredOrders.map((order, index) => {
                const orderTotal = calculateOrderTotal(order);
                const displayIndex = filteredOrders.length - index; // Reverse numbering (latest first)
                const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                
                return (
                  <tr key={order.id} className={isDarkMode ? "hover:bg-gray-750" : "hover:bg-gray-50"}>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {displayIndex}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {order.orderNumber || `#${order.id}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === 'SUBMITTED' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status === 'PROCESSING'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {totalItems} item(s)
                      </span>
                    </td>
                    {orderControl?.showSalePrice && (
                      <td className="px-4 py-3">
                        <span className={`font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                          {orderTotal ? `$${orderTotal.toFixed(2)}` : '—'}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className={`px-4 py-2 rounded-lg font-medium ${
                            isDarkMode
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className={`p-2 rounded ${isDarkMode
                              ? 'text-red-400 hover:text-red-300 hover:bg-gray-700'
                              : 'text-red-600 hover:text-red-900 hover:bg-gray-200'
                            }`}
                          title="Delete from view"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyOrders;