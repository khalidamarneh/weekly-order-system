import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import ProductManagement from "../components/admin/ProductManagement";
import ClientManagement from "../components/admin/ClientManagement";
import SupplierManagement from "../components/admin/SupplierManagement";
import SalesManagement from "../components/admin/sales/SalesManagement";
import SalesQuotationUnified from "../components/admin/sales/SalesQuotationUnified";
import ReportManagement from "../components/admin/ReportManagement";
import AdminLanding from "./AdminLanding";
import OrderControl from "../components/admin/inbound_orders/OrderControl";
import InboundOrderStatus from "../components/admin/inbound_orders/InboundOrderStatus";
import InboundInvLanding from "../components/admin/Inbound_Invoices/InboundInvLanding"; // We'll create this file
import OutboundInvoiceFromCatalog from "../components/admin/Inbound_Invoices/OutboundInvoiceFromCatalog"; // Add this import
import InvoiceFromOrder from "../components/admin/Inbound_Invoices/InvoiceFromOrder";
import InvoiceFromCsv from "../components/admin/Inbound_Invoices/InvoiceFromCsv";
import InvoiceAnalytics from '../components/admin/Inbound_Invoices/InvoiceAnalytics';
import { io } from "socket.io-client";
import socketService from "../services/socket";

import {
  CogIcon,
  ViewListIcon,
  UsersIcon,
  RefreshIcon,
  ChartBarIcon,
  TruckIcon,
  DocumentTextIcon,
  DocumentReportIcon,
  ShoppingCartIcon,
  AdjustmentsIcon,
  StatusOnlineIcon,
  ChipIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MenuIcon,
  XIcon,
  HomeIcon,
  ClockIcon,
  DocumentIcon,
  ClipboardListIcon,
  CurrencyDollarIcon,
  TruckIcon as TruckIconSolid,
  ChartPieIcon
} from "@heroicons/react/outline";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("landing");
  const [activeSubTab, setActiveSubTab] = useState("");
  const [activeOrderType, setActiveOrderType] = useState("");
  const [activeOrderSubTab, setActiveOrderSubTab] = useState("");
  const [activeInvoiceType, setActiveInvoiceType] = useState("");
  const [activeInvoiceSubTab, setActiveInvoiceSubTab] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    orders: false,
    inbound: false,
    outbound: false,
    sales: false,
    invoices: false,
    inboundInvoices: false,
    outboundInvoices: false
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileOrdersMenuOpen, setMobileOrdersMenuOpen] = useState(false);
  const [mobileSalesMenuOpen, setMobileSalesMenuOpen] = useState(false);
  const [mobileInvoicesMenuOpen, setMobileInvoicesMenuOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [showExitWarning, setShowExitWarning] = useState(false);
  // Update current date and time
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const date = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const time = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true 
      });
      setCurrentDateTime(`${date} • ${time}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Add this useEffect to Admin.jsx to handle the custom navigation
  useEffect(() => {
    const handleAdminNavigation = (event) => {
      const { tab, orderType, orderSubTab } = event.detail;
      if (tab === "orders") {
        handleTabChange(tab, "", orderType, orderSubTab);
      }
    };

    window.addEventListener('adminNavigation', handleAdminNavigation);
    return () => {
      window.removeEventListener('adminNavigation', handleAdminNavigation);
    };
  }, []);

  // Handle browser back button
  useEffect(() => {
    const handleBackButton = (event) => {
      if (activeTab !== "landing") {
        event.preventDefault();
        setShowExitWarning(true);
      }
    };

    window.addEventListener('popstate', handleBackButton);
    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [activeTab]);

  // Create socket connection once
// Create socket connection once (SECURE + COOKIE BASED)
const [socket, setSocket] = useState(null);

useEffect(() => {
  if (!user) return; // wait for auth

  const connectSocket = async () => {
    try {
      await socketService.connect();          // uses JWT cookie automatically
      await socketService.waitForConnection();
      await socketService.joinAdminRoom();    // auto join Admin room

      setSocket(socketService.getSocket());
    } catch (err) {
      console.error("Admin socket error:", err.message);
    }
  };

  connectSocket();
}, [user]);


  // Check system preference and load from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedMode !== null) {
      setIsDarkMode(savedMode === 'true');
    } else {
      setIsDarkMode(systemPrefersDark);
    }
  }, []);

  // Apply dark mode globally and save preference
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.style.backgroundColor = '#111827';
      document.body.style.backgroundColor = '#111827';
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = '#f9fafb';
      document.body.style.backgroundColor = '#f9fafb';
    }
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleTabChange = (tab, subTab = "", orderType = "", orderSubTab = "", invoiceType = "", invoiceSubTab = "") => {
    setActiveTab(tab);
    setActiveSubTab(subTab);
    setActiveOrderType(orderType);
    setActiveOrderSubTab(orderSubTab);
    setActiveInvoiceType(invoiceType);
    setActiveInvoiceSubTab(invoiceSubTab);
    setMobileMenuOpen(false);
    setMobileOrdersMenuOpen(false);
    setMobileSalesMenuOpen(false);
    setMobileInvoicesMenuOpen(false);

    // Auto-expand relevant sections when navigating
    if (tab === "orders") {
      setExpandedSections(prev => ({
        ...prev,
        orders: true,
        [orderType]: true
      }));
    } else if (tab === "sales") {
      setExpandedSections(prev => ({
        ...prev,
        sales: true
      }));
    } else if (tab === "invoices") {
      setExpandedSections(prev => ({
        ...prev,
        invoices: true,
        [invoiceType]: true
      }));
    }
  };

  const handleOrderNavigation = (orderType, orderSubTab = "control") => {
    handleTabChange("orders", "", orderType, orderSubTab);
  };

  const handleSalesNavigation = (salesSubTab = "management") => {
    handleTabChange("sales", salesSubTab, "", "", salesSubTab);
  };

  const handleInvoiceNavigation = (invoiceType, invoiceSubTab = "landing") => {
    handleTabChange("invoices", "", "", "", invoiceType, invoiceSubTab);
  };

  const handleHomeNavigation = () => {
    if (activeTab !== "landing") {
      handleTabChange("landing");
    }
  };

  const handleBackNavigation = () => {
    if (activeTab !== "landing") {
      handleTabChange("landing");
    } else {
      setShowExitWarning(true);
    }
  };

  const handleExitConfirm = () => {
    logout();
    setShowExitWarning(false);
  };

  const handleExitCancel = () => {
    setShowExitWarning(false);
  };

  const isTabActive = (tab, subTab = "", orderType = "", orderSubTab = "", invoiceType = "", invoiceSubTab = "") => {
    return activeTab === tab && 
           activeSubTab === subTab && 
           activeOrderType === orderType && 
           activeOrderSubTab === orderSubTab &&
           activeInvoiceType === invoiceType &&
           activeInvoiceSubTab === invoiceSubTab;
  };

  const renderOrdersContent = () => {
    if (activeOrderType === "inbound") {
      switch (activeOrderSubTab) {
        case "control":
          return <OrderControl isDarkMode={isDarkMode} />;
        case "status":
          return <InboundOrderStatus isDarkMode={isDarkMode} />;
        case "process":
          return (
            <div className={`p-8 text-center rounded-lg ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}>
              <ChipIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className={`text-lg font-semibold mb-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}>Inbound Orders Process</h3>
              <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                Advanced order processing features coming soon
              </p>
            </div>
          );
        default:
          return <OrderControl isDarkMode={isDarkMode} />;
      }
    } else if (activeOrderType === "outbound") {
      return (
        <div className={`p-8 text-center rounded-lg ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}>
          <TruckIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className={`text-lg font-semibold mb-2 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}>Outbound Orders Management</h3>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
            Outbound orders system coming soon
          </p>
          <div className={`mt-4 text-sm ${
            isDarkMode ? "text-gray-500" : "text-gray-400"
          }`}>
            Available: Control • Status • Process
          </div>
        </div>
      );
    }
    return (
      <div className={`p-8 text-center rounded-lg ${
        isDarkMode ? "bg-gray-800" : "bg-white"
      }`}>
        <ShoppingCartIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className={`text-lg font-semibold mb-2 ${
          isDarkMode ? "text-white" : "text-gray-900"
        }`}>Order Management</h3>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
          Select an order type to get started
        </p>
      </div>
    );
  };

  const renderSalesContent = () => {
    switch (activeSubTab) {
      case "management":
        return <SalesManagement isDarkMode={isDarkMode} />;
      case "quotations":
        return <SalesQuotationUnified isDarkMode={isDarkMode} />;
      default:
        return <SalesManagement isDarkMode={isDarkMode} activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />;
    }
  };

 const renderInvoicesContent = () => {
  if (activeInvoiceType === "outbound") {
    switch (activeInvoiceSubTab) {
      case "landing":
        return <InboundInvLanding isDarkMode={isDarkMode} activeSubTab={activeInvoiceSubTab} setActiveSubTab={(tab) => handleInvoiceNavigation("outbound", tab)} />;
      case "csv":
        return (
          <InvoiceFromCsv 
            isDarkMode={isDarkMode} 
            setActiveSubTab={(tab) => handleInvoiceNavigation("outbound", tab)}
            onNavigate={(tab) => handleInvoiceNavigation("outbound", tab)}
            onViewInvoiceHistory={() => handleInvoiceNavigation("outbound", "history")}
          />
        );
      case 'orders':
        return (
          <InvoiceFromOrder 
            isDarkMode={isDarkMode} 
            setActiveSubTab={(tab) => handleInvoiceNavigation("outbound", tab)}
            onNavigate={(tab) => handleInvoiceNavigation("outbound", tab)}
            onViewInvoiceHistory={() => handleInvoiceNavigation("outbound", "history")}
          />
        );;
      case "shipment":
        return (
          <div className={`p-8 text-center rounded-lg ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}>
            <TruckIconSolid className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className={`text-lg font-semibold mb-2 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>Shipment Tracking/Delivery</h3>
            <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
              Track shipments and manage delivery status
            </p>
          </div>
        );
      case "payments":
        return (
          <div className={`p-8 text-center rounded-lg ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}>
            <CurrencyDollarIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className={`text-lg font-semibold mb-2 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>Payments</h3>
            <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
              Manage invoice payments and payment tracking
            </p>
          </div>
        );
      case "analytics":
  return (
    <InvoiceAnalytics 
      isDarkMode={isDarkMode} 
      setActiveSubTab={(tab) => handleInvoiceNavigation("outbound", tab)}
      onNavigate={(tab) => handleInvoiceNavigation("outbound", tab)}
      onViewInvoiceHistory={() => handleInvoiceNavigation("outbound", "history")}
    />
  );
      default:
        return <InboundInvLanding isDarkMode={isDarkMode} activeSubTab={activeInvoiceSubTab} setActiveSubTab={(tab) => handleInvoiceNavigation("outbound", tab)} />;
    }
  } else if (activeInvoiceType === "inbound") {
    return (
      <div className={`p-8 text-center rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"
        }`}>
        <DocumentTextIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className={`text-lg font-semibold mb-2 ${
          isDarkMode ? "text-white" : "text-gray-900"
        }`}>Inbound Invoices</h3>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
          Inbound invoice management system coming soon
        </p>
      </div>
    );
  }
  return (
    <div className={`p-8 text-center rounded-lg ${
      isDarkMode ? "bg-gray-800" : "bg-white"
    }`}>
      <DocumentTextIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
      <h3 className={`text-lg font-semibold mb-2 ${
        isDarkMode ? "text-white" : "text-gray-900"
      }`}>Invoice Management</h3>
      <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
        Select an invoice type to get started
      </p>
    </div>
  );
};

  // Modern Compact Orders Sidebar Component
  const OrdersSidebar = () => (
    <div
      className={`w-56 rounded-lg shadow-lg border ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } h-screen pt-4`}
    >
      {/* Orders Header */}
      <div
        className={`p-4 border-b cursor-pointer ${
          isDarkMode ? "border-gray-700 hover:bg-gray-750" : "border-gray-200 hover:bg-gray-50"
        }`}
        onClick={() => toggleSection("orders")}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? "bg-blue-600" : "bg-blue-500"}`}>
              <ShoppingCartIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Orders
              </h3>
            </div>
          </div>

          {expandedSections.orders ? (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Orders Content */}
      {expandedSections.orders && (
        <div className="p-3 space-y-3">
          {/* Inbound Orders Section */}
          <div className={`rounded-md ${isDarkMode ? "bg-gray-750" : "bg-gray-50"}`}>
            <div
              className={`p-3 cursor-pointer ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              onClick={() => toggleSection("inbound")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${isDarkMode ? "bg-green-600" : "bg-green-500"}`}>
                    <ShoppingCartIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className={`font-semibold text-sm ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                    Inbound
                  </span>
                </div>

                {expandedSections.inbound ? (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Inbound Sub-options */}
            {expandedSections.inbound && (
              <div className="pl-3 pb-2 space-y-1">
                {[
                  { key: "control", label: "Control", icon: AdjustmentsIcon },
                  { key: "status", label: "Status", icon: StatusOnlineIcon },
                  { key: "process", label: "Process", icon: ChipIcon }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleOrderNavigation("inbound", item.key)}
                    className={`w-full text-left p-3 rounded flex items-center space-x-3 text-sm ${
                      activeOrderSubTab === item.key && activeOrderType === "inbound"
                        ? isDarkMode
                          ? "bg-green-700 text-white shadow-lg"
                          : "bg-green-100 text-green-800 shadow-md"
                        : isDarkMode
                        ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <item.icon
                      className={`h-5 w-5 ${
                        activeOrderSubTab === item.key && activeOrderType === "inbound"
                          ? "text-white"
                          : isDarkMode
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                    />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Outbound Orders Section */}
          <div className={`rounded-md ${isDarkMode ? "bg-gray-750" : "bg-gray-50"}`}>
            <div
              className={`p-3 cursor-pointer ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              onClick={() => toggleSection("outbound")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${isDarkMode ? "bg-blue-600" : "bg-blue-500"}`}>
                    <TruckIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className={`font-semibold text-sm ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                    Outbound
                  </span>
                </div>

                {expandedSections.outbound ? (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Outbound Sub-options */}
            {expandedSections.outbound && (
              <div className="pl-3 pb-2 space-y-1">
                {[
                  { key: "control", label: "Control", icon: AdjustmentsIcon },
                  { key: "status", label: "Status", icon: StatusOnlineIcon },
                  { key: "process", label: "Process", icon: ChipIcon }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleOrderNavigation("outbound", item.key)}
                    className={`w-full text-left p-3 rounded flex items-center space-x-3 text-sm ${
                      activeOrderSubTab === item.key && activeOrderType === "outbound"
                        ? isDarkMode
                          ? "bg-blue-700 text-white shadow-lg"
                          : "bg-blue-100 text-blue-800 shadow-md"
                        : isDarkMode
                        ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <item.icon
                      className={`h-5 w-5 ${
                        activeOrderSubTab === item.key && activeOrderType === "outbound"
                          ? "text-white"
                          : isDarkMode
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                    />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );

  // Modern Compact Sales Sidebar Component
  const SalesSidebar = () => (
    <div
      className={`w-56 rounded-lg shadow-lg border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } h-screen pt-4`}
    >
      {/* Sales Header */}
      <div
        className={`p-4 border-b cursor-pointer ${isDarkMode ? "border-gray-700 hover:bg-gray-750" : "border-gray-200 hover:bg-gray-50"
          }`}
        onClick={() => toggleSection("sales")}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? "bg-orange-600" : "bg-orange-500"}`}>
              <DocumentReportIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Sales
              </h3>
            </div>
          </div>

          {expandedSections.sales ? (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Sales Content */}
      {expandedSections.sales && (
        <div className="p-3 space-y-1">
          {[
            { key: "dashboard", label: "Sales Dashboard", icon: ChartBarIcon },
            { key: "quotations", label: "Create Quotation", icon: DocumentTextIcon },
            { key: "history", label: "Quotation History", icon: ClockIcon },
            { key: "analytics", label: "Sales Analytics", icon: ChartBarIcon },
            { key: "customers", label: "Customers", icon: UsersIcon }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => handleSalesNavigation(item.key)}
              className={`w-full text-left p-3 rounded flex items-center space-x-3 text-sm ${activeSubTab === item.key && activeTab === "sales"
                  ? isDarkMode
                    ? "bg-orange-700 text-white shadow-lg"
                    : "bg-orange-100 text-orange-800 shadow-md"
                  : isDarkMode
                    ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
            >
              <item.icon
                className={`h-5 w-5 ${activeSubTab === item.key && activeTab === "sales"
                    ? "text-white"
                    : isDarkMode
                      ? "text-gray-400"
                      : "text-gray-500"
                  }`}
              />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Modern Compact Invoices Sidebar Component
  const InvoicesSidebar = () => (
    <div
      className={`w-56 rounded-lg shadow-lg border ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } h-screen pt-4`}
    >
      {/* Invoices Header */}
      <div
        className={`p-4 border-b cursor-pointer ${
          isDarkMode ? "border-gray-700 hover:bg-gray-750" : "border-gray-200 hover:bg-gray-50"
        }`}
        onClick={() => toggleSection("invoices")}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? "bg-cyan-600" : "bg-cyan-500"}`}>
              <DocumentTextIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Invoices
              </h3>
            </div>
          </div>

          {expandedSections.invoices ? (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Invoices Content */}
      {expandedSections.invoices && (
        <div className="p-3 space-y-3">
          {/* Inbound Invoices Section */}
          <div className={`rounded-md ${isDarkMode ? "bg-gray-750" : "bg-gray-50"}`}>
            <div
              className={`p-3 cursor-pointer ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              onClick={() => toggleSection("inboundInvoices")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${isDarkMode ? "bg-purple-600" : "bg-purple-500"}`}>
                    <DocumentIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className={`font-semibold text-sm ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                    Inbound Invoices
                  </span>
                </div>

                {expandedSections.inboundInvoices ? (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Inbound Invoices Sub-options */}
            {expandedSections.inboundInvoices && (
              <div className="pl-3 pb-2 space-y-1">
                <button
                  onClick={() => handleInvoiceNavigation("inbound", "management")}
                  className={`w-full text-left p-3 rounded flex items-center space-x-3 text-sm ${
                    activeInvoiceType === "inbound"
                      ? isDarkMode
                        ? "bg-purple-700 text-white shadow-lg"
                        : "bg-purple-100 text-purple-800 shadow-md"
                      : isDarkMode
                      ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <AdjustmentsIcon className="h-5 w-5" />
                  <span className="font-medium">Management</span>
                </button>
              </div>
            )}
          </div>

          {/* Outbound Invoices Section */}
          <div className={`rounded-md ${isDarkMode ? "bg-gray-750" : "bg-gray-50"}`}>
            <div
              className={`p-3 cursor-pointer ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              onClick={() => toggleSection("outboundInvoices")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${isDarkMode ? "bg-cyan-600" : "bg-cyan-500"}`}>
                    <DocumentTextIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className={`font-semibold text-sm ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                    Outbound Invoices
                  </span>
                </div>

                {expandedSections.outboundInvoices ? (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Outbound Invoices Sub-options */}
            {expandedSections.outboundInvoices && (
              <div className="pl-3 pb-2 space-y-1">
                {[
                  { key: "landing", label: "Dashboard", icon: ChartBarIcon },
                  { key: "csv", label: "Start From CSV", icon: DocumentIcon },
                  { key: "orders", label: "Start From InBound Orders", icon: ClipboardListIcon },
                  { key: "catalog", label: "Start From Catalog", icon: ViewListIcon },
                  { key: "shipment", label: "Shipment Tracking", icon: TruckIconSolid },
                  { key: "payments", label: "Payments", icon: CurrencyDollarIcon },
                  { key: "analytics", label: "Analytics/Reports", icon: ChartPieIcon }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleInvoiceNavigation("outbound", item.key)}
                    className={`w-full text-left p-3 rounded flex items-center space-x-3 text-sm ${
                      activeInvoiceSubTab === item.key && activeInvoiceType === "outbound"
                        ? isDarkMode
                          ? "bg-cyan-700 text-white shadow-lg"
                          : "bg-cyan-100 text-cyan-800 shadow-md"
                        : isDarkMode
                        ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <item.icon
                      className={`h-5 w-5 ${
                        activeInvoiceSubTab === item.key && activeInvoiceType === "outbound"
                          ? "text-white"
                          : isDarkMode
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                    />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Mobile Orders Menu Component
  const MobileOrdersMenu = () => (
    <div className={`lg:hidden fixed inset-0 z-50 transform transition-transform duration-300 ${
      mobileOrdersMenuOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className={`absolute inset-0 bg-black bg-opacity-50`} onClick={() => setMobileOrdersMenuOpen(false)} />
      <div className={`absolute left-0 top-0 h-full w-64 shadow-2xl ${
        isDarkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Order Navigation
          </h2>
          <button
            onClick={() => setMobileOrdersMenuOpen(false)}
            className={`p-2 rounded-lg ${
              isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <OrdersSidebar />
        </div>
      </div>
    </div>
  );

  // Mobile Sales Menu Component
  const MobileSalesMenu = () => (
    <div className={`lg:hidden fixed inset-0 z-50 transform transition-transform duration-300 ${
      mobileSalesMenuOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className={`absolute inset-0 bg-black bg-opacity-50`} onClick={() => setMobileSalesMenuOpen(false)} />
      <div className={`absolute left-0 top-0 h-full w-64 shadow-2xl ${
        isDarkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Sales Navigation
          </h2>
          <button
            onClick={() => setMobileSalesMenuOpen(false)}
            className={`p-2 rounded-lg ${
              isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <SalesSidebar />
        </div>
      </div>
    </div>
  );

  // Mobile Invoices Menu Component
  const MobileInvoicesMenu = () => (
    <div className={`lg:hidden fixed inset-0 z-50 transform transition-transform duration-300 ${
      mobileInvoicesMenuOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className={`absolute inset-0 bg-black bg-opacity-50`} onClick={() => setMobileInvoicesMenuOpen(false)} />
      <div className={`absolute left-0 top-0 h-full w-64 shadow-2xl ${
        isDarkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Invoice Navigation
          </h2>
          <button
            onClick={() => setMobileInvoicesMenuOpen(false)}
            className={`p-2 rounded-lg ${
              isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <InvoicesSidebar />
        </div>
      </div>
    </div>
  );

  // Exit Warning Modal
  const ExitWarningModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`rounded-lg shadow-2xl p-6 max-w-sm w-full mx-4 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h3 className={`text-lg font-bold mb-2 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Exit Application?
        </h3>
        <p className={`mb-4 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Are you sure you want to exit the application? You will be logged out.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={handleExitCancel}
            className={`flex-1 py-2 px-4 rounded-lg font-medium ${
              isDarkMode 
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleExitConfirm}
            className="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );

  // Mobile Main Menu Component - Fixed scrolling with Home button
  const MobileMainMenu = () => (
    <div className={`lg:hidden fixed inset-0 z-50 transform transition-transform duration-300 ${
      mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className={`absolute inset-0 bg-black bg-opacity-50`} onClick={() => setMobileMenuOpen(false)} />
      <div className={`absolute left-0 top-0 h-full w-80 max-w-[85vw] shadow-2xl flex flex-col ${
        isDarkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        {/* Header - Compact */}
        <div className="p-3 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Menu
          </h2>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className={`p-1 rounded-lg ${
              isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content - More space */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-3 space-y-1">
            {/* Home Button */}
            <button
              onClick={handleHomeNavigation}
              className={`w-full text-left p-2 rounded-lg flex items-center space-x-2 transition-all duration-200 ${
                activeTab === "landing"
                  ? "bg-blue-600 text-white shadow-md"
                  : isDarkMode 
                    ? "bg-gray-800 text-gray-200 hover:bg-gray-700" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <HomeIcon className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium text-sm">Home</span>
            </button>

            {[
              { key: "products", label: "Products", icon: ViewListIcon },
              { key: "orders", label: "Orders", icon: CogIcon },
              { key: "sales", label: "Sales", icon: DocumentReportIcon },
              { key: "invoices", label: "Invoices", icon: DocumentTextIcon },
              { key: "clients", label: "Clients", icon: UsersIcon },
              { key: "suppliers", label: "Suppliers", icon: TruckIcon },
              { key: "reports", label: "Reports", icon: DocumentReportIcon }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(
                  tab.key, 
                  tab.key === "sales" ? "management" : "",
                  tab.key === "orders" ? "inbound" : "", 
                  tab.key === "orders" ? "control" : "",
                  tab.key === "invoices" ? "outbound" : "",
                  tab.key === "invoices" ? "landing" : ""
                )}
                className={`w-full text-left p-2 rounded-lg flex items-center space-x-2 transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-blue-600 text-white shadow-md"
                    : isDarkMode 
                      ? "bg-gray-800 text-gray-200 hover:bg-gray-700" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <tab.icon className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Fixed Footer - Compact */}
        <div className="border-t border-gray-300 dark:border-gray-700 p-3 space-y-2 flex-shrink-0 bg-inherit">
          {/* User Info - Compact */}
          <div className="space-y-0.5">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
              {user?.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {currentDateTime}
            </div>
          </div>
          
          {/* Dark Mode Toggle - Compact */}
          <button
            onClick={toggleDarkMode}
            className={`w-full text-left p-2 rounded-lg flex items-center space-x-2 text-sm ${
              isDarkMode 
                ? "bg-gray-800 text-gray-200 hover:bg-gray-700" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {isDarkMode ? (
              <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 01-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
            <span className="font-medium">{isDarkMode ? "Light" : "Dark"}</span>
          </button>
          
          {/* Logout - Compact */}
          <button
            onClick={() => setShowExitWarning(true)}
            className="w-full text-left p-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors duration-200 flex items-center space-x-2 text-sm"
          >
            <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Modern Blue Gradient Header */}
      <nav className={`bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 shadow-2xl relative overflow-hidden ${
        isDarkMode ? 'from-blue-900 via-blue-800 to-indigo-900' : ''
      }`}>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo Section with Back Button */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBackNavigation}
                className={`p-2 rounded-xl transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-white/20 hover:bg-white/30 text-white' 
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
                title="Go Back"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm border border-white/30 shadow-lg">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Weekly Orders
                </h1>
                <p className="text-blue-100 text-xs font-medium">
                  Admin Dashboard
                </p>
              </div>
            </div>

            {/* Desktop User Info with Date/Time */}
            <div className="hidden lg:flex items-center space-x-4">
              <div className="text-right">
                <div className="text-blue-100 text-sm font-medium">
                  Hello, {user?.name}
                </div>
                <div className="text-blue-200 text-xs">
                  {currentDateTime}
                </div>
              </div>
              
              <button
                onClick={handleRefresh}
                className="p-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white transition-all duration-300 hover:bg-white/30"
                title="Refresh Stats"
              >
                <RefreshIcon className="h-4 w-4" />
              </button>
              
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white transition-all duration-300 hover:bg-white/30"
                title="Toggle Dark Mode"
              >
                {isDarkMode ? (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 01-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              
              <button
                onClick={() => setShowExitWarning(true)}
                className="bg-white/20 backdrop-blur-sm border border-white/30 text-white font-medium py-2 px-4 rounded-xl transition-all duration-300 hover:bg-white/30 text-sm"
              >
                Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center space-x-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-300"
              >
                {mobileMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Desktop Main Tabs - Spread out with more space */}
          <div className="hidden lg:block pb-4">
            <div className="flex justify-between space-x-2">
              {[
                { key: "landing", label: "Dashboard", icon: ChartBarIcon, color: "from-blue-400 to-cyan-500" },
                { key: "products", label: "Products", icon: ViewListIcon, color: "from-green-400 to-emerald-500" },
                { key: "orders", label: "Orders", icon: CogIcon, color: "from-indigo-400 to-purple-500" },
                { key: "sales", label: "Sales", icon: DocumentReportIcon, color: "from-orange-400 to-red-500" },
                { key: "invoices", label: "Invoices", icon: DocumentTextIcon, color: "from-cyan-400 to-blue-500" },
                { key: "clients", label: "Clients", icon: UsersIcon, color: "from-emerald-400 to-green-500" },
                { key: "suppliers", label: "Suppliers", icon: TruckIcon, color: "from-purple-400 to-indigo-500" },
                { key: "reports", label: "Reports", icon: DocumentReportIcon, color: "from-gray-400 to-blue-500" }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(
                    tab.key, 
                    tab.key === "sales" ? "management" : "",
                    tab.key === "orders" ? "inbound" : "", 
                    tab.key === "orders" ? "control" : "",
                    tab.key === "invoices" ? "outbound" : "",
                    tab.key === "invoices" ? "landing" : ""
                  )}
                  className={`group relative py-3 px-4 rounded-xl font-medium text-sm flex items-center space-x-2 transition-all duration-300 flex-1 justify-center max-w-[140px] ${
                    activeTab === tab.key
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                      : "bg-white/10 backdrop-blur-sm text-blue-100 hover:bg-white/20 border border-white/20"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                  {activeTab === tab.key && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Content Area - No gaps */}
      <main className={`min-h-[calc(100vh-80px)] ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          {activeTab === "landing" && (
            <AdminLanding
              isDarkMode={isDarkMode}
              setActiveTab={setActiveTab}
              setActiveSubTab={setActiveSubTab}
              socket={socket}
            />
          )}

          {activeTab === "products" && <ProductManagement isDarkMode={isDarkMode} />}
          {activeTab === "clients" && <ClientManagement isDarkMode={isDarkMode} />}
          {activeTab === "suppliers" && <SupplierManagement isDarkMode={isDarkMode} />}
          {activeTab === "reports" && <ReportManagement isDarkMode={isDarkMode} />}

          {/* Modern Sales Layout */}
          {activeTab === "sales" && (
            <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 h-full py-4">
              {/* Mobile Sales Menu Button */}
              <div className="lg:hidden">
                <button
                  onClick={() => setMobileSalesMenuOpen(true)}
                  className={`w-full p-3 rounded-lg shadow-lg flex items-center justify-between ${isDarkMode
                      ? "bg-orange-700 text-white"
                      : "bg-orange-600 text-white"
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <MenuIcon className="h-4 w-4" />
                    <span className="font-semibold text-sm">Sales Navigation</span>
                  </div>
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Desktop Sidebar Navigation */}
              <div className="hidden lg:block flex-shrink-0">
                <SalesSidebar />
              </div>

              {/* Main Content Area */}
              <div className="flex-1 min-w-0 w-full">
                <div className={`rounded-lg shadow-lg border min-h-[600px] ${isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                  }`}>
                  {/* Remove the header since SalesManagement has its own */}
                  <div className="p-0 h-full">
                    {renderSalesContent()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modern Orders Layout - Full width for tables */}
          {activeTab === "orders" && (
            <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 h-full py-4">
              {/* Mobile Orders Menu Button */}
              <div className="lg:hidden">
                <button
                  onClick={() => setMobileOrdersMenuOpen(true)}
                  className={`w-full p-3 rounded-lg shadow-lg flex items-center justify-between ${
                    isDarkMode 
                      ? "bg-blue-700 text-white" 
                      : "bg-blue-600 text-white"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <MenuIcon className="h-4 w-4" />
                    <span className="font-semibold text-sm">Order Navigation</span>
                  </div>
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Desktop Sidebar Navigation - Narrower */}
              <div className="hidden lg:block flex-shrink-0">
                <OrdersSidebar />
              </div>
              
              {/* Main Content Area - Wider for tables */}
              <div className="flex-1 min-w-0 w-full">
                <div className={`rounded-lg shadow-lg border min-h-[600px] ${
                  isDarkMode 
                    ? "bg-gray-800 border-gray-700" 
                    : "bg-white border-gray-200"
                }`}>
                  {/* Orders Content Header - Better alignment */}
                  <div className={`p-6 border-b ${
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                  }`}>
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${
                        activeOrderType === "inbound" 
                          ? isDarkMode ? "bg-green-600" : "bg-green-500"
                          : isDarkMode ? "bg-blue-600" : "bg-blue-500"
                      }`}>
                        {activeOrderType === "inbound" ? (
                          <ShoppingCartIcon className="h-6 w-6 text-white" />
                        ) : (
                          <TruckIcon className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h1 className={`text-2xl font-bold ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}>
                          {activeOrderType === "inbound" ? "Inbound Orders" : "Outbound Orders"}
                        </h1>
                        <p className={`mt-1 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}>
                          {activeOrderSubTab === "control" && "Manage client order visibility, time controls, and messaging"}
                          {activeOrderSubTab === "status" && "Track order status and progress"}
                          {activeOrderSubTab === "process" && "Advanced order processing"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Orders Content - Full width for tables */}
                  <div className="p-0 h-full">
                    {renderOrdersContent()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modern Invoices Layout */}
          {activeTab === "invoices" && (
            <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 h-full py-4">
              {/* Mobile Invoices Menu Button */}
              <div className="lg:hidden">
                <button
                  onClick={() => setMobileInvoicesMenuOpen(true)}
                  className={`w-full p-3 rounded-lg shadow-lg flex items-center justify-between ${
                    isDarkMode 
                      ? "bg-cyan-700 text-white" 
                      : "bg-cyan-600 text-white"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <MenuIcon className="h-4 w-4" />
                    <span className="font-semibold text-sm">Invoice Navigation</span>
                  </div>
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Desktop Sidebar Navigation */}
              <div className="hidden lg:block flex-shrink-0">
                <InvoicesSidebar />
              </div>

              {/* Main Content Area */}
              <div className="flex-1 min-w-0 w-full">
                <div className={`rounded-lg shadow-lg border min-h-[600px] ${
                  isDarkMode 
                    ? "bg-gray-800 border-gray-700" 
                    : "bg-white border-gray-200"
                }`}>
                  {/* Invoices Content Header */}
                  <div className={`p-6 border-b ${
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                  }`}>
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${
                        activeInvoiceType === "inbound" 
                          ? isDarkMode ? "bg-purple-600" : "bg-purple-500"
                          : isDarkMode ? "bg-cyan-600" : "bg-cyan-500"
                      }`}>
                        <DocumentTextIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h1 className={`text-2xl font-bold ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}>
                          {activeInvoiceType === "inbound" ? "Inbound Invoices" : "Outbound Invoices"}
                        </h1>
                        <p className={`mt-1 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}>
                          {activeInvoiceType === "inbound" && "Manage incoming supplier invoices"}
                          {activeInvoiceType === "outbound" && "Create and manage customer invoices"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Invoices Content */}
                  <div className="p-0 h-full">
                    {renderInvoicesContent()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Menus */}
      <MobileMainMenu />
      <MobileOrdersMenu />
      <MobileSalesMenu />
      <MobileInvoicesMenu />

      {/* Exit Warning Modal */}
      {showExitWarning && <ExitWarningModal />}
    </div>
  );
};

export default AdminDashboard;