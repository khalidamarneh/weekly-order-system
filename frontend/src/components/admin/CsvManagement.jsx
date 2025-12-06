// src/components/admin/CsvManagement.jsx
import React, { useState, useRef } from 'react';
import api from '../../services/api';
import socketService from '../../services/socket'; // ← ADD THIS IMPORT
import Papa from 'papaparse';

const CsvManagement = ({ onProductsImported }) => {
  const [uploading, setUploading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showQuantityStrategyModal, setShowQuantityStrategyModal] = useState(false); // ✅ Moved up
  const [showMarkupModal, setShowMarkupModal] = useState(false);
  const [showMarkupEntry, setShowMarkupEntry] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [parsedProducts, setParsedProducts] = useState([]);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [tempMarkup, setTempMarkup] = useState('20');
  const [categories, setCategories] = useState([]);
  const [resultSummary, setResultSummary] = useState(null);
  const [quantityUpdateStrategy, setQuantityUpdateStrategy] = useState('add'); // 'add' or 'replace'
  const [newCategoryCreated, setNewCategoryCreated] = useState(null);
  const fileInputRef = useRef(null);

  const loadCategories = async () => {
    try {
      const res = await api.get('/api/products/categories');
      const flat = flattenCategories(res.data);
      setCategories(flat);
    } catch {
      alert('Failed to load categories');
    }
  };

  const flattenCategories = (nodes = [], level = 0, out = []) => {
    nodes.forEach(node => {
      out.push({ id: node.id, name: node.name, level, parentId: node.parentId ?? null });
      if (Array.isArray(node.children) && node.children.length > 0) {
        flattenCategories(node.children, level + 1, out);
      }
    });
    return out;
  };

  const resetFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

//////////////////////////
// Helper: Expand scientific notation → string only (no Number/BigInt)
// helper has been DELETED
//////////////////////////
const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setUploading(true);

  const fileReader = new FileReader();
  fileReader.onload = async (event) => {
    let rawCsv = event.target.result;

    // Add apostrophe before every UPC-like field (scientific notation pattern or long digits)
    rawCsv = rawCsv.replace(/,([0-9.]+E\+[0-9]+),/gi, (match, num) => {
      return `,'${num},`;
    });

    rawCsv = rawCsv.replace(/,(\d{11,}),/g, (match, num) => {
      // catch plain long numbers too (11+ digits typical for UPC/EAN)
      return `,'${num},`;
    });

    Papa.parse(rawCsv, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // keep everything as strings
      complete: async (results) => {
        const { data } = results;

        if (!data || data.length === 0) {
          alert("CSV is empty or invalid");
          setUploading(false);
          resetFileInput();
          return;
        }

        const products = [];

        for (const row of data) {
          const name = (row["Product Name"] || "").trim();

          let rawPart = (
            row.UPC ??
            row["Single Upc"] ??
            row["Part Number"] ??
            ""
          ).toString().trim();

          // ✅ At this point, values like "'10819913012591" should survive
          const partNo = rawPart;

          const costPrice = parseFloat(
            String(row["Sold Price"] ?? row["Cost Price"] ?? "")
              .replace(/,/g, "")
              .trim()
          );
          const quantity =
            row.Quantity !== undefined && row.Quantity !== ""
              ? parseInt(String(row.Quantity).replace(/,/g, ""), 10)
              : null;

          if (!name || !partNo || Number.isNaN(costPrice)) continue;

          products.push({
            name,
            partNo,
            costPrice,
            quantity,
          });
        }

        if (products.length === 0) {
          alert("No valid products found in CSV");
          setUploading(false);
          resetFileInput();
          return;
        }

        setParsedProducts(products);
        setUploading(false);

        await loadCategories();
        setShowCategoryModal(true);
      },
      error: () => {
        alert("Failed to parse CSV");
        setUploading(false);
        resetFileInput();
      },
    });
  };

  fileReader.readAsText(file);
};
////////////////////////////////////////////////////////////////////////////

  const handleCategorySubmit = async () => {
    if (selectedCategory === 'new' && !newCategoryName.trim()) {
      alert('Please enter a name for the new category');
      return;
    }
    setShowCategoryModal(false);

    // ✅ After category, check if quantity update is needed
    let existingProducts = [];
    try {
      const res = await api.get('/api/products');
      if (Array.isArray(res.data)) {
        existingProducts = res.data;
      }
    } catch (err) {
      console.error('Failed to load existing products for quantity check', err);
    }

    const existingMap = new Map();
    existingProducts.forEach(p => {
      if (p.partNo) {
        existingMap.set(p.partNo, p);
      }
    });

    const hasExistingProducts = parsedProducts.some(p => {
      const existing = existingMap.get(p.partNo);
      return p.quantity !== null && existing && existing.quantity !== null;
    });

    if (hasExistingProducts) {
      setShowQuantityStrategyModal(true); // ✅ First: Ask about quantity
    } else {
      setQuantityUpdateStrategy('add'); // Default
      setShowMarkupModal(true); // Then: Ask about markup
    }
  };

  const handleQuantityStrategySubmit = () => {
    setShowQuantityStrategyModal(false);
    setShowMarkupModal(true); // ✅ After quantity, show markup choice
  };

  const handleMarkupChoice = (addNow) => {
    setShowMarkupModal(false);
    
    if (addNow) {
      setCurrentProductIndex(0);
      setTempMarkup('20');
      setShowMarkupEntry(true); // ✅ Now show markup entry
    } else {
      const productsWithMarkup = parsedProducts.map(p => ({
        ...p,
        markupPercentage: 20,
        salePrice: p.costPrice * 1.2
      }));
      submitBulkProducts(productsWithMarkup);
    }
  };

  const handleNextProduct = () => {
    const updatedProducts = [...parsedProducts];
    const markup = parseFloat(tempMarkup) || 0;
    updatedProducts[currentProductIndex].markupPercentage = markup;
    updatedProducts[currentProductIndex].salePrice =
      updatedProducts[currentProductIndex].costPrice * (1 + markup / 100);

    if (currentProductIndex === parsedProducts.length - 1) {
      setShowMarkupEntry(false);
      submitBulkProducts(updatedProducts);
    } else {
      setCurrentProductIndex(currentProductIndex + 1);
      setTempMarkup('20');
    }
  };

  const handleMarkupCancel = () => {
    setShowMarkupEntry(false);
    setShowMarkupModal(true);
  };

  const submitBulkProducts = async (products) => {
    let finalCategoryId = selectedCategory;

    if (selectedCategory === 'new') {
      try {
        const res = await api.post('/api/products/categories', { name: newCategoryName });
        finalCategoryId = res.data.id;
        setNewCategoryCreated(finalCategoryId); // ← Keep this for logging

        // ✅ Wait for categories to reload so we can find the new one
        await loadCategories();

        // ✅ Now find the new category in updated state
        const newCat = categories.find(c => c.id === finalCategoryId);
        if (newCat) {
          setSelectedCategory({ id: newCat.id, name: newCat.name });
        }
      } catch {
        alert('Failed to create category');
        return;
      }
    }

    // ✅ Apply quantity strategy
    let existingProductsMap = new Map();
    try {
      const res = await api.get('/api/products');
      if (Array.isArray(res.data)) {
        res.data.forEach(p => {
          if (p.partNo) {
            existingProductsMap.set(p.partNo, p);
          }
        });
      }
    } catch (err) {
      console.error('Failed to load existing products for quantity check', err);
    }

    const finalProducts = products.map(p => {
      const existing = existingProductsMap.get(p.partNo);
      if (existing && p.quantity !== null && existing.quantity !== null) {
        if (quantityUpdateStrategy === 'add') {
          p.quantity = existing.quantity + p.quantity;
        }
      }
      return p;
    });

    try {
      const response = await api.post('/api/products/csv', {
        categoryId: finalCategoryId,
        products: finalProducts.map(p => ({
          name: p.name,
          partNo: p.partNo,
          costPrice: p.costPrice,
          markupPercentage: p.markupPercentage || 20,
          quantity: p.quantity
        }))
      });

      const {
        newCount,
        updateCount,
        skippedCount,
        createdProducts,
        updatedProducts,
        skippedProducts
      } = response.data;

      const categoryName =
        categories.find(c => c.id?.toString() === finalCategoryId?.toString())?.name ||
        newCategoryName ||
        'Selected Category';

      setResultSummary({
        newCount,
        updateCount,
        skippedCount,
        createdProducts: createdProducts || [],
        updatedProducts: updatedProducts || [],
        skippedProducts: skippedProducts || [],
        categoryName
      });

      setShowResultModal(true);

      // ✅ Reset file input & parsed products
      resetFileInput();
      setParsedProducts([]);

      // ✅ Trigger refresh with correct category
      if (onProductsImported) {
        onProductsImported(finalCategoryId); // 👈 This will call loadProducts(finalCategoryId)
      }
      // ✅ Trigger real-time updates
    if (onProductsImported) {
      onProductsImported();
    }

    // ✅ Emit socket event for real-time updates
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('products_imported', {
        newCount: createdProducts.length,
        updateCount: updatedProducts.length
      });
    }
    } catch (err) {
      alert('Import failed: ' + (err.response?.data?.message || err.message));
    }
  };



  return (
    <>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
        id="csv-upload"
        ref={fileInputRef}
        disabled={uploading}
      />
      <label
        htmlFor="csv-upload"
        className="px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 cursor-pointer disabled:opacity-70"
      >
        {uploading ? 'Uploading...' : 'Upload CSV'}
      </label>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Category</h3>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border rounded-md py-2 px-3 mb-4"
              >
                <option value="">-- Select Category --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {'— '.repeat(cat.level)} {cat.name}
                  </option>
                ))}
                <option value="new">+ Create New Category</option>
              </select>

              {selectedCategory === 'new' && (
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category name"
                  className="w-full border rounded-md py-2 px-3 mb-4"
                />
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    resetFileInput();
                  }}
                  className="px-4 py-2 border rounded-md text-sm bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCategorySubmit}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Quantity Update Strategy Modal (Now appears before markup) */}
      {showQuantityStrategyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Quantity?</h3>
              <p className="text-sm text-gray-600 mb-6">
                Some products in the CSV already exist with a quantity. How would you like to update them?
              </p>
              <div className="space-y-3 mb-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={quantityUpdateStrategy === 'add'}
                    onChange={() => setQuantityUpdateStrategy('add')}
                    className="mr-2"
                  />
                  <span className="text-sm">Add to existing quantity (e.g., restock)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={quantityUpdateStrategy === 'replace'}
                    onChange={() => setQuantityUpdateStrategy('replace')}
                    className="mr-2"
                  />
                  <span className="text-sm">Replace with CSV quantity</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowQuantityStrategyModal(false);
                    setShowCategoryModal(true);
                  }}
                  className="px-4 py-2 border rounded-md text-sm bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuantityStrategySubmit}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Markup Decision Modal */}
      {showMarkupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Markup Now?</h3>
              <p className="text-sm text-gray-600 mb-6">
                You can set markup percentage for each product now, or skip to use default (20%).
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowMarkupModal(false);
                    setShowQuantityStrategyModal(true);
                  }}
                  className="px-4 py-2 border rounded-md text-sm bg-white"
                >
                  Back
                </button>
                <button
                  onClick={() => handleMarkupChoice(false)}
                  className="px-4 py-2 border rounded-md text-sm bg-gray-200"
                >
                  Skip
                </button>
                <button
                  onClick={() => handleMarkupChoice(true)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Yes, Add Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Markup Entry Modal */}
      {showMarkupEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Set Markup - {currentProductIndex + 1} of {parsedProducts.length}
              </h3>
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <p><strong>Name:</strong> {parsedProducts[currentProductIndex]?.name}</p>
                <p><strong>Part #:</strong> {parsedProducts[currentProductIndex]?.partNo}</p>
                <p><strong>Cost:</strong> ${parsedProducts[currentProductIndex]?.costPrice.toFixed(2)}</p>
                <p><strong>Quantity:</strong> {parsedProducts[currentProductIndex]?.quantity !== null ? parsedProducts[currentProductIndex]?.quantity : '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Markup Percentage (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={tempMarkup}
                  onChange={(e) => setTempMarkup(e.target.value)}
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleMarkupCancel}
                  className="px-4 py-2 border rounded-md text-sm bg-white"
                >
                  Cancel
                </button>
                {currentProductIndex > 0 && (
                  <button
                    onClick={() => setCurrentProductIndex(currentProductIndex - 1)}
                    className="px-4 py-2 border rounded-md text-sm bg-gray-200"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleNextProduct}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  {currentProductIndex === parsedProducts.length - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Summary Modal */}
      {showResultModal && resultSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 text-left">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Import Summary</h3>

            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-1">
                ✅ <strong>{resultSummary.newCount}</strong> new item(s) added to{' '}
                <span className="font-semibold">{resultSummary.categoryName}</span>.
              </p>
              <p className="text-sm text-gray-700 mb-1">
                ♻️ <strong>{resultSummary.updateCount}</strong> duplicate item(s) updated in their original categories.
              </p>
              <p className="text-sm text-gray-700">
                ⚠️ <strong>{resultSummary.skippedCount}</strong> invalid item(s) skipped.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <h4 className="font-medium mb-2">New items</h4>
                {resultSummary.createdProducts.length === 0 ? (
                  <p className="text-sm text-gray-500">No new items</p>
                ) : (
                  <ul className="text-sm text-gray-700 max-h-40 overflow-auto">
                    {resultSummary.createdProducts.map((it, idx) => (
                      <li key={idx} className="py-1 border-b">
                        <span className="font-semibold">{it.partNo}</span>
                        <div className="text-xs text-gray-600">{it.name}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2">Updated items</h4>
                {resultSummary.updatedProducts.length === 0 ? (
                  <p className="text-sm text-gray-500">No updates</p>
                ) : (
                  <ul className="text-sm text-gray-700 max-h-40 overflow-auto">
                    {resultSummary.updatedProducts.map((it, idx) => (
                      <li key={idx} className="py-1 border-b">
                        <span className="font-semibold">{it.partNo}</span>
                        <div className="text-xs text-gray-600">{it.name}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2">Skipped</h4>
                {resultSummary.skippedProducts.length === 0 ? (
                  <p className="text-sm text-gray-500">None</p>
                ) : (
                  <ul className="text-sm text-gray-700 max-h-40 overflow-auto">
                    {resultSummary.skippedProducts.map((it, idx) => (
                      <li key={idx} className="py-1 border-b">
                        <span className="font-semibold">{it.partNo || '—'}</span>
                        <div className="text-xs text-gray-600">{it.name || 'invalid row'}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowResultModal(false);
                  resetFileInput();
                  setParsedProducts([]);
                  setSelectedCategory('');
                  setNewCategoryName('');
                }}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CsvManagement;