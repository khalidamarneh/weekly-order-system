// frontend/src/components/admin/Inboun_Invoices/InboundInvLanding.jsx
import React, { useState, useEffect } from 'react';
import {
    DocumentTextIcon,
    DocumentIcon,
    ClipboardListIcon,
    ViewListIcon,
    TruckIcon,
    CurrencyDollarIcon,
    ChartPieIcon,
    PlusIcon,
    ArrowRightIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationIcon,
    ChevronRightIcon,
    ChevronDownIcon
} from '@heroicons/react/outline';
import OutboundInvoiceFromCatalog from './OutboundInvoiceFromCatalog';
import InvoiceFromOrder from './InvoiceFromOrder';
import InvoiceHistory from './InvoiceHistory'; // You'll need to create this

import api from '../../../services/api';

const InboundInvLanding = ({ isDarkMode = false, activeSubTab = 'dashboard', setActiveSubTab }) => {
    const [stats, setStats] = useState({
        totalInvoices: 0,
        pendingInvoices: 0,
        paidInvoices: 0,
        overdueInvoices: 0,
        totalAmount: 0,
        pendingAmount: 0
    });
    

    const [recentInvoices, setRecentInvoices] = useState([]);
    const [allInvoices, setAllInvoices] = useState([]);
    const [showAllInvoices, setShowAllInvoices] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showCreateDropdown, setShowCreateDropdown] = useState(false);
    

    // Internal state fallback
    const [internalActiveTab, setInternalActiveTab] = useState('dashboard');
    
    // Determine navigation mode
    const isUsingMainNavigation = typeof setActiveSubTab === 'function';
    const currentActiveTab = isUsingMainNavigation ? (activeSubTab || 'dashboard') : internalActiveTab;

    // Sync internal state with props when using main navigation
    useEffect(() => {
        if (isUsingMainNavigation && activeSubTab) {
            setInternalActiveTab(activeSubTab);
        }
    }, [activeSubTab, isUsingMainNavigation]);

    const handleTabChange = (tabId) => {
        if (isUsingMainNavigation) {
            setActiveSubTab(tabId);
        } else {
            setInternalActiveTab(tabId);
        }
        setShowCreateDropdown(false);
    };

    // Load real invoice data from available API endpoints
    useEffect(() => {
        const loadRealData = async () => {
            setLoading(true);
            try {
                // Load all invoices to calculate stats and get recent ones
                const invoicesResponse = await api.get('/api/outbound-invoices');
                const allInvoicesData = invoicesResponse.data || [];
                setAllInvoices(allInvoicesData);

                // Calculate stats from the invoice data
                const totalInvoices = allInvoicesData.length;
                const pendingInvoices = allInvoicesData.filter(inv => 
                    inv.paymentStatus === 'PENDING' || inv.status === 'DRAFT'
                ).length;
                const paidInvoices = allInvoicesData.filter(inv => 
                    inv.paymentStatus === 'PAID'
                ).length;
                const overdueInvoices = allInvoicesData.filter(inv => 
                    inv.paymentStatus === 'OVERDUE'
                ).length;
                
                const totalAmount = allInvoicesData.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
                const pendingAmount = allInvoicesData
                    .filter(inv => inv.paymentStatus === 'PENDING' || inv.status === 'DRAFT')
                    .reduce((sum, inv) => sum + (inv.balanceDue || inv.totalAmount || 0), 0);

                setStats({
                    totalInvoices,
                    pendingInvoices,
                    paidInvoices,
                    overdueInvoices,
                    totalAmount,
                    pendingAmount,
                    // Additional calculated stats for the sidebar
                    thisMonthInvoices: allInvoicesData.filter(inv => {
                        const invoiceDate = new Date(inv.createdAt);
                        const now = new Date();
                        return invoiceDate.getMonth() === now.getMonth() && 
                               invoiceDate.getFullYear() === now.getFullYear();
                    }).length,
                    averageAmount: totalInvoices > 0 ? totalAmount / totalInvoices : 0,
                    collectionRate: totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0
                });

                // Set recent invoices (last 5)
                setRecentInvoices(allInvoicesData.slice(0, 5));

            } catch (error) {
                console.error('Error loading invoice data:', error);
                // Fallback to empty data if API fails
                setStats({
                    totalInvoices: 0,
                    pendingInvoices: 0,
                    paidInvoices: 0,
                    overdueInvoices: 0,
                    totalAmount: 0,
                    pendingAmount: 0,
                    thisMonthInvoices: 0,
                    averageAmount: 0,
                    collectionRate: 0
                });
                setRecentInvoices([]);
                setAllInvoices([]);
            } finally {
                setLoading(false);
            }
        };

        loadRealData();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'Invalid Date';
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            paid: {
                color: 'bg-green-100 text-green-800 border-green-200',
                darkColor: 'bg-green-900 text-green-200 border-green-700',
                icon: CheckCircleIcon,
                text: 'Paid'
            },
            PAID: {
                color: 'bg-green-100 text-green-800 border-green-200',
                darkColor: 'bg-green-900 text-green-200 border-green-700',
                icon: CheckCircleIcon,
                text: 'Paid'
            },
            pending: {
                color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                darkColor: 'bg-yellow-900 text-yellow-200 border-yellow-700',
                icon: ClockIcon,
                text: 'Pending'
            },
            PENDING: {
                color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                darkColor: 'bg-yellow-900 text-yellow-200 border-yellow-700',
                icon: ClockIcon,
                text: 'Pending'
            },
            DRAFT: {
                color: 'bg-gray-100 text-gray-800 border-gray-200',
                darkColor: 'bg-gray-900 text-gray-200 border-gray-700',
                icon: ClockIcon,
                text: 'Draft'
            },
            SENT: {
                color: 'bg-blue-100 text-blue-800 border-blue-200',
                darkColor: 'bg-blue-900 text-blue-200 border-blue-700',
                icon: ClockIcon,
                text: 'Sent'
            },
            overdue: {
                color: 'bg-red-100 text-red-800 border-red-200',
                darkColor: 'bg-red-900 text-red-200 border-red-700',
                icon: ExclamationIcon,
                text: 'Overdue'
            },
            OVERDUE: {
                color: 'bg-red-100 text-red-800 border-red-200',
                darkColor: 'bg-red-900 text-red-200 border-red-700',
                icon: ExclamationIcon,
                text: 'Overdue'
            },
            PARTIALLY_PAID: {
                color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                darkColor: 'bg-yellow-900 text-yellow-200 border-yellow-700',
                icon: ClockIcon,
                text: 'Partial'
            }
        };

        const config = statusConfig[status] || statusConfig.pending;
        const IconComponent = config.icon;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                isDarkMode ? config.darkColor : config.color
            }`}>
                <IconComponent className="h-3 w-3 mr-1" />
                {config.text}
            </span>
        );
    };

    const featureCards = [
        {
            id: 'csv',
            title: 'Start From CSV',
            description: 'Import and process invoices from CSV files with bulk operations',
            icon: DocumentIcon,
            color: 'from-blue-500 to-blue-600',
            stats: 'Process 100+ invoices',
            action: 'Upload CSV'
        },
        {
            id: 'orders',
        title: 'Start From InBound Orders',
        description: 'Generate invoices automatically from completed inbound orders',
        icon: ClipboardListIcon,
        color: 'from-green-500 to-green-600',
        stats: '25 orders ready',
        action: 'View Orders'
    
        },
        {
            id: 'catalog',
            title: 'Start From Catalog',
            description: 'Create invoices directly from product catalog with custom pricing',
            icon: ViewListIcon,
            color: 'from-purple-500 to-purple-600',
            stats: '500+ products',
            action: 'Browse Catalog'
        },

        {
            id: 'history',
            title: 'Invoice History',
            description: 'View and manage all invoice history and past transactions',
            icon: DocumentTextIcon,
            color: 'from-indigo-500 to-indigo-600',
            stats: `${stats.totalInvoices || 0} invoices`,
            action: 'View History'
        },

        {
            id: 'shipment',
            title: 'Shipment Tracking/Delivery',
            description: 'Track shipments and manage delivery status for all invoices',
            icon: TruckIcon,
            color: 'from-orange-500 to-orange-600',
            stats: '15 in transit',
            action: 'Track Shipments'
        },
        {
            id: 'payments',
            title: 'Payments',
            description: 'Manage invoice payments, payment tracking, and reconciliation',
            icon: CurrencyDollarIcon,
            color: 'from-emerald-500 to-emerald-600',
            stats: `${formatCurrency(stats.pendingAmount)} pending`,
            action: 'View Payments'
        },
        {
            id: 'analytics',
            title: 'Analytics/Reports',
            description: 'Comprehensive analytics and reporting for invoice performance',
            icon: ChartPieIcon,
            color: 'from-indigo-500 to-indigo-600',
            stats: 'Monthly reports',
            action: 'View Analytics'
        }
    ];

    const StatCard = ({ title, value, subtitle, icon: Icon, trend, color }) => (
        <div className={`p-6 rounded-xl border transition-all duration-300 hover:shadow-lg ${
            isDarkMode 
                ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                : 'bg-white border-gray-200 hover:border-gray-300'
        }`}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {title}
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {value}
                    </p>
                    {subtitle && (
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                            {subtitle}
                        </p>
                    )}
                    {trend && (
                        <p className={`text-xs mt-1 ${
                            trend > 0 
                                ? 'text-green-600' 
                                : trend < 0 
                                    ? 'text-red-600' 
                                    : 'text-gray-500'
                            }`}>
                            {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-r ${color}`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
        </div>
    );

    const FeatureCard = ({ feature }) => {
        const IconComponent = feature.icon;

        const handleClick = () => {
            handleTabChange(feature.id);
        };

        return (
            <div
                onClick={handleClick}
                className={`group cursor-pointer p-6 rounded-xl border transition-all duration-300 hover:shadow-xl ${isDarkMode
                        ? 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-750'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.color}`}>
                        <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <ChevronRightIcon className={`h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                </div>

                <h3 className={`font-semibold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {feature.title}
                </h3>

                <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {feature.description}
                </p>

                <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                        {feature.stats}
                    </span>
                    <button className={`text-sm font-medium flex items-center gap-1 ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                        }`}>
                        {feature.action}
                        <ArrowRightIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        );
    };

    const CreateInvoiceDropdown = () => (
        <div className="relative">
            <button
                onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
            >
                <PlusIcon className="h-5 w-5" />
                Create Invoice
                <ChevronDownIcon className="h-4 w-4" />
            </button>

            {showCreateDropdown && (
                <div className={`absolute right-0 mt-2 w-64 rounded-lg shadow-xl z-50 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                    <div className="py-2">
                        <button
                            onClick={() => handleTabChange('catalog')}
                            className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${isDarkMode
                                    ? 'hover:bg-gray-700 text-white'
                                    : 'hover:bg-gray-100 text-gray-900'
                                }`}
                        >
                            <ViewListIcon className="h-5 w-5 text-purple-500" />
                            <div>
                                <div className="font-medium">From Catalog</div>
                                <div className="text-sm text-gray-500">Use product catalog</div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleTabChange('csv')}
                            className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${isDarkMode
                                ? 'hover:bg-gray-700 text-white'
                                : 'hover:bg-gray-100 text-gray-900'
                                }`}
                        >
                            <DocumentIcon className="h-5 w-5 text-blue-500" />
                            <div>
                                <div className="font-medium">From CSV</div>
                                <div className="text-sm text-gray-500">Bulk import</div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleTabChange('orders')}
                            className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${isDarkMode
                                    ? 'hover:bg-gray-700 text-white'
                                    : 'hover:bg-gray-100 text-gray-900'
                                }`}
                        >
                            <ClipboardListIcon className="h-5 w-5 text-green-500" />
                            <div>
                                <div className="font-medium">From Orders</div>
                                <div className="text-sm text-gray-500">Inbound orders</div>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

const renderContent = () => {
    switch (currentActiveTab) {
        case 'catalog':
            return <OutboundInvoiceFromCatalog isDarkMode={isDarkMode} onNavigate={handleTabChange} />;
        case 'orders':
  return (
    <InvoiceFromOrder 
      isDarkMode={isDarkMode} 
      setActiveSubTab={handleTabChange}
      onNavigate={handleTabChange}
      onViewInvoiceHistory={() => handleTabChange('history')}
    />
  
            );
        case 'history':
            return <InvoiceHistory isDarkMode={isDarkMode} setActiveTab={handleTabChange} />;
        case 'csv':
            return (
                <div className={`p-8 rounded-xl text-center ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                    }`}>
                    <DocumentIcon className="h-16 w-16 mx-auto mb-4 text-blue-500" />
                    <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        CSV Invoice Import
                    </h2>
                    <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Import and process invoices from CSV files (Coming Soon)
                    </p>
                    <button
                        onClick={() => handleTabChange('dashboard')}
                        className={`px-6 py-3 rounded-lg font-medium ${isDarkMode
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        Back to Dashboard
                    </button>
                </div>
            );
        case 'dashboard':
        default:
            return renderDashboard();
    }
};

    const handleViewAllInvoices = () => {
        setShowAllInvoices(!showAllInvoices);
    };

    const getDisplayInvoices = () => {
        return showAllInvoices ? allInvoices : recentInvoices;
    };

    const renderDashboard = () => {
        if (loading) {
            return (
                <div className={`min-h-screen flex items-center justify-center ${
                    isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
                }`}>
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Loading Invoice Dashboard...
                        </p>
                    </div>
                </div>
            );
        }

        const displayInvoices = getDisplayInvoices();

        return (
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Outbound Invoices Dashboard
                            </h1>
                            <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Manage and track all outbound customer invoices in one place
                            </p>
                        </div>
                        <CreateInvoiceDropdown />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        title="Total Invoices"
                        value={stats.totalInvoices || 0}
                        subtitle="All time"
                        icon={DocumentTextIcon}
                        trend={12}
                        color="from-blue-500 to-blue-600"
                    />
                    <StatCard
                        title="Pending Invoices"
                        value={stats.pendingInvoices || 0}
                        subtitle="Awaiting payment"
                        icon={ClockIcon}
                        trend={-5}
                        color="from-yellow-500 to-yellow-600"
                    />
                    <StatCard
                        title="Paid Invoices"
                        value={stats.paidInvoices || 0}
                        subtitle="Successfully processed"
                        icon={CheckCircleIcon}
                        trend={8}
                        color="from-green-500 to-green-600"
                    />
                    <StatCard
                        title="Overdue Invoices"
                        value={stats.overdueInvoices || 0}
                        subtitle="Past due date"
                        icon={ExclamationIcon}
                        trend={2}
                        color="from-red-500 to-red-600"
                    />
                    <StatCard
                        title="Total Amount"
                        value={formatCurrency(stats.totalAmount)}
                        subtitle="All invoices"
                        icon={CurrencyDollarIcon}
                        trend={15}
                        color="from-emerald-500 to-emerald-600"
                    />
                    <StatCard
                        title="Pending Amount"
                        value={formatCurrency(stats.pendingAmount)}
                        subtitle="Awaiting collection"
                        icon={CurrencyDollarIcon}
                        trend={-3}
                        color="from-orange-500 to-orange-600"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Features Section - 2/3 width */}
                    <div className="lg:col-span-2">
                        <div className="mb-6">
                            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Quick Actions
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {featureCards.map((feature) => (
                                    <FeatureCard key={feature.id} feature={feature} />
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity Section */}
                        <div className={`rounded-xl border ${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                            <div className={`p-6 border-b ${
                                isDarkMode ? 'border-gray-700' : 'border-gray-200'
                            }`}>
                                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {showAllInvoices ? 'All Invoices' : 'Recent Invoices'}
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {displayInvoices.length > 0 ? (
                                        displayInvoices.map((invoice) => (
                                            <div 
                                                key={invoice.id}
                                                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                                                    isDarkMode 
                                                        ? 'border-gray-700 hover:bg-gray-750' 
                                                        : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className={`p-2 rounded-lg ${
                                                        isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                                    }`}>
                                                        <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                                                    </div>
                                                    <div>
                                                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                            {invoice.invoiceNumber || `INV-${invoice.id}`}
                                                        </p>
                                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            {invoice.customer?.name || invoice.customerName || 'Unknown Customer'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        {formatCurrency(invoice.totalAmount)}
                                                    </p>
                                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        Due {formatDate(invoice.dueDate)}
                                                    </p>
                                                </div>
                                                <div>
                                                    {getStatusBadge(invoice.status || invoice.paymentStatus)}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No invoices found</p>
                                            <p className="text-sm mt-1">Create your first invoice to get started</p>
                                        </div>
                                    )}
                                </div>
                                {allInvoices.length > 5 && (
                                    <button 
                                        onClick={handleViewAllInvoices}
                                        className={`w-full mt-4 py-2 text-center rounded-lg border transition-colors ${
                                            isDarkMode 
                                                ? 'border-gray-600 text-gray-400 hover:bg-gray-750 hover:text-gray-300' 
                                                : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    >
                                        {showAllInvoices ? 'Show Less Invoices' : `View All Invoices (${allInvoices.length})`}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - 1/3 width */}
                    <div className="space-y-6">
                        {/* Quick Stats */}
                        <div className={`rounded-xl border p-6 ${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                            <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Invoice Summary
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>This Month</span>
                                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {stats.thisMonthInvoices || 0} invoices
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Avg. Amount</span>
                                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {formatCurrency(stats.averageAmount)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Collection Rate</span>
                                    <span className="font-medium text-green-600">
                                        {stats.collectionRate ? `${Math.round(stats.collectionRate)}%` : '0%'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Upcoming Deadlines */}
                        <div className={`rounded-xl border p-6 ${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                            <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Upcoming Deadlines
                            </h3>
                            <div className="space-y-3">
                                {allInvoices.filter(inv => 
                                    inv.dueDate && new Date(inv.dueDate) > new Date() && 
                                    (inv.status === 'PENDING' || inv.status === 'DRAFT' || inv.paymentStatus === 'PENDING')
                                ).slice(0, 2).map((invoice, index) => (
                                    <div key={invoice.id} className={`p-3 rounded-lg border ${
                                        isDarkMode ? 'border-yellow-700 bg-yellow-900/20' : 'border-yellow-200 bg-yellow-50'
                                    }`}>
                                        <p className={`text-sm font-medium ${isDarkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                                            {invoice.invoiceNumber || `INV-${invoice.id}`} - {invoice.customer?.name || invoice.customerName}
                                        </p>
                                        <p className={`text-xs ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                                            Due {formatDate(invoice.dueDate)} - {formatCurrency(invoice.totalAmount)}
                                        </p>
                                    </div>
                                ))}
                                {allInvoices.filter(inv => 
                                    inv.dueDate && new Date(inv.dueDate) > new Date() && 
                                    (inv.status === 'PENDING' || inv.status === 'DRAFT' || inv.paymentStatus === 'PENDING')
                                ).length === 0 && (
                                    <p className={`text-sm text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        No upcoming deadlines
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className={`rounded-xl border p-6 ${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                            <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Quick Actions
                            </h3>
                            <div className="space-y-2">
                                <button 
                                    onClick={() => setShowCreateDropdown(true)}
                                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                                        isDarkMode 
                                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                                >
                                    Create New Invoice
                                </button>
                                <button className={`w-full text-left p-3 rounded-lg transition-colors ${
                                    isDarkMode 
                                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}>
                                    Export Invoice Report
                                </button>
                                <button className={`w-full text-left p-3 rounded-lg transition-colors ${
                                    isDarkMode 
                                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}>
                                    Send Payment Reminders
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300 p-6`}>
            <div className="max-w-7xl mx-auto">
                {/* Show header only when not on dashboard */}
                {currentActiveTab !== 'dashboard' && (
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className={`text-2xl sm:text-3xl font-bold ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                } mb-2`}>
                                    {featureCards.find(tab => tab.id === currentActiveTab)?.title || 'Invoice Management'}
                                </h1>
                                <p className={`text-base ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    {featureCards.find(tab => tab.id === currentActiveTab)?.description || 'Manage invoice operations'}
                                </p>
                            </div>
                            <button
                                onClick={() => handleTabChange('dashboard')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    isDarkMode 
                                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                }`}
                            >
                                ← Back to Dashboard
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="rounded-lg">
                    {renderContent()}
                </div>
            </div>

            {/* Close dropdown when clicking outside */}
            {showCreateDropdown && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowCreateDropdown(false)}
                />
            )}
        </div>
    );
};

export default InboundInvLanding;