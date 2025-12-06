// src/components/admin/shared/GlobalProductCatalog.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const BACKEND_URL = 'http://localhost:5000';
const placeholderSvg = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2U0ZTVlYSIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjYzFjNGM4Ij5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=`;

const GlobalProductCatalog = ({
  mode = 'selection',
  onAddToOrder,
  isDarkMode = false,
  onItemsUpdate,
  initialItems = [],
  showCustomerFields = false,
  showOfferDetails = false,
  customActions = [],
  title = "Product Catalog",
  actionButtonText = "Add to Selection",
  emptyMessage = "No products selected",
  searchQuery = '',
  showCategories = true,
  orderControl = {
    showSalePrice: true,
    showQuantity: true,
    timeControlEnabled: false,
    warningEnabled: false,
    customMessageActive: false
  },
  // Add these new props for state persistence
  persistentData = null,
  quotationId = null
}) => {
  // State - Initialize with persistent data if available
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [internalSearch, setInternalSearch] = useState(searchQuery);
  
  // Initialize state with persistent data or defaults
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    persistentData?.selectedCustomerId || null
  );
  const [creatorName, setCreatorName] = useState(
    persistentData?.creatorName || ''
  );
  const [creatorPosition, setCreatorPosition] = useState(
    persistentData?.creatorPosition || ''
  );
  const [customers, setCustomers] = useState([]);
  const [customerEmail, setCustomerEmail] = useState(
    persistentData?.customerEmail || ''
  );
  const [customerPhone, setCustomerPhone] = useState(
    persistentData?.customerPhone || ''
  );
  
  // Admin mode state - Initialize with persistent data
  const [selectedItems, setSelectedItems] = useState(
    persistentData?.items || initialItems
  );
  const [customerName, setCustomerName] = useState(
    persistentData?.customerName || ''
  );
  const [offerDate, setOfferDate] = useState(
    persistentData?.offerDate || new Date().toISOString().split('T')[0]
  );
  const [offerNote, setOfferNote] = useState(
    persistentData?.offerNote || ''
  );
  
  // Add Customer Modal State
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: ''
  });
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Load customers from API
  useEffect(() => {
    if (showCustomerFields) {
      api.get('/api/customers')
        .then(res => {
          setCustomers(Array.isArray(res.data) ? res.data : []);
        })
        .catch(() => setCustomers([]));
    }
  }, [showCustomerFields]);

  // Load data
  useEffect(() => {
    loadCategories();
    loadAllProducts();
  }, []);

  // Sync external search query
  useEffect(() => {
    setInternalSearch(searchQuery);
  }, [searchQuery]);

  // Load products when category changes
  useEffect(() => {
    if (selectedCategory) {
      loadProducts(selectedCategory.id);
    } else {
      setProducts([]);
    }
  }, [selectedCategory]);

  // Filter products
  useEffect(() => {
    if (!internalSearch && !selectedCategory) {
      setFilteredProducts(allProducts);
    } else if (internalSearch) {
      const query = internalSearch.toLowerCase();
      const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(query) ||
        (product.partNo && product.partNo.toLowerCase().includes(query)) ||
        (product.description && product.description.toLowerCase().includes(query))
      );
      setFilteredProducts(filtered);
    } else if (selectedCategory) {
      const categoryProducts = allProducts.filter(product =>
        product.categoryId === selectedCategory.id
      );
      setFilteredProducts(categoryProducts);
    }
  }, [products, allProducts, internalSearch, selectedCategory]);

  // API functions
  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/products/categories');
      const categoriesData = Array.isArray(response.data) ? response.data : [];
      setCategories(categoriesData);

      if (categoriesData.length > 0) {
        setSelectedCategory(categoriesData[0]);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
      setError('Failed to load categories');
    }
  };

  const loadAllProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/products');
      const productsData = Array.isArray(response.data) ? response.data : [];

      const productsWithOptimizedImages = productsData.map(optimizeProductImage);
      setAllProducts(productsWithOptimizedImages);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load all products', err);
      setLoading(false);
    }
  };

  const loadProducts = async (categoryId) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/products/category/${categoryId}`);
      const productsData = Array.isArray(response.data) ? response.data : [];

      const productsWithOptimizedImages = productsData.map(optimizeProductImage);
      setProducts(productsWithOptimizedImages);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load products', err);
      setError('Failed to load products');
      setProducts([]);
      setLoading(false);
    }
  };

  const optimizeProductImage = (product) => {
    if (product.image) {
      let imageUrl = product.image;

      if (imageUrl.startsWith('/uploads/')) {
        imageUrl = `${BACKEND_URL}${imageUrl}`;
        if (!imageUrl.includes('?')) {
          imageUrl += '?width=200&height=150&quality=70';
        }
      } else if (!imageUrl.startsWith('http')) {
        imageUrl = `${BACKEND_URL}/${imageUrl}`.replace('//', '/');
      }

      return { ...product, image: imageUrl };
    }
    return product;
  };

  // Product selection logic - FIXED to include unitPrice
// Add this function in GlobalProductCatalog.jsx, inside the component

// Product selection logic - UPDATED to prevent duplicates and include unitPrice
const handleAddProduct = (product) => {
  if (onAddToOrder) {
    onAddToOrder(product);
    return;
  }

  // Check if product already exists in selected items
  const existingItemIndex = selectedItems.findIndex(
    item => item.productId === product.id
  );

  let updatedItems;

  if (existingItemIndex > -1) {
    // If product exists, increment quantity
    updatedItems = selectedItems.map((item, index) => 
      index === existingItemIndex 
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
  } else {
    // If product doesn't exist, add new item
    const newItem = {
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      partNo: product.partNo,
      salePrice: product.salePrice || 0,
      costPrice: product.costPrice || 0,
      unitPrice: product.salePrice || 0,
      quantity: 1,
      image: product.image,
      description: product.description
    };

    updatedItems = [...selectedItems, newItem];
  }

  setSelectedItems(updatedItems);
  
  // Call onItemsUpdate with all current state
  if (onItemsUpdate) {
    onItemsUpdate(updatedItems, getQuotationData(updatedItems));
  }
};

  // Helper function to get all quotation data
  const getQuotationData = (items = selectedItems) => {
    const total = items.reduce((sum, item) => {
      const price = mode === 'quotation' ? (item.salePrice || 0) : (item.costPrice || 0);
      return sum + (price * item.quantity);
    }, 0);
    
    return {
      items: items,
      total,
      customerName: showCustomerFields ? customerName : '',
      customerEmail: showCustomerFields ? customerEmail : '',
      customerPhone: showCustomerFields ? customerPhone : '',
      creatorName: showCustomerFields ? creatorName : '',
      creatorPosition: showCustomerFields ? creatorPosition : '',
      offerDate: showOfferDetails ? offerDate : '',
      offerNote: showOfferDetails ? offerNote : '',
      selectedCustomerId: showCustomerFields ? selectedCustomerId : null,
      context: mode,
      mode,
      quotationId: quotationId // Include the quotation ID
    };
  };

  // Admin mode functions - UPDATED to call onItemsUpdate
  const updateQuantity = (itemId, newQuantity) => {
    const quantity = Math.max(1, newQuantity || 1);
    const updatedItems = selectedItems.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );
    setSelectedItems(updatedItems);
    
    if (onItemsUpdate) {
      onItemsUpdate(updatedItems, getQuotationData(updatedItems));
    }
  };

  const removeItem = (itemId) => {
    const updatedItems = selectedItems.filter(item => item.id !== itemId);
    setSelectedItems(updatedItems);
    
    if (onItemsUpdate) {
      onItemsUpdate(updatedItems, getQuotationData(updatedItems));
    }
  };

  const clearAllItems = () => {
    setSelectedItems([]);
    if (onItemsUpdate) {
      onItemsUpdate([], getQuotationData([]));
    }
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => {
      const price = mode === 'quotation' ? (item.salePrice || 0) : (item.costPrice || 0);
      return total + (price * item.quantity);
    }, 0);
  };

  // Add Customer Modal Functions
  const handleAddNewCustomer = async () => {
    if (!newCustomerData.name.trim()) {
      alert('Customer name is required');
      return;
    }

    try {
      setSavingCustomer(true);
      const response = await api.post('/api/customers', newCustomerData);
      const newCustomer = response.data;
      
      // Add to local customers list
      setCustomers(prev => [...prev, newCustomer]);
      
      // Auto-select the new customer
      setSelectedCustomerId(newCustomer.id);
      setCustomerName(newCustomer.name);
      setCustomerEmail(newCustomer.email || '');
      setCustomerPhone(newCustomer.phone || '');
      
      // Reset form and close modal
      setNewCustomerData({
        name: '',
        email: '',
        phone: '',
        address: '',
        company: ''
      });
      setShowCustomerModal(false);
      
      alert('Customer added successfully!');
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Failed to add customer');
    } finally {
      setSavingCustomer(false);
    }
  };

  // Render categories
  const renderCategories = (categories = [], level = 0) => {
    if (!Array.isArray(categories)) return null;

    return categories.map(category => (
      <div key={category.id} style={{ paddingLeft: level * 16 }}>
        <button
          onClick={() => setSelectedCategory(category)}
          className={`w-full text-left py-1.5 px-3 rounded-md transition-colors text-sm ${selectedCategory?.id === category.id
              ? `${isDarkMode ? 'bg-indigo-900 text-indigo-100' : 'bg-indigo-100 text-indigo-800'} font-medium`
              : `${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`
            }`}
        >
          {category.name}
        </button>
        {category.children && Array.isArray(category.children) && category.children.length > 0 && (
          <div className={`ml-2 border-l ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            {renderCategories(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  // Add Customer Modal Component
  const AddCustomerModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="p-6">
          <h3 className={`text-lg font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Add New Customer
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Customer Name *
              </label>
              <input
                type="text"
                value={newCustomerData.name}
                onChange={(e) => setNewCustomerData(prev => ({...prev, name: e.target.value}))}
                className={`w-full border rounded px-3 py-2 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Company
              </label>
              <input
                type="text"
                value={newCustomerData.company}
                onChange={(e) => setNewCustomerData(prev => ({...prev, company: e.target.value}))}
                className={`w-full border rounded px-3 py-2 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
                placeholder="Optional"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email
              </label>
              <input
                type="email"
                value={newCustomerData.email}
                onChange={(e) => setNewCustomerData(prev => ({...prev, email: e.target.value}))}
                className={`w-full border rounded px-3 py-2 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
                placeholder="Optional"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Phone
              </label>
              <input
                type="tel"
                value={newCustomerData.phone}
                onChange={(e) => setNewCustomerData(prev => ({...prev, phone: e.target.value}))}
                className={`w-full border rounded px-3 py-2 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
                placeholder="Optional"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Address
              </label>
              <textarea
                value={newCustomerData.address}
                onChange={(e) => setNewCustomerData(prev => ({...prev, address: e.target.value}))}
                rows={2}
                className={`w-full border rounded px-3 py-2 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAddNewCustomer}
              disabled={savingCustomer || !newCustomerData.name.trim()}
              className={`flex-1 py-2 px-4 rounded transition-colors ${
                isDarkMode 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } ${savingCustomer || !newCustomerData.name.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {savingCustomer ? 'Adding...' : 'Add Customer'}
            </button>
            <button
              onClick={() => setShowCustomerModal(false)}
              className={`flex-1 py-2 px-4 rounded border transition-colors ${
                isDarkMode 
                  ? 'border-gray-600 hover:bg-gray-700 text-white' 
                  : 'border-gray-300 hover:bg-gray-100 text-gray-700'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-2">⚠️</div>
        <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{error}</p>
        <button
          onClick={loadCategories}
          className="mt-4 text-indigo-600 hover:text-indigo-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
      <div className="max-w-7xl mx-auto">
        {/* Add Customer Modal */}
        {showCustomerModal && <AddCustomerModal />}

        {/* Selected Items Sidebar - Right Side (Admin Mode Only) */}
        {!onAddToOrder && (
          <div className="lg:col-span-1">
            <div className={`rounded-lg border p-4 sticky top-4 ${
              isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
            }`}>
              {/* Quotation ID Display */}
              {quotationId && (
                <div className={`mb-4 p-3 rounded ${
                  isDarkMode ? 'bg-blue-900 bg-opacity-20 border border-blue-700' : 'bg-blue-50 border border-blue-200'
                }`}>
                  <p className={`text-sm font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    Quotation: {quotationId}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Selected Items ({selectedItems.length})
                </h3>
                {selectedItems.length > 0 && (
                  <button
                    onClick={clearAllItems}
                    className={`text-xs px-2 py-1 rounded ${
                      isDarkMode 
                        ? 'text-red-400 hover:bg-red-900' 
                        : 'text-red-500 hover:bg-red-100'
                    }`}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {showCustomerFields && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Customer Selection */}
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                      Customer *
                    </label>
                    <div className="flex gap-2 mb-2">
                      <select
                        value={selectedCustomerId || ''}
                        onChange={(e) => {
                          const customerId = e.target.value;
                          if (customerId === 'new') {
                            setShowCustomerModal(true);
                            return;
                          }
                          const customer = customers.find(c => c.id === parseInt(customerId));
                          if (customer) {
                            setSelectedCustomerId(customer.id);
                            setCustomerName(customer.name);
                            setCustomerEmail(customer.email || '');
                            setCustomerPhone(customer.phone || '');
                          }
                        }}
                        className={`flex-1 border rounded px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                          }`}
                      >
                        <option value="">Select a customer...</option>
                        <option value="new">+ Add New Customer</option>
                        {customers.map(customer => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name} {customer.company ? `- ${customer.company}` : ''}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => window.open('/admin/customers', '_blank')}
                        className={`px-3 py-2 rounded border ${isDarkMode
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500'
                            : 'bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-400'
                          }`}
                      >
                        Manage
                      </button>
                    </div>

                    {/* Customer Info Display */}
                    {selectedCustomerId && (
                      <div className={`p-3 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                        }`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {customerEmail && (
                            <div>
                              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Email: </span>
                              <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>{customerEmail}</span>
                            </div>
                          )}
                          {customerPhone && (
                            <div>
                              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Phone: </span>
                              <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>{customerPhone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Manual Customer Input (as fallback) */}
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                      Or Enter Customer Manually
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        setSelectedCustomerId(null);
                      }}
                      className={`w-full border rounded px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      placeholder="Enter customer name"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                      Customer Email
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className={`w-full border rounded px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                      Customer Phone
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className={`w-full border rounded px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      placeholder="Optional"
                    />
                  </div>

                  {/* Creator Information */}
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                      Prepared By
                    </label>
                    <input
                      type="text"
                      value={creatorName}
                      onChange={(e) => setCreatorName(e.target.value)}
                      className={`w-full border rounded px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                      Position
                    </label>
                    <input
                      type="text"
                      value={creatorPosition}
                      onChange={(e) => setCreatorPosition(e.target.value)}
                      className={`w-full border rounded px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      placeholder="Enter your position"
                    />
                  </div>
                             
                  {showOfferDetails && (
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                        Offer Date
                      </label>
                      <input
                        type="date"
                        value={offerDate}
                        onChange={(e) => setOfferDate(e.target.value)}
                        className={`w-full border rounded px-3 py-2 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                  )}
                </div>
              )}

              {showOfferDetails && (
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Offer Notes
                  </label>
                  <textarea
                    value={offerNote}
                    onChange={(e) => setOfferNote(e.target.value)}
                    rows={3}
                    className={`w-full border rounded px-3 py-2 ${
                      isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                    placeholder="Additional notes for the offer..."
                  />
                </div>
              )}

              {selectedItems.length === 0 ? (
                <p className={`text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {emptyMessage}
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedItems.map((item, index) => (
                    <div key={item.id} className={`flex items-center justify-between p-3 rounded ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {/* Numbering Column */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {index + 1}
                        </div>
                        
                        {item.image && (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-12 h-12 object-cover rounded flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className={`font-medium text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {item.name}
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Part #: {item.partNo || 'N/A'}
                          </p>
                          {/* Show unit price */}
                          <p className={`text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            Unit: ${(item.unitPrice || item.salePrice || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 flex-shrink-0">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                            className={`w-16 border rounded px-2 py-1 text-center ${
                              isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                            }`}
                          />
                        </div>
                        
                        <p className={`font-bold w-20 text-right text-sm ${
                          isDarkMode ? 'text-green-400' : 'text-green-600'
                        }`}>
                          ${((item.unitPrice || item.salePrice || 0) * item.quantity).toFixed(2)}
                        </p>

                        <button
                          onClick={() => removeItem(item.id)}
                          className={`p-1 rounded flex-shrink-0 ${
                            isDarkMode 
                              ? 'text-red-400 hover:bg-red-900' 
                              : 'text-red-500 hover:bg-red-100'
                          }`}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Total Section */}
                  <div className={`border-t pt-3 mt-4 ${
                    isDarkMode ? 'border-gray-600' : 'border-gray-200'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Total:
                      </span>
                      <span className={`text-xl font-bold ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`}>
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Custom Actions */}
                  {customActions.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {customActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            const total = calculateTotal();
                            action.onClick(getQuotationData());
                          }}
                          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                            action.primary 
                              ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                              : isDarkMode 
                                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Header with Search /////////////////////////////////////////////////////////////////////////////////// */}
        <header className="mb-6">
          <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h1>
          
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <input
              type="text"
              placeholder="Search products by name, part number, or description..."
              value={internalSearch}
              onChange={(e) => setInternalSearch(e.target.value)}
              className={`flex-1 border rounded-lg px-4 py-2 ${
                isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
            
            <select
              value={selectedCategory?.id || ''}
              onChange={(e) => {
                const categoryId = e.target.value;
                const category = categories.find(cat => cat.id === categoryId);
                setSelectedCategory(category || null);
              }}
              className={`border rounded-lg px-4 py-2 ${
                isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Categories Sidebar - Left Side */}
          {showCategories && (
            <div className="lg:col-span-1">
              <div className={`rounded-lg shadow-sm p-4 h-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`text-md font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>Categories</h3>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[calc(100vh-250px)] overflow-y-auto">
                    {renderCategories(categories)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Products Grid - Middle */}
          <div className={showCategories ? 'lg:col-span-2' : 'lg:col-span-3'}>
            {internalSearch && (
              <div className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Showing results for: <span className="font-medium">"{internalSearch}"</span>
                {filteredProducts.length > 0 && (
                  <span> - {filteredProducts.length} product(s) found</span>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {loading ? (
                <div className="col-span-full text-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
                </div>
              ) : !Array.isArray(filteredProducts) || filteredProducts.length === 0 ? (
                <div className={`col-span-full text-center py-8 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    {internalSearch ? 'No products found matching your search' : 'No products in this category'}
                  </p>
                </div>
              ) : (
                filteredProducts.map(product => (
                  <div key={product.id} className={`rounded-lg shadow overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="relative overflow-hidden">
                      <div className="pb-[100%] h-0 relative">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                            key={product.image}
                            onError={(e) => {
                              const target = e.target;
                              const src = target.src;

                              if (src.startsWith(`${BACKEND_URL}/uploads/`)) {
                                setTimeout(() => {
                                  target.src = src.replace(/\?.*$/, '') + '?t=' + Date.now();
                                }, 300);

                                target.onerror = (e2) => {
                                  e2.target.src = placeholderSvg;
                                  e2.onerror = null;
                                };
                              } else {
                                target.src = placeholderSvg;
                                target.onerror = null;
                              }
                            }}
                          />
                        ) : (
                          <div className="absolute top-0 left-0 w-full h-full bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                        <button
                          onClick={() => handleAddProduct(product)}
                          className="w-full bg-indigo-600 text-white py-1.5 text-xs rounded-md font-medium transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300"
                        >
                          {onAddToOrder ? "Add To Order" : actionButtonText}
                        </button>
                      </div>
                    </div>
                    <div className="p-2">
                      <h3 className={`font-medium text-xs line-clamp-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{product.name}</h3>
                      <p className={`mt-0.5 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Part #: {product.partNo}</p>

                      {/* Display sale price and quantity based on order control settings */}
                      {orderControl?.showSalePrice && product.salePrice && (
                        <p className={`mt-0.5 text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                          Price: ${product.salePrice}
                        </p>
                      )}

                      {orderControl?.showQuantity && product.quantity !== undefined && (
                        <p className={`mt-0.5 text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          Stock: {product.quantity}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalProductCatalog;