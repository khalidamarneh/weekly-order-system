// src/components/admin/ExportProductsModal.jsx
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { XIcon } from '@heroicons/react/outline';

const ExportProductsModal = ({ isOpen, onClose, categories, onFetchAllProducts }) => {
    const [exportType, setExportType] = useState('all');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [products, setProducts] = useState([]);

    useEffect(() => {
        if (!isOpen) return;

        // Reset selections
        setExportType('all');
        setSelectedCategoryId('');
        setProducts([]);
    }, [isOpen]);

    const generateCSV = async () => {
        let dataToExport = [];

        if (exportType === 'all') {
            // ✅ Load all products from backend
            dataToExport = await onFetchAllProducts();
        } else if (exportType === 'category' && selectedCategoryId) {
            // Use filtered list passed from parent
            dataToExport = products.filter(p => p.categoryId === parseInt(selectedCategoryId));
        }

        if (dataToExport.length === 0) {
            alert('No products to export');
            return;
        }

        // Build category name map (supports nested)
        const categoryNameMap = {};
        const buildCategoryMap = (nodes, level = 0) => {
            nodes.forEach(node => {
                const prefix = '— '.repeat(level);
                categoryNameMap[node.id] = `${prefix}${node.name}`;
                if (Array.isArray(node.children)) {
                    buildCategoryMap(node.children, level + 1);
                }
            });
        };
        buildCategoryMap(categories);

        
        const csvData = [
            ['Product Name', 'Part Number', 'Cost Price', 'Sale Price', 'Quantity', 'Category'],
            ...dataToExport.map(p => [
                p.name,
                p.partNo || '',
                parseFloat(p.costPrice).toFixed(2),
                parseFloat(p.salePrice).toFixed(2),
                p.quantity !== null && p.quantity !== undefined ? p.quantity : '',
                categoryNameMap[p.categoryId] || 'Uncategorized'
            ])
        ];

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `products-export-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto mt-10 mb-10">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Export Products</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    <div className="flex space-x-4 border-b border-gray-200">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                checked={exportType === 'all'}
                                onChange={() => setExportType('all')}
                                className="mr-2"
                            />
                            <span className="text-sm">All Products</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                checked={exportType === 'category'}
                                onChange={() => setExportType('category')}
                                className="mr-2"
                            />
                            <span className="text-sm">By Category</span>
                        </label>
                    </div>

                    {exportType === 'category' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Category</label>
                            <select
                                value={selectedCategoryId}
                                onChange={(e) => setSelectedCategoryId(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                            >
                                <option value="">-- Select Category --</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {'— '.repeat(cat.level)} {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 p-5 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={generateCSV}
                        disabled={exportType === 'category' && !selectedCategoryId}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        Export CSV
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportProductsModal;