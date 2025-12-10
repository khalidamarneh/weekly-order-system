// src/components/admin/ProductManagement.jsx
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import api from '../../services/api';
import socketService from '../../services/socket';
import CsvManagement from './CsvManagement';
import ExportProductsModal from './ExportProductsModal';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  FolderIcon,
  PhotographIcon,
  XIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SearchIcon
} from '@heroicons/react/outline';

const BACKEND_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";


// ✅ Optimized debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// ✅ Memoized image resize function
const resizeImage = (file, maxSize = 500, quality = 0.7) => {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;

      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          const timestamp = Date.now();
          const resizedFile = new File([blob], `${timestamp}.webp`, { type: 'image/webp' });
          resolve(resizedFile);
        },
        'image/webp',
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
};

// ✅ Memoized Category Item Component
const CategoryItem = memo(({ 
  category, 
  level, 
  isDarkMode, 
  selectedCategory, 
  expandedCategories, 
  onToggle, 
  onSelect, 
  onEdit, 
  onDelete 
}) => {
  const hasChildren = Array.isArray(category.children) && category.children.length > 0;
  const isExpanded = expandedCategories.has(category.id);
  const isSelected = selectedCategory?.id === category.id;

  return (
    <div className="mb-1">
      <div
        className={`flex items-center justify-between p-2 rounded-lg transition-colors duration-200 group ${
          isSelected
            ? isDarkMode
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              : "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
            : isDarkMode
            ? "bg-gray-700 border border-gray-600 hover:bg-gray-600"
            : "bg-white border border-gray-200 hover:bg-gray-50"
        }`}
      >
        <div className="flex items-center flex-1">
          {hasChildren ? (
            <button
              onClick={() => onToggle(category.id)}
              className="mr-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-6 mr-2" />
          )}
          <button
            type="button"
            onClick={() => onSelect(category)}
            className={`text-left flex-1 font-medium transition-colors ${
              isSelected
                ? "text-white"
                : isDarkMode
                ? "text-gray-200 hover:text-white"
                : "text-gray-800 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className={`w-1.5 h-1.5 rounded-full ${
                isSelected ? 'bg-white' : isDarkMode ? 'bg-gray-500' : 'bg-gray-400'
              }`} />
              <span className="truncate">{category.name}</span>
            </div>
          </button>
        </div>

        <div className="flex items-center space-x-1 ml-2 opacity-100 lg:opacity-80 lg:group-hover:opacity-100 transition">
          <button
            type="button"
            onClick={() => {
              const newName = prompt("Edit category name", category.name);
              if (newName && newName.trim() !== "")
                onEdit(category.id, newName.trim());
            }}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Edit category"
          >
            <PencilIcon className="w-4 h-4 text-blue-500" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(category.id)}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Delete category"
          >
            <TrashIcon className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-6 mt-1">
          {category.children.map(child => (
            <CategoryItem
              key={child.id}
              category={child}
              level={level + 1}
              isDarkMode={isDarkMode}
              selectedCategory={selectedCategory}
              expandedCategories={expandedCategories}
              onToggle={onToggle}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// ✅ Memoized Product Row Component
const ProductRow = memo(({ product, isDarkMode, uploading, onEdit, onDelete }) => {
  return (
    <tr className={`hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors duration-150`}>
      {/* Image Column */}
      <td className="px-6 py-4 whitespace-nowrap">
        {product.image ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const imageUrl = product.image.startsWith('/')
                ? `${BACKEND_URL}${product.image}`
                : product.image;
              window.open(imageUrl, '_blank', 'width=600,height=600');
            }}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
          >
            <PhotographIcon className="w-3 h-3 mr-1" />
            View
          </button>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            No Image
          </span>
        )}
      </td>
      {/* Product Name */}
      <td className={`px-6 py-4 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        {product.name}
      </td>
      {/* Part # */}
      <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
        {product.partNo}
      </td>
      {/* Cost Price */}
      <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
        ${Number(product.costPrice || 0).toFixed(2)}
      </td>
      {/* Sale Price */}
      <td className={`px-6 py-4 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        ${Number(product.salePrice || 0).toFixed(2)}
      </td>
      {/* Quantity */}
      <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
        {product.quantity !== null && product.quantity !== undefined ? product.quantity : '—'}
      </td>
      {/* Actions */}
      <td className="px-6 py-4 text-sm font-medium">
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(product)}
            disabled={uploading}
            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50 transition-colors duration-200 p-1"
            title="Edit product"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(product.id)}
            disabled={uploading}
            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 transition-colors duration-200 p-1"
            title="Delete product"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});

// ✅ Memoized Product Grid Card Component
const ProductGridCard = memo(({ product, isDarkMode, uploading, onEdit, onDelete }) => {
  return (
    <div key={product.id} className={`rounded-lg border transition-all duration-200 hover:shadow-md ${
      isDarkMode 
        ? 'bg-gray-700 border-gray-600 hover:border-gray-500' 
        : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      {/* Product Image */}
      <div className="h-32 bg-gray-100 dark:bg-gray-600 rounded-t-lg overflow-hidden">
        {product.image ? (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const imageUrl = product.image.startsWith('/')
                ? `${BACKEND_URL}${product.image}`
                : product.image;
              window.open(imageUrl, '_blank', 'width=600,height=600');
            }}
            className="w-full h-full"
          >
            <img 
              src={product.image.startsWith('/') ? `${BACKEND_URL}${product.image}` : product.image} 
              alt={product.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
          </button>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PhotographIcon className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3">
        <h3 className={`font-semibold text-sm mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {product.name}
        </h3>
        
        {product.description && (
          <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} break-words`}>
            {product.description}
          </p>
        )}
        
        <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {product.partNo || 'No Part Number'}
        </p>
        
        <div className="flex justify-between items-center mb-2">
          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Cost: ${Number(product.costPrice || 0).toFixed(2)}
          </span>
          <span className={`text-xs font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
            ${Number(product.salePrice || 0).toFixed(2)}
          </span>
        </div>

        {product.quantity != null && (
          <div className={`text-xs px-2 py-1 rounded-full mb-2 text-center ${
            product.quantity > 10 
              ? isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
              : isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {product.quantity} in stock
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(product)}
            disabled={uploading}
            className="flex-1 bg-blue-500 text-white py-1 px-2 rounded text-xs font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(product.id)}
            disabled={uploading}
            className="flex-1 bg-red-500 text-white py-1 px-2 rounded text-xs font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
});

const ProductManagement = ({ isDarkMode }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState({
    categories: false,
    products: false,
    initial: true
  });
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [viewMode, setViewMode] = useState('table');
  
  // modals / forms
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // ✅ Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // New product form
  const [newProduct, setNewProduct] = useState({
    name: '',
    partNo: '',
    costPrice: '',
    markupPercentage: '20',
    categoryId: '',
    imageFile: null,
    imageUrl: '',
    quantity: ''
  });

  // Editing product form
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingImageMeta, setEditingImageMeta] = useState(null);

  // Upload state
  const [uploading, setUploading] = useState(false);

  // ✅ Memoized helper functions
  const flattenCategories = useCallback((nodes = [], level = 0, out = []) => {
    nodes.forEach(node => {
      out.push({ id: node.id, name: node.name, level, parentId: node.parentId ?? null });
      if (Array.isArray(node.children) && node.children.length > 0) {
        flattenCategories(node.children, level + 1, out);
      }
    });
    return out;
  }, []);

  const flatCats = useMemo(() => flattenCategories(categories), [categories, flattenCategories]);

  const formatBytes = useCallback((bytes) => {
    if (!bytes && bytes !== 0) return '';
    const units = ['B','KB','MB','GB','TB'];
    let i = 0;
    let n = Number(bytes);
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return `${n.toFixed(1)} ${units[i]}`;
  }, []);

  // ✅ OPTIMIZED: Memoized filtered products
  const filteredProducts = useMemo(() => {
    if (!debouncedSearchQuery && !selectedCategory) {
      return allProducts;
    } else if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      return allProducts.filter(product =>
        product.name.toLowerCase().includes(query) ||
        (product.partNo ?? '').toLowerCase().includes(query) ||
        (product.description ?? '').toLowerCase().includes(query)
      );
    } else if (selectedCategory) {
      return allProducts.filter(product => product.categoryId === selectedCategory.id);
    }
    return [];
  }, [allProducts, debouncedSearchQuery, selectedCategory]);

  // ✅ OPTIMIZED: Loaders with proper loading states
  const loadCategories = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, categories: true }));
      const res = await api.get('/api/products/categories');
      const cats = Array.isArray(res.data) ? res.data : [];
      setCategories(cats);
      return flattenCategories(cats);
    } catch (err) {
      console.error('Failed to load categories', err);
      setCategories([]);
      setProducts([]);
      setSelectedCategory(null);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, categories: false, initial: false }));
    }
  }, [flattenCategories]);

  const loadProducts = useCallback(async (categoryId) => {
    if (!categoryId || typeof categoryId !== 'number' || isNaN(categoryId)) {
      setProducts([]);
      return;
    }

    try {
      setLoading(prev => ({ ...prev, products: true }));
      const res = await api.get(`/api/products/category/${categoryId}`);
      const data = Array.isArray(res.data) ? res.data : [];
      const filtered = data.filter(p => p.categoryId === categoryId);
      setProducts(filtered);
    } catch (err) {
      console.error('Failed to load products', err);
      setProducts([]);
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  }, []);

  const loadAllProducts = useCallback(async () => {
    try {
      const res = await api.get('/api/products');
      const productsData = Array.isArray(res.data) ? res.data : [];
      setAllProducts(productsData);
      return productsData;
    } catch (err) {
      console.error('Failed to fetch all products', err);
      setAllProducts([]);
      return [];
    }
  }, []);

  // ✅ OPTIMIZED: Throttled socket listeners
  const setupSocketListeners = useCallback(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Cleanup existing listeners
    const events = ['products_updated', 'product_created', 'product_updated', 'product_deleted', 'categories_updated', 'products_imported'];
    events.forEach(event => socket.off(event));

    let refreshTimeout;
    const refreshData = () => {
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        loadAllProducts();
        if (selectedCategory) loadProducts(selectedCategory.id);
        loadCategories();
      }, 300);
    };

    // Product events with immediate UI updates
    socket.on('product_created', (newProduct) => {
      setAllProducts(prev => {
        const exists = prev.some(p => p.id === newProduct.id);
        if (!exists) {
          return [newProduct, ...prev];
        }
        return prev;
      });
      
      if (selectedCategory && newProduct.categoryId === selectedCategory.id) {
        setProducts(prev => [newProduct, ...prev]);
      }
    });

    socket.on('product_updated', (updatedProduct) => {
      setAllProducts(prev => prev.map(p => 
        p.id === updatedProduct.id ? updatedProduct : p
      ));
      
      if (selectedCategory && updatedProduct.categoryId === selectedCategory.id) {
        setProducts(prev => prev.map(p => 
          p.id === updatedProduct.id ? updatedProduct : p
        ));
      }
    });

    socket.on('product_deleted', (productId) => {
      setAllProducts(prev => prev.filter(p => p.id !== productId));
      setProducts(prev => prev.filter(p => p.id !== productId));
    });

    // Bulk updates use throttled refresh
    socket.on('products_updated', refreshData);
    socket.on('products_imported', refreshData);
    socket.on('categories_updated', refreshData);

    return () => {
      clearTimeout(refreshTimeout);
    };
  }, [selectedCategory, loadCategories, loadAllProducts, loadProducts]);

  // ✅ OPTIMIZED: Sequential initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading({ categories: true, products: false, initial: true });
      
      // Load sequentially to avoid network overload
      await loadCategories();
      await loadAllProducts();
      
      setLoading(prev => ({ ...prev, initial: false }));
    };

    loadInitialData();
    setupSocketListeners();
    
    return () => {
      const socket = socketService.getSocket();
      if (socket) {
        const events = [
          'products_updated', 'product_created', 'product_updated', 
          'product_deleted', 'categories_updated', 'products_imported'
        ];
        events.forEach(event => socket.off(event));
      }
    };
  }, [loadCategories, loadAllProducts, setupSocketListeners]);

  // ✅ OPTIMIZED: Category selection effect
  useEffect(() => {
    if (selectedCategory) {
      loadProducts(selectedCategory.id);
    } else {
      setProducts([]);
    }
  }, [selectedCategory, loadProducts]);

  // ✅ Memoized category actions
  const toggleCategory = useCallback((categoryId) => {
    setExpandedCategories(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(categoryId)) {
        newExpanded.delete(categoryId);
      } else {
        newExpanded.add(categoryId);
      }
      return newExpanded;
    });
  }, []);

  const expandAllCategories = useCallback(() => {
    const allIds = new Set();
    const collectIds = (nodes) => {
      nodes.forEach(node => {
        allIds.add(node.id);
        if (Array.isArray(node.children) && node.children.length > 0) {
          collectIds(node.children);
        }
      });
    };
    collectIds(categories);
    setExpandedCategories(allIds);
  }, [categories]);

  const collapseAllCategories = useCallback(() => {
    setExpandedCategories(new Set());
  }, []);

  // ✅ Optimized category handlers
  const handleAddCategory = useCallback(async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    const categoryData = { name: categoryName.trim() };
    if (parentCategoryId) {
      categoryData.parentId = parseInt(parentCategoryId);
    }

    try {
      await api.post('/api/products/categories', categoryData);
      setCategoryName('');
      setParentCategoryId('');
      setShowAddCategory(false);
      await loadCategories();
    } catch (err) {
      console.error('Failed to add category', err);
      alert('Failed to add category. Please try again.');
    }
  }, [categoryName, parentCategoryId, loadCategories]);

  const handleEditCategory = useCallback(async (categoryId, name) => {
    const oldCategories = [...categories];
    setCategories(prev => prev.map((c) => (c.id === categoryId ? { ...c, name } : c)));

    try {
      await api.put(`/api/products/categories/${categoryId}`, { name });
      await loadCategories();
    } catch (err) {
      console.error('Failed to edit category', err);
      alert('Failed to edit category');
      setCategories(oldCategories);
    }
  }, [categories, loadCategories]);

  const handleDeleteCategory = useCallback(async (categoryId) => {
    if (!window.confirm('Are You Sure You Want To Delete this category?')) return;

    const oldCategories = [...categories];
    setCategories(prev => prev.filter((c) => c.id !== categoryId));
    if (selectedCategory?.id === categoryId) setSelectedCategory(null);

    try {
      await api.delete(`/api/products/categories/${categoryId}`);
      await loadCategories();
      setSuccessMessage(`✅ Category "${categories.find(c => c.id === categoryId)?.name}" and all its products deleted successfully.`);
    } catch (err) {
      console.error('Failed to delete category', err);
      alert('Failed to delete category');
      setCategories(oldCategories);
    }
  }, [categories, selectedCategory, loadCategories]);

  // ✅ Optimized product actions
  const openAddProduct = useCallback(() => {
    setNewProduct({
      name: '',
      partNo: '',
      costPrice: '',
      markupPercentage: '20',
      categoryId: selectedCategory?.id || '',
      imageFile: null,
      imageUrl: '',
      quantity: ''
    });
    setShowAddProduct(true);
  }, [selectedCategory]);

  const handleAddProduct = useCallback(async (e) => {
    e.preventDefault();
    setUploading(true);

    const name = (newProduct.name || '').toString().trim();
    const categoryId = Number(newProduct.categoryId || selectedCategory?.id);

    if (!name) {
      alert('Product name is required');
      setUploading(false);
      return;
    }
    if (!categoryId) {
      alert('Please select a category');
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    if (newProduct.partNo) formData.append('partNo', newProduct.partNo);
    if (newProduct.costPrice !== '') formData.append('costPrice', parseFloat(newProduct.costPrice) || 0);
    if (newProduct.markupPercentage !== '') formData.append('markupPercentage', parseFloat(newProduct.markupPercentage) || 0);
    formData.append('categoryId', categoryId);

    if (newProduct.quantity !== '') {
      formData.append('quantity', parseInt(newProduct.quantity) || 0);
    }

    if (newProduct.imageFile) {
      try {
        const resizedFile = await resizeImage(newProduct.imageFile, 500, 0.7);
        formData.append('image', resizedFile);
      } catch (err) {
        console.error('Image resize failed:', err);
        alert('Image processing failed');
        setUploading(false);
        return;
      }
    }

    try {
      await api.post('/api/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShowAddProduct(false);
      setNewProduct({ name: '', partNo: '', costPrice: '', markupPercentage: '20', categoryId: '', imageFile: null, imageUrl: '', quantity: '' });
      await loadProducts(categoryId);
      await loadAllProducts();
    } catch (err) {
      console.error('Failed to add product', err);
      alert('Failed to add product');
    } finally {
      setUploading(false);
    }
  }, [newProduct, selectedCategory, loadProducts, loadAllProducts]);

  const handleDeleteProduct = useCallback(async (productId) => {
    if (!window.confirm('Delete this product?')) return;

    try {
      await api.delete(`/api/products/${productId}`);
      if (selectedCategory) await loadProducts(selectedCategory.id);
      await loadAllProducts();
      setSuccessMessage(`✅ Product deleted successfully.`);
    } catch (err) {
      console.error('Failed to delete product', err);
      alert('Failed to delete product');
    }
  }, [selectedCategory, loadProducts, loadAllProducts]);

  const openEditProduct = useCallback((product) => {
    setEditingProduct({
      id: product.id,
      name: product.name ?? '',
      partNo: product.partNo ?? '',
      costPrice: product.costPrice !== undefined && product.costPrice !== null ? String(product.costPrice) : '',
      markupPercentage: product.markupPercentage !== undefined && product.markupPercentage !== null ? String(product.markupPercentage) : '',
      categoryId: product.categoryId ?? (selectedCategory?.id || ''),
      image: product.image || null,
      imageSize: product.imageSize || null,
      imageFile: null,
      imageUrl: '',
      quantity: product.quantity !== undefined && product.quantity !== null ? String(product.quantity) : '',
    });
    setShowEditProduct(true);
  }, [selectedCategory]);

  const handleUpdateProduct = useCallback(async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setUploading(true);

    const name = (editingProduct.name || '').toString().trim();
    const categoryId = Number(editingProduct.categoryId);

    if (!name) {
      alert('Product name is required');
      setUploading(false);
      return;
    }
    if (!categoryId) {
      alert('Please select a category');
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    if (editingProduct.partNo) formData.append('partNo', editingProduct.partNo);
    if (editingProduct.costPrice !== '') formData.append('costPrice', parseFloat(editingProduct.costPrice) || 0);
    if (editingProduct.markupPercentage !== '') formData.append('markupPercentage', parseFloat(editingProduct.markupPercentage) || 0);
    formData.append('categoryId', categoryId);

    if (editingProduct.quantity !== '') {
      formData.append('quantity', parseInt(editingProduct.quantity) || 0);
    }

    if (editingProduct.imageFile) {
      try {
        const resizedFile = await resizeImage(editingProduct.imageFile, 500, 0.7);
        formData.append('image', resizedFile);
      } catch (err) {
        console.error('Image resize failed:', err);
        alert('Image processing failed');
        setUploading(false);
        return;
      }
    }

    try {
      await api.put(`/api/products/${editingProduct.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setShowEditProduct(false);
      setEditingProduct(null);
      await loadProducts(categoryId);
      await loadAllProducts();
    } catch (err) {
      console.error('Failed to update product', err);
      alert('Failed to update product');
    } finally {
      setUploading(false);
    }
  }, [editingProduct, loadProducts, loadAllProducts]);

  // ✅ Memoized category render function
  const renderCategories = useCallback(() => {
    if (!Array.isArray(categories)) return null;
    
    return categories.map((cat) => (
      <CategoryItem
        key={cat.id}
        category={cat}
        level={0}
        isDarkMode={isDarkMode}
        selectedCategory={selectedCategory}
        expandedCategories={expandedCategories}
        onToggle={toggleCategory}
        onSelect={setSelectedCategory}
        onEdit={handleEditCategory}
        onDelete={handleDeleteCategory}
      />
    ));
  }, [categories, isDarkMode, selectedCategory, expandedCategories, toggleCategory, handleEditCategory, handleDeleteCategory]);

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800'
          } flex items-center justify-between`}>
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-xs ml-2 hover:opacity-70 transition-opacity"
          >
            ✖
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className={`mb-6 p-4 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full">
            <label htmlFor="admin-product-search" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Search Products
            </label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="admin-product-search"
                type="text"
                placeholder="Search by product name, part number, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 border rounded-lg px-4 py-2 transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500'
                } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
              />
            </div>
          </div>

          {/* Search results info */}
          {debouncedSearchQuery && (
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            </div>
          )}

          {/* Clear search button */}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Product Management</h2>
                
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openAddProduct}
            disabled={uploading}
            className="flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Product
          </button>
          <button
            onClick={() => setShowAddCategory(true)}
            disabled={uploading}
            className="flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <FolderIcon className="w-4 h-4 mr-2" />
            Add Category
          </button>
          <CsvManagement
            onProductsImported={async (newCategoryId) => {
              const freshCategories = await loadCategories();
              if (newCategoryId) {
                const newCat = freshCategories.find(c => c.id === newCategoryId);
                if (newCat) {
                  setSelectedCategory({ id: newCat.id, name: newCat.name });
                }
              }
            }}
          />

          {/* Add Export Button */}
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-200"
          >
            <PhotographIcon className="w-4 h-4 mr-2" />
            Export CSV
          </button>

          {/* View Mode Toggle */}
          <div className={`flex rounded-lg p-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'table'
                  ? isDarkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                  : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Table View"
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? isDarkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                  : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Grid View"
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar container */}
        <div className="lg:w-80 flex-shrink-0">
          <div
            className={`rounded-xl shadow-md overflow-hidden flex flex-col ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
              }`}
          >
            {/* Header */}
            <div
              className={`p-4 border-b flex flex-wrap justify-between items-center gap-2 ${isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
            >
              <h3
                className={`text-lg font-semibold flex items-center flex-1 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                <FolderIcon className="w-5 h-5 mr-2 text-indigo-500" />
                Categories
              </h3>
              <div className="flex space-x-2 flex-shrink-0">
                <button
                  onClick={expandAllCategories}
                  className={`text-xs px-2 py-1 rounded-lg shadow-sm transition-colors ${
                    isDarkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Expand
                </button>
                <button
                  onClick={collapseAllCategories}
                  className={`text-xs px-2 py-1 rounded-lg shadow-sm transition-colors ${
                    isDarkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Collapse
                </button>
              </div>
            </div>

            {/* Show All Products Button */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  !selectedCategory
                    ? isDarkMode ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FolderIcon className="w-4 h-4" />
                  <span className="font-medium">All Products</span>
                </div>
                <p className={`text-xs mt-1 ${!selectedCategory ? 'text-green-100' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  View products from all categories
                </p>
              </button>
            </div>

            {/* Category list */}
            <div className="p-3 max-h-[calc(100vh-250px)] overflow-y-auto">
              {loading.categories ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-b-2 border-indigo-500 rounded-full mx-auto" />
                </div>
              ) : (
                <div className="space-y-1">
                  {renderCategories()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products display */}
        <div className="flex-1 min-w-0">
          <div
            className={`rounded-xl shadow-sm overflow-hidden ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
              }`}
          >
            {/* Table header */}
            <div
              className={`p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
            >
              <h3
                className={`text-lg font-medium ${
                  selectedCategory || debouncedSearchQuery
                    ? "text-red-600 font-bold"
                    : "text-red-600"
                  }`}
              >
                {debouncedSearchQuery ? (
                  `Search Results: "${debouncedSearchQuery}"`
                ) : selectedCategory ? (
                  `Products in Category: ${selectedCategory.name}`
                ) : (
                  "All Products"
                )}
              </h3>
              {(selectedCategory || debouncedSearchQuery || !selectedCategory) && (
                <p
                  className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"
                    } mt-1`}
                >
                  {filteredProducts.length} product(s) found
                  {debouncedSearchQuery && selectedCategory && ` in "${selectedCategory.name}"`}
                </p>
              )}
            </div>

            {/* Products Display */}
            {viewMode === 'table' ? (
              /* Table View */
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-200' : 'text-gray-500'}`}>
                        Image
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-200' : 'text-gray-500'}`}>
                        Product Name
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-200' : 'text-gray-500'}`}>
                        Part #
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-200' : 'text-gray-500'}`}>
                        Cost Price
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-200' : 'text-gray-500'}`}>
                        Sale Price
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-200' : 'text-gray-500'}`}>
                        Quantity
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-200' : 'text-gray-500'}`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? "divide-gray-700 bg-gray-800" : "divide-gray-200 bg-white"}`}>
                    {loading.products || loading.initial ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center">
                          <div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full mx-auto"></div>
                        </td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="7" className={`px-6 py-8 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          {debouncedSearchQuery ? (
                            <>No products found matching "<strong>{debouncedSearchQuery}</strong>"</>
                          ) : (
                            "No products found"
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map(product => (
                        <ProductRow
                          key={product.id}
                          product={product}
                          isDarkMode={isDarkMode}
                          uploading={uploading}
                          onEdit={openEditProduct}
                          onDelete={handleDeleteProduct}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Grid View */
              <div className="p-4">
                {loading.products || loading.initial ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="animate-spin h-12 w-12 border-b-2 border-indigo-600 rounded-full"></div>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <SearchIcon className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      No products found
                    </h3>
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                      {debouncedSearchQuery 
                        ? `No products match "${debouncedSearchQuery}"` 
                        : 'Try selecting a different category or adding new products'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map(product => (
                      <ProductGridCard
                        key={product.id}
                        product={product}
                        isDarkMode={isDarkMode}
                        uploading={uploading}
                        onEdit={openEditProduct}
                        onDelete={handleDeleteProduct}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div
            className={`rounded-xl shadow-xl w-full max-w-lg mx-auto mt-10 mb-10 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Add New Product
              </h3>
              <button
                onClick={() => setShowAddProduct(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleAddProduct} className="flex flex-col max-h-[70vh]">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Product Name */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-400' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                    required
                    disabled={uploading}
                  />
                </div>

                {/* Part Number */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Part Number
                  </label>
                  <input
                    type="text"
                    value={newProduct.partNo}
                    onChange={(e) => setNewProduct({ ...newProduct, partNo: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-400' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                    disabled={uploading}
                  />
                </div>

                {/* Cost Price */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Cost Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.costPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-400' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                    disabled={uploading}
                  />
                </div>

                {/* Markup Percentage */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Markup Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={newProduct.markupPercentage}
                    onChange={(e) => setNewProduct({ ...newProduct, markupPercentage: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-400' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                    disabled={uploading}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Category *
                  </label>
                  <select
                    required
                    value={newProduct.categoryId || selectedCategory?.id || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, categoryId: Number(e.target.value) })}
                    className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-400' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                    disabled={uploading}
                  >
                    <option value="">-- Select Category --</option>
                    {flatCats.map(c => (
                      <option key={c.id} value={c.id}>{'— '.repeat(c.level)} {c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Quantity (Optional)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={newProduct.quantity}
                    onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-400' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                    placeholder="e.g. 50"
                  />
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Leave blank if not tracking inventory
                  </p>
                </div>

                {/* Upload Image */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Upload Image
                  </label>

                  {/* Upload box */}
                  <div className={`mt-1 p-3 border-2 border-dashed rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                    {uploading ? (
                      <div className={`flex items-center justify-center space-x-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
                        <span>Uploading...</span>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) setNewProduct({ ...newProduct, imageFile: file, imageUrl: '' });
                        }}
                        disabled={uploading}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
        file:rounded-md file:border-0 file:text-sm file:font-semibold 
        file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                    )}
                  </div>

                  {/* File info outside the box */}
                  {newProduct.imageFile && !uploading && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm truncate max-w-[70%] ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          📄 {newProduct.imageFile.name} ({(newProduct.imageFile.size / 1024).toFixed(2)} KB)
                        </span>
                        <button
                          type="button"
                          onClick={() => setNewProduct({ ...newProduct, imageFile: null })}
                          className={`text-sm ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'}`}
                        >
                          Remove
                        </button>
                      </div>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <strong>Path:</strong> /uploads/images/{newProduct.imageFile.name}
                      </p>
                    </div>
                  )}

                  {/* No image yet */}
                  {!newProduct.imageFile && !newProduct.imageUrl && (
                    <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <p><strong>Image:</strong> No image uploaded</p>
                      <p><strong>Path:</strong> No path</p>
                    </div>
                  )}
                </div>

                {/* Image URL Fallback */}
                <div className="mt-3">
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Or: Image URL (fallback)
                  </label>
                  <input
                    type="url"
                    value={newProduct.imageUrl}
                    onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value, imageFile: null })}
                    placeholder="https://example.com/image.jpg"
                    className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-400' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'} focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                    disabled={uploading || newProduct.imageFile}
                  />
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Used only if no file uploaded
                  </p>
                </div>

              </div>

              {/* Footer */}
              <div className={`flex justify-end space-x-3 p-5 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  disabled={uploading}
                  className={`px-4 py-2 border rounded-lg text-sm ${isDarkMode
                      ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600'
                      : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                    } disabled:opacity-50 transition-colors duration-200`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 transition-colors duration-200"
                >
                  {uploading ? 'Uploading...' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProduct && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div
            className={`rounded-xl shadow-xl w-full max-w-lg mx-auto mt-10 mb-10 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Edit Product
              </h3>
              <button
                onClick={() => { setShowEditProduct(false); setEditingProduct(null); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleUpdateProduct} className="flex flex-col max-h-[70vh]">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Product Name */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-400' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                    required
                    disabled={uploading}
                  />
                </div>

                {/* Part Number */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Part Number
                  </label>
                  <input
                    type="text"
                    value={editingProduct.partNo}
                    onChange={(e) => setEditingProduct({ ...editingProduct, partNo: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-400' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                    disabled={uploading}
                  />
                </div>

                {/* Cost Price */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Cost Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingProduct.costPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-400' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                    disabled={uploading}
                  />
                </div>

                {/* Markup Percentage */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Markup Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editingProduct.markupPercentage}
                    onChange={(e) => setEditingProduct({ ...editingProduct, markupPercentage: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-400' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                    disabled={uploading}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Category *
                  </label>
                  <select
                    required
                    value={editingProduct.categoryId || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: Number(e.target.value) })}
                    className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-400' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                    disabled={uploading}
                  >
                    <option value="">-- Select Category --</option>
                    {flatCats.map(c => (
                      <option key={c.id} value={c.id}>{'— '.repeat(c.level)} {c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Quantity (Optional)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={editingProduct.quantity}
                    onChange={(e) => setEditingProduct({ ...editingProduct, quantity: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-400' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                    placeholder="e.g. 50"
                  />
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Leave blank if not tracking inventory
                  </p>
                </div>

                {/* Upload New Image */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Upload New Image
                  </label>

                  {/* Upload box */}
                  <div className={`mt-1 p-3 border-2 border-dashed rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                    {uploading ? (
                      <div className={`flex items-center justify-center space-x-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
                        <span>Uploading...</span>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) setEditingProduct({ ...editingProduct, imageFile: file, imageUrl: '' });
                        }}
                        disabled={uploading}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
        file:rounded-md file:border-0 file:text-sm file:font-semibold 
        file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                    )}
                  </div>

                  {/* Show new uploaded file info */}
                  {editingProduct.imageFile && !uploading && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm truncate max-w-[70%] ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          📄 {editingProduct.imageFile.name} ({(editingProduct.imageFile.size / 1024).toFixed(2)} KB)
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct, imageFile: null })}
                          className={`text-sm ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'}`}
                        >
                          Remove
                        </button>
                      </div>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <strong>Path:</strong> /uploads/images/{editingProduct.imageFile.name}
                      </p>
                    </div>
                  )}

                  {/* Show existing image if no new file */}
                  {!editingProduct.imageFile && editingProduct.image && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm truncate max-w-[70%] ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          📄 {editingProduct.image.split("/").pop()}
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm("Remove this image from the server?")) return;
                            try {
                              await api.delete(`/api/products/${editingProduct.id}/image`);
                              setEditingProduct(prev => prev ? ({ ...prev, image: null, imageFile: null, imageUrl: '', imageSize: null }) : prev);
                              if (selectedCategory) await loadProducts(selectedCategory.id);
                            } catch (err) {
                              console.error("Failed to remove image", err);
                              alert("Failed to remove image");
                            }
                          }}
                          className={`text-sm ${isDarkMode ? "text-red-400 hover:text-red-300" : "text-red-500 hover:text-red-700"}`}
                        >
                          Remove
                        </button>
                      </div>
                      <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        <strong>Path:</strong> {editingProduct.image}
                      </p>
                      {editingProduct.imageSize && (
                        <p className={`text-xs mt-0 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                          <strong>Size:</strong> {formatBytes(editingProduct.imageSize)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* No image at all */}
                  {!editingProduct.imageFile && !editingProduct.image && (
                    <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <p><strong>Image:</strong> No image uploaded</p>
                      <p><strong>Path:</strong> No path</p>
                    </div>
                  )}
                </div>

                {/* Or: Update Image URL */}
                <div className="mt-3">
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Or: Update Image URL
                  </label>
                  <input
                    type="url"
                    value={editingProduct.imageUrl}
                    onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value, imageFile: null })}
                    placeholder="https://example.com/image.jpg"
                    className={`w-full border rounded-lg px-3 py-2 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-400' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'} focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                    disabled={uploading || editingProduct.imageFile}
                  />
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Only used if no file uploaded
                  </p>
                </div>

              </div>

              {/* Footer */}
              <div className={`flex justify-end space-x-3 p-5 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => { setShowEditProduct(false); setEditingProduct(null); }}
                  disabled={uploading}
                  className={`px-4 py-2 border rounded-lg text-sm ${isDarkMode
                      ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600'
                      : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                    } disabled:opacity-50 transition-colors duration-200`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 transition-colors duration-200"
                >
                  {uploading ? 'Uploading...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Export Products Modal */}
      <ExportProductsModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        categories={categories}
        onFetchAllProducts={loadAllProducts}
      />
      
      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-xl w-full max-w-md ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add New Category</h3>
                <button
                  onClick={() => setShowAddCategory(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddCategory}>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category Name *</label>
                    <input
                      type="text"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-400' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'} focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Parent Category (Optional)</label>
                    <select
                      value={parentCategoryId}
                      onChange={(e) => setParentCategoryId(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-400' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'} focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                    >
                      <option value="">-- No Parent --</option>
                      {flatCats.map(c => (
                        <option key={c.id} value={c.id}>{'— '.repeat(c.level) + c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(false)}
                    className={`px-4 py-2 border rounded-lg text-sm ${isDarkMode ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600' : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'} transition-colors duration-200`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors duration-200"
                  >
                    Add Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;