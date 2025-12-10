// frontend/src/components/client/ProductCatalog.jsx
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import api from '../../services/api';
import socketService from '../../services/socket';
import {
  ViewGridIcon,
  ViewListIcon,
  FilterIcon,
  XIcon,
  ShoppingCartIcon
} from '@heroicons/react/outline';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const placeholderSvg = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2U0ZTVlYSIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjYzFjNGM4Ij5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=`;

// Custom comparison function for ProductCard
const productCardPropsAreEqual = (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.image === nextProps.product.image &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.product.partNo === nextProps.product.partNo &&
    prevProps.product.description === nextProps.product.description &&
    prevProps.product.salePrice === nextProps.product.salePrice &&
    prevProps.product.quantity === nextProps.product.quantity &&
    prevProps.isDarkMode === nextProps.isDarkMode &&
    prevProps.orderControl?.showSalePrice === nextProps.orderControl?.showSalePrice &&
    prevProps.orderControl?.showQuantity === nextProps.orderControl?.showQuantity
  );
};

// Memoized Product Card Component
const ProductCard = memo(({ product, isDarkMode, orderControl, onAddToOrder }) => {
  const handleImageError = useCallback((e) => {
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
  }, []);

  const handleAddToOrder = useCallback(() => {
    onAddToOrder && onAddToOrder(product);
  }, [onAddToOrder, product]);

  return (
    <div className={`rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group ${
      isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
    }`}>
      <div className="relative overflow-hidden">
        <div className="pb-[75%] h-0 relative">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
              onError={handleImageError}
            />
          ) : (
            <div className={`absolute top-0 left-0 w-full h-full flex items-center justify-center ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No Image</span>
            </div>
          )}
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <button
            onClick={handleAddToOrder}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-3 text-sm rounded-xl font-semibold transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
          >
            <ShoppingCartIcon className="w-4 h-4" />
            <span>Add to Order</span>
          </button>
        </div>

        {/* Quick Add Button (Visible on mobile) */}
        <button
          onClick={handleAddToOrder}
          className="lg:hidden absolute bottom-3 right-3 bg-green-500 text-white p-2 rounded-full shadow-lg hover:bg-green-600 transition-colors"
        >
          <ShoppingCartIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4">
        <h3 className={`font-bold text-sm mb-1 line-clamp-2 leading-tight ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {product.name}
        </h3>
        
        <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          SKU: {product.partNo || 'N/A'}
        </p>

        {/* Description */}
        {product.description && (
          <p className={`text-xs mb-3 line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {product.description}
          </p>
        )}

        <div className="flex justify-between items-center">
          {orderControl?.showSalePrice && product.salePrice && (
            <span className={`text-lg font-bold ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`}>
              ${Number(product.salePrice).toFixed(2)}
            </span>
          )}

          {orderControl?.showQuantity && product.quantity !== undefined && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              product.quantity > 10 
                ? isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                : isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {product.quantity} in stock
            </span>
          )}
        </div>
      </div>
    </div>
  );
}, productCardPropsAreEqual);

// Custom comparison function for ProductListItem
const productListItemPropsAreEqual = (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.image === nextProps.product.image &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.product.partNo === nextProps.product.partNo &&
    prevProps.product.description === nextProps.product.description &&
    prevProps.product.salePrice === nextProps.product.salePrice &&
    prevProps.product.quantity === nextProps.product.quantity &&
    prevProps.isDarkMode === nextProps.isDarkMode &&
    prevProps.orderControl?.showSalePrice === nextProps.orderControl?.showSalePrice &&
    prevProps.orderControl?.showQuantity === nextProps.orderControl?.showQuantity
  );
};

// Memoized Product List Item Component
const ProductListItem = memo(({ product, isDarkMode, orderControl, onAddToOrder }) => {
  const handleImageError = useCallback((e) => {
    e.target.src = placeholderSvg;
    e.onerror = null;
  }, []);

  const handleAddToOrder = useCallback(() => {
    onAddToOrder && onAddToOrder(product);
  }, [onAddToOrder, product]);

  return (
    <div className={`rounded-2xl p-4 transition-all duration-300 hover:shadow-lg ${
      isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
        {/* Product Image */}
        <div className="flex-shrink-0 w-full sm:w-20 h-20 rounded-xl overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={handleImageError}
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No Image</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-lg mb-1 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {product.name}
          </h3>
          
          <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            SKU: {product.partNo || 'N/A'}
          </p>

          {product.description && (
            <p className={`text-sm mb-2 line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {product.description}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {orderControl?.showSalePrice && product.salePrice && (
              <span className={`text-xl font-bold ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                ${Number(product.salePrice).toFixed(2)}
              </span>
            )}

            {orderControl?.showQuantity && product.quantity !== undefined && (
              <span className={`text-sm px-3 py-1 rounded-full ${
                product.quantity > 10 
                  ? isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                  : isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {product.quantity} in stock
              </span>
            )}
          </div>
        </div>

        {/* Add to Order Button */}
        <div className="flex-shrink-0 w-full sm:w-auto">
          <button
            onClick={handleAddToOrder}
            className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <ShoppingCartIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Add to Order</span>
          </button>
        </div>
      </div>
    </div>
  );
}, productListItemPropsAreEqual);

const ProductCatalog = ({ searchQuery, isDarkMode, onAddToOrder }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  
  const [orderControl, setOrderControl] = useState({
    showSalePrice: true,
    showQuantity: true,
    timeControlEnabled: false,
    warningEnabled: false,
    customMessageActive: false
  });

  // Debounce search for better performance
  const debouncedSearchQuery = useMemo(() => {
    return searchQuery;
  }, [searchQuery]);

  // Fetch order control settings for this client
  useEffect(() => {
    const fetchOrderControl = async () => {
      try {
        const response = await api.get('/api/client/order-control');
        setOrderControl(response.data);
      } catch (err) {
        console.error('Failed to fetch order control settings', err);
      }
    };

    fetchOrderControl();
  }, []);

  useEffect(() => {
    loadCategories();
    loadAllProducts();
  }, []);

  useEffect(() => {
    if (selectedCategory && !showAllProducts) {
      loadProducts(selectedCategory.id);
    } else {
      setProducts([]);
    }
  }, [selectedCategory, showAllProducts]);

  // Optimized filtering with useMemo
  useEffect(() => {
    if (showAllProducts) {
      // Show all products when "Show All" is active
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        const filtered = allProducts.filter(product =>
          product.name.toLowerCase().includes(query) ||
          (product.partNo && product.partNo.toLowerCase().includes(query)) ||
          (product.description && product.description.toLowerCase().includes(query))
        );
        setFilteredProducts(filtered);
      } else {
        setFilteredProducts(allProducts);
      }
    } else if (!debouncedSearchQuery && !selectedCategory) {
      setFilteredProducts(allProducts);
    } else if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
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
  }, [products, allProducts, debouncedSearchQuery, selectedCategory, showAllProducts]);

  // Replace the socket useEffect in ProductCatalog with this optimized version:
  useEffect(() => {
    const setupSocketListeners = () => {
      const socket = socketService.getSocket();

      if (!socket) {
        console.log('Socket not available in ProductCatalog');
        return;
      }

     // To this (development only):
if (process.env.NODE_ENV === 'development') {
  console.log("Setting up optimized socket listeners in ProductCatalog");
}

      // Only update order control - don't trigger product reloads for warnings/countdowns
      const handleOrderControlUpdate = (data) => {
        console.log('📦 Order control update received in ProductCatalog:', data);
        
        // Only update if it's actually order control changes, not just time updates
        const shouldUpdate = data.updates.showSalePrice !== undefined || 
                            data.updates.showQuantity !== undefined ||
                            data.updates.timeControlEnabled !== undefined;
        
        if (shouldUpdate) {
          setOrderControl(prev => ({ ...prev, ...data.updates }));
        }
        // Ignore time warning updates to prevent flickering
      };

      const handleCustomMessage = (data) => {
        console.log('📨 Custom message received in ProductCatalog:', data);
        setOrderControl(prev => ({
          ...prev,
          customMessage: data.message,
          customMessageActive: true,
          customMessageExpires: data.expiresAt
        }));
      };

      const handleMessageDisabled = () => {
        console.log('Message disabled in ProductCatalog');
        setOrderControl(prev => ({
          ...prev,
          customMessageActive: false,
          customMessage: ''
        }));
      };

      // Product updates - keep these as they're important
      const handleProductsUpdated = () => {
        console.log('🔄 Products updated - refreshing catalog...');
        loadAllProducts();
        if (selectedCategory) {
          loadProducts(selectedCategory.id);
        }
      };

      const handleProductCreated = (newProduct) => {
        console.log('🆕 New product created:', newProduct);
        setAllProducts(prev => {
          const exists = prev.some(p => p.id === newProduct.id);
          if (!exists) {
            return [optimizeProductImage(newProduct), ...prev];
          }
          return prev;
        });
        
        if (selectedCategory && newProduct.categoryId === selectedCategory.id) {
          setProducts(prev => {
            const exists = prev.some(p => p.id === newProduct.id);
            if (!exists) {
              return [optimizeProductImage(newProduct), ...prev];
            }
            return prev;
          });
        }
      };

      const handleProductUpdated = (updatedProduct) => {
        console.log('✏️ Product updated:', updatedProduct);
        setAllProducts(prev => prev.map(p => 
          p.id === updatedProduct.id ? optimizeProductImage(updatedProduct) : p
        ));
        
        if (selectedCategory && updatedProduct.categoryId === selectedCategory.id) {
          setProducts(prev => prev.map(p => 
            p.id === updatedProduct.id ? optimizeProductImage(updatedProduct) : p
          ));
        }
      };

      const handleProductDeleted = (productId) => {
        console.log('🗑️ Product deleted:', productId);
        setAllProducts(prev => prev.filter(p => p.id !== productId));
        setProducts(prev => prev.filter(p => p.id !== productId));
      };

      const handleCategoriesUpdated = () => {
        console.log('📁 Categories updated - refreshing categories...');
        loadCategories();
      };

      // Register only necessary listeners
      socket.on('client_order_control_updated', handleOrderControlUpdate);
      socket.on('client_custom_message', handleCustomMessage);
      socket.on('client_message_disabled', handleMessageDisabled);
      socket.on('products_updated', handleProductsUpdated);
      socket.on('product_created', handleProductCreated);
      socket.on('product_updated', handleProductUpdated);
      socket.on('product_deleted', handleProductDeleted);
      socket.on('categories_updated', handleCategoriesUpdated);

      // Cleanup function
      return () => {
        socket.off('client_order_control_updated', handleOrderControlUpdate);
        socket.off('client_custom_message', handleCustomMessage);
        socket.off('client_message_disabled', handleMessageDisabled);
        socket.off('products_updated', handleProductsUpdated);
        socket.off('product_created', handleProductCreated);
        socket.off('product_updated', handleProductUpdated);
        socket.off('product_deleted', handleProductDeleted);
        socket.off('categories_updated', handleCategoriesUpdated);
      };
    };

    if (socketService.isConnected) {
      return setupSocketListeners();
    } else {
      const socket = socketService.getSocket();
      if (socket) {
        socket.once('connect', setupSocketListeners);
        return () => {
          socket.off('connect', setupSocketListeners);
        };
      }
    }
  }, [selectedCategory]); // Keep selectedCategory dependency

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
  if (!product.image) return product;

  let imageUrl = product.image;

  // Case 1: Local uploaded images (e.g., /uploads/abc.jpg)
  if (imageUrl.startsWith('/uploads/')) {
    imageUrl = `${BACKEND_URL}${imageUrl}`;

    // Add on-the-fly optimization params only once
    if (!imageUrl.includes('?')) {
      imageUrl += '?width=300&height=200&quality=80';
    }
  }

  // Case 2: Images stored as relative paths (e.g., "images/abc.png")
  else if (!imageUrl.startsWith('http')) {
    imageUrl = `${BACKEND_URL}/${imageUrl}`;

    // Fix accidental double slashes LIKE:
    // http://localhost:5000//images/abc.png
    imageUrl = imageUrl.replace(/([^:]\/)\/+/g, '$1');
  }

  return { ...product, image: imageUrl };
};


  const handleShowAllProducts = () => {
    setShowAllProducts(true);
    setSelectedCategory(null);
    setMobileSidebarOpen(false);
  };

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    setShowAllProducts(false);
    setMobileSidebarOpen(false);
  };

  const renderCategories = (categories = [], level = 0) => {
    if (!Array.isArray(categories)) return null;

    return categories.map(category => (
      <div key={category.id} style={{ paddingLeft: level * 12 }}>
        <button
          onClick={() => handleSelectCategory(category)}
          className={`w-full text-left py-2 px-3 rounded-xl transition-all duration-200 text-sm font-medium ${
            selectedCategory?.id === category.id
              ? `${isDarkMode ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'}`
              : `${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`
          }`}
        >
          <div className="flex items-center space-x-2">
            <div className={`w-1.5 h-1.5 rounded-full ${
              selectedCategory?.id === category.id ? 'bg-white' : isDarkMode ? 'bg-gray-500' : 'bg-gray-400'
            }`} />
            <span className="truncate">{category.name}</span>
          </div>
        </button>
        {category.children && Array.isArray(category.children) && category.children.length > 0 && (
          <div className={`ml-3 mt-1 border-l ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            {renderCategories(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Oops! Something went wrong</h3>
        <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
        <button
          onClick={loadCategories}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
          >
            <FilterIcon className="w-5 h-5" />
          </button>
          
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Products
          </h1>
          
          <div className="flex items-center space-x-2">
            <div className={`flex rounded-lg p-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? isDarkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                    : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ViewGridIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? isDarkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                    : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ViewListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* Sidebar */}
        <div className={`fixed lg:sticky top-0 left-0 z-50 h-screen lg:h-auto lg:top-4 transform ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 w-80 lg:w-72 xl:w-80 flex-shrink-0`}>
          <div className={`h-full lg:rounded-2xl lg:m-4 lg:shadow-xl ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            {/* Sidebar Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Categories
                </h2>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
              
              {/* Show All Products Button */}
              <button
                onClick={handleShowAllProducts}
                className={`w-full p-4 rounded-xl text-left transition-all duration-200 mb-4 ${
                  showAllProducts
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : isDarkMode 
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <ViewGridIcon className="w-5 h-5" />
                  <span className="font-semibold">All Products</span>
                </div>
                <p className={`text-sm mt-1 ${
                  showAllProducts ? 'text-green-100' : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Browse all available products
                </p>
              </button>
            </div>

            {/* Category List */}
            <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  {renderCategories(categories)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="p-4 lg:p-6">
            {/* Header Section */}
            <div className="mb-6">
              <div className="hidden lg:flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Product Catalog
                  </h1>
                  <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {showAllProducts 
                      ? `Showing all ${filteredProducts.length} products` 
                      : selectedCategory 
                        ? `Products in ${selectedCategory.name}` 
                        : 'Select a category or view all products'
                    }
                  </p>
                </div>

                {/* View Mode Toggle - Desktop */}
                <div className={`flex rounded-lg p-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-3 rounded-md transition-colors flex items-center space-x-2 ${
                      viewMode === 'grid'
                        ? isDarkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                        : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <ViewGridIcon className="w-5 h-5" />
                    <span>Grid</span>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-3 rounded-md transition-colors flex items-center space-x-2 ${
                      viewMode === 'list'
                        ? isDarkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                        : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <ViewListIcon className="w-5 h-5" />
                    <span>List</span>
                  </button>
                </div>
              </div>

              {/* Search Results Info */}
              {searchQuery && (
                <div className={`p-4 rounded-2xl mb-4 ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                } shadow-lg`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Search results for: 
                      </span>
                      <span className="font-semibold ml-1">"{searchQuery}"</span>
                    </div>
                    {filteredProducts.length > 0 && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Products Display */}
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin h-12 w-12 border-b-2 border-blue-500 rounded-full" />
              </div>
            ) : !Array.isArray(filteredProducts) || filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  No products found
                </h3>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {searchQuery 
                    ? `No products match "${searchQuery}"` 
                    : 'Try selecting a different category'
                  }
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              // Grid View - Updated with memoized components
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isDarkMode={isDarkMode}
                    orderControl={orderControl}
                    onAddToOrder={onAddToOrder}
                  />
                ))}
              </div>
            ) : (
              // List View - Updated with memoized components
              <div className="space-y-4">
                {filteredProducts.map(product => (
                  <ProductListItem
                    key={product.id}
                    product={product}
                    isDarkMode={isDarkMode}
                    orderControl={orderControl}
                    onAddToOrder={onAddToOrder}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Message Banner */}
      {orderControl?.customMessageActive && orderControl?.customMessage && (
        <div className="fixed bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-96 z-50">
          <div className={`p-4 rounded-2xl shadow-xl ${
            isDarkMode ? 'bg-yellow-900 text-yellow-100' : 'bg-yellow-100 text-yellow-800'
          }`}>
            <div className="flex items-start space-x-3">
              <span className="text-lg">📢</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{orderControl.customMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCatalog;