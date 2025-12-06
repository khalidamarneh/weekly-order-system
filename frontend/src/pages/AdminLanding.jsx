// src/pages/AdminLanding.jsx
import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";
import socketService from "../services/socket";
import { useAuth } from "../context/AuthContext";
import {
    UsersIcon,
    CubeIcon,
    ShoppingCartIcon,
    DocumentTextIcon,
    DocumentReportIcon,
    CollectionIcon,
    TruckIcon,
    ExclamationIcon
} from "@heroicons/react/outline";

const AdminLanding = ({ isDarkMode, setActiveTab, setActiveSubTab }) => {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newSubmittedCount, setNewSubmittedCount] = useState(0);
    const [isBlinking, setIsBlinking] = useState(false);
    
    // Use ref to track previous submitted orders count
    const previousSubmittedCountRef = useRef(0);
    // Track if this is the initial load
    const initialLoadRef = useRef(true);

    const fetchSummary = async (isSilentRefresh = false) => {
        try {
            if (!isSilentRefresh) {
                setLoading(true);
            }
            setError(null);
            const res = await api.get("/api/admin/summary");
            
            // Only log for non-silent refreshes to reduce console noise
            if (!isSilentRefresh) {
                console.log("SUMMARY DATA:", res.data);
            }

            const currentSubmitted = res.data.submittedOrders || 0;
            const previousSubmitted = previousSubmittedCountRef.current;

            // First time loading - just set the baseline
            if (initialLoadRef.current) {
                console.log("Initial load - setting baseline:", currentSubmitted);
                previousSubmittedCountRef.current = currentSubmitted;
                initialLoadRef.current = false;
            } 
            // Subsequent loads - check for new orders
            else if (currentSubmitted > previousSubmitted) {
                const newOrders = currentSubmitted - previousSubmitted;
                setNewSubmittedCount(prev => prev + newOrders);
                setIsBlinking(true);
                
                console.log(`🚨 NEW ORDERS DETECTED: ${newOrders} new order(s)!`);
                console.log(`Previous: ${previousSubmitted}, Current: ${currentSubmitted}`);
                
                // Update the previous count reference
                previousSubmittedCountRef.current = currentSubmitted;
            } 
            // If count decreased or stayed the same, just update the reference silently
            else if (currentSubmitted < previousSubmitted) {
                console.log(`Order count decreased. Previous: ${previousSubmitted}, Current: ${currentSubmitted}`);
                previousSubmittedCountRef.current = currentSubmitted;
            }
            // No change - update silently (no console log to reduce noise)
            else {
                previousSubmittedCountRef.current = currentSubmitted;
            }

            setSummary(res.data);
        } catch (err) {
            console.error("Failed to fetch summary:", err);
            setError("Failed to load dashboard data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
        
        // REMOVED the automatic interval - we'll rely on WebSocket events only
        // const interval = setInterval(fetchSummary, 15000);
        
        // return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Set up WebSocket listener for new orders
        const setupSocketListener = () => {
            const socket = socketService.getSocket();

            if (socket) {
                socket.on('inbound_order_submitted', (newOrder) => {
                    console.log('🎯 WebSocket: New order submitted:', newOrder);
                    // Force immediate refresh when WebSocket event is received
                    fetchSummary(true); // Pass true for silent refresh
                });

                socket.on('order_updated', (updatedOrder) => {
                    console.log('🎯 WebSocket: Order updated:', updatedOrder);
                    if (updatedOrder.status === 'SUBMITTED') {
                        fetchSummary(true); // Silent refresh
                    }
                });

                socket.on('new_order', (order) => {
                    console.log('🎯 WebSocket: New order created:', order);
                    fetchSummary(true); // Silent refresh
                });

                return () => {
                    socket.off('inbound_order_submitted');
                    socket.off('order_updated');
                    socket.off('new_order');
                };
            }
        };

        setupSocketListener();
    }, []);

    const handleTabClick = (tab, subTab = "") => {
        setActiveTab(tab);
        if (subTab) {
            setActiveSubTab(subTab);
        }
    };

    // Updated handler for order status cards to go directly to Status section
    const handleOrderStatusClick = (orderType) => {
        // Navigate to Orders tab with Inbound Orders and Status sub-tab
        setActiveTab("orders");
        
        setTimeout(() => {
            const event = new CustomEvent('adminNavigation', {
                detail: {
                    tab: "orders",
                    orderType: "inbound",
                    orderSubTab: "status",
                    filter: orderType
                }
            });
            window.dispatchEvent(event);
        }, 100);
        
        // Reset new orders count and stop blinking when submitted orders card is clicked
        if (orderType === "submitted") {
            console.log(`🔄 Resetting new orders count from ${newSubmittedCount} to 0`);
            setNewSubmittedCount(0);
            setIsBlinking(false);
        }
    };

    // Listen for navigation events in parent component
    useEffect(() => {
        const handleNavigation = (event) => {
            const { tab, orderType, orderSubTab } = event.detail;
            if (tab === "orders") {
                console.log("Navigation to:", tab, orderType, orderSubTab);
            }
        };

        window.addEventListener('adminNavigation', handleNavigation);
        return () => {
            window.removeEventListener('adminNavigation', handleNavigation);
        };
    }, []);

    // Manual refresh function (optional - if you want a refresh button)
    const handleManualRefresh = () => {
        fetchSummary();
    };
//////////////////////////////////////////////////////////////////////////////////////////////
    if (loading) {
        return (
            <div
                className={`min-h-screen flex items-center justify-center ${isDarkMode
                        ? "bg-gradient-to-br from-gray-900 to-gray-800"
                        : "bg-gradient-to-br from-gray-50 to-gray-100"
                } transition-colors duration-300`}
            >
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p
                        className={`text-lg font-medium ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                    >
                        Loading dashboard...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !summary) {
        return (
            <div
                className={`min-h-screen flex items-center justify-center ${
                    isDarkMode
                        ? "bg-gradient-to-br from-gray-900 to-gray-800"
                        : "bg-gradient-to-br from-gray-50 to-gray-100"
                } transition-colors duration-300`}
            >
                <div className="text-center max-w-md mx-4">
                    <div className="text-red-500 text-4xl mb-4">⚠️</div>
                    <h2
                        className={`text-xl font-semibold ${
                            isDarkMode ? "text-white" : "text-gray-900"
                        } mb-2`}
                    >
                        Unable to load data
                    </h2>
                    <p
                        className={`${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                        } mb-6`}
                    >
                        {error || "Please check your connection and try again."}
                    </p>
                    <button
                        onClick={fetchSummary}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const statCards = [
        {
            title: "Total Clients",
            value: summary?.totalClients || 0,
            icon: UsersIcon,
            color: "bg-blue-500",
            tab: "clients",
        },
        {
            title: "Total Products",
            value: summary?.totalProducts || 0,
            icon: CubeIcon,
            color: "bg-green-500",
            tab: "products",
        },
        {
            title: "Total Categories",
            value: summary?.totalCategories || 0,
            icon: CollectionIcon,
            color: "bg-pink-500",
            tab: "products",
        },
        {
            title: "Total Orders",
            value: summary?.totalOrders || 0,
            icon: ShoppingCartIcon,
            color: "bg-purple-500",
            tab: "orders",
            onClick: () => handleOrderStatusClick("all")
        },
        {
            title: "Draft Orders",
            value: summary?.draftOrders || 0,
            icon: DocumentTextIcon,
            color: "bg-yellow-500",
            tab: "orders",
            onClick: () => handleOrderStatusClick("drafts")
        },
        {
            title: "Submitted Orders",
            value: summary?.submittedOrders || 0, // Show actual submitted orders count
            icon: DocumentReportIcon,
            color: "bg-indigo-500",
            tab: "orders",
            onClick: () => handleOrderStatusClick("submitted"),
            blinking: isBlinking && newSubmittedCount > 0,
            hasNew: newSubmittedCount > 0,
            newCount: newSubmittedCount
        },
        {
            title: "Total Suppliers",
            value: summary?.totalSuppliers || 0,
            icon: TruckIcon,
            color: "bg-orange-500",
            tab: "suppliers",
        },
        {
            title: "Low Stock Alerts",
            value: summary?.lowStockProducts?.length || 0,
            icon: ExclamationIcon,
            color: "bg-red-500",
            tab: "products",
            alert: summary?.lowStockProducts?.length > 0
        },
    ];

    return (
        <div
            className={`min-h-screen ${
                isDarkMode
                    ? "bg-gradient-to-br from-gray-900 to-gray-800"
                    : "bg-gradient-to-br from-gray-50 to-gray-100"
            } transition-colors duration-300 p-4 sm:p-6`}
        >
            {/* Header */}
            <header className="mb-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <h1
                            className={`text-2xl sm:text-3xl font-bold ${
                                isDarkMode ? "text-white" : "text-gray-900"
                            } mb-1`}
                        >
                            Welcome back, {user?.name}
                        </h1>
                        <p
                            className={
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                            }
                        >
                            Here's what's happening with your store today
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {newSubmittedCount > 0 && (
                            <div className={`px-4 py-2 rounded-lg ${
                                isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                            }`}>
                                <span className="font-semibold">{newSubmittedCount} new order{newSubmittedCount > 1 ? 's' : ''} received!</span>
                            </div>
                        )}
                        {/* Optional: Add a manual refresh button if needed */}
                        <button
                            onClick={handleManualRefresh}
                            className={`p-2 rounded-lg ${
                                isDarkMode 
                                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            } transition-colors duration-200`}
                            title="Refresh data"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
                {statCards.map((stat, index) => (
                    <div
                        key={index}
                        onClick={stat.onClick || (() => handleTabClick(stat.tab))}
                        className={`cursor-pointer rounded-xl shadow-sm 
            transition-all duration-300 p-6 group transform 
            hover:scale-105 hover:shadow-lg relative border-2
            ${isDarkMode
                                ? "bg-gray-800 hover:bg-gray-700 border-gray-600"
                                : "bg-white hover:bg-gray-50 border-gray-200"
                            } 
            ${stat.alert ? '!border-red-500' : ''}
            ${stat.blinking ? 'blinking-card' : ''}`}
                    >
                        {/* New Order Badge */}
                        {stat.hasNew && (
                            <div className="new-order-badge">
                                {stat.newCount}
                            </div>
                        )}

                        {/* Low Stock Alert Badge */}
                        {stat.alert && !stat.hasNew && (
                            <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                                !
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div>
                                <p
                                    className={`text-sm font-medium ${isDarkMode
                                        ? "text-gray-400"
                                        : "text-gray-600"
                                        } mb-1`}
                                >
                                    {stat.title}
                                </p>
                                <p
                                    className={`text-2xl font-bold ${isDarkMode
                                        ? "text-white"
                                        : "text-gray-900"
                                        }`}
                                >
                                    {stat.value}
                                    {stat.hasNew && (
                                        <span className="text-sm text-red-500 ml-1">+{stat.newCount}</span>
                                    )}
                                </p>
                                {stat.hasNew && (
                                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                        {stat.newCount} new order{stat.newCount > 1 ? 's' : ''} received!
                                    </p>
                                )}
                            </div>
                            <div
                                className={`p-3 rounded-lg ${stat.color} text-white`}
                            >
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                        <div
                            className={`mt-4 h-1 rounded-full overflow-hidden ${isDarkMode ? "bg-gray-700" : "bg-gray-100"
                                }`}
                        >
                            <div
                                className={`h-full ${stat.color} transition-all duration-1000`}
                                style={{
                                    width: `${Math.min(
                                        (stat.value / 50) * 100,
                                        100
                                    )}%`,
                                }}
                            ></div>
                        </div>
                    </div>
                ))}
            </section>

            {/* Rest of your component remains the same */}
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-8">
                    {/* Recent Orders */}
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h2
                                className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"
                                    }`}
                            >
                                Recent Orders
                            </h2>
                            <button
                                onClick={() => handleOrderStatusClick("all")}
                                className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                                View all
                            </button>
                        </div>
                        <div
                            className={`rounded-xl shadow-sm overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"
                                }`}
                        >
                            <table className="min-w-full text-sm">
                                <thead
                                    className={`${isDarkMode
                                            ? "bg-gray-700 text-gray-300"
                                            : "bg-gray-100 text-gray-700"
                                        }`}
                                >
                                    <tr>
                                        <th className="px-4 py-2 text-left">Order #</th>
                                        <th className="px-4 py-2 text-left">Type</th>
                                        <th className="px-4 py-2 text-left">Client/Supplier</th>
                                        <th className="px-4 py-2 text-left">Status</th>
                                        <th className="px-4 py-2 text-left">Items</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.recentOrders?.slice(0, 5).map((order) => (
                                        <tr
                                            key={order.id}
                                            className={`${isDarkMode
                                                    ? "border-gray-700 hover:bg-gray-700"
                                                    : "border-gray-200 hover:bg-gray-50"
                                                } border-t transition-colors duration-150 cursor-pointer`}
                                            onClick={() =>
                                                handleOrderStatusClick(
                                                    order.status === "DRAFT"
                                                        ? "drafts"
                                                        : order.status === "SUBMITTED"
                                                            ? "submitted"
                                                            : "all"
                                                )
                                            }
                                        >
                                            <td
                                                className={`px-4 py-2 ${isDarkMode ? "text-gray-200" : "text-gray-900"
                                                    }`}
                                            >
                                                {order.orderNumber}
                                            </td>
                                            <td className="px-4 py-2">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs ${order.type === "inbound"
                                                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                                            : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                                        }`}
                                                >
                                                    {order.type}
                                                </span>
                                            </td>
                                            <td
                                                className={`px-4 py-2 ${isDarkMode ? "text-gray-200" : "text-gray-900"
                                                    }`}
                                            >
                                                {order.client?.name || order.supplier?.name || "—"}
                                            </td>
                                            <td className="px-4 py-2">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs ${order.status === "SUBMITTED"
                                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                            : order.status === "DRAFT"
                                                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                                        }`}
                                                >
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td
                                                className={`px-4 py-2 font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"
                                                    }`}
                                            >
                                                {order.items?.length || 0}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Low Stock Alerts */}
                    {summary.lowStockProducts && summary.lowStockProducts.length > 0 && (
                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <h2
                                    className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"
                                        }`}
                                >
                                    Low Stock Alerts
                                </h2>
                                <button
                                    onClick={() => handleTabClick("products")}
                                    className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                >
                                    View all
                                </button>
                            </div>
                            <div
                                className={`rounded-xl shadow-sm overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"
                                    }`}
                            >
                                <table className="min-w-full text-sm">
                                    <thead
                                        className={`${isDarkMode
                                                ? "bg-red-900 text-red-200"
                                                : "bg-red-100 text-red-800"
                                            }`}
                                    >
                                        <tr>
                                            <th className="px-4 py-2 text-left">Product</th>
                                            <th className="px-4 py-2 text-left">Current Stock</th>
                                            <th className="px-4 py-2 text-left">Min Required</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.lowStockProducts.slice(0, 5).map((product) => (
                                            <tr
                                                key={product.id}
                                                className={`${isDarkMode
                                                        ? "border-gray-700 hover:bg-gray-700"
                                                        : "border-gray-200 hover:bg-gray-50"
                                                    } border-t transition-colors duration-150`}
                                            >
                                                <td
                                                    className={`px-4 py-2 ${isDarkMode ? "text-gray-200" : "text-gray-900"
                                                        }`}
                                                >
                                                    {product.name}
                                                </td>
                                                <td className="px-4 py-2 text-red-600 dark:text-red-400 font-medium">
                                                    {product.quantity || 0}
                                                </td>
                                                <td
                                                    className={`px-4 py-2 ${isDarkMode ? "text-gray-200" : "text-gray-900"
                                                        }`}
                                                >
                                                    {product.minStockLevel || 10}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                    {/* Top Products */}
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h2
                                className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"
                                    }`}
                            >
                                Top Products (last 7 days)
                            </h2>
                            <button
                                onClick={() => handleTabClick("products")}
                                className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                                View all
                            </button>
                        </div>
                        <div
                            className={`rounded-xl shadow-sm overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"
                                }`}
                        >
                            <table className="min-w-full text-sm">
                                <thead
                                    className={`${isDarkMode
                                            ? "bg-gray-700 text-gray-300"
                                            : "bg-gray-100 text-gray-700"
                                        }`}
                                >
                                    <tr>
                                        <th className="px-4 py-2 text-left">Product</th>
                                        <th className="px-4 py-2 text-left">Qty Sold</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.topProducts?.map((product) => (
                                        <tr
                                            key={product.id}
                                            className={`${isDarkMode
                                                    ? "border-gray-700 hover:bg-gray-700"
                                                    : "border-gray-200 hover:bg-gray-50"
                                                } border-t transition-colors duration-150`}
                                        >
                                            <td
                                                className={`px-4 py-2 ${isDarkMode ? "text-gray-200" : "text-gray-900"
                                                    }`}
                                            >
                                                {product.name}
                                            </td>
                                            <td
                                                className={`px-4 py-2 font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"
                                                    }`}
                                            >
                                                {product.qty}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AdminLanding;