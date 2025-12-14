// frontend/src/components/admin/inbound orders/InboundOrderStatus.jsx
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import api from '../../../services/api';
import socketService from '../../../services/socket';
import AddBarcode from './AddBarcode';
import { 
  PrinterIcon, 
  ShareIcon, 
  EyeIcon, 
  EyeOffIcon,
  TrashIcon,
  DocumentDownloadIcon,
  ChevronDownIcon,
  ViewGridIcon,
  ViewListIcon,
  PencilIcon,
  XIcon
} from '@heroicons/react/outline';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// ✅ Enhanced Status Indicator Component with Dropdown
const StatusIndicator = memo(({ status, onStatusChange, isEditable = false }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'PENDING':
        return { color: 'bg-red-500', blink: true, text: 'Pending' };
      case 'PROCESSING':
        return { color: 'bg-yellow-500', blink: true, text: 'Processing' };
      case 'COMPLETED':
        return { color: 'bg-green-500', blink: false, text: 'Completed' };
      default:
        return { color: 'bg-gray-500', blink: false, text: status };
    }
  };

  const config = getStatusConfig(status);
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusChange = (newStatus) => {
    setIsOpen(false);
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  };

  if (isEditable) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          <div className={`w-3 h-3 rounded-full ${config.color} ${config.blink ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-medium">{config.text}</span>
          <ChevronDownIcon className="w-4 h-4" />
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10">
            {['PENDING', 'PROCESSING', 'COMPLETED'].map((statusOption) => {
              const optionConfig = getStatusConfig(statusOption);
              return (
                <button
                  key={statusOption}
                  onClick={() => handleStatusChange(statusOption)}
                  className="flex items-center space-x-3 w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  <div className={`w-3 h-3 rounded-full ${optionConfig.color} ${optionConfig.blink ? 'animate-pulse' : ''}`} />
                  <span className="text-sm">{optionConfig.text}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-3 h-3 rounded-full ${config.color} ${config.blink ? 'animate-pulse' : ''}`} />
      <span>{config.text}</span>
    </div>
  );
});

// ✅ Enhanced Scroll Indicator Component
const ScrollIndicator = memo(({ direction = 'horizontal', isDarkMode }) => {
  if (direction === 'horizontal') {
    return (
      <div className="flex justify-center items-center py-2">
        <div className={`w-32 h-1 rounded-full ${isDarkMode ? 'bg-gradient-to-r from-transparent via-purple-500 to-transparent' : 'bg-gradient-to-r from-transparent via-blue-500 to-transparent'} animate-pulse`} />
        <span className={`text-xs mx-2 ${isDarkMode ? 'text-purple-400' : 'text-blue-600'} font-medium`}>
          Scroll for more columns →
        </span>
        <div className={`w-32 h-1 rounded-full ${isDarkMode ? 'bg-gradient-to-r from-transparent via-purple-500 to-transparent' : 'bg-gradient-to-r from-transparent via-blue-500 to-transparent'} animate-pulse`} />
      </div>
    );
  }
  
  return null;
});

// ✅ Order Item Card Component for Grid View with Actions
const OrderItemCard = memo(({ 
  item, 
  index, 
  isDarkMode, 
  orderId,
  showSalePrice,
  showCostPrice,
  showAvailableColumn,
  showImageColumn,
  showBarcode,
  getProductImageUrl,
  getAvailableQuantity,
  handleAvailableQuantityChange,
  onEditItem,
  onDeleteItem
}) => {
  const isUnlisted = !item.product;
  const salePrice = item.unitPrice || item.product?.salePrice || 0;
  const costPrice = item.product?.costPrice || 0;
  const priceToUse = showCostPrice ? costPrice : salePrice;
  const itemTotal = priceToUse * item.quantity;
  const available = getAvailableQuantity(orderId, item.id);

  return (
    <div className={`rounded-lg border transition-all duration-200 hover:shadow-md ${
      isDarkMode 
        ? 'bg-gray-700 border-gray-600 hover:border-gray-500' 
        : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <div className="p-3">
        {/* Item Header with Actions */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${isUnlisted ? 'text-red-500' : (isDarkMode ? 'text-white' : 'text-gray-900')}`}>
              #{index + 1}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              isUnlisted 
                ? 'bg-red-100 text-red-800' 
                : isDarkMode 
                  ? 'bg-gray-600 text-gray-300' 
                  : 'bg-gray-100 text-gray-700'
            }`}>
              {isUnlisted ? 'Unlisted' : 'Product'}
            </span>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => onEditItem(item, index)}
              className={`p-1 rounded hover:bg-opacity-20 ${
                isDarkMode 
                  ? 'text-blue-400 hover:bg-blue-400' 
                  : 'text-blue-600 hover:bg-blue-200'
              }`}
              title="Edit Item"
            >
              <PencilIcon className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDeleteItem(item.id, index)}
              className={`p-1 rounded hover:bg-opacity-20 ${
                isDarkMode 
                  ? 'text-red-400 hover:bg-red-400' 
                  : 'text-red-600 hover:bg-red-200'
              }`}
              title="Delete Item"
            >
              <XIcon className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Product Name */}
        <div className={`font-medium text-sm mb-1 ${isUnlisted ? 'text-red-500' : (isDarkMode ? 'text-white' : 'text-gray-900')}`}>
          {item.product?.name || item.description || 'Unlisted Item'}
        </div>

        {/* Part Number */}
        {item.product?.partNo && (
          <div className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Part #: {item.product.partNo}
          </div>
        )}

        {/* Image - Always visible on mobile */}
        {showImageColumn && (
          <div className="flex justify-center mb-2">
            {getProductImageUrl(item) ? (
              <img
                src={getProductImageUrl(item)}
                alt="Product"
                className="w-16 h-16 object-cover rounded border cursor-pointer hover:scale-105 transition-transform"
                onClick={() => window.open(getProductImageUrl(item, false), '_blank')}
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.parentNode.querySelector('.image-fallback') || document.createElement('span');
                  fallback.className = 'image-fallback text-gray-400 text-xs';
                  fallback.textContent = 'No image';
                  if (!e.target.parentNode.querySelector('.image-fallback')) {
                    e.target.parentNode.appendChild(fallback);
                  }
                }}
              />
            ) : (
              <span className="image-fallback text-gray-400 text-xs">No image</span>
            )}
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-1 text-xs">
          {showAvailableColumn && (
            <>
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Available:</span>
              <input
                type="text"
                value={available}
                onChange={(e) => handleAvailableQuantityChange(orderId, item.id, e.target.value)}
                placeholder="Enter available"
                className={`w-full border rounded px-2 py-1 text-xs ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </>
          )}
          
          {showSalePrice && (
            <>
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Sale Price:</span>
              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>${salePrice.toFixed(2)}</span>
            </>
          )}
          
          {showCostPrice && (
            <>
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Cost Price:</span>
              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>${costPrice.toFixed(2)}</span>
            </>
          )}
          
          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Quantity:</span>
          <span className={`font-medium ${isUnlisted ? 'text-red-500' : (isDarkMode ? 'text-white' : 'text-gray-900')}`}>
            {item.quantity}
          </span>
        </div>

        {/* Total Price */}
        <div className="mt-2 pt-2 border-t border-gray-600 dark:border-gray-400">
          <div className="flex justify-between items-center">
            <span className={`text-sm font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
              Total: ${itemTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Barcode */}
        {showBarcode && item.product?.partNo && (
          <div className="mt-2 pt-2 border-t border-gray-600 dark:border-gray-400">
            <AddBarcode
              partNumber={item.product.partNo}
              isDarkMode={isDarkMode}
              compact={true}
            />
          </div>
        )}
      </div>
    </div>
  );
});

// ✅ Memoized Order Row Component for Table View
const OrderRow = memo(({ 
  order, 
  index, 
  isDarkMode, 
  selectedOrders, 
  onSelectOrder, 
  onViewDetails 
}) => {
  const orderTotal = useMemo(() => {
    if (!order.items) return 0;
    return order.items.reduce((total, item) => {
      const itemPrice = item.unitPrice || item.product?.salePrice || 0;
      return total + (itemPrice * item.quantity);
    }, 0);
  }, [order.items]);

  return (
    <tr className={isDarkMode ? "hover:bg-gray-750" : "hover:bg-gray-50"}>
      <td className="px-3 py-2">
        <input
          type="checkbox"
          checked={selectedOrders.has(order.id)}
          onChange={() => onSelectOrder(order.id)}
          className="rounded border-gray-300"
        />
      </td>
      <td className="px-3 py-2">
        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {index + 1}
        </span>
      </td>
      <td className="px-3 py-2">
        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {order.orderNumber || `#${order.id}`}
        </span>
      </td>
      <td className="px-3 py-2">
        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
          {order.client?.name || 'Unknown'}
        </span>
      </td>
      <td className="px-3 py-2">
        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
          {new Date(order.createdAt).toLocaleDateString()}
        </span>
      </td>
      <td className="px-3 py-2">
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
      <td className="px-3 py-2">
        <StatusIndicator status={order.internalStatus || 'PENDING'} />
      </td>
      <td className="px-3 py-2">
        <span className={`font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
          ${orderTotal.toFixed(2)}
        </span>
      </td>
      <td className="px-3 py-2">
        <button
          onClick={() => onViewDetails(order)}
          className={`px-3 py-1 rounded-md text-sm font-medium ${
            isDarkMode
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          View Details
        </button>
      </td>
    </tr>
  );
});

// ✅ Memoized Order Card Component for Grid View
const OrderCard = memo(({ 
  order, 
  index, 
  isDarkMode, 
  selectedOrders, 
  onSelectOrder, 
  onViewDetails 
}) => {
  const orderTotal = useMemo(() => {
    if (!order.items) return 0;
    return order.items.reduce((total, item) => {
      const itemPrice = item.unitPrice || item.product?.salePrice || 0;
      return total + (itemPrice * item.quantity);
    }, 0);
  }, [order.items]);

  const itemCount = useMemo(() => {
    return order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }, [order.items]);

  return (
    <div className={`rounded-lg border transition-all duration-200 hover:shadow-md ${
      isDarkMode 
        ? 'bg-gray-700 border-gray-600 hover:border-gray-500' 
        : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedOrders.has(order.id)}
              onChange={() => onSelectOrder(order.id)}
              className="rounded border-gray-300"
            />
            <div>
              <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {order.orderNumber || `#${order.id}`}
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {order.client?.name || 'Unknown'}
              </p>
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
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
        </div>

        {/* Order Details */}
        <div className="space-y-2 mb-3">
          <div className="flex justify-between">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Date:</span>
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Items:</span>
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{itemCount}</span>
          </div>
          <div className="flex justify-between">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Internal Status:</span>
            <StatusIndicator status={order.internalStatus || 'PENDING'} />
          </div>
        </div>

        {/* Total and Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
          <span className={`font-bold text-lg ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
            ${orderTotal.toFixed(2)}
          </span>
          <button
            onClick={() => onViewDetails(order)}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              isDarkMode
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
});

// ✅ Optimized debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const InboundOrderStatus = ({ isDarkMode }) => {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [showSalePrice, setShowSalePrice] = useState(true);
  const [showCostPrice, setShowCostPrice] = useState(true);
  const [showOrderInfo, setShowOrderInfo] = useState(true);
  const [showOrderNumber, setShowOrderNumber] = useState(true);
  const [showImageColumn, setShowImageColumn] = useState(true);
  const [showAvailableColumn, setShowAvailableColumn] = useState(true);
  const [sortBy, setSortBy] = useState('date-desc');
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const [clientFilter, setClientFilter] = useState('');
  const [printNote, setPrintNote] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deleteAction, setDeleteAction] = useState(null);
  const [showBarcode, setShowBarcode] = useState(false);
  const [availableQuantities, setAvailableQuantities] = useState({});
  const [viewMode, setViewMode] = useState('table');
  const [itemsViewMode, setItemsViewMode] = useState('table');

  // NEW: Client-side order modifications
  const [modifiedOrders, setModifiedOrders] = useState({});
  const [modifiedSelectedOrder, setModifiedSelectedOrder] = useState(null);

  // ✅ Debounced filters for better performance
  const debouncedClientFilter = useDebounce(clientFilter, 300);
  const debouncedDateFilter = useDebounce(dateFilter, 300);

  // ✅ Client-side only item action handlers (NO DB CHANGES)
  const handleEditItem = useCallback((item, index) => {
    if (!selectedOrder) return;
    
    const newQuantity = prompt(`Edit quantity for: ${item.product?.name || item.description}\nCurrent quantity: ${item.quantity}`, item.quantity);
    
    if (newQuantity && !isNaN(newQuantity) && parseInt(newQuantity) > 0) {
      const quantity = parseInt(newQuantity);
      
      // Update the modified selected order
      setModifiedSelectedOrder(prev => {
        if (!prev) return null;
        
        const updatedItems = [...prev.items];
        updatedItems[index] = {
          ...updatedItems[index],
          quantity: quantity
        };
        
        return {
          ...prev,
          items: updatedItems
        };
      });
      
      // Also update the modified orders cache
      setModifiedOrders(prev => ({
        ...prev,
        [selectedOrder.id]: {
          ...selectedOrder,
          items: modifiedSelectedOrder?.items || selectedOrder.items.map((itm, idx) => 
            idx === index ? { ...itm, quantity } : itm
          )
        }
      }));
    }
  }, [selectedOrder, modifiedSelectedOrder]);

  const handleDeleteItem = useCallback((itemId, index) => {
    if (!selectedOrder) return;
    
    if (window.confirm('Are you sure you want to remove this item from the view? This change is only temporary and won\'t affect the database.')) {
      // Update the modified selected order
      setModifiedSelectedOrder(prev => {
        if (!prev) return null;
        
        const updatedItems = prev.items.filter((_, idx) => idx !== index);
        
        return {
          ...prev,
          items: updatedItems
        };
      });
      
      // Also update the modified orders cache
      setModifiedOrders(prev => ({
        ...prev,
        [selectedOrder.id]: {
          ...selectedOrder,
          items: (modifiedSelectedOrder?.items || selectedOrder.items).filter((_, idx) => idx !== index)
        }
      }));
    }
  }, [selectedOrder, modifiedSelectedOrder]);

  // Get the current order data (original or modified)
  const getCurrentOrderData = useCallback((order) => {
    if (!order) return null;
    return modifiedOrders[order.id] || order;
  }, [modifiedOrders]);

  // Get current selected order data
  const currentSelectedOrder = useMemo(() => {
    return modifiedSelectedOrder || selectedOrder;
  }, [modifiedSelectedOrder, selectedOrder]);

  // Reset modifications when selecting a different order
  useEffect(() => {
    if (selectedOrder) {
      setModifiedSelectedOrder(modifiedOrders[selectedOrder.id] || selectedOrder);
    } else {
      setModifiedSelectedOrder(null);
    }
  }, [selectedOrder, modifiedOrders]);

  // ✅ Memoized data processing
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders;

    // Apply client filter
    if (debouncedClientFilter) {
      filtered = filtered.filter(order => 
        order.client?.name?.toLowerCase().includes(debouncedClientFilter.toLowerCase())
      );
    }

    // Apply date filter
    if (debouncedDateFilter.from || debouncedDateFilter.to) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        const fromDate = debouncedDateFilter.from ? new Date(debouncedDateFilter.from) : null;
        const toDate = debouncedDateFilter.to ? new Date(debouncedDateFilter.to + 'T23:59:59') : null;

        if (fromDate && orderDate < fromDate) return false;
        if (toDate && orderDate > toDate) return false;
        return true;
      });
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'client-asc':
          aValue = a.client?.name || 'Unknown';
          bValue = b.client?.name || 'Unknown';
          return aValue.localeCompare(bValue);
        case 'client-desc':
          aValue = a.client?.name || 'Unknown';
          bValue = b.client?.name || 'Unknown';
          return bValue.localeCompare(aValue);
        case 'total-asc':
          aValue = calculateOrderTotal(a);
          bValue = calculateOrderTotal(b);
          return aValue - bValue;
        case 'total-desc':
          aValue = calculateOrderTotal(a);
          bValue = calculateOrderTotal(b);
          return bValue - aValue;
        case 'date-asc':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          return aValue - bValue;
        case 'date-desc':
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          return bValue - aValue;
      }
    });
  }, [orders, sortBy, debouncedClientFilter, debouncedDateFilter]);

  // ✅ Optimized socket listeners with proper cleanup
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [ordersResponse, clientsResponse] = await Promise.all([
          api.get('/api/admin/inbound-orders'),
          api.get('/api/clients')
        ]);

        if (isMounted) {
          setOrders(ordersResponse.data);
          setClients(clientsResponse.data);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    const socket = socketService.getSocket();
    if (socket) {
      const handleOrderUpdate = () => {
        if (isMounted) {
          fetchData();
        }
      };

      socket.on('inbound_order_submitted', handleOrderUpdate);
      socket.on('inbound_order_updated', handleOrderUpdate);

      return () => {
        isMounted = false;
        if (socket) {
          socket.off('inbound_order_submitted', handleOrderUpdate);
          socket.off('inbound_order_updated', handleOrderUpdate);
        }
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // ✅ Memoized helper functions
  const getProductImageUrl = useCallback((item, optimized = true) => {
    let imageUrl = null;

    if (item.imagePath) {
      imageUrl = `${BACKEND_URL}${item.imagePath}`;
    } else if (item.product?.image) {
      imageUrl = item.product.image;
    }

    if (!imageUrl) return null;

    if (imageUrl.startsWith('/uploads/')) {
      imageUrl = `${BACKEND_URL}${imageUrl}`;
      if (optimized && !imageUrl.includes('?')) {
        imageUrl += '?width=200&height=150&quality=70';
      }
    } else if (!imageUrl.startsWith('http')) {
      imageUrl = `${BACKEND_URL}/${imageUrl}`.replace('//', '/');
    }

    return imageUrl;
  }, []);

  const calculateOrderTotal = useCallback((order) => {
    if (!order.items) return 0;
    return order.items.reduce((total, item) => {
      const itemPrice = showSalePrice ? (item.unitPrice || item.product?.salePrice || 0) : 0;
      const itemCost = showCostPrice ? (item.product?.costPrice || 0) : 0;
      const priceToUse = showCostPrice ? itemCost : itemPrice;
      return total + (priceToUse * item.quantity);
    }, 0);
  }, [showSalePrice, showCostPrice]);

  const calculateDetailedTotals = useCallback((order) => {
    let saleTotal = 0;
    let costTotal = 0;

    order.items.forEach(item => {
      const salePrice = item.unitPrice || item.product?.salePrice || 0;
      const costPrice = item.product?.costPrice || 0;
      saleTotal += salePrice * item.quantity;
      costTotal += costPrice * item.quantity;
    });

    return { saleTotal, costTotal };
  }, []);

  // ✅ Optimized event handlers
  const handleAvailableQuantityChange = useCallback((orderId, itemId, quantity) => {
    setAvailableQuantities(prev => ({
      ...prev,
      [`${orderId}-${itemId}`]: quantity
    }));
  }, []);

  const getAvailableQuantity = useCallback((orderId, itemId) => {
    return availableQuantities[`${orderId}-${itemId}`] || '';
  }, [availableQuantities]);

  const handleSelectOrder = useCallback((orderId) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedOrders.size === filteredAndSortedOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredAndSortedOrders.map(order => order.id)));
    }
  }, [filteredAndSortedOrders, selectedOrders.size]);

  const updateInternalStatus = useCallback(async (orderId, newStatus) => {
    try {
      await api.put(`/api/admin/inbound-orders/${orderId}/status`, {
        status: newStatus
      });
      
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, internalStatus: newStatus } : order
      ));
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, internalStatus: newStatus }));
        setModifiedSelectedOrder(prev => prev ? { ...prev, internalStatus: newStatus } : null);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  }, [selectedOrder]);

  const updateBulkInternalStatus = useCallback(async (newStatus) => {
    if (selectedOrders.size === 0) {
      alert('Please select at least one order');
      return;
    }

    try {
      await api.put('/api/admin/inbound-orders/bulk-status', {
        orderIds: Array.from(selectedOrders),
        status: newStatus
      });

      setOrders(prev => prev.map(order => 
        selectedOrders.has(order.id) ? { ...order, internalStatus: newStatus } : order
      ));

      if (selectedOrder && selectedOrders.has(selectedOrder.id)) {
        setSelectedOrder(prev => ({ ...prev, internalStatus: newStatus }));
        setModifiedSelectedOrder(prev => prev ? { ...prev, internalStatus: newStatus } : null);
      }

      setSelectedOrders(new Set());
      alert(`Status updated to ${newStatus} for ${selectedOrders.size} orders`);
    } catch (err) {
      console.error('Error updating bulk status:', err);
      alert('Failed to update status');
    }
  }, [selectedOrders, selectedOrder]);

  const handleDeleteOrders = useCallback(async () => {
    if (selectedOrders.size === 0) {
      alert('Please select at least one order to delete');
      return;
    }

    setDeleteAction('delete');
    setShowPasswordModal(true);
  }, [selectedOrders.size]);

  const verifyAdminPassword = useCallback(async () => {
    try {
      const response = await api.post('/api/admin/verify-password', {
        password: adminPassword
      });

      if (response.data.valid) {
        if (deleteAction === 'delete') {
          await api.post('/api/admin/inbound-orders/bulk-delete', {
            orderIds: Array.from(selectedOrders)
          });

          setOrders(prev => prev.filter(order => !selectedOrders.has(order.id)));
          setSelectedOrders(new Set());
          alert(`Successfully deleted ${selectedOrders.size} orders`);
        }
        
        setShowPasswordModal(false);
        setAdminPassword('');
        setDeleteAction(null);
      } else {
        alert('Invalid admin password');
        setAdminPassword('');
      }
    } catch (err) {
      console.error('Password verification failed:', err);
      alert('Password verification failed');
      setAdminPassword('');
    }
  }, [adminPassword, deleteAction, selectedOrders]);

  const exportSelectedToCSV = useCallback(() => {
    if (selectedOrders.size === 0) {
      alert('Please select at least one order to export');
      return;
    }

    const selectedOrdersData = orders.filter(order => selectedOrders.has(order.id));
    const headers = ['Order Number', 'Client', 'Date', 'Status', 'Internal Status', 'Total', 'Item Count'];
    const csvData = selectedOrdersData.map(order => [
      order.orderNumber || order.id,
      order.client?.name || 'Unknown',
      new Date(order.createdAt).toLocaleDateString(),
      order.status,
      order.internalStatus || 'PENDING',
      `$${calculateOrderTotal(order).toFixed(2)}`,
      order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [selectedOrders, orders, calculateOrderTotal]);

  const exportOrderToCSV = useCallback((order) => {
    const headers = ['Product', 'Part Number', 'Quantity', 'Available', 'Sale Price', 'Cost Price', 'Total'];
    const csvData = order.items.map(item => {
      const salePrice = item.unitPrice || item.product?.salePrice || 0;
      const costPrice = item.product?.costPrice || 0;
      const total = salePrice * item.quantity;
      const available = getAvailableQuantity(order.id, item.id) || '';
      
      return [
        item.product?.name || item.description || 'Unlisted Item',
        item.product?.partNo || 'N/A',
        item.quantity,
        available,
        `$${salePrice.toFixed(2)}`,
        `$${costPrice.toFixed(2)}`,
        `$${total.toFixed(2)}`
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order_${order.orderNumber || order.id}_details.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [getAvailableQuantity]);

  const shareOrder = useCallback((order) => {
    const orderTotal = calculateOrderTotal(order);
    const orderText = `Order #${order.orderNumber || order.id}\n` +
      `Client: ${order.client?.name || 'Unknown'}\n` +
      `Date: ${new Date(order.createdAt).toLocaleDateString()}\n` +
      `Status: ${order.status}\n` +
      `Items: ${order.items.reduce((total, item) => total + item.quantity, 0)}\n` +
      `Total: $${orderTotal.toFixed(2)}`;

    if (navigator.share) {
      navigator.share({
        title: `Order ${order.orderNumber || order.id}`,
        text: orderText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(orderText);
      alert('Order details copied to clipboard!');
    }
  }, [calculateOrderTotal]);

 const handlePrint = useCallback((order) => {
  const printWindow = window.open('', '_blank');
  const currentOrder = getCurrentOrderData(order);
  const { saleTotal, costTotal } = calculateDetailedTotals(currentOrder);
  const itemCount = currentOrder.items.reduce((sum, item) => sum + item.quantity, 0);
  const showImageInPrint = showImageColumn && currentOrder.items.some(item => 
    item.imagePath || item.product?.image
  );

  // Calculate colspan values
  const baseColspan = 3 + (showAvailableColumn ? 1 : 0) + (showSalePrice ? 1 : 0) + (showCostPrice ? 1 : 0);
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Order ${currentOrder.orderNumber || currentOrder.id}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          padding: 15px; 
          margin: 0; 
          font-size: 12px;
          line-height: 1.2;
        }
        .print-header { 
          margin-bottom: 15px; 
          padding-bottom: 8px; 
          border-bottom: 1px solid #333;
        }
        .print-title { 
          font-size: 16px; 
          font-weight: bold; 
          margin: 0 0 5px 0;
          color: #333;
        }
        .order-info { 
          margin-bottom: 12px; 
          padding: 10px; 
          background: #f8f9fa; 
          border-radius: 4px; 
          border-left: 3px solid #ffc107;
          font-size: 11px;
        }
        .order-info p { margin: 3px 0; }
        .note-section { 
          margin: 10px 0; 
          padding: 8px; 
          border: 1px dashed #999; 
          background: #fffacd; 
          border-radius: 4px; 
          font-size: 11px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 12px;
          font-size: 11px;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 6px 4px; 
          text-align: center; 
          vertical-align: middle;
        }
        th { 
          background-color: #ffc107; 
          font-weight: bold; 
          font-size: 10px;
          padding: 4px;
        }
        tbody tr:nth-child(even) { background-color: #f9f9f9; }
        tbody tr:nth-child(odd) { background-color: #ffffff; }
        .total-row { background-color: #ffc107 !important; font-weight: bold; }
        .cost-total { background-color: #ffeaa7 !important; font-weight: bold; }
        .product-image { 
          max-width: 40px; 
          max-height: 40px; 
          border-radius: 3px;
          display: block;
          margin: 0 auto;
        }
        .compact-text { font-size: 10px; line-height: 1.1; }
        .text-left { text-align: left; }
        @media print { 
          body { padding: 10mm; } 
          @page { margin: 10mm; } 
        }
        @media print and (max-width: 600px) {
          body { padding: 5mm; font-size: 10px; }
          table { font-size: 9px; }
          th, td { padding: 3px 2px; }
        }
      </style>
    </head>
    <body>
      <div class="print-header">
        <h1 class="print-title">${showOrderNumber ? `Order #${currentOrder.orderNumber || currentOrder.id}` : 'Order Details'}</h1>
      </div>
      
      ${showOrderInfo ? `<div class="order-info compact-text">
        ${showOrderNumber ? `<p><strong>Order Number:</strong> ${currentOrder.orderNumber || currentOrder.id}</p>` : ''}
        <p><strong>Client:</strong> ${currentOrder.client?.name || 'Unknown'}</p>
        <p><strong>Date:</strong> ${new Date(currentOrder.createdAt).toLocaleString()}</p>
        <p><strong>Status:</strong> ${currentOrder.status}</p>
        <p><strong>Internal Status:</strong> ${currentOrder.internalStatus || 'PENDING'}</p>
        <p><strong>Total Items:</strong> ${itemCount}</p>
      </div>` : ''}

      ${printNote ? `<div class="note-section compact-text">
        <strong>Note:</strong> ${printNote}
      </div>` : ''}

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th class="text-left">Product</th>
            <th>Part No</th>
            ${showAvailableColumn ? '<th>Avail</th>' : ''}
            ${showSalePrice ? '<th>Sale</th>' : ''}
            ${showCostPrice ? '<th>Cost</th>' : ''}
            <th>Qty</th>
            ${(showSalePrice || showCostPrice) ? '<th>Total</th>' : ''}
            ${showImageInPrint ? '<th>Img</th>' : ''}
            ${showBarcode ? '<th>Barcode</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${currentOrder.items.map((item, index) => {
            const salePrice = item.unitPrice || item.product?.salePrice || 0;
            const costPrice = item.product?.costPrice || 0;
            const priceToUse = showCostPrice ? costPrice : salePrice;
            const itemTotal = priceToUse * item.quantity;
            const imagePath = item.imagePath || item.product?.imagePath;
            const partNo = item.product?.partNo;
            const available = getAvailableQuantity(currentOrder.id, item.id) || '';
            
            const displayPartNo = partNo ? 
              (partNo.toString().includes('E+') ? 
                BigInt(Number(partNo)).toString() : 
                partNo.toString()) 
              : 'N/A';

            return `<tr>
              <td class="compact-text">${index + 1}</td>
              <td class="compact-text text-left">${item.product?.name || item.description || 'Unlisted Item'}</td>
              <td class="compact-text part-number">${displayPartNo}</td>
              ${showAvailableColumn ? `<td class="compact-text">${available}</td>` : ''}
              ${showSalePrice ? `<td class="compact-text">$${salePrice.toFixed(2)}</td>` : ''}
              ${showCostPrice ? `<td class="compact-text">$${costPrice.toFixed(2)}</td>` : ''}
              <td class="compact-text">${item.quantity}</td>
              ${(showSalePrice || showCostPrice) ? `<td class="compact-text">$${itemTotal.toFixed(2)}</td>` : ''}
              ${showImageInPrint ? `<td>${(item.imagePath || item.product?.image) ? `<img src="${BACKEND_URL}${item.imagePath || item.product?.image}" alt="Product Image" class="product-image" />` : ''}</td>` : ''}
              ${showBarcode && partNo ? `<td><img src="https://barcodeapi.org/api/128/${displayPartNo}" alt="Barcode" style="max-width: 80px; height: 30px;" /></td>` : (showBarcode ? '<td></td>' : '')}
            </tr>`;
          }).join('')}
          
          ${showSalePrice ? `<tr class="total-row">
            <td colspan="${baseColspan}" style="text-align: right;" class="compact-text">Grand Total (Sale):</td>
            <td class="compact-text">${itemCount}</td>
            <td class="compact-text">$${saleTotal.toFixed(2)}</td>
            ${showImageInPrint ? '<td></td>' : ''}
            ${showBarcode ? '<td></td>' : ''}
          </tr>` : ''}
          
          ${showCostPrice ? `<tr class="${showSalePrice ? 'cost-total' : 'total-row'}">
            <td colspan="${baseColspan}" style="text-align: right;" class="compact-text">Grand Total (Cost):</td>
            <td class="compact-text">${itemCount}</td>
            <td class="compact-text">$${costTotal.toFixed(2)}</td>
            ${showImageInPrint ? '<td></td>' : ''}
            ${showBarcode ? '<td></td>' : ''}
          </tr>` : ''}
        </tbody>
      </table>

      <script>
        function waitForImagesAndPrint() {
          const imgs = Array.from(document.images);
          if (imgs.length === 0) {
            window.print();
            return;
          }
          let loaded = 0;
          imgs.forEach(img => {
            if (img.complete) {
              loaded++;
            } else {
              img.onload = img.onerror = () => {
                loaded++;
                if (loaded === imgs.length) {
                  window.print();
                }
              };
            }
          });
          if (loaded === imgs.length) {
            window.print();
          }
        }
        window.onload = waitForImagesAndPrint;
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
}, [showOrderInfo, showOrderNumber, showAvailableColumn, showSalePrice, showCostPrice, showImageColumn, showBarcode, printNote, calculateDetailedTotals, getAvailableQuantity, getCurrentOrderData]);
  
// ✅ Detailed Order View
  if (selectedOrder) {
    const currentOrder = currentSelectedOrder;
    const { saleTotal, costTotal } = calculateDetailedTotals(currentOrder);

    return (
      <div className={`rounded-xl shadow-sm p-4 sm:p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Order #{currentOrder.orderNumber || currentOrder.id}
            {modifiedSelectedOrder && modifiedSelectedOrder !== selectedOrder && (
              <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-1 rounded">Modified</span>
            )}
          </h2>

          <div className="flex flex-wrap gap-2 justify-end">
            {/* View Mode Toggle for Items */}
            <div className={`flex rounded-lg p-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <button
                onClick={() => setItemsViewMode('table')}
                className={`p-2 rounded-md transition-colors flex items-center space-x-1 ${
                  itemsViewMode === 'table'
                    ? isDarkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                    : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Table View"
              >
                <ViewListIcon className="w-3 h-3" />
                <span className="text-xs">Table</span>
              </button>
              <button
                onClick={() => setItemsViewMode('grid')}
                className={`p-2 rounded-md transition-colors flex items-center space-x-1 ${
                  itemsViewMode === 'grid'
                    ? isDarkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                    : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Grid View"
              >
                <ViewGridIcon className="w-3 h-3" />
                <span className="text-xs">Grid</span>
              </button>
            </div>

            {/* Order Number Toggle */}
            <div className="group relative">
              <button
                onClick={() => setShowOrderNumber(!showOrderNumber)}
                className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${showOrderNumber
                    ? 'bg-amber-600 text-white shadow-lg'
                    : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                title={showOrderNumber ? "Hide Order Number" : "Show Order Number"}
              >
                <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-10 shadow-lg border border-gray-600">
                {showOrderNumber ? "Hide Order No" : "Show Order No"}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>

            {/* Order Info Toggle */}
            <div className="group relative">
              <button
                onClick={() => setShowOrderInfo(!showOrderInfo)}
                className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${showOrderInfo
                    ? 'bg-purple-600 text-white shadow-lg'
                    : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                title={showOrderInfo ? "Hide Order Info" : "Show Order Info"}
              >
                <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-10 shadow-lg border border-gray-600">
                {showOrderInfo ? "Hide Info" : "Show Info"}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>

            {/* Sale Price Toggle */}
            <div className="group relative">
              <button
                onClick={() => setShowSalePrice(!showSalePrice)}
                className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${showSalePrice
                    ? 'bg-green-600 text-white shadow-lg'
                    : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                title={showSalePrice ? "Hide Sale Prices" : "Show Sale Prices"}
              >
                <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-10 shadow-lg border border-gray-600">
                {showSalePrice ? "Hide Sale" : "Show Sale"}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>

            {/* Cost Price Toggle */}
            <div className="group relative">
              <button
                onClick={() => setShowCostPrice(!showCostPrice)}
                className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${showCostPrice
                    ? 'bg-blue-600 text-white shadow-lg'
                    : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                title={showCostPrice ? "Hide Cost Prices" : "Show Cost Prices"}
              >
                <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-10 shadow-lg border border-gray-600">
                {showCostPrice ? "Hide Cost" : "Show Cost"}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>

            {/* Image Column Toggle */}
            <div className="group relative">
              <button
                onClick={() => setShowImageColumn(!showImageColumn)}
                className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${showImageColumn
                    ? 'bg-pink-600 text-white shadow-lg'
                    : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                title={showImageColumn ? "Hide Image Column" : "Show Image Column"}
              >
                <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-10 shadow-lg border border-gray-600">
                {showImageColumn ? "Hide Images" : "Show Images"}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>

            {/* Available Column Toggle */}
            <div className="group relative">
              <button
                onClick={() => setShowAvailableColumn(!showAvailableColumn)}
                className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${showAvailableColumn
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                title={showAvailableColumn ? "Hide Available Column" : "Show Available Column"}
              >
                <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-10 shadow-lg border border-gray-600">
                {showAvailableColumn ? "Hide Available" : "Show Available"}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>

            {/* Barcode Toggle */}
            <div className="group relative">
              <button
                onClick={() => setShowBarcode(!showBarcode)}
                className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${showBarcode
                    ? 'bg-orange-600 text-white shadow-lg'
                    : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                title={showBarcode ? "Hide Barcodes" : "Show Barcodes"}
              >
                <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-10 shadow-lg border border-gray-600">
                {showBarcode ? "Hide Barcodes" : "Show Barcodes"}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>

            {/* Reset Modifications Button */}
            {modifiedSelectedOrder && modifiedSelectedOrder !== selectedOrder && (
              <div className="group relative">
                <button
                  onClick={() => {
                    setModifiedSelectedOrder(selectedOrder);
                    setModifiedOrders(prev => {
                      const newModified = { ...prev };
                      delete newModified[selectedOrder.id];
                      return newModified;
                    });
                  }}
                  className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${
                    isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                  title="Reset Changes"
                >
                  <XIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-10 shadow-lg border border-gray-600">
                  Reset Changes
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                </div>
              </div>
            )}

            {/* CSV Export Button */}
            <div className="group relative">
              <button
                onClick={() => exportOrderToCSV(currentOrder)}
                className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 flex items-center ${isDarkMode ? 'bg-teal-700 hover:bg-teal-600 text-white' : 'bg-teal-200 hover:bg-teal-300 text-teal-700'
                  }`}
                title="Export to CSV"
              >
                <DocumentDownloadIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                <span className="text-xs font-medium">CSV</span>
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-10 shadow-lg border border-gray-600">
                Export CSV
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>

            {/* Print Button */}
            <div className="group relative">
              <button
                onClick={() => handlePrint(currentOrder)}
                className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                title="Print Order"
              >
                <PrinterIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-10 shadow-lg border border-gray-600">
                Print Order
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>

            {/* Share Button */}
            <div className="group relative">
              <button
                onClick={() => shareOrder(currentOrder)}
                className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                title="Share Order"
              >
                <ShareIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-10 shadow-lg border border-gray-600">
                Share Order
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Internal Status Display - Now Editable */}
        <div className="mb-4">
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Internal Status
          </label>
          <StatusIndicator 
            status={currentOrder.internalStatus || 'PENDING'} 
            onStatusChange={(newStatus) => updateInternalStatus(currentOrder.id, newStatus)}
            isEditable={true}
          />
        </div>

        {/* Print Note Input */}
        <div className="mb-4">
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Print Note (Optional)
          </label>
          <input
            type="text"
            value={printNote}
            onChange={(e) => setPrintNote(e.target.value)}
            placeholder="Add a note for printing..."
            className={`w-full border rounded-lg px-3 py-2 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          />
        </div>

        {/* Order Info - Conditionally Rendered */}
        {showOrderInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
            <div className="space-y-1">
              {showOrderNumber && (
                <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <strong>Order Number:</strong> {currentOrder.orderNumber || currentOrder.id}
                </div>
              )}
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <strong>Client:</strong> {currentOrder.client?.name || 'Unknown'}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <strong>Date:</strong> {new Date(currentOrder.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="space-y-1">
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <strong>Submitted Status:</strong> {currentOrder.status}
              </div>
              <div className={`text-sm font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                <strong>Total:</strong> ${calculateOrderTotal(currentOrder).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Items Count and View Info */}
        <div className="flex justify-between items-center mb-3">
          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {currentOrder.items.length} items
            {modifiedSelectedOrder && modifiedSelectedOrder !== selectedOrder && (
              <span className="ml-1 text-xs text-yellow-600">(modified)</span>
            )}
          </span>
          <span className={`text-xs ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
            {itemsViewMode === 'table' ? 'Scroll horizontally to see all columns →' : 'Grid View - Scroll vertically'}
          </span>
        </div>

        {/* Order Items Display - Table or Grid View */}
        {itemsViewMode === 'table' ? (
          /* Table View */
          <div>
            <ScrollIndicator isDarkMode={isDarkMode} />
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className={isDarkMode ? "bg-yellow-600" : "bg-yellow-400"}>
                  <tr>
                    <th className="px-2 py-1 text-center text-xs font-bold uppercase tracking-wider">#</th>
                    <th className="px-2 py-1 text-left text-xs font-bold uppercase tracking-wider">Product</th>
                    <th className="px-2 py-1 text-center text-xs font-bold uppercase tracking-wider">Part No</th>
                    {showAvailableColumn && <th className="px-2 py-1 text-center text-xs font-bold uppercase tracking-wider">Available</th>}
                    {showSalePrice && <th className="px-2 py-1 text-center text-xs font-bold uppercase tracking-wider">Sale</th>}
                    {showCostPrice && <th className="px-2 py-1 text-center text-xs font-bold uppercase tracking-wider">Cost</th>}
                    <th className="px-2 py-1 text-center text-xs font-bold uppercase tracking-wider">Qty</th>
                    {(showSalePrice || showCostPrice) && (
                      <th className="px-2 py-1 text-center text-xs font-bold uppercase tracking-wider">Total</th>
                    )}
                    {showImageColumn && <th className="px-2 py-1 text-center text-xs font-bold uppercase tracking-wider">Image</th>}
                    {showBarcode && <th className="px-2 py-1 text-center text-xs font-bold uppercase tracking-wider">Barcode</th>}
                    <th className="px-2 py-1 text-center text-xs font-bold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                  {currentOrder.items.map((item, index) => {
                    const isUnlisted = !item.product;
                    const salePrice = item.unitPrice || item.product?.salePrice || 0;
                    const costPrice = item.product?.costPrice || 0;
                    const priceToUse = showCostPrice ? costPrice : salePrice;
                    const itemTotal = priceToUse * item.quantity;
                    const available = getAvailableQuantity(currentOrder.id, item.id);

                    return (
                      <tr key={`${item.id}-${index}`} className={isDarkMode ? "hover:bg-gray-750" : "hover:bg-gray-50"}>
                        <td className="px-2 py-1 text-center">
                          <span className={`font-medium text-xs ${isUnlisted ? 'text-red-500' : (isDarkMode ? 'text-gray-300' : 'text-gray-700')}`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-2 py-1">
                          <div className={`font-medium text-xs ${isUnlisted ? 'text-red-500' : (isDarkMode ? 'text-white' : 'text-gray-900')}`}>
                            {item.product?.name || item.description || 'Unlisted Item'}
                          </div>
                          {item.product?.partNo && (
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {item.product.partNo}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-1 text-center">
                          <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {item.product?.partNo || 'N/A'}
                          </span>
                        </td>
                        {/* Available Column */}
                        {showAvailableColumn && (
                          <td className="px-2 py-1 text-center">
                            <input
                              type="text"
                              value={available}
                              onChange={(e) => handleAvailableQuantityChange(currentOrder.id, item.id, e.target.value)}
                              placeholder="Qty"
                              className={`w-12 border rounded px-1 py-0.5 text-xs ${
                                isDarkMode 
                                  ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                              }`}
                            />
                          </td>
                        )}
                        {showSalePrice && (
                          <td className="px-2 py-1 text-center">
                            <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              ${salePrice.toFixed(2)}
                            </span>
                          </td>
                        )}
                        {showCostPrice && (
                          <td className="px-2 py-1 text-center">
                            <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              ${costPrice.toFixed(2)}
                            </span>
                          </td>
                        )}
                        <td className="px-2 py-1 text-center">
                          <span className={`font-medium text-xs ${isUnlisted ? 'text-red-500' : (isDarkMode ? 'text-white' : 'text-gray-900')}`}>
                            {item.quantity}
                          </span>
                        </td>
                        {(showSalePrice || showCostPrice) && (
                          <td className="px-2 py-1 text-center">
                            <span className={`font-medium text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                              ${itemTotal.toFixed(2)}
                            </span>
                          </td>
                        )}
                        {showImageColumn && (
                          <td className="px-2 py-1 text-center">
                            {getProductImageUrl(item) ? (
                              <div className="flex justify-center">
                                <img
                                  src={getProductImageUrl(item)}
                                  alt="Product"
                                  className="w-8 h-8 object-cover rounded border cursor-pointer hover:scale-110 transition-transform"
                                  onClick={() => window.open(getProductImageUrl(item,false), '_blank')}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    const fallback = e.target.parentNode.querySelector('.image-fallback') || document.createElement('span');
                                    fallback.className = 'image-fallback text-gray-400 text-xs';
                                    fallback.textContent = 'No img';
                                    if (!e.target.parentNode.querySelector('.image-fallback')) {
                                      e.target.parentNode.appendChild(fallback);
                                    }
                                  }}
                                />
                                <span className="image-fallback text-gray-400 text-xs" style={{display: 'none'}}>No img</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">No img</span>
                            )}
                          </td>
                        )}
                        {showBarcode && (
                          <td className="px-2 py-1 text-center">
                            <AddBarcode
                              partNumber={item.product?.partNo}
                              isDarkMode={isDarkMode}
                              compact={true}
                            />
                          </td>
                        )}
                        {/* Actions Column */}
                        <td className="px-2 py-1 text-center">
                          <div className="flex justify-center space-x-1">
                            <button
                              onClick={() => handleEditItem(item, index)}
                              className={`p-1 rounded hover:bg-opacity-20 ${
                                isDarkMode 
                                  ? 'text-blue-400 hover:bg-blue-400' 
                                  : 'text-blue-600 hover:bg-blue-200'
                              }`}
                              title="Edit Quantity"
                            >
                              <PencilIcon className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id, index)}
                              className={`p-1 rounded hover:bg-opacity-20 ${
                                isDarkMode 
                                  ? 'text-red-400 hover:bg-red-400' 
                                  : 'text-red-600 hover:bg-red-200'
                              }`}
                              title="Remove Item (Temporary)"
                            >
                              <XIcon className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Footer Totals */}
                  {(showSalePrice || showCostPrice) && (
                    <>
                      {showSalePrice && (
                        <tr className={isDarkMode ? "bg-yellow-700" : "bg-yellow-200"}>
                          <td 
                            colSpan={3 + (showAvailableColumn ? 1 : 0) + (showSalePrice ? 1 : 0) + (showCostPrice ? 1 : 0)} 
                            className="px-2 py-1 text-right font-bold text-xs"
                          >
                            Total Sale:
                          </td>
                          <td className="px-2 py-1 text-center font-bold text-xs">
                            {currentOrder.items.reduce((sum, item) => sum + item.quantity, 0)}
                          </td>
                          <td className="px-2 py-1 font-bold text-xs">
                            ${saleTotal.toFixed(2)}
                          </td>
                          {showImageColumn && <td></td>}
                          {showBarcode && <td></td>}
                          <td></td>
                        </tr>
                      )}
                      {showCostPrice && (
                        <tr className={isDarkMode ? "bg-yellow-600" : "bg-yellow-300"}>
                          <td 
                            colSpan={3 + (showAvailableColumn ? 1 : 0) + (showSalePrice ? 1 : 0) + (showCostPrice ? 1 : 0)} 
                            className="px-2 py-1 text-right font-bold text-xs"
                          >
                            Total Cost:
                          </td>
                          <td className="px-2 py-1 text-center font-bold text-xs">
                            {currentOrder.items.reduce((sum, item) => sum + item.quantity, 0)}
                          </td>
                          <td className="px-2 py-1 font-bold text-xs">
                            ${costTotal.toFixed(2)}
                          </td>
                          {showImageColumn && <td></td>}
                          {showBarcode && <td></td>}
                          <td></td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
            <ScrollIndicator isDarkMode={isDarkMode} />
          </div>
        ) : (
          /* Grid View for Items */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentOrder.items.map((item, index) => (
              <OrderItemCard
                key={`${item.id}-${index}`}
                item={item}
                index={index}
                isDarkMode={isDarkMode}
                orderId={currentOrder.id}
                showSalePrice={showSalePrice}
                showCostPrice={showCostPrice}
                showAvailableColumn={showAvailableColumn}
                showImageColumn={showImageColumn}
                showBarcode={showBarcode}
                getProductImageUrl={getProductImageUrl}
                getAvailableQuantity={getAvailableQuantity}
                handleAvailableQuantityChange={handleAvailableQuantityChange}
                onEditItem={handleEditItem}
                onDeleteItem={handleDeleteItem}
              />
            ))}
            
            {/* Totals in Grid View */}
            {(showSalePrice || showCostPrice) && (
              <div className={`col-span-full p-3 rounded-lg border ${isDarkMode ? 'bg-yellow-700 border-yellow-600' : 'bg-yellow-200 border-yellow-300'}`}>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {showSalePrice && (
                    <>
                      <div className="font-bold">Total Sale:</div>
                      <div className="font-bold">${saleTotal.toFixed(2)}</div>
                    </>
                  )}
                  {showCostPrice && (
                    <>
                      <div className="font-bold">Total Cost:</div>
                      <div className="font-bold">${costTotal.toFixed(2)}</div>
                    </>
                  )}
                  <div className="font-bold">Total Items:</div>
                  <div className="font-bold">{currentOrder.items.reduce((sum, item) => sum + item.quantity, 0)}</div>
                </div>
              </div>
            )}
          </div>
        )}
        
        <button
          onClick={() => {
            setSelectedOrder(null);
            setModifiedSelectedOrder(null);
          }}
          className={`mt-4 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${isDarkMode
            ? 'bg-gray-600 hover:bg-gray-700 text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
        >
          ← Back to Orders List
        </button>
      </div>
    );
  }

  // Main orders list view
  return (
    <div className={`rounded-xl shadow-sm p-4 sm:p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Inbound Orders Status
        </h2>

        {/* View Mode Toggle */}
        <div className={`flex rounded-lg p-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-md transition-colors flex items-center space-x-2 ${
              viewMode === 'table'
                ? isDarkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Table View"
          >
            <ViewListIcon className="w-4 h-4" />
            <span className="text-sm">Table</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors flex items-center space-x-2 ${
              viewMode === 'grid'
                ? isDarkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Grid View"
          >
            <ViewGridIcon className="w-4 h-4" />
            <span className="text-sm">Grid</span>
          </button>
        </div>
      </div>
      {/* Filters and Sorting */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="date-desc">Date (Newest First)</option>
            <option value="date-asc">Date (Oldest First)</option>
            <option value="client-asc">Client Name (A-Z)</option>
            <option value="client-desc">Client Name (Z-A)</option>
            <option value="total-desc">Total (Highest First)</option>
            <option value="total-asc">Total (Lowest First)</option>
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Client Filter
          </label>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="">All Clients</option>
            {clients.map(client => (
              <option key={client.id} value={client.name}>
                {client.name} {client.company ? `(${client.company})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Date Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={dateFilter.from}
              onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
              className={`w-full border rounded-lg px-3 py-2 text-xs ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
            <input
              type="date"
              value={dateFilter.to}
              onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
              className={`w-full border rounded-lg px-3 py-2 text-xs ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
        </div>
      </div>

      {/* Bulk Action Buttons */}
      {selectedOrders.size > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => console.log('Processing orders:', Array.from(selectedOrders))}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            Process Selected ({selectedOrders.size})
          </button>
          <button
            onClick={() => console.log('Merging orders:', Array.from(selectedOrders))}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Merge Orders
          </button>
          <button
            onClick={() => console.log('Forwarding to outbound:', Array.from(selectedOrders))}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            Forward to Outbound
          </button>
          <button
            onClick={exportSelectedToCSV}
            className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center text-sm"
          >
            <DocumentDownloadIcon className="w-4 h-4 mr-1" />
            Export CSV ({selectedOrders.size})
          </button>
          <button
            onClick={handleDeleteOrders}
            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center text-sm"
          >
            <TrashIcon className="w-4 h-4 mr-1" />
            Delete ({selectedOrders.size})
          </button>
          {/* Bulk status update */}
          <select
            onChange={(e) => updateBulkInternalStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white text-gray-900 text-sm"
            defaultValue=""
          >
            <option value="" disabled>Update Status</option>
            <option value="PENDING">Set to Pending</option>
            <option value="PROCESSING">Set to Processing</option>
            <option value="COMPLETED">Set to Completed</option>
          </select>
        </div>
      )}

      {/* Password Confirmation Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-xl w-full max-w-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="p-6">
              <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Admin Password Required
              </h3>
              <p className={`mb-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Please enter your admin password to confirm this action.
              </p>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                className={`w-full border rounded-lg px-3 py-2 mb-4 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setAdminPassword('');
                    setDeleteAction(null);
                  }}
                  className={`flex-1 py-2 px-4 border rounded-lg text-sm ${isDarkMode ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600' : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={verifyAdminPassword}
                  className="flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Display */}
      {filteredAndSortedOrders.length === 0 ? (
        <div className={`text-center py-12 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {orders.length === 0 ? 'No orders found' : 'No orders match your filters'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className={isDarkMode ? "bg-yellow-600" : "bg-yellow-400"}>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedOrders.size === filteredAndSortedOrders.length && filteredAndSortedOrders.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider">#</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider">Order #</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider">Client</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider">Date</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider">In-Status</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider">Total</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {filteredAndSortedOrders.map((order, index) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  index={index}
                  isDarkMode={isDarkMode}
                  selectedOrders={selectedOrders}
                  onSelectOrder={handleSelectOrder}
                  onViewDetails={setSelectedOrder}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedOrders.map((order, index) => (
            <OrderCard
              key={order.id}
              order={order}
              index={index}
              isDarkMode={isDarkMode}
              selectedOrders={selectedOrders}
              onSelectOrder={handleSelectOrder}
              onViewDetails={setSelectedOrder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InboundOrderStatus;