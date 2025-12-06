import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ItemProcessingModal = ({ 
    isDarkMode, 
    item, 
    onProcessItem, 
    onCancel 
}) => {
    const [profitPercentage, setProfitPercentage] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [currentStep, setCurrentStep] = useState('profit');
    const [costPrice, setCostPrice] = useState(0); // Changed from unitCost to costPrice
    const [loadingCost, setLoadingCost] = useState(false);

    // Reset state when item changes
    useEffect(() => {
        setProfitPercentage('');
        setQuantity('1');
        setCurrentStep('profit');
        setCostPrice(0);
        setLoadingCost(false);
        
        if (item) {
            fetchProductCost();
        }
    }, [item]);

    // Auto-focus inputs
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentStep === 'profit') {
                const input = document.getElementById('profitPercentageInput');
                input?.focus();
            } else {
                const input = document.getElementById('quantityInput');
                input?.focus();
            }
        }, 50);
        
        return () => clearTimeout(timer);
    }, [currentStep]);

    const fetchProductCost = async () => {
        if (!item?.partNo) {
            setCostPrice(0);
            return;
        }

        setLoadingCost(true);
        try {
            // Search products by part number - FIXED: using correct endpoint
            const response = await api.get(`/api/products?partNo=${encodeURIComponent(item.partNo)}`);
            
            if (response.data && response.data.length > 0) {
                // Find exact match by partNo
                const exactMatch = response.data.find(p => 
                    p.partNo && p.partNo.toString().toLowerCase() === item.partNo.toLowerCase()
                );
                
                const product = exactMatch || response.data[0];
                // Use costPrice instead of unitCost
                setCostPrice(product.costPrice || 0);
            } else {
                setCostPrice(0);
            }
        } catch (error) {
            console.error('Error fetching product cost:', error);
            setCostPrice(0);
        } finally {
            setLoadingCost(false);
        }
    };

    // Calculations - using costPrice instead of unitCost
    const basePrice = parseFloat(item?.unitPrice) || 0;
    const profitValue = parseFloat(profitPercentage) || 0;
    const finalPrice = basePrice * (1 + profitValue / 100);
    const profitAmount = finalPrice - costPrice;
    const actualProfitPercentage = costPrice > 0 ? (profitAmount / costPrice) * 100 : 0;
    const quantityValue = parseInt(quantity) || 1;
    const totalPrice = finalPrice * quantityValue;
    const totalProfit = profitAmount * quantityValue;

    // Handlers
    const handleProfitSubmit = () => {
        if (profitPercentage === '' || isNaN(profitValue) || profitValue < 0) {
            alert('Please enter a valid profit percentage.');
            return;
        }
        setCurrentStep('quantity');
    };

    const handleQuantitySubmit = () => {
        if (isNaN(quantityValue) || quantityValue < 1) {
            alert('Please enter a valid quantity.');
            return;
        }

        const processedItem = {
            ...item,
            unitPrice: finalPrice,
            quantity: quantityValue,
            totalPrice: totalPrice,
            unitCost: costPrice, // Still send as unitCost for backend compatibility
            costPrice: costPrice, // Add costPrice for clarity
            profitAmount: totalProfit,
            profitPercentage: actualProfitPercentage,
            markupAmount: totalProfit,
            markupPercentage: profitValue
        };

        onProcessItem(processedItem);
    };

    const handleKeyPress = (e, submitFunction) => {
        if (e.key === 'Enter') submitFunction();
    };

    const handleSkipItem = () => {
        onProcessItem({ skipped: true, queueIndex: item.queueIndex });
    };

    const handleCancelAll = () => {
        onCancel();
    };

    if (!item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className={`rounded-xl shadow-2xl w-full max-w-xs mx-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                
                {/* Header */}
                <div className={`p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold">
                            Item {item.queueIndex + 1} of {item.totalItems}
                        </h3>
                        <button
                            onClick={handleCancelAll}
                            className={`text-xs px-2 py-1 rounded ${
                                isDarkMode 
                                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Cancel All
                        </button>
                    </div>
                </div>
                
                {/* Item Info */}
                <div className="p-3 border-b bg-gray-50 dark:bg-gray-700">
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                            <span className="font-medium">Part No:</span>
                            <span className="truncate max-w-[120px]">{item.partNo || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Description:</span>
                            <span className="truncate max-w-[120px]">{item.description || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Base Price:</span>
                            <span>${basePrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Cost Price:</span> {/* Changed from Unit Cost */}
                            <span>{loadingCost ? '...' : `$${costPrice.toFixed(2)}`}</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Profit Step */}
                    {currentStep === 'profit' && (
                        <div className="space-y-4">
                            <div className="text-center">
                                <label className="block text-sm font-medium mb-2">
                                    Profit Percentage
                                </label>
                                <input
                                    id="profitPercentageInput"
                                    type="number"
                                    value={profitPercentage}
                                    onChange={(e) => setProfitPercentage(e.target.value)}
                                    onKeyPress={(e) => handleKeyPress(e, handleProfitSubmit)}
                                    step="0.1"
                                    min="0"
                                    placeholder="0"
                                    className={`w-full px-3 py-2 text-sm border rounded-lg text-center ${
                                        isDarkMode 
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                    }`}
                                />
                            </div>

                            {/* Preview */}
                            {profitPercentage !== '' && !isNaN(profitValue) && (
                                <div className="text-xs text-center space-y-1 p-2 rounded bg-blue-50 dark:bg-blue-900/20">
                                    <div className="text-green-600 font-semibold">
                                        Final Price: ${finalPrice.toFixed(2)}
                                    </div>
                                    <div className="text-blue-600">
                                        Unit Profit: ${profitAmount.toFixed(2)} ({actualProfitPercentage.toFixed(1)}%)
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button 
                                    onClick={handleSkipItem}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium ${
                                        isDarkMode 
                                            ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                    }`}
                                >
                                    Skip Item
                                </button>
                                <button 
                                    onClick={handleProfitSubmit}
                                    disabled={profitPercentage === '' || isNaN(profitValue) || profitValue < 0}
                                    className="flex-1 py-2 px-3 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Quantity Step */}
                    {currentStep === 'quantity' && (
                        <div className="space-y-4">
                            <div className="text-center">
                                <label className="block text-sm font-medium mb-2">
                                    Quantity
                                </label>
                                <input
                                    id="quantityInput"
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    onKeyPress={(e) => handleKeyPress(e, handleQuantitySubmit)}
                                    min="1"
                                    placeholder="1"
                                    className={`w-full px-3 py-2 text-sm border rounded-lg text-center ${
                                        isDarkMode 
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                    }`}
                                />
                            </div>

                            {/* Preview */}
                            {!isNaN(quantityValue) && quantityValue > 0 && (
                                <div className="text-xs text-center space-y-1 p-2 rounded bg-green-50 dark:bg-green-900/20">
                                    <div className="text-green-600 font-semibold">
                                        Total Price: ${totalPrice.toFixed(2)}
                                    </div>
                                    <div className="text-blue-600">
                                        Total Profit: ${totalProfit.toFixed(2)}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setCurrentStep('profit')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium ${
                                        isDarkMode 
                                            ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                    }`}
                                >
                                    Back
                                </button>
                                <button 
                                    onClick={handleSkipItem}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium ${
                                        isDarkMode 
                                            ? 'bg-yellow-600 hover:bg-yellow-500 text-white' 
                                            : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                    }`}
                                >
                                    Skip
                                </button>
                                <button 
                                    onClick={handleQuantitySubmit}
                                    disabled={isNaN(quantityValue) || quantityValue < 1}
                                    className="flex-1 py-2 px-3 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ItemProcessingModal;