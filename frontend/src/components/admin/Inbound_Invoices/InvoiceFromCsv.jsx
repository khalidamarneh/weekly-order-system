//frontend\src\components\admin\Inbound_Invoices\InvoiceFromCsv.jsx//
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    DocumentIcon,
    SearchIcon,
    PrinterIcon,
    SaveIcon,
    RefreshIcon,
    PlusIcon,
    TrashIcon,
    ArrowLeftIcon,
    DocumentTextIcon,
    UserIcon,
    CameraIcon,
    XIcon,
    DocumentDuplicateIcon,
    CheckCircleIcon,
    ChevronDownIcon,
    CurrencyDollarIcon,
    ShoppingBagIcon,
    CreditCardIcon,
    TruckIcon,
    CloudUploadIcon,
    ClipboardIcon,
    ExclamationIcon,
    CheckIcon
} from '@heroicons/react/outline';
import api from '../../../services/api';
import CustomerManagement from '../sales/CustomerManagement';
import ItemProcessingModal from './ItemProcessingModal';
import CsvManagement from '../CsvManagement';
import InvoiceHistory from './InvoiceHistory';

// Status options matching the backend
const INVOICE_STATUS_OPTIONS = ['DRAFT', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'];
const PAYMENT_STATUS_OPTIONS = ['PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'];
const SHIPMENT_STATUS_OPTIONS = ['PENDING', 'PACKED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'];
const PAYMENT_METHODS = ['CASH', 'CREDIT_CARD', 'BANK_TRANSFER', 'CHECK', 'DIGITAL_WALLET', 'OTHER'];

// FIXED: Stable Generic Dropdown Component
const GenericDropdown = React.memo(({
    label,
    current,
    options = [],
    onChange,
    isDarkMode = false
}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("click", onClick);
        return () => document.removeEventListener("click", onClick);
    }, []);

    return (
        <div ref={ref} className="relative w-full">
            {label && (
                <label className="block text-xs mb-1 text-gray-600 dark:text-gray-300 font-medium">
                    {label}
                </label>
            )}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen((o) => !o);
                }}
                className={`w-full flex justify-between items-center px-4 py-3 sm:px-3 sm:py-2 rounded-lg border text-sm transition-all duration-200 active:scale-[0.98] ${isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
                    : 'bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200'
                    }`}
                aria-expanded={open}
                aria-haspopup="listbox"
            >
                <span className="truncate">{current}</span>
                <ChevronDownIcon className={`h-4 w-4 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className={`absolute left-0 right-0 mt-1 rounded-lg shadow-lg border z-50 max-h-60 overflow-y-auto ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                    <div className="py-1">
                        {options.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => {
                                    onChange(opt);
                                    setOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 sm:py-2 text-sm transition-colors duration-150 ${opt === current
                                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                    }`}
                                role="option"
                                aria-selected={opt === current}
                            >
                                <div className="flex items-center gap-2">
                                    {opt === current && <CheckIcon className="h-4 w-4 text-blue-500" />}
                                    <span>{opt}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});

const InvoiceFromCsv = ({ isDarkMode = false, setActiveSubTab, onNavigate, onViewInvoiceHistory }) => {
    // State for CSV data and processing
    const [allProducts, setAllProducts] = useState([]);
    const [upcColumnIndex, setUpcColumnIndex] = useState(-1);
    const [csvGrandTotal, setCsvGrandTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // State for search and UI
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedSearchItems, setSelectedSearchItems] = useState(new Set());
    const [searchStatus, setSearchStatus] = useState({ message: '', type: '' });
    const [fileStatus, setFileStatus] = useState({ message: '', type: '' });

    // State for invoice
    const [invoiceItems, setInvoiceItems] = useState([]);
    const [invoiceCounter, setInvoiceCounter] = useState(1);
    const [customerName, setCustomerName] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [customerId, setCustomerId] = useState(null);
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');

    // New invoice fields
    const [taxRate, setTaxRate] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [shippingAddress, setShippingAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [terms, setTerms] = useState('Payment due within 30 days. Late payments subject to fees.');
    const [invoiceStatus, setInvoiceStatus] = useState('DRAFT');
    const [paymentStatus, setPaymentStatus] = useState('PENDING');
    const [shipmentStatus, setShipmentStatus] = useState('PENDING');
    const [showTax, setShowTax] = useState(true);

    // State for saved invoices
    const [savedInvoices, setSavedInvoices] = useState([]);

    // State for modals
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showCsvModal, setShowCsvModal] = useState(false);
    const [showItemProcessing, setShowItemProcessing] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [currentProcessingItem, setCurrentProcessingItem] = useState(null);
    const [processingQueue, setProcessingQueue] = useState([]);

    // State for customers
    const [customers, setCustomers] = useState([]);

    // Notification state
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    // State for editing
    const [editingCell, setEditingCell] = useState(null); // {itemId, field, value}

    const fileInputRef = useRef(null);
    const searchInputRef = useRef(null);

    // Styling classes
    const cardClass = `rounded-lg shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`;

    const inputClass = `w-full rounded-lg px-3 py-2 text-sm border ${isDarkMode
            ? 'bg-gray-800 border-gray-600 text-white'
            : 'bg-white border-gray-300 text-gray-900'
        }`;

    const buttonClass = (color = 'gray', size = 'md') => {
        const base = `rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm'
            }`;
        const colors = {
            gray: isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700',
            blue: 'bg-blue-600 hover:bg-blue-700 text-white',
            green: 'bg-green-600 hover:bg-green-700 text-white',
            red: 'bg-red-600 hover:bg-red-700 text-white',
            yellow: 'bg-yellow-500 hover:bg-yellow-600 text-white',
            purple: 'bg-purple-600 hover:bg-purple-700 text-white',
            indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white'
        };
        return `${base} ${colors[color]}`;
    };

// Add CSS to document head
useEffect(() => {
    const invoiceTableCSS = `
    .invoice-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        margin-top: 0;
        box-shadow: none;
        border-radius: 0;
        table-layout: auto;
    }

    .invoice-table th, .invoice-table td {
        border-right: 2px solid #007bff;
        border-bottom: 2px solid #007bff;
        padding: 8px 5px;
        text-align: center;
        word-wrap: break-word;
        overflow: hidden;
        text-overflow: ellipsis;
        height: auto;
        box-sizing: border-box;
    }

    .invoice-table th:last-child, .invoice-table td:last-child {
        border-right: none;
    }

    .invoice-table tr:last-child th, .invoice-table tr:last-child td {
        border-bottom: none;
    }

    .invoice-table th {
        background-color: #ffc107;
        color: #212529;
        font-weight: bold;
        position: sticky;
        top: 0;
        z-index: 10;
        height: auto;
        padding: 8px 5px;
        box-sizing: border-box;
        text-align: center;
        box-shadow: inset 0 1px 0 #007bff,
                    inset 0 -1px 0 #007bff,
                    0 2px 2px -1px rgba(0, 0, 0, 0.2);
    }

    .invoice-table tr:nth-child(even) {
        background-color: #f8f9fa;
    }

    .invoice-table tr:hover {
        background-color: #e9ecef;
    }

    .invoice-table th:nth-child(3), .invoice-table td:nth-child(3) {
        width: auto;
        min-width: 150px;
        text-align: center;
        max-width: none;
        padding: 8px 5px;
    }

    .invoice-table th:nth-child(2), .invoice-table td:nth-child(2) {
        width: auto;
        min-width: 120px;
        max-width: none;
        padding: 8px 5px;
    }

    .invoice-table td {
        padding: 8px 5px;
    }

    .invoice-table input[type="number"],
    .invoice-table input[type="text"] {
        width: 100%;
        box-sizing: border-box;
        text-align: center;
        padding: 5px;
        font-size: 0.95rem;
        border: 1px solid #ced4da;
        border-radius: 3px;
    }

    .invoice-table .part-no-input,
    .invoice-table .description-input {
        text-align: center;
    }

    .invoice-total-row {
        font-weight: bold;
        background-color: #ffc107 !important;
        height: auto;
    }

    .invoice-total-row td {
        border-top: 2px solid #212529;
        border-right: 2px solid #007bff;
        border-bottom: 2px solid #007bff;
        padding: 8px 5px;
        box-sizing: border-box;
        text-align: center;
    }

    .invoice-total-row td:last-child {
        border-right: none;
    }

    .editable-cell {
        cursor: pointer;
        transition: background-color 0.2s;
        min-height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .editable-cell:hover {
        background-color: #e3f2fd !important;
    }

    .dark .editable-cell:hover {
        background-color: #374151 !important;
    }

    /* =========================================== */
    /* MOBILE RESPONSIVE FIXES - UPDATED */
    /* =========================================== */

    /* Mobile scrolling container */
    .invoice-table-scroll-container {
        position: relative;
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        border-radius: 8px;
        margin: 0 -4px;
        padding: 0 4px;
    }

    .invoice-table-scroll-container::-webkit-scrollbar {
        height: 8px;
    }

    .invoice-table-scroll-container::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
    }

    .invoice-table-scroll-container::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 4px;
    }

    .invoice-table-scroll-container::-webkit-scrollbar-thumb:hover {
        background: #555;
    }

    .dark .invoice-table-scroll-container::-webkit-scrollbar-track {
        background: #374151;
    }

    .dark .invoice-table-scroll-container::-webkit-scrollbar-thumb {
        background: #6b7280;
    }

    /* For mobile screens (768px and below) */
    @media (max-width: 768px) {
        .invoice-table-container {
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin: 0;
            padding: 0;
            position: relative;
        }

        .invoice-table {
            min-width: 700px; /* Slightly wider for better readability */
            font-size: 0.875rem;
            margin: 0;
        }
        
        .invoice-table th,
        .invoice-table td {
            padding: 10px 6px !important;
            min-width: 90px;
            white-space: nowrap;
            font-size: 0.875rem;
        }
        
        /* Specific column widths for mobile */
        .invoice-table th:nth-child(1),
        .invoice-table td:nth-child(1) {
            min-width: 50px; /* No# */
            max-width: 50px;
            position: sticky;
            left: 0;
            z-index: 5;
            background: inherit;
        }
        
        .invoice-table th:nth-child(2),
        .invoice-table td:nth-child(2) {
            min-width: 100px; /* Part No */
            max-width: 120px;
            position: sticky;
            left: 50px;
            z-index: 5;
            background: inherit;
        }
        
        .invoice-table th:nth-child(3),
        .invoice-table td:nth-child(3) {
            min-width: 180px; /* Description - wider for mobile */
            max-width: 200px;
            white-space: normal;
        }
        
        .invoice-table th:nth-child(4),
        .invoice-table td:nth-child(4) {
            min-width: 80px; /* Quantity */
            max-width: 90px;
        }
        
        .invoice-table th:nth-child(5),
        .invoice-table td:nth-child(5) {
            min-width: 100px; /* Unit Price */
            max-width: 110px;
        }
        
        .invoice-table th:nth-child(6),
        .invoice-table td:nth-child(6) {
            min-width: 100px; /* Total Price */
            max-width: 110px;
        }
        
        .invoice-table th:nth-child(7),
        .invoice-table td:nth-child(7) {
            min-width: 80px; /* Action */
            max-width: 90px;
            position: sticky;
            right: 0;
            z-index: 5;
            background: inherit;
        }
        
        .invoice-table .editable-cell {
            min-height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .invoice-table input[type="number"],
        .invoice-table input[type="text"] {
            font-size: 0.875rem;
            padding: 6px 4px;
            min-height: 36px;
            width: 100%;
        }
        
        .invoice-total-row td {
            padding: 10px 6px !important;
            font-size: 0.875rem;
        }
        
        /* Mobile scroll hint */
        .mobile-scroll-hint {
            display: block;
            text-align: center;
            padding: 8px;
            font-size: 0.75rem;
            color: #6b7280;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
            border-radius: 0 0 8px 8px;
        }
        
        .dark .mobile-scroll-hint {
            background: #374151;
            color: #9ca3af;
            border-top: 1px solid #4b5563;
        }
    }
    
    /* For small mobile screens (640px and below) */
    @media (max-width: 640px) {
        .invoice-table {
            min-width: 650px;
            font-size: 0.85rem;
        }
        
        .invoice-table th,
        .invoice-table td {
            padding: 8px 5px !important;
            min-width: 85px;
        }
        
        .invoice-table th:nth-child(1),
        .invoice-table td:nth-child(1) {
            min-width: 45px;
            left: 0;
        }
        
        .invoice-table th:nth-child(2),
        .invoice-table td:nth-child(2) {
            min-width: 90px;
            left: 45px;
        }
        
        .invoice-table th:nth-child(3),
        .invoice-table td:nth-child(3) {
            min-width: 160px;
        }
        
        .invoice-table input[type="number"],
        .invoice-table input[type="text"] {
            font-size: 0.85rem;
            padding: 5px 3px;
            min-height: 34px;
        }
    }
    
    /* For very small screens (480px and below) */
    @media (max-width: 480px) {
        .invoice-table {
            min-width: 620px;
            font-size: 0.8rem;
        }
        
        .invoice-table th,
        .invoice-table td {
            padding: 7px 4px !important;
            min-width: 80px;
        }
        
        .invoice-table th:nth-child(1),
        .invoice-table td:nth-child(1) {
            min-width: 40px;
            left: 0;
        }
        
        .invoice-table th:nth-child(2),
        .invoice-table td:nth-child(2) {
            min-width: 85px;
            left: 40px;
        }
        
        .invoice-table th:nth-child(3),
        .invoice-table td:nth-child(3) {
            min-width: 140px;
        }
        
        .invoice-table input[type="number"],
        .invoice-table input[type="text"] {
            font-size: 0.8rem;
            padding: 4px 2px;
            min-height: 32px;
        }
    }
    
    /* For iPhone SE/320px screens */
    @media (max-width: 320px) {
        .invoice-table {
            min-width: 580px;
            font-size: 0.75rem;
        }
        
        .invoice-table th,
        .invoice-table td {
            padding: 6px 3px !important;
        }
    }
    
    /* Dark mode fixes for invoice table */
    .dark .invoice-table th {
        background-color: #d97706; /* Amber 600 for dark mode */
        color: #1f2937; /* Dark text */
    }
    
    .dark .invoice-table tr:nth-child(even) {
        background-color: #374151; /* gray-700 */
    }
    
    .dark .invoice-table tr:hover {
        background-color: #4b5563; /* gray-600 */
    }
    
    .dark .invoice-table tr:nth-child(even):hover {
        background-color: #4b5563; /* gray-600 */
    }
    
    .dark .invoice-table td {
        color: #e5e7eb; /* gray-200 for text */
    }
    
    .dark .invoice-table input[type="number"],
    .dark .invoice-table input[type="text"] {
        background-color: #374151; /* gray-700 */
        border-color: #4b5563; /* gray-600 */
        color: #f9fafb; /* gray-50 */
    }
    
    .dark .invoice-table input[type="number"]:focus,
    .dark .invoice-table input[type="text"]:focus {
        border-color: #3b82f6; /* blue-500 */
        outline: none;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
    }
    
    .dark .invoice-total-row {
        background-color: #d97706 !important; /* Amber 600 */
    }
    
    .dark .invoice-total-row td {
        color: #1f2937; /* gray-900 for contrast */
        font-weight: bold;
    }
    
    /* Fix for mobile touch targets */
    @media (max-width: 768px) {
        .invoice-table button {
            min-height: 36px;
            min-width: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 6px;
        }
    }
    
    /* Fix for print styles */
    @media print {
        .invoice-table {
            border: 1px solid #000 !important;
            width: 100% !important;
            min-width: 100% !important;
        }
        
        .invoice-table th,
        .invoice-table td {
            border: 1px solid #000 !important;
            padding: 6px !important;
            color: #000 !important;
        }
        
        .invoice-table th {
            background-color: #ffc107 !important;
            color: #000 !important;
        }
        
        .invoice-table-scroll-container {
            overflow: visible !important;
        }
    }
    `;
        const styleSheet = document.createElement("style");
        styleSheet.innerText = invoiceTableCSS;
        document.head.appendChild(styleSheet);

        return () => {
            if (document.head.contains(styleSheet)) {
                document.head.removeChild(styleSheet);
            }
        };
    }, []);
    // Format numbers to 2 decimal places with thousands separators
    const formatNumber = (num) => {
        if (num === null || num === undefined) return '0.00';
        const number = typeof num === 'string' ? parseFloat(num) : num;
        if (isNaN(number)) return '0.00';

        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(number);
    };

    const formatMoney = (v) => {
        const num = typeof v === 'string' ? parseFloat(v) : v;
        if (isNaN(num)) return '$0.00';
        return `$${formatNumber(num)}`;
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 5000);
    };

    // FIXED: Faster real-time search with better debouncing
    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (searchTerm.trim()) {
                performSearch(searchTerm);
            } else {
                clearSearchResults();
            }
        }, 150);

        return () => clearTimeout(delaySearch);
    }, [searchTerm]);

    // Load customers and saved invoices on component mount
    useEffect(() => {
        loadCustomers();
        loadSavedInvoices();
        loadSavedData();
    }, []);

    const loadCustomers = async () => {
        try {
            const res = await api.get('/api/customers');
            setCustomers(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed loading customers', err);
            setCustomers([]);
        }
    };

    const loadSavedInvoices = async () => {
        try {
            const res = await api.get('/api/outbound-invoices');
            setSavedInvoices(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error loading invoices', err);
            setSavedInvoices([]);
        }
    };

    const loadSavedData = () => {
        try {
            const savedProducts = localStorage.getItem('barcodeAppProducts');
            const savedUpcIndex = localStorage.getItem('barcodeAppUpcIndex');
            if (savedProducts && savedUpcIndex) {
                const products = JSON.parse(savedProducts);
                const upcIndex = parseInt(savedUpcIndex, 10);
                if (!isNaN(upcIndex) && products && products.length > 0) {
                    setAllProducts(products);
                    setUpcColumnIndex(upcIndex);
                }
            }
        } catch (e) {
            console.warn("Could not load from localStorage:", e);
        }
    };

    // Search functions
    const performSearch = useCallback((searchText = null) => {
        const term = (searchText || searchTerm).trim();

        if (!term) {
            setSearchStatus({ message: 'Please enter a search term.', type: 'error' });
            clearSearchResults();
            return;
        }

        if (!allProducts || !Array.isArray(allProducts) || allProducts.length <= 1) {
            setSearchStatus({ message: 'Please upload product data first.', type: 'error' });
            clearSearchResults();
            return;
        }

        setSearchStatus({ message: 'Searching...', type: 'info' });

        try {
            const results = searchProducts(term);
            setSearchResults(results);
            setSearchStatus({
                message: `Found ${results.length} result(s).`,
                type: results.length > 0 ? 'success' : 'info'
            });
        } catch (err) {
            console.error("Search error:", err);
            setSearchStatus({ message: `Search failed: ${err.message}`, type: 'error' });
            clearSearchResults();
        }
    }, [searchTerm, allProducts]);

    const searchProducts = (term) => {
        const termLower = term.toLowerCase();
        const results = [];

        for (let i = 1; i < allProducts.length; i++) {
            const row = allProducts[i];
            if (!Array.isArray(row)) continue;
            const matches = row.some(cell => {
                return typeof cell === 'string' && cell.toLowerCase().includes(termLower);
            });
            if (matches) {
                results.push({ rowIndex: i, data: row });
            }
        }
        return results;
    };

    const clearSearchResults = () => {
        setSearchResults([]);
        setSelectedSearchItems(new Set());
    };

    const resetSearch = () => {
        setSearchTerm('');
        clearSearchResults();
        setSearchStatus({ message: '', type: '' });
    };

    const displayAllProducts = () => {
        if (!allProducts || allProducts.length <= 1) {
            setSearchStatus({ message: 'Please upload product data first.', type: 'error' });
            return;
        }

        const results = [];
        for (let i = 1; i < allProducts.length; i++) {
            const row = allProducts[i];
            if (Array.isArray(row)) {
                results.push({ rowIndex: i, data: row });
            }
        }

        setSearchResults(results);
        setSearchStatus({ 
            message: `Displaying all ${results.length} products.`, 
            type: 'success' 
        });
    };

    // File upload handling
    const handleFileUpload = async (event) => {
        const files = event.target.files;
        if (files.length === 0) {
            setFileStatus({ message: 'Please select one or more CSV files.', type: 'error' });
            return;
        }

        setLoading(true);
        setFileStatus({ message: 'Processing files...', type: 'info' });

        try {
            const filePromises = Array.from(files).map(file => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const csvData = e.target.result;
                            const parsedData = parseCSV(csvData);
                            resolve(parsedData);
                        } catch (err) {
                            reject(err);
                        }
                    };
                    reader.onerror = () => reject(new Error(`Error reading file: ${file.name}`));
                    reader.readAsText(file);
                });
            });

            const results = await Promise.all(filePromises);
            let combinedProducts = [];

            results.forEach(parsedData => {
                if (combinedProducts.length > 0 && parsedData.length > 0) {
                    combinedProducts.push(...parsedData.slice(1));
                } else if (combinedProducts.length === 0 && parsedData.length > 0) {
                    combinedProducts = parsedData;
                }
            });

            combinedProducts = combinedProducts.filter(row => row.some(cell => cell.trim() !== ''));

            if (combinedProducts.length === 0) {
                throw new Error("No data found in uploaded files.");
            }

            const headerRow = combinedProducts[0];
            const upcIndex = headerRow.findIndex(cell => cell.trim().toLowerCase() === 'upc');

            setAllProducts(combinedProducts);
            setUpcColumnIndex(upcIndex);

            localStorage.setItem('barcodeAppProducts', JSON.stringify(combinedProducts));
            localStorage.setItem('barcodeAppUpcIndex', upcIndex.toString());

            setFileStatus({ 
                message: `Successfully processed ${files.length} file(s). Found ${combinedProducts.length - 1} product rows.`, 
                type: 'success' 
            });

            clearSearchResults();

        } catch (err) {
            console.error("File processing error:", err);
            setFileStatus({ message: `Error processing files: ${err.message}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const parseCSV = (csvText) => {
        const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
        const result = [];

        for (let i = 0; i < lines.length; i++) {
            const row = [];
            let current = '';
            let inQuotes = false;

            for (let j = 0; j < lines[i].length; j++) {
                const char = lines[i][j];

                if (char === '"' && !inQuotes) {
                    inQuotes = true;
                } else if (char === '"' && inQuotes) {
                    if (j + 1 < lines[i].length && lines[i][j + 1] === '"') {
                        current += '"';
                        j++;
                    } else {
                        inQuotes = false;
                    }
                } else if (char === ',' && !inQuotes) {
                    row.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            row.push(current.trim());
            result.push(row);
        }
        return result;
    };

    // Search item selection
    const handleSearchItemSelect = (rowIndex) => {
        setSelectedSearchItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(rowIndex)) {
                newSet.delete(rowIndex);
            } else {
                newSet.add(rowIndex);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedSearchItems.size === searchResults.length) {
            setSelectedSearchItems(new Set());
        } else {
            const allIndices = new Set(searchResults.map(result => result.rowIndex));
            setSelectedSearchItems(allIndices);
        }
    };

    const processSelectedItems = () => {
        if (selectedSearchItems.size === 0) {
            setSearchStatus({ message: 'Please select at least one item.', type: 'error' });
            return;
        }

        const selectedItems = searchResults.filter(result => 
            selectedSearchItems.has(result.rowIndex)
        );

        if (selectedItems.length > 0) {
            setProcessingQueue(selectedItems);
            processNextItem(selectedItems);
        }
    };

    const processNextItem = (items, currentIndex = 0) => {
        if (currentIndex >= items.length) {
            setShowItemProcessing(false);
            setCurrentProcessingItem(null);
            setProcessingQueue([]);
            setSelectedSearchItems(new Set());
            return;
        }

        const item = items[currentIndex];
        const headerRow = allProducts[0];
        const partNoIndex = upcColumnIndex;
        const descriptionIndex = headerRow.findIndex(h => h.toLowerCase().includes('product name'));
        const unitPriceIndex = headerRow.findIndex(h => h.toLowerCase().includes('sold price'));

        const itemData = {
            partNo: partNoIndex !== -1 ? item.data[partNoIndex] || '' : '',
            description: descriptionIndex !== -1 ? item.data[descriptionIndex] || '' : '',
            unitPrice: unitPriceIndex !== -1 ? item.data[unitPriceIndex] || '0' : '0',
            rowIndex: item.rowIndex,
            queueIndex: currentIndex,
            totalItems: items.length
        };

        setCurrentProcessingItem(itemData);
        setShowItemProcessing(true);
    };

    const handleProcessedItem = (processedItem) => {
        if (processedItem.skipped) {
            const nextIndex = processedItem.queueIndex + 1;
            if (nextIndex < processingQueue.length) {
                processNextItem(processingQueue, nextIndex);
            } else {
                setShowItemProcessing(false);
                setCurrentProcessingItem(null);
                setProcessingQueue([]);
                setSelectedSearchItems(new Set());
            }
            return;
        }

        addItemToInvoice(processedItem);
        
        const nextIndex = processedItem.queueIndex + 1;
        if (nextIndex < processingQueue.length) {
            processNextItem(processingQueue, nextIndex);
        } else {
            setShowItemProcessing(false);
            setCurrentProcessingItem(null);
            setProcessingQueue([]);
            setSelectedSearchItems(new Set());
        }
    };

    // Invoice management
    const addItemToInvoice = (itemData) => {
        const unitPrice = parseFloat(itemData.unitPrice) || 0;
        const quantity = parseInt(itemData.quantity) || 1;
        const totalPrice = unitPrice * quantity;
        const unitCost = parseFloat(itemData.unitCost) || 0;

        const newItem = {
            id: invoiceCounter,
            number: invoiceItems.length + 1,
            partNo: itemData.partNo || '',
            description: itemData.description || '',
            quantity: quantity,
            unitPrice: unitPrice,
            totalPrice: totalPrice,
            unitCost: unitCost,
            markupAmount: itemData.markupAmount || 0,
            markupPercentage: itemData.markupPercentage || 0
        };

        setInvoiceItems(prev => [...prev, newItem]);
        setInvoiceCounter(prev => prev + 1);
    };

    const deleteItem = (itemId) => {
        setInvoiceItems(prev => {
            const newItems = prev.filter(item => item.id !== itemId);
            return newItems.map((item, index) => ({
                ...item,
                number: index + 1
            }));
        });
    };

    const updateItemField = (itemId, field, value) => {
        setInvoiceItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'quantity' || field === 'unitPrice') {
                    updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice;
                }
                return updatedItem;
            }
            return item;
        }));
    };

    const handleAddEmptyItem = () => {
        addItemToInvoice({
            partNo: '',
            description: '',
            unitPrice: '0.00',
            quantity: 1,
            unitCost: 0
        });
    };

    // Calculate invoice totals
    const invoiceSubtotal = useMemo(() => {
        return invoiceItems.reduce((sum, item) => sum + item.totalPrice, 0);
    }, [invoiceItems]);

    const taxAmount = useMemo(() => {
        return showTax ? (invoiceSubtotal * taxRate) / 100 : 0;
    }, [invoiceSubtotal, taxRate, showTax]);

    const invoiceTotal = useMemo(() => {
        return invoiceSubtotal + taxAmount - discount;
    }, [invoiceSubtotal, taxAmount, discount]);

    // Calculate profit metrics
    const profitMetrics = useMemo(() => {
        const totalCost = invoiceItems.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0);
        const totalRevenue = invoiceSubtotal;
        const totalProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        return {
            totalCost,
            totalRevenue,
            totalProfit,
            profitMargin
        };
    }, [invoiceItems, invoiceSubtotal]);

    // Helper function to get invoice ID from number
    const getInvoiceIdFromNumber = (invoiceNum) => {
        const invoice = savedInvoices.find(inv => inv.invoiceNumber === invoiceNum);
        return invoice ? invoice.id : null;
    };

    // FIXED: Status update function
    const handleStatusUpdate = async (field, value) => {
        if (!invoiceNumber) {
            showNotification('Please save the invoice first before updating status', 'error');
            return;
        }

        const invoiceId = getInvoiceIdFromNumber(invoiceNumber);
        if (!invoiceId) {
            showNotification('Invoice not found for status update', 'error');
            return;
        }

        try {
            const updateData = { [field]: value };
            
            if (field === 'status' && value === 'SENT') updateData.sentAt = new Date();
            if (field === 'status' && value === 'VIEWED') updateData.viewedAt = new Date();
            if (field === 'paymentStatus' && value === 'PAID') updateData.paidAt = new Date();

            await api.put(`/api/outbound-invoices/csv/${invoiceId}/status`, updateData);
            
            if (field === 'status') setInvoiceStatus(value);
            if (field === 'paymentStatus') setPaymentStatus(value);
            if (field === 'shipmentStatus') setShipmentStatus(value);
            
            showNotification(`${field} updated successfully!`, 'success');
        } catch (error) {
            console.error('Error updating status:', error);
            showNotification('Failed to update status', 'error');
        }
    };

    // FIXED: Save Invoice functionality
    const handleSaveInvoice = async () => {
        if (!customerName || customerName.trim() === '') {
            showNotification('Customer name is required', 'error');
            return;
        }

        if (invoiceItems.length === 0) {
            showNotification('At least one invoice item is required', 'error');
            return;
        }

        setSaving(true);

        try {
            const totalCost = invoiceItems.reduce((sum, item) => sum + (item.unitCost || 0) * item.quantity, 0);
            const totalProfit = invoiceSubtotal - totalCost;
            const profitMargin = invoiceSubtotal > 0 ? (totalProfit / invoiceSubtotal) * 100 : 0;

            let finalInvoiceNumber = invoiceNumber;
            if (!finalInvoiceNumber || finalInvoiceNumber.trim() === '') {
                finalInvoiceNumber = '';
            }

            const payload = {
                invoiceNumber: finalInvoiceNumber,
                customerName: customerName.trim(),
                customerEmail: customerEmail || '',
                customerPhone: customerPhone || '',
                customerAddress: customerAddress || '',
                issueDate: new Date().toISOString(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                items: invoiceItems.map(item => ({
                    name: item.description || 'CSV Product',
                    partNo: item.partNo || '',
                    description: item.description || '',
                    image: '',
                    quantity: Number(item.quantity) || 1,
                    unitPrice: Number(item.unitPrice) || 0,
                    totalPrice: Number(item.totalPrice) || 0,
                    unitCost: Number(item.unitCost) || 0,
                    markupAmount: Number(item.markupAmount) || 0,
                    markupPercentage: Number(item.markupPercentage) || 0,
                    inboundItemId: null
                })),
                subtotal: parseFloat(invoiceSubtotal),
                taxRate: Number(taxRate || 0),
                taxAmount: parseFloat(taxAmount || 0),
                discount: parseFloat(discount || 0),
                totalAmount: parseFloat(invoiceTotal || 0),
                paymentMethod: paymentMethod || '',
                shippingAddress: shippingAddress || customerAddress || '',
                notes: notes || '',
                terms: terms || '',
                baseCost: parseFloat(totalCost),
                markupAmount: parseFloat(totalProfit),
                markupPercentage: parseFloat(profitMargin),
                status: invoiceStatus,
                paymentStatus: paymentStatus,
                shipmentStatus: shipmentStatus
            };

            if (customerId) {
                payload.customerId = customerId;
            }

            let response;
            if (invoiceNumber && invoiceNumber.trim() !== '') {
                const invoiceId = getInvoiceIdFromNumber(invoiceNumber);
                if (invoiceId) {
                    response = await api.put(`/api/outbound-invoices/csv/${invoiceId}`, payload);
                    showNotification(`Invoice ${response.data.invoiceNumber} updated successfully!`, 'success');
                } else {
                    response = await api.post('/api/outbound-invoices/csv', payload);
                    showNotification(`Invoice ${response.data.invoiceNumber} created successfully!`, 'success');
                }
            } else {
                response = await api.post('/api/outbound-invoices/csv', payload);
                showNotification(`Invoice ${response.data.invoiceNumber} created successfully!`, 'success');
            }

            if (!invoiceNumber) {
                setInvoiceNumber(response.data.invoiceNumber);
            }

            await loadSavedInvoices();

        } catch (error) {
            console.error('Error saving invoice:', error);
            const errorMessage = error.response?.data?.message || 'Failed to save invoice';
            showNotification(errorMessage, 'error');
        } finally {
            setSaving(false);
        }
    };

    // Import invoice functionality
    const handleImportInvoice = (invoice) => {
        setCustomerId(invoice.customerId || null);
        setCustomerName(invoice.customerName || '');
        setCustomerEmail(invoice.customerEmail || '');
        setCustomerPhone(invoice.customerPhone || '');
        setCustomerAddress(invoice.customerAddress || '');
        setInvoiceNumber(invoice.invoiceNumber || '');
        setTaxRate(invoice.taxRate || 0);
        setDiscount(invoice.discount || 0);
        setPaymentMethod(invoice.paymentMethod || '');
        setShippingAddress(invoice.shippingAddress || '');
        setNotes(invoice.notes || '');
        setTerms(invoice.terms || '');
        setInvoiceStatus(invoice.status || 'DRAFT');
        setPaymentStatus(invoice.paymentStatus || 'PENDING');
        setShipmentStatus(invoice.shipmentStatus || 'PENDING');

        if (invoice.items && invoice.items.length > 0) {
            const importedItems = invoice.items.map((item, index) => ({
                id: index + 1,
                number: index + 1,
                partNo: item.partNo || '',
                description: item.description || item.name || '',
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice || 0,
                totalPrice: item.totalPrice || 0,
                unitCost: item.unitCost || 0,
                markupAmount: item.markupAmount || 0,
                markupPercentage: item.markupPercentage || 0
            }));
            setInvoiceItems(importedItems);
            setInvoiceCounter(importedItems.length + 1);
        }

        setShowImportModal(false);
    };

    // Customer selection
    const handleCustomerSelect = (customer) => {
        if (!customer) return;
        setCustomerId(customer.id);
        setCustomerName(customer.name || '');
        setCustomerEmail(customer.email || '');
        setCustomerPhone(customer.phone || '');
        setCustomerAddress(customer.address || '');
        setShowCustomerModal(false);
    };

    // Navigation functions
    const handleBackToDashboard = () => {
        if (setActiveSubTab && typeof setActiveSubTab === 'function') {
            setActiveSubTab('dashboard');
        } else if (onNavigate && typeof onNavigate === 'function') {
            onNavigate('dashboard');
        }
    };

    // Print function
    const handlePrint = () => {
        const printContent = document.getElementById('printable-invoice');
        if (!printContent) return;

        const printWindow = window.open('', '_blank', 'width=900,height=700');
        
        const taxRow = showTax && taxAmount > 0 ? `
            <tr>
                <td colspan="5" style="text-align: right; padding: 8px; border: 1px solid #000;">Tax (${taxRate}%):</td>
                <td style="padding: 8px; border: 1px solid #000; text-align: center;">${formatMoney(taxAmount)}</td>
            </tr>
        ` : '';

        const discountRow = discount > 0 ? `
            <tr>
                <td colspan="5" style="text-align: right; padding: 8px; border: 1px solid #000;">Discount:</td>
                <td style="padding: 8px; border: 1px solid #000; text-align: center;">-${formatMoney(discount)}</td>
            </tr>
        ` : '';

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice ${invoiceNumber}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.4; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                    .customer-info { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #000; padding: 12px 8px; text-align: left; }
                    th { background-color: #f0f0f0; font-weight: bold; }
                    .total-row { font-weight: bold; background-color: #e0e0e0; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 style="margin: 0; color: #2c5aa0;">INVOICE</h1>
                    <p style="margin: 5px 0; font-size: 16px;">Invoice #: ${invoiceNumber || 'Pending'}</p>
                    <p style="margin: 5px 0; font-size: 14px;">Date: ${new Date().toLocaleDateString()}</p>
                </div>

                <div class="customer-info">
                    <h3 style="margin: 0 0 10px 0;">Bill To:</h3>
                    <p style="margin: 5px 0;"><strong>Customer:</strong> ${customerName}</p>
                    ${customerEmail ? `<p style="margin: 5px 0;"><strong>Email:</strong> ${customerEmail}</p>` : ''}
                    ${customerPhone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${customerPhone}</p>` : ''}
                    ${customerAddress ? `<p style="margin: 5px 0;"><strong>Address:</strong> ${customerAddress}</p>` : ''}
                </div>

                <table>
                    <thead>
                        <tr>
                            <th class="text-center">No#</th>
                            <th>Part No</th>
                            <th>Description</th>
                            <th class="text-center">Quantity</th>
                            <th class="text-center">Unit Price</th>
                            <th class="text-center">Total Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoiceItems.map((item, index) => `
                            <tr>
                                <td class="text-center">${item.number}</td>
                                <td>${item.partNo || 'N/A'}</td>
                                <td>${item.description || 'N/A'}</td>
                                <td class="text-center">${item.quantity}</td>
                                <td class="text-center">${formatMoney(item.unitPrice)}</td>
                                <td class="text-center">${formatMoney(item.totalPrice)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="5" class="text-right"><strong>Subtotal:</strong></td>
                            <td class="text-center"><strong>${formatMoney(invoiceSubtotal)}</strong></td>
                        </tr>
                        ${taxRow}
                        ${discountRow}
                        <tr class="total-row">
                            <td colspan="5" class="text-right"><strong>Grand Total:</strong></td>
                            <td class="text-center"><strong>${formatMoney(invoiceTotal)}</strong></td>
                        </tr>
                    </tfoot>
                </table>

                ${notes ? `<div style="margin-top: 30px;"><strong>Notes:</strong><br>${notes}</div>` : ''}
                ${terms ? `<div style="margin-top: 15px;"><strong>Terms:</strong><br>${terms}</div>` : ''}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 1000);
    };

    // Calculate CSV grand total
    const calculateAndDisplayCsvTotal = () => {
        if (!allProducts || allProducts.length <= 1) {
            setFileStatus({ message: 'Please upload product data first.', type: 'error' });
            return;
        }

        try {
            const headerRow = allProducts[0];
            const totalColumnIndex = headerRow.findIndex(h => h.toLowerCase().includes('total'));

            if (totalColumnIndex === -1) {
                throw new Error("'Total' column not found in CSV data.");
            }

            let sum = 0;
            for (let i = 1; i < allProducts.length; i++) {
                const totalCell = allProducts[i][totalColumnIndex];
                const totalValue = parseFloat(totalCell);
                if (!isNaN(totalValue)) {
                    sum += totalValue;
                }
            }

            setCsvGrandTotal(sum);
            setFileStatus({ message: `CSV Grand Total calculated: ${formatMoney(sum)}`, type: 'success' });

        } catch (err) {
            console.error("CSV Total calculation error:", err);
            setFileStatus({ message: `Error calculating CSV total: ${err.message}`, type: 'error' });
        }
    };

    // Scanner function
    const openBarcodeScanner = () => {
        if (window.startScanner) {
            window.startScanner();
        } else {
            setSearchStatus({ message: 'Scanner not available', type: 'error' });
        }
    };

    // Set up callback for when barcode is detected
    useEffect(() => {
        if (!window.setBarcodeCallback) return;

        window.setBarcodeCallback((barcode) => {
            setSearchTerm(barcode);
            performSearch(barcode);
        });
    }, [performSearch]);

    // Click-to-Edit functionality
    const makeCellEditable = (itemId, field, currentValue) => {
        setEditingCell({ itemId, field, value: currentValue });
    };

    const handleCellEditSave = () => {
        if (!editingCell) return;

        const { itemId, field, value } = editingCell;
        
        if (field === 'quantity') {
            updateItemField(itemId, field, parseInt(value) || 1);
        } else if (field === 'unitPrice') {
            // Remove currency symbols and commas for parsing
            const cleanValue = value.replace(/[$,]/g, '');
            updateItemField(itemId, field, parseFloat(cleanValue) || 0);
        } else {
            updateItemField(itemId, field, value);
        }

        setEditingCell(null);
    };

    const handleCellEditCancel = () => {
        setEditingCell(null);
    };

    const handleEditingChange = (e) => {
        setEditingCell(prev => ({
            ...prev,
            value: e.target.value
        }));
    };

    const handleEditingKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleCellEditSave();
        } else if (e.key === 'Escape') {
            handleCellEditCancel();
        }
    };

    // Render editable cell content
    const renderEditableCell = (itemId, field, value, isNumeric = false) => {
        if (editingCell && editingCell.itemId === itemId && editingCell.field === field) {
            return (
                <input
                    type={isNumeric ? "number" : "text"}
                    value={editingCell.value}
                    onChange={handleEditingChange}
                    onKeyDown={handleEditingKeyPress}
                    onBlur={handleCellEditSave}
                    autoFocus
                    className={`w-full px-2 py-1 text-sm border rounded ${
                        isNumeric ? 'text-center' : 'text-left'
                    } ${
                        isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        border: '1px solid #ced4da',
                        borderRadius: '3px',
                        padding: '3px',
                        fontSize: '0.95rem'
                    }}
                />
            );
        }

        let displayValue = value;
        if (field === 'unitPrice') {
            displayValue = formatMoney(value);
        }

        return (
            <div 
                className="editable-cell w-full h-full flex items-center justify-center"
                onClick={() => makeCellEditable(itemId, field, value)}
                title="Click to edit"
            >
                {displayValue || ''}
            </div>
        );
    };

    // Render search results table
    const renderSearchResults = () => {
        if (searchResults.length === 0) {
            return <p className="text-center py-4 text-gray-500">No products to display.</p>;
        }

        const headerRow = allProducts[0];
        const customerNameIndex = headerRow.findIndex(h => h.toLowerCase().includes('customer name'));
        const companyNameIndex = headerRow.findIndex(h => h.toLowerCase().includes('company name'));
        const unitPriceIndex = headerRow.findIndex(h => h.toLowerCase().includes('unit price'));
        const taxIndex = headerRow.findIndex(h => h.toLowerCase().includes('tax'));
        const soldPriceIndex = headerRow.findIndex(h => h.toLowerCase().includes('sold price'));

        return (
            <div className="overflow-x-auto border rounded-lg">
                {searchResults.length > 0 && (
                    <div className={`p-3 mb-3 rounded-lg flex items-center gap-2 ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                        <input
                            type="checkbox"
                            id="selectAllCheckbox"
                            checked={selectedSearchItems.size === searchResults.length}
                            onChange={handleSelectAll}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="selectAllCheckbox" className="text-sm font-medium">
                            Select All ({selectedSearchItems.size} selected)
                        </label>
                    </div>
                )}

                <table className="min-w-full border-collapse">
                    <thead>
                        <tr className={isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}>
                            <th className="border px-2 py-1 text-xs font-bold text-center w-12">Select</th>
                            {headerRow.map((header, index) => {
                                if (index === customerNameIndex || index === companyNameIndex || index === unitPriceIndex || index === taxIndex) {
                                    return null;
                                }
                                return (
                                    <th key={index} className="border px-2 py-1 text-xs font-bold text-center whitespace-nowrap min-w-[100px]">
                                        {header}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {searchResults.map((result, idx) => (
                            <tr 
                                key={idx} 
                                className={`${
                                    idx % 2 === 0 
                                        ? (isDarkMode ? 'bg-gray-800' : 'bg-white') 
                                        : (isDarkMode ? 'bg-gray-750' : 'bg-gray-50')
                                } hover:${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}
                            >
                                <td className="border px-2 py-1 text-center">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedSearchItems.has(result.rowIndex)}
                                        onChange={() => handleSearchItemSelect(result.rowIndex)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </td>
                                {result.data.map((cell, index) => {
                                    if (index === customerNameIndex || index === companyNameIndex || index === unitPriceIndex || index === taxIndex) {
                                        return null;
                                    }
                                    const isSoldPriceColumn = index === soldPriceIndex;
                                    return (
                                        <td key={index} className={`border px-2 py-1 text-sm text-center break-words min-w-[100px] max-w-[200px] ${
                                            isSoldPriceColumn ? 'font-semibold text-green-600' : ''
                                        }`}>
                                            {cell}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // Updated renderInvoiceTable function using click-to-edit
    const renderInvoiceTable = () => {
        if (invoiceItems.length === 0) {
            return (
                <tr>
                    <td colSpan="7" style={{textAlign: 'center'}}>
                        No items added to invoice.
                    </td>
                </tr>
            );
        }

        return (
            <>
                {invoiceItems.map((item) => (
                    <tr key={item.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-50'}>
                        <td className="font-medium whitespace-nowrap">
                            {item.number}
                        </td>
                        <td>
                            {renderEditableCell(item.id, 'partNo', item.partNo, false)}
                        </td>
                        <td>
                            {renderEditableCell(item.id, 'description', item.description, false)}
                        </td>
                        <td>
                            {renderEditableCell(item.id, 'quantity', item.quantity, true)}
                        </td>
                        <td>
                            {renderEditableCell(item.id, 'unitPrice', item.unitPrice, true)}
                        </td>
                        <td className="font-semibold text-green-600">
                            {formatMoney(item.totalPrice)}
                        </td>
                        <td className="text-center whitespace-nowrap">
                            <button
                                onClick={() => deleteItem(item.id)}
                                className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                            >
                                <TrashIcon className="h-3 w-3 inline" />
                            </button>
                        </td>
                    </tr>
                ))}
                
                {showTax && taxAmount > 0 && (
                    <tr className={`${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'} font-semibold`}>
                        <td colSpan="5" className="text-right">
                            Tax ({taxRate}%):
                        </td>
                        <td className="text-green-600">
                            {formatMoney(taxAmount)}
                        </td>
                        <td></td>
                    </tr>
                )}
            </>
        );
    };

    return (
        <div className={`min-h-screen px-3 sm:px-5 py-4 ${
            isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
        }`}>
            {/* Notification */}
            {notification.show && (
                <div className={`fixed top-4 right-4 z-50 p-3 rounded shadow ${
                    notification.type === "error"
                        ? "bg-red-500 text-white"
                        : "bg-green-500 text-white"
                }`}>
                    {notification.message}
                </div>
            )}

            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-lg border`}>
                        <div className="flex items-center gap-3">
                            <RefreshIcon className="h-5 w-5 animate-spin" />
                            <span className="font-medium">Processing...</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto space-y-5">
                {/* Header */}
                <div className={`p-4 ${cardClass}`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleBackToDashboard}
                                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                            >
                                <ArrowLeftIcon className="h-5 w-5" />
                            </button>
                            <h1 className="text-lg font-bold flex items-center gap-2">
                                <DocumentIcon className="h-6 w-6 text-blue-500" />
                                Create Invoice from CSV
                            </h1>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm"
                            >
                                <DocumentDuplicateIcon className="h-4 w-4 inline mr-1" />
                                Invoices History
                            </button>
                            <button
                                onClick={() => setShowCsvModal(true)}
                                className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm"
                            >
                                <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                                Current Csv
                            </button>
                        </div>
                    </div>
                </div>

                {/* Database Import Section */}
                <div className={`p-4 ${cardClass}`}>
                    <h2 className="font-semibold mb-3">First Import Products To The DB</h2>
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <div className="flex-1 w-full">
                            <CsvManagement
                                onProductsImported={() => console.log('Products imported')}
                                isDarkMode={isDarkMode}
                            />
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                            Import products to database before creating invoices. This ensures all items are available in the product catalog.
                        </div>
                    </div>
                </div>

                {/* File Upload Section */}
                <div className={`p-4 ${cardClass}`}>
                    <h2 className="font-semibold mb-3">Upload Product Data (CSV) for Invoice</h2>
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-3">
                        <div className="flex-1 min-w-0">
                            <input
                                type="file"
                                accept=".csv"
                                multiple
                                onChange={handleFileUpload}
                                className={`${inputClass} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100`}
                                ref={fileInputRef}
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setShowCsvModal(true)}
                                disabled={allProducts.length === 0}
                                className={buttonClass('gray', 'sm')}
                            >
                                Display CSV
                            </button>
                            <button
                                onClick={calculateAndDisplayCsvTotal}
                                disabled={allProducts.length === 0}
                                className={buttonClass('green', 'sm')}
                            >
                                CSV Total
                            </button>
                        </div>
                    </div>
                    {fileStatus.message && (
                        <div className={`p-2 rounded text-sm ${fileStatus.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
                                fileStatus.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
                                    'bg-blue-100 text-blue-800 border border-blue-200'
                            } ${isDarkMode ? '!bg-opacity-20' : ''}`}>
                            {fileStatus.message}
                        </div>
                    )}
                </div>
                {/* Search Section - Mobile Optimized */}
                <div className={`p-3 sm:p-4 invoice-mobile-card ${cardClass}`}>
                    <h2 className="font-semibold mb-3 text-base sm:text-lg">Search Products</h2>

                    {/* Mobile-optimized search input with action buttons */}
                    <div className="flex flex-col xs:flex-row gap-2 mb-3">
                        {/* Search input with integrated search button for mobile */}
                        <div className="relative flex-1 search-input-320">
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search part no or description..."
                                className={`w-full px-3 py-3 sm:py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 invoice-mobile-input ${isDarkMode
                                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                    }`}
                                onKeyPress={(e) => e.key === 'Enter' && performSearch()}
                            />
                            {/* Mobile search button inside input */}
                            <button
                                onClick={() => performSearch()}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 sm:hidden p-1.5 rounded-md bg-blue-500 hover:bg-blue-600 text-white"
                                aria-label="Search"
                            >
                                <SearchIcon className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Action buttons - mobile optimized layout */}
                        <div className="flex flex-wrap gap-2 gap-xs-1">
                            {/* Scan button - full width on very small screens */}
                            <button
                                onClick={openBarcodeScanner}
                                className="flex-1 xs:flex-none flex items-center justify-center gap-1 px-3 py-3 sm:px-3 sm:py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium whitespace-nowrap min-w-[70px] button-responsive"
                                title="Scan barcode"
                            >
                                <CameraIcon className="h-4 w-4" />
                                <span className="hidden xs:inline">Scan</span>
                            </button>

                            {/* Desktop search button - hidden on mobile */}
                            <button
                                onClick={() => performSearch()}
                                className="hidden sm:flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium whitespace-nowrap"
                            >
                                <SearchIcon className="h-4 w-4" />
                                <span>Search</span>
                            </button>
                        </div>
                    </div>

                    {/* Secondary action buttons - row for mobile */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        <button
                            onClick={displayAllProducts}
                            disabled={allProducts.length === 0}
                            className={`flex-1 xs:flex-none flex items-center justify-center px-3 py-3 sm:px-3 sm:py-2 text-sm font-medium rounded-lg whitespace-nowrap invoice-mobile-button ${allProducts.length === 0
                                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                        >
                            Display All
                        </button>

                        <button
                            onClick={resetSearch}
                            className="flex-1 xs:flex-none flex items-center justify-center gap-1 px-3 py-3 sm:px-3 sm:py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium whitespace-nowrap invoice-mobile-button"
                        >
                            <RefreshIcon className="h-4 w-4" />
                            <span className="hidden xs:inline">Reset</span>
                        </button>
                    </div>

                    {/* Status message with better mobile styling */}
                    {searchStatus.message && (
                        <div className={`p-3 rounded-lg text-sm mb-3 ${searchStatus.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800' :
                                searchStatus.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' :
                                    'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            }`}>
                            <div className="flex items-start">
                                <span className="flex-1 break-words">{searchStatus.message}</span>
                                <button
                                    onClick={() => setSearchStatus({ message: '', type: '' })}
                                    className="ml-2 text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 btn-xs-tiny"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Mobile helper tip */}
                    <div className="sm:hidden mb-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            💡 Press Enter to search or tap the 🔍 button
                        </p>
                    </div>

                    {/* Search Results */}
                    <div className="border rounded-lg overflow-hidden">
                        {renderSearchResults()}
                    </div>

                    {/* Add Selected Items Button - Mobile optimized */}
                    {selectedSearchItems.size > 0 && (
                        <div className="mt-4 flex flex-col xs:flex-row gap-2 justify-between items-center">
                            <span className="text-sm font-medium text-xs-tiny">
                                ✅ {selectedSearchItems.size} item(s) selected
                            </span>
                            <button
                                onClick={processSelectedItems}
                                className="w-full xs:w-auto flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors invoice-mobile-button"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Add Selected Items ({selectedSearchItems.size})
                            </button>
                        </div>
                    )}
                </div>

                {/* Quick Actions Bar - Mobile Optimized */}
                <div className="space-y-3">
                    {/* Main action buttons - mobile optimized */}
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        {/* Print button */}
                        <button
                            onClick={handlePrint}
                            disabled={invoiceItems.length === 0}
                            className={`flex-1 xs:flex-none flex items-center justify-center gap-2 px-4 py-3 sm:px-3 sm:py-2 rounded-lg font-medium text-sm transition-all duration-200 invoice-mobile-button ${invoiceItems.length === 0
                                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                                }`}
                        >
                            <PrinterIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="whitespace-nowrap">Print</span>
                        </button>

                        {/* New Invoice button */}
                        <button
                            onClick={() => {
                                if (window.confirm('Clear current invoice and start new?')) {
                                    setInvoiceItems([]);
                                    setInvoiceCounter(1);
                                    setInvoiceNumber('');
                                    setCustomerName('');
                                    setCustomerEmail('');
                                    setCustomerPhone('');
                                    setCustomerAddress('');
                                    setTaxRate(0);
                                    setDiscount(0);
                                    setPaymentMethod('');
                                    setNotes('');
                                    setTerms('Payment due within 30 days. Late payments subject to fees.');
                                }
                            }}
                            className="flex-1 xs:flex-none flex items-center justify-center px-4 py-3 sm:px-3 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-all duration-200 active:scale-95 invoice-mobile-button whitespace-nowrap"
                        >
                            New Invoice
                        </button>

                        {/* Save Invoice button */}
                        <button
                            onClick={handleSaveInvoice}
                            disabled={saving || invoiceItems.length === 0 || !customerName}
                            className={`flex-1 xs:flex-none flex items-center justify-center gap-2 px-4 py-3 sm:px-3 sm:py-2 rounded-lg font-medium text-sm transition-all duration-200 invoice-mobile-button ${(saving || invoiceItems.length === 0 || !customerName)
                                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white active:scale-95'
                                }`}
                        >
                            <SaveIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="whitespace-nowrap">
                                {saving ? (
                                    <>
                                        <span className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1"></span>
                                        Saving...
                                    </>
                                ) : 'Save Invoice'}
                            </span>
                        </button>
                    </div>

                    {/* Status controls - stacked on mobile */}
                    <div className="flex flex-col xs:flex-row flex-wrap gap-3 justify-center sm:justify-start">
                        {/* Status dropdowns - full width on mobile */}
                        <div className="w-full xs:w-auto invoice-status-mobile">
                            <GenericDropdown
                                label="Invoice Status"
                                current={invoiceStatus}
                                options={INVOICE_STATUS_OPTIONS}
                                onChange={(value) => {
                                    setInvoiceStatus(value);
                                    handleStatusUpdate('status', value);
                                }}
                                isDarkMode={isDarkMode}
                            />
                        </div>

                        <div className="w-full xs:w-auto invoice-status-mobile">
                            <GenericDropdown
                                label="Payment Status"
                                current={paymentStatus}
                                options={PAYMENT_STATUS_OPTIONS}
                                onChange={(value) => {
                                    setPaymentStatus(value);
                                    handleStatusUpdate('paymentStatus', value);
                                }}
                                isDarkMode={isDarkMode}
                            />
                        </div>

                        {/* Tax Toggle Button - full width on small screens */}
                        <button
                            onClick={() => setShowTax(!showTax)}
                            className={`flex items-center justify-center gap-2 px-4 py-3 sm:px-3 sm:py-2 rounded-lg font-medium text-sm transition-all duration-200 active:scale-95 invoice-mobile-button ${showTax
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                                }`}
                        >
                            {showTax ? (
                                <>
                                    <CheckCircleIcon className="h-4 w-4 flex-shrink-0" />
                                    <span className="whitespace-nowrap">Tax ON</span>
                                </>
                            ) : (
                                <>
                                    <XIcon className="h-4 w-4 flex-shrink-0" />
                                    <span className="whitespace-nowrap">Tax OFF</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Mobile helper text */}
                    <div className="sm:hidden">
                        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                            💡 Swipe left/right to see more actions
                        </p>
                    </div>
                </div>
                {/* Invoice Form Section */}
                <div className={`p-4 ${cardClass}`}>
                    <h2 className="font-semibold mb-3 flex items-center gap-2">
                        <ClipboardIcon className="h-5 w-5 text-green-500" />
                        Invoice Details
                    </h2>

                    {/* Customer Info */}
                    {/* Customer Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                            <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                Customer
                            </label>
                            <div className="flex gap-1">
                                <select
                                    value={customerId || ''}
                                    onChange={(e) => {
                                        const selectedCustomer = customers.find(c => c.id === parseInt(e.target.value));
                                        if (selectedCustomer) {
                                            handleCustomerSelect(selectedCustomer);
                                        } else {
                                            setCustomerId(null);
                                            setCustomerName('');
                                            setCustomerEmail('');
                                            setCustomerPhone('');
                                            setCustomerAddress('');
                                        }
                                    }}
                                    className={inputClass}
                                >
                                    <option value="">Select Customer</option>
                                    {customers.map(customer => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => setShowCustomerModal(true)}
                                    className={buttonClass('gray', 'sm')}
                                    title="Manage Customers"
                                >
                                    <UserIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                Customer Name
                            </label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Enter customer name"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                Invoice Number
                            </label>
                            <input
                                type="text"
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                placeholder="Auto-generated if empty"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                Date
                            </label>
                            <div className={`px-3 py-2 rounded-lg border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
                                }`}>
                                {new Date().toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {/* Additional Customer Fields - Fixed Dark Mode */}
                    {(customerEmail || customerPhone || customerAddress) && (
                        <div className={`mt-4 p-4 border rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 ${isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-gray-200'
                                : 'bg-gray-50 border-gray-200 text-gray-700'
                            }`}>
                            <div>
                                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    Email
                                </label>
                                <div className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'
                                    }`}>
                                    {customerEmail || '-'}
                                </div>
                            </div>
                            <div>
                                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    Phone
                                </label>
                                <div className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'
                                    }`}>
                                    {customerPhone || '-'}
                                </div>
                            </div>
                            <div>
                                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    Address
                                </label>
                                <div className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'
                                    }`}>
                                    {customerAddress || '-'}
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Tax, Discount, and Payment */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-sm mb-1">Tax Rate (%)</label>
                            <input
                                type="number"
                                value={taxRate}
                                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                step="0.01"
                                min="0"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1">Discount ($)</label>
                            <input
                                type="number"
                                value={discount}
                                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                step="0.01"
                                min="0"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1">Payment Method</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className={inputClass}
                            >
                                <option value="">Select Method</option>
                                {PAYMENT_METHODS.map(method => (
                                    <option key={method} value={method}>{method.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <GenericDropdown
                            label="Shipment Status"
                            current={shipmentStatus}
                            options={SHIPMENT_STATUS_OPTIONS}
                            onChange={(value) => {
                                setShipmentStatus(value);
                                handleStatusUpdate('shipmentStatus', value);
                            }}
                            isDarkMode={isDarkMode}
                        />
                    </div>

                    {/* Profit Summary */}
                    {profitMetrics.totalRevenue > 0 && (
                        <div className={`mt-4 p-4 rounded-lg border ${
                            isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-green-50 border-green-200'
                        }`}>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <CurrencyDollarIcon className="h-4 w-4 text-green-600" />
                                Profit Summary
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <div className="text-gray-600 dark:text-gray-400">Total Cost</div>
                                    <div className="font-semibold">{formatMoney(profitMetrics.totalCost)}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600 dark:text-gray-400">Total Revenue</div>
                                    <div className="font-semibold">{formatMoney(profitMetrics.totalRevenue)}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600 dark:text-gray-400">Total Profit</div>
                                    <div className={`font-semibold ${
                                        profitMetrics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {formatMoney(profitMetrics.totalProfit)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-600 dark:text-gray-400">Profit Margin</div>
                                    <div className={`font-semibold ${
                                        profitMetrics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {profitMetrics.profitMargin.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notes and Terms */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-2">Notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows="3"
                                placeholder="Additional notes..."
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-2">Terms & Conditions</label>
                            <textarea
                                value={terms}
                                onChange={(e) => setTerms(e.target.value)}
                                rows="3"
                                placeholder="Payment terms and conditions..."
                                className={inputClass}
                            />
                        </div>
                    </div>
                </div>

{/* Invoice Items Table with Click-to-Edit */}
<div className={`p-4 ${cardClass}`}>
    <h2 className="font-semibold mb-4 flex items-center gap-2">
        <ShoppingBagIcon className="h-5 w-5 text-purple-500" />
        Invoice Items
        <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
            {invoiceItems.length} item(s)
        </span>
    </h2>

                    {/* Mobile-optimized table container */}
                    <div className="invoice-table-scroll-container">
                        <div className="invoice-table-container">
                            <table className="invoice-table">
                                <thead>
                                    <tr>
                                        <th className="whitespace-nowrap">No#</th>
                                        <th className="whitespace-nowrap">Part No</th>
                                        <th className="whitespace-nowrap">Description</th>
                                        <th className="whitespace-nowrap">Quantity</th>
                                        <th className="whitespace-nowrap">Unit Price</th>
                                        <th className="whitespace-nowrap">Total Price</th>
                                        <th className="whitespace-nowrap">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {renderInvoiceTable()}
                                </tbody>
                                {invoiceItems.length > 0 && (
                                    <tfoot>
                                        <tr className="invoice-total-row">
                                            <td colSpan="5" className="text-center font-semibold">
                                                Total Invoice Amount:
                                            </td>
                                            <td className="text-lg font-bold">
                                                {formatMoney(invoiceTotal)}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>

                            {/* Mobile scroll hint */}
                            <div className="mobile-scroll-hint">
                                <div className="flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    </svg>
                                    <span>Scroll horizontally to see all columns</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Add Empty Item Button */}
                    <div className="flex justify-start mt-4">
                        <button
                            onClick={handleAddEmptyItem}
                            className={`${buttonClass('green', 'sm')} flex items-center gap-2`}
                        >
                            <PlusIcon className="h-4 w-4" />
                            Add Empty Item
                        </button>
                    </div>
                </div>

                {/* Totals + Actions - Mobile Optimized */}
                <div className={`p-4 ${cardClass}`}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-3 flex-1 w-full">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <p className="text-sm">
                                        <strong>Subtotal:</strong> {formatMoney(invoiceSubtotal)}
                                    </p>
                                    {showTax && taxAmount > 0 && (
                                        <p className="text-sm">
                                            <strong>Tax ({taxRate}%):</strong> {formatMoney(taxAmount)}
                                        </p>
                                    )}
                                    {discount > 0 && (
                                        <p className="text-sm">
                                            <strong>Discount:</strong> -{formatMoney(discount)}
                                        </p>
                                    )}
                                </div>

                                {profitMetrics.totalRevenue > 0 && (
                                    <div className="space-y-1">
                                        <p className="text-sm">
                                            <strong>Cost:</strong> {formatMoney(profitMetrics.totalCost)}
                                        </p>
                                        <p className="text-sm">
                                            <strong className="text-green-600 dark:text-green-400">Profit:</strong>
                                            <span className="ml-1 text-green-600 dark:text-green-400">
                                                {formatMoney(profitMetrics.totalProfit)}
                                            </span>
                                        </p>
                                        <p className="text-sm">
                                            <strong>Margin:</strong>
                                            <span className={`ml-1 ${profitMetrics.profitMargin >= 0
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-red-600 dark:text-red-400'
                                                }`}>
                                                {profitMetrics.profitMargin.toFixed(2)}%
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t">
                                <p className="text-lg font-bold">
                                    Grand Total: {formatMoney(invoiceTotal)}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <button
                                onClick={handlePrint}
                                disabled={invoiceItems.length === 0}
                                className={`${buttonClass('blue', 'sm')} flex items-center justify-center gap-2 flex-1 sm:flex-none ${invoiceItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                <PrinterIcon className="h-4 w-4" />
                                <span>Print</span>
                            </button>
                            <button
                                onClick={handleSaveInvoice}
                                disabled={saving || invoiceItems.length === 0 || !customerName}
                                className={`${buttonClass('green', 'sm')} flex items-center justify-center gap-2 flex-1 sm:flex-none ${(saving || invoiceItems.length === 0 || !customerName) ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                {saving ? (
                                    <>
                                        <span className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <SaveIcon className="h-4 w-4" />
                                        <span>Save Invoice</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden printable content */}
            <div id="printable-invoice" className="p-6" style={{ display: 'none' }}>
                {/* Printable content */}
            </div>

            {/* Modals */}
            {showCustomerModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-3xl mx-2 rounded-lg shadow-lg overflow-hidden">
                        <div className="flex justify-between items-center p-3 border-b">
                            <h3 className="font-semibold">Customer Management</h3>
                            <button
                                onClick={() => setShowCustomerModal(false)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                                <XIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 overflow-auto max-h-[70vh]">
                            <CustomerManagement
                                isDarkMode={isDarkMode}
                                onCustomerSelect={handleCustomerSelect}
                                embedded={true}
                            />
                        </div>
                    </div>
                </div>
            )}

            {showCsvModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-6xl mx-2 rounded-lg shadow-lg overflow-hidden">
                        <div className="flex justify-between items-center p-3 border-b">
                            <h3 className="font-semibold">CSV Data</h3>
                            <button
                                onClick={() => setShowCsvModal(false)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                                <XIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 overflow-auto max-h-[70vh]">
                            {allProducts.length > 0 ? (
                                <div className="overflow-x-auto border rounded-lg">
                                    <table className="min-w-full border-collapse">
                                        <thead>
                                            <tr className={isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}>
                                                {allProducts[0].map((header, index) => (
                                                    <th key={index} className="border px-2 py-1 text-xs font-bold text-center whitespace-nowrap min-w-[100px]">
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allProducts.slice(1).map((row, rowIndex) => (
                                                <tr key={rowIndex} className={`${rowIndex % 2 === 0
                                                        ? (isDarkMode ? 'bg-gray-800' : 'bg-white')
                                                        : (isDarkMode ? 'bg-gray-750' : 'bg-gray-50')
                                                    }`}>
                                                    {row.map((cell, cellIndex) => (
                                                        <td key={cellIndex} className="border px-2 py-1 text-sm text-center break-words min-w-[100px] max-w-[200px]">
                                                            {cell}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p>No CSV data available.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showImportModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-5xl mx-2 rounded-lg shadow-lg overflow-hidden">
                        <div className="flex justify-between items-center p-3 border-b">
                            <h3 className="font-semibold">Invoice History</h3>
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                                <XIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 overflow-auto max-h-[70vh]">
                            <InvoiceHistory 
                                isDarkMode={isDarkMode}
                                onInvoiceSelect={handleImportInvoice}
                                embedded={true}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Item Processing Modal */}
            {showItemProcessing && currentProcessingItem && (
                <ItemProcessingModal
                    isDarkMode={isDarkMode}
                    item={currentProcessingItem}
                    onProcessItem={handleProcessedItem}
                    onCancel={() => {
                        setShowItemProcessing(false);
                        setCurrentProcessingItem(null);
                        setProcessingQueue([]);
                    }}
                />
            )}
        </div>
    );
};

export default InvoiceFromCsv;