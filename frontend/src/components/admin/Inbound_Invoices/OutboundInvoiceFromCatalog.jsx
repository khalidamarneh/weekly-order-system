
// frontend/src/components/admin/Inbound_Invoices/OutboundInvoiceFromCatalog.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
    PrinterIcon,
    ShareIcon,
    PencilAltIcon,
    TrashIcon,
    PlusIcon,
    SaveIcon,
    RefreshIcon,
    XIcon,
    MailIcon,
    ChevronDownIcon,
    CheckCircleIcon,
    UserIcon,
    ShoppingCartIcon,
    ArrowLeftIcon,
    TruckIcon,
    CurrencyDollarIcon,
    CreditCardIcon,
    DocumentTextIcon
} from '@heroicons/react/outline';
import api from '../../../services/api';
import GlobalProductCatalog from '../../shared/GlobalProductCatalog';
import CustomerManagement from '../sales/CustomerManagement';

const INVOICE_STATUS_OPTIONS = ['DRAFT', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'];
const PAYMENT_STATUS_OPTIONS = ['PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'];
const SHIPMENT_STATUS_OPTIONS = ['PENDING', 'PACKED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'];
const PAYMENT_METHODS = ['CASH', 'CREDIT_CARD', 'BANK_TRANSFER', 'CHECK', 'DIGITAL_WALLET', 'OTHER'];

// Create fallback for XCircleIcon
const XCircleIcon = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const inputBaseClass = (isDark) =>
    `w-full rounded-lg px-3 py-2 text-sm outline-none transition-all duration-200 border ${
        isDark 
            ? 'bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white' 
            : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900'
    }`;

const buttonBaseClass = (isDark, color = 'gray', size = 'md') => {
    const base = `rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
        size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm'
    }`;
    const colors = {
        gray: isDark 
            ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600' 
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300',
        blue: 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-700',
        green: 'bg-green-600 hover:bg-green-700 text-white border border-green-700',
        orange: 'bg-orange-600 hover:bg-orange-700 text-white border border-orange-700',
        red: 'bg-red-600 hover:bg-red-700 text-white border border-red-700',
        indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700',
        purple: 'bg-purple-600 hover:bg-purple-700 text-white border border-purple-700',
        cyan: 'bg-cyan-600 hover:bg-cyan-700 text-white border border-cyan-700'
    };
    return `${base} ${colors[color]}`;
};

const OutboundInvoiceFromCatalog = ({ isDarkMode = false, onNavigate }) => {
    // blank template for invoice
    const blankInvoice = {
        id: null,
        invoiceNumber: null,
        customerId: null,
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        clientId: null,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [],
        subtotal: 0,
        taxRate: 0,
        taxAmount: 0,
        discount: 0,
        totalAmount: 0,
        paidAmount: 0,
        balanceDue: 0,
        paymentMethod: '',
        shippingAddress: '',
        trackingNumber: '',
        notes: '',
        terms: 'Payment due within 30 days. Late payments subject to fees.',
        status: 'DRAFT',
        paymentStatus: 'PENDING',
        shipmentStatus: 'PENDING',
        baseCost: 0,
        markupAmount: 0,
        markupPercentage: 0,
        companyInfo: {
            name: 'Your Company Name',
            address: '123 Business St, City',
            phone: '(555) 123-4567',
            email: 'invoices@company.com'
        },
        createdAt: new Date().toISOString()
    };

    const [invoice, setInvoice] = useState(blankInvoice);
    const [savedInvoices, setSavedInvoices] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);

    // UI controls
    const [showCatalog, setShowCatalog] = useState(false);
    const [catalogSelection, setCatalogSelection] = useState([]);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showTax, setShowTax] = useState(true);
    const [editingItemId, setEditingItemId] = useState(null);
    const [editingDraft, setEditingDraft] = useState({ quantity: 1, unitPrice: 0 });

    useEffect(() => {
        loadSavedInvoices();
        loadCustomers();
    }, []);

    const loadSavedInvoices = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/outbound-invoices');
            setSavedInvoices(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error loading invoices', err);
            setSavedInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    const loadCustomers = async () => {
        try {
            const res = await api.get('/api/customers');
            setCustomers(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed loading customers', err);
            setCustomers([]);
        }
    };

    // computed totals
    const subtotal = useMemo(() => {
        return invoice.items.reduce((s, it) => s + (Number(it.unitPrice || 0) * Number(it.quantity || 0)), 0);
    }, [invoice.items]);

    const taxAmount = useMemo(() => {
        return (subtotal * (Number(invoice.taxRate || 0) / 100));
    }, [subtotal, invoice.taxRate]);

    const totalAmount = useMemo(() => {
        const amountAfterTax = subtotal + (showTax ? taxAmount : 0);
        return amountAfterTax - (invoice.discount || 0);
    }, [subtotal, taxAmount, invoice.discount, showTax]);

    const formatMoney = (v) => `$${Number(v || 0).toFixed(2)}`;

    // Map items to backend payload - FIXED VERSION
    const buildItemsPayload = (items) => items.map(it => ({
        productId: it.productId ? parseInt(it.productId) : null,
        name: it.name || 'Unnamed Product',
        partNo: it.partNo || '',
        description: it.description || '',
        image: it.image || '',
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        totalPrice: Number(it.unitPrice || 0) * Number(it.quantity || 0),
        unitCost: Number(it.unitCost) || 0, // Changed from null to 0
        markupAmount: Number(it.markupAmount) || 0, // Changed from null to 0
        markupPercentage: Number(it.markupPercentage) || 0 // Changed from null to 0
    }));

    // Validation rules
    const validateForCreate = () => {
        if (!invoice.customerName || invoice.customerName.trim() === '') { 
            alert('Customer name is required.'); 
            return false; 
        }
        if (!invoice.items || invoice.items.length === 0) { 
            alert('At least one item is required.'); 
            return false; 
        }
        return true;
    };

    // Save invoice
    const saveInvoice = async ({ forceNew = false } = {}) => {
        try {
            setLoading(true);

            const payload = {
                customerName: invoice.customerName,
                customerEmail: invoice.customerEmail || '',
                customerPhone: invoice.customerPhone || '',
                customerAddress: invoice.customerAddress || '',
                issueDate: invoice.issueDate,
                dueDate: invoice.dueDate,
                items: buildItemsPayload(invoice.items),
                subtotal,
                taxRate: Number(invoice.taxRate || 0),
                taxAmount: Number(taxAmount || 0),
                discount: Number(invoice.discount || 0),
                totalAmount: Number(totalAmount || 0),
                paymentMethod: invoice.paymentMethod || '',
                shippingAddress: invoice.shippingAddress || '',
                notes: invoice.notes || '',
                terms: invoice.terms || '',
                baseCost: invoice.baseCost || 0,
                markupAmount: invoice.markupAmount || 0,
                markupPercentage: invoice.markupPercentage || 0,
                status: invoice.status,
                paymentStatus: invoice.paymentStatus,
                shipmentStatus: invoice.shipmentStatus
            };

            if (invoice.customerId) {
                payload.customerId = invoice.customerId;
            }

            let response;
            
            if (!invoice.id || forceNew) {
                if (!validateForCreate()) return null;
                response = await api.post('/api/outbound-invoices', payload);
                const created = response.data;
                setInvoice(prev => ({
                    ...prev,
                    id: created.id,
                    invoiceNumber: created.invoiceNumber,
                    status: 'DRAFT',
                    isNew: false,
                    createdAt: created.createdAt || prev.createdAt
                }));
                setSavedInvoices(prev => [created, ...prev]);
                alert(`Invoice saved as draft! Number: ${created.invoiceNumber}`);
                return created;
            } else {
                if (invoice.status !== 'DRAFT') {
                    alert('Cannot update a sent invoice. Please create a new invoice.');
                    return null;
                }
                response = await api.put(`/api/outbound-invoices/${invoice.id}`, payload);
                const updated = response.data;
                setSavedInvoices(prev => prev.map(q => q.id === updated.id ? updated : q));
                setInvoice(prev => ({ ...prev, status: updated.status || prev.status }));
                alert('Draft invoice updated successfully!');
                return updated;
            }
        } catch (err) {
            console.error('Save error', err);
            const msg = err?.response?.data?.message || err.message || 'Failed to save';
            alert('Error: ' + msg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Update status
    const updateStatus = async (field, newStatus) => {
        try {
            setInvoice(prev => ({ ...prev, [field]: newStatus }));
            if (invoice.id) {
                const updateData = { [field]: newStatus };
                await api.put(`/api/outbound-invoices/${invoice.id}/status`, updateData);
                await loadSavedInvoices();
            }
        } catch (err) {
            console.error('Status update failed', err);
            alert('Failed to update status');
        }
    };

    // Send invoice
    const sendInvoice = async () => {
        try {
            if (!invoice.id) {
                const created = await saveInvoice();
                if (!created) return;
            }
            await updateStatus('status', 'SENT');
            alert('Invoice sent (status updated).');
        } catch (err) {
            console.error('send failed', err);
        }
    };

    const deleteInvoice = async (id) => {
        if (!window.confirm('Delete invoice?')) return;
        try {
            await api.delete(`/api/outbound-invoices/${id}`);
            setSavedInvoices(prev => prev.filter(q => q.id !== id));
            if (invoice.id === id) setInvoice(blankInvoice);
            alert('Deleted.');
        } catch (err) {
            console.error(err);
            alert(err?.response?.data?.message || 'Failed to delete.');
        }
    };

    // Items operations
    const addItem = (product) => {
        const newItem = {
            id: `i-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            productId: product.id || product.productId || null,
            name: product.name || product.title || 'New Item',
            partNo: product.partNo || '',
            description: product.description || '',
            image: product.image || product.thumbnail || '',
            quantity: Number(product.quantity) || 1,
            unitPrice: Number(product.salePrice ?? product.unitPrice ?? 0),
            unitCost: Number(product.costPrice ?? 0),
            markupAmount: 0,
            markupPercentage: 0,
            totalPrice: (Number(product.salePrice ?? product.unitPrice ?? 0) * (Number(product.quantity) || 1))
        };
        
        // Calculate markup if cost price is available
        if (newItem.unitCost && newItem.unitCost > 0) {
            newItem.markupAmount = newItem.unitPrice - newItem.unitCost;
            newItem.markupPercentage = ((newItem.markupAmount / newItem.unitCost) * 100);
        }
        
        setInvoice(prev => ({ ...prev, items: [...prev.items, newItem] }));
    };

    const addMultipleItems = (arr) => {
        const items = arr.map(p => ({
            id: `i-${Date.now()}-${Math.floor(Math.random() * 1000)}-${Math.floor(Math.random() * 1000)}`,
            productId: p.id || p.productId || null,
            name: p.name || p.title || 'New Item',
            partNo: p.partNo || '',
            description: p.description || '',
            image: p.image || p.thumbnail || '',
            quantity: Number(p.quantity) || 1,
            unitPrice: Number(p.salePrice ?? p.unitPrice ?? 0),
            unitCost: Number(p.costPrice ?? 0),
            markupAmount: 0,
            markupPercentage: 0,
            totalPrice: (Number(p.salePrice ?? p.unitPrice ?? 0) * (Number(p.quantity) || 1))
        })).map(item => {
            // Calculate markup for each item
            if (item.unitCost && item.unitCost > 0) {
                item.markupAmount = item.unitPrice - item.unitCost;
                item.markupPercentage = ((item.markupAmount / item.unitCost) * 100);
            }
            return item;
        });
        
        setInvoice(prev => ({ ...prev, items: [...prev.items, ...items] }));
    };

    const removeItemLocal = (itemId) => {
        if (!window.confirm('Remove item?')) return;
        setInvoice(prev => ({ ...prev, items: prev.items.filter(it => it.id !== itemId) }));
    };

    const startEditItem = (it) => {
        setEditingItemId(it.id);
        setEditingDraft({ quantity: it.quantity, unitPrice: it.unitPrice });
    };

    const saveEditItem = (id) => {
        setInvoice(prev => ({
            ...prev,
            items: prev.items.map(it => it.id === id ? { 
                ...it, 
                quantity: Number(editingDraft.quantity) || 1, 
                unitPrice: Number(editingDraft.unitPrice) || 0,
                totalPrice: Number(editingDraft.unitPrice || 0) * Number(editingDraft.quantity || 1)
            } : it)
        }));
        setEditingItemId(null);
        setEditingDraft({ quantity: 1, unitPrice: 0 });
    };

    const cancelEditItem = () => {
        setEditingItemId(null);
        setEditingDraft({ quantity: 1, unitPrice: 0 });
    };

    // Catalog selection callback
    const handleCatalogItemsUpdate = (items) => {
        const arr = Array.isArray(items) ? items : [items];
        setCatalogSelection(arr);
    };

    // Catalog add function
    const handleCatalogAddSelected = () => {
        if (!catalogSelection || catalogSelection.length === 0) {
            alert('No items selected in catalog. Please select items first.');
            return;
        }
        
        const itemsToAdd = [...catalogSelection];
        setCatalogSelection([]);
        addMultipleItems(itemsToAdd);
        setShowCatalog(false);
        
        if (itemsToAdd.length === 1) {
            alert(`Added "${itemsToAdd[0].name}" to invoice`);
        } else {
            alert(`Added ${itemsToAdd.length} items to invoice`);
        }
    };

    // Customer selection
    const handleCustomerSelect = (customer) => {
        if (!customer) return;
        setInvoice(prev => ({
            ...prev,
            customerId: customer.id,
            customerName: customer.name || prev.customerName,
            customerEmail: customer.email || prev.customerEmail,
            customerPhone: customer.phone || prev.customerPhone,
            customerAddress: customer.address || prev.customerAddress
        }));
        setShowCustomerModal(false);
        setTimeout(() => {
            loadCustomers();
        }, 500);
    };

    // Load invoice for edit
    const loadInvoiceForEdit = (inv) => {
        const items = (inv.items || []).map(it => ({
            id: it.id ? `it-${it.id}` : `it-${Math.random()}`,
            productId: it.productId || null,
            name: it.name || '',
            partNo: it.partNo || '',
            description: it.description || '',
            image: it.image || '',
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            unitCost: Number(it.unitCost) || 0,
            markupAmount: Number(it.markupAmount) || 0,
            markupPercentage: Number(it.markupPercentage) || 0,
            totalPrice: Number(it.totalPrice) || 0
        }));

        setInvoice({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            customerId: inv.customerId || null,
            customerName: inv.customerName || '',
            customerEmail: inv.customerEmail || '',
            customerPhone: inv.customerPhone || '',
            customerAddress: inv.customerAddress || '',
            clientId: inv.clientId || null,
            issueDate: inv.issueDate ? new Date(inv.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            items,
            subtotal: Number(inv.subtotal || 0),
            taxRate: Number(inv.taxRate || 0),
            taxAmount: Number(inv.taxAmount || 0),
            discount: Number(inv.discount || 0),
            totalAmount: Number(inv.totalAmount || 0),
            paidAmount: Number(inv.paidAmount || 0),
            balanceDue: Number(inv.balanceDue || 0),
            paymentMethod: inv.paymentMethod || '',
            shippingAddress: inv.shippingAddress || '',
            trackingNumber: inv.trackingNumber || '',
            notes: inv.notes || '',
            terms: inv.terms || blankInvoice.terms,
            status: inv.status || 'DRAFT',
            paymentStatus: inv.paymentStatus || 'PENDING',
            shipmentStatus: inv.shipmentStatus || 'PENDING',
            baseCost: Number(inv.baseCost || 0),
            markupAmount: Number(inv.markupAmount || 0),
            markupPercentage: Number(inv.markupPercentage || 0),
            companyInfo: inv.companyInfo || blankInvoice.companyInfo,
            createdAt: inv.createdAt || new Date().toISOString()
        });
        setShowPreview(false);
    };

    // Print HTML generator
    const generatePrintHtml = () => {
        const itemsHtml = invoice.items.map((it, idx) => `
            <tr style="background:${idx % 2 === 0 ? '#fff' : '#f8faf0'}">
                <td style="padding:8px;text-align:center">${idx + 1}</td>
                <td style="padding:8px">${it.image ? `<img src="${it.image}" style="width:48px;height:48px;object-fit:cover;border-radius:4px;margin-right:8px;vertical-align:middle" />` : ''}${it.name}<br/><small>Part: ${it.partNo || '-'}</small></td>
                <td style="padding:8px;text-align:center">${it.quantity}</td>
                <td style="padding:8px;text-align:center">${formatMoney(it.unitPrice)}</td>
                <td style="padding:8px;text-align:center">${formatMoney(Number(it.unitPrice) * Number(it.quantity))}</td>
            </tr>
        `).join('');

        const discountRow = invoice.discount ? `<tr><td colspan="3"></td><td style="text-align:right;padding:8px">Discount</td><td style="text-align:center;padding:8px">-${formatMoney(invoice.discount)}</td></tr>` : '';
        const taxRow = showTax ? `<tr><td colspan="3"></td><td style="text-align:right;padding:8px">Tax (${invoice.taxRate}%)</td><td style="text-align:center;padding:8px">${formatMoney(taxAmount)}</td></tr>` : '';

        return `<!doctype html>
            <html>
            <head>
                <meta charset="utf-8"/>
                <title>Invoice ${invoice.invoiceNumber || '(unsaved)'}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin:20px; color:#222; }
                    h1 { margin:0 0 6px 0; }
                    .top { display:flex; justify-content:space-between; align-items:flex-start; gap:20px; }
                    table { width:100%; border-collapse:collapse; margin-top:20px; }
                    th { background:#3b82f6; color:#fff; padding:8px; text-align:center; }
                    td { padding:8px; border-bottom:1px solid #eee; }
                    .company-header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #3b82f6; }
                    .status-badge { display:inline-block; padding:4px 8px; border-radius:12px; font-size:12px; font-weight:bold; }
                    .draft { background:#6b7280; color:white; }
                    .sent { background:#10b981; color:white; }
                    .paid { background:#059669; color:white; }
                    .overdue { background:#dc2626; color:white; }
                </style>
            </head>
            <body>
                <div class="company-header">
                    <h1>${invoice.companyInfo.name}</h1>
                    <div>${invoice.companyInfo.address}</div>
                    <div>Phone: ${invoice.companyInfo.phone} | Email: ${invoice.companyInfo.email}</div>
                </div>

                <div class="top">
                    <div>
                        <strong>Bill To:</strong><br/>
                        ${invoice.customerName || '-'}<br/>
                        ${invoice.customerEmail ? `<a href="mailto:${invoice.customerEmail}">${invoice.customerEmail}</a><br/>` : ''}
                        ${invoice.customerPhone ? `${invoice.customerPhone}<br/>` : ''}
                        ${invoice.customerAddress ? `${invoice.customerAddress}<br/>` : ''}
                    </div>
                    <div style="text-align:right">
                        <div style="font-weight:700">INVOICE</div>
                        <div style="font-size:18px;margin-top:6px">${invoice.invoiceNumber || '(unsaved)'}</div>
                        <div style="margin-top:6px">
                            <span class="status-badge ${invoice.status.toLowerCase()}">${invoice.status}</span>
                            <span class="status-badge ${invoice.paymentStatus.toLowerCase()}" style="margin-left:8px">${invoice.paymentStatus}</span>
                        </div>
                        <div style="margin-top:6px">Issue Date: ${invoice.issueDate}</div>
                        <div style="margin-top:6px">Due Date: ${invoice.dueDate}</div>
                    </div>
                </div>

                <table>
                    <thead><tr><th>#</th><th style="text-align:left">Product</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
                    <tbody>
                        ${itemsHtml}
                        <tr><td colspan="3"></td><td style="text-align:right;padding:8px">Subtotal</td><td style="text-align:center;padding:8px">${formatMoney(subtotal)}</td></tr>
                        ${discountRow}
                        ${taxRow}
                        <tr style="font-weight:700;background:#dbeafe"><td colspan="3"></td><td style="text-align:right;padding:8px">Grand Total</td><td style="text-align:center;padding:8px">${formatMoney(totalAmount)}</td></tr>
                    </tbody>
                </table>

                <div style="margin-top:20px">
                    <strong>Payment Details</strong>
                    <div>Method: ${invoice.paymentMethod || 'Not specified'}</div>
                    <div>Balance Due: ${formatMoney(invoice.balanceDue)}</div>
                </div>

                <div style="margin-top:20px">
                    <strong>Notes</strong>
                    <div>${invoice.notes || '-'}</div>
                </div>

                <div style="margin-top:20px">
                    <strong>Terms & Conditions</strong>
                    <div>${invoice.terms || '-'}</div>
                </div>
            </body>
            </html>`;
    };

    const handlePrint = () => {
        const html = generatePrintHtml();
        const w = window.open('', '_blank');
        w.document.write(html);
        w.document.close();
        w.print();
    };

    // UI helpers
    const statusBadge = (status, type = 'status') => {
        const statusConfig = {
            DRAFT: { text: 'Draft', color: 'bg-gray-500' },
            SENT: { text: 'Sent', color: 'bg-green-500' },
            VIEWED: { text: 'Viewed', color: 'bg-blue-500' },
            PARTIALLY_PAID: { text: 'Partial', color: 'bg-yellow-500' },
            PAID: { text: 'Paid', color: 'bg-green-600' },
            OVERDUE: { text: 'Overdue', color: 'bg-red-500' },
            CANCELLED: { text: 'Cancelled', color: 'bg-red-600' },
            PENDING: { text: 'Pending', color: 'bg-yellow-500' },
            PACKED: { text: 'Packed', color: 'bg-blue-400' },
            SHIPPED: { text: 'Shipped', color: 'bg-indigo-500' },
            IN_TRANSIT: { text: 'In Transit', color: 'bg-purple-500' },
            DELIVERED: { text: 'Delivered', color: 'bg-green-600' },
            RETURNED: { text: 'Returned', color: 'bg-red-400' }
        };
        
        const s = statusConfig[status] || statusConfig.DRAFT;
        return <span className={`px-2 py-1 rounded text-xs ${s.color} text-white font-medium`}>{s.text}</span>;
    };

    // New invoice
    const startNew = () => {
        setInvoice({ ...blankInvoice, issueDate: new Date().toISOString().split('T')[0] });
        setShowPreview(false);
    };

    // Back to dashboard
    const handleBackToDashboard = () => {
        if (onNavigate) {
            onNavigate('outbound', 'landing');
        } else {
            window.history.back();
        }
    };

    // Handle view invoice history
    const handleViewInvoiceHistory = () => {
        if (onNavigate) {
            onNavigate('outbound', 'history');
        } else {
            console.log('Navigate to invoice history');
            // Fallback navigation
            window.location.hash = '#invoice-history';
        }
    };
    // Compact Modal Wrapper
    const CompactModal = ({ title, children, onClose, size = 'md', showFooter = true, onAddSelected }) => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
            <div className={`rounded-xl shadow-2xl ${
                isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                } ${size === 'sm' ? 'max-w-md' :
                    size === 'md' ? 'max-w-2xl' :
                        'max-w-4xl'
                } w-full max-h-[95vh] overflow-hidden flex flex-col`}>
                {/* Header */}
                <div className={`px-4 sm:px-6 py-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
                    } flex items-center justify-between`}>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                            }`}
                    >
                        <XIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 sm:p-6">
                    {children}
                </div>

                {/* Footer */}
                {showFooter && (
                    <div className={`px-4 sm:px-6 py-4 border-t ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
                        } flex flex-col sm:flex-row justify-end gap-2 sm:gap-3`}>
                        <button
                            onClick={onClose}
                            className={`${buttonBaseClass(isDarkMode, 'gray')} w-full sm:w-auto justify-center`}
                        >
                            <XIcon className="h-4 w-4" />
                            Cancel
                        </button>
                        <button
                            onClick={onAddSelected || handleCatalogAddSelected}
                            className={`${buttonBaseClass(isDarkMode, 'indigo')} w-full sm:w-auto justify-center`}
                        >
                            <PlusIcon className="h-4 w-4" />
                            Add Selected Items
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    // Calculate profit metrics
    const profitMetrics = useMemo(() => {
        const totalCost = invoice.items.reduce((sum, item) => sum + (Number(item.unitCost || 0) * Number(item.quantity || 0)), 0);
        const totalRevenue = subtotal;
        const totalProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        return {
            totalCost,
            totalRevenue,
            totalProfit,
            profitMargin
        };
    }, [invoice.items, subtotal]);

    return (
        <div className={`min-h-screen p-3 sm:p-4 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-2xl`}>
                        <div className="flex items-center gap-3">
                            <RefreshIcon className="h-5 w-5 animate-spin" />
                            <span className="font-medium">Processing...</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
                {/* Modern Header - Fixed for mobile */}
                <div className={`p-4 sm:p-6 rounded-xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                    } shadow-sm`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <button
                                onClick={handleBackToDashboard}
                                className={`p-2 rounded-lg transition-colors ${isDarkMode
                                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                    }`}
                                title="Back to Dashboard"
                            >
                                <ArrowLeftIcon className="h-5 w-5" />
                            </button>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3 truncate">
                                    <CreditCardIcon className="h-6 w-6 sm:h-7 sm:w-7 text-cyan-500 flex-shrink-0" />
                                    <span className="truncate">Create Outbound Invoice</span>
                                </h1>
                                <p className="text-gray-400 mt-1 text-sm sm:text-base truncate">
                                    Create customer invoices from product catalog
                                </p>
                            </div>
                        </div>


                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            {/* Mobile: Stack these vertically on small screens */}
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                                <div className={`px-3 py-1.5 rounded-lg border text-sm font-medium flex-shrink-0 ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
                                    }`}>
                                    <span className="hidden sm:inline">
                                        {invoice.invoiceNumber ? `Invoice: ${invoice.invoiceNumber}` : 'New Invoice'}
                                    </span>
                                    <span className="sm:hidden">
                                        {invoice.invoiceNumber ? invoice.invoiceNumber : 'New'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {statusBadge(invoice.status)}
                                    {statusBadge(invoice.paymentStatus, 'payment')}
                                </div>
                            </div>

                            {/* Buttons row */}
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                                <button
                                    onClick={startNew}
                                    className={`${buttonBaseClass(isDarkMode, 'green', 'sm')} flex-1 sm:flex-none`}
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    <span className="hidden sm:inline">New</span>
                                </button>
                                <button
                                    onClick={loadSavedInvoices}
                                    className={`${buttonBaseClass(isDarkMode, 'gray', 'sm')} flex-1 sm:flex-none`}
                                    title="Refresh invoices"
                                >
                                    <RefreshIcon className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={handleViewInvoiceHistory}
                                    className={`${buttonBaseClass(isDarkMode, 'blue', 'sm')} flex-1 sm:flex-none`}
                                >
                                    <DocumentTextIcon className="h-4 w-4" />
                                    <span className="hidden sm:inline">History</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-4 gap-6">
                    {/* Main Content - 3 columns */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Quick Actions Bar - Responsive */}
                        <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className={buttonBaseClass(isDarkMode, 'blue', 'sm')}
                            >
                                <PrinterIcon className="h-4 w-4" />
                                <span className="hidden sm:inline">{showPreview ? 'Hide' : 'Show'} Preview</span>
                                <span className="sm:hidden">Preview</span>
                            </button>
                            <button
                                onClick={handlePrint}
                                className={buttonBaseClass(isDarkMode, 'indigo', 'sm')}
                            >
                                <PrinterIcon className="h-4 w-4" />
                                <span className="hidden sm:inline">Print</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (invoice.status === 'SENT') {
                                        alert('Cannot update a sent invoice. Please create a new invoice.');
                                        return;
                                    }
                                    saveInvoice();
                                }}
                                disabled={loading || invoice.status === 'SENT'}
                                className={`${buttonBaseClass(isDarkMode, 'green', 'sm')} ${(loading || invoice.status === 'SENT') ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                <SaveIcon className="h-4 w-4" />
                                <span className="hidden sm:inline">Save Draft</span>
                                <span className="sm:hidden">Save</span>
                            </button>
                            {/* ADDED: Save Invoice Button */}
                            <button
                                onClick={() => saveInvoice({ forceNew: true })}
                                disabled={loading || invoice.items.length === 0}
                                className={`${buttonBaseClass(isDarkMode, 'purple', 'sm')} ${(loading || invoice.items.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                <DocumentTextIcon className="h-4 w-4" />
                                <span className="hidden sm:inline">Save Invoice</span>
                                <span className="sm:hidden">Save Inv</span>
                            </button>
                            <button
                                onClick={sendInvoice}
                                disabled={loading}
                                className={`${buttonBaseClass(isDarkMode, 'cyan', 'sm')} ${loading ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                <MailIcon className="h-4 w-4" />
                                <span className="hidden sm:inline">Send Invoice</span>
                                <span className="sm:hidden">Send</span>
                            </button>

                            {/* Status Dropdowns */}
                            <InvoiceStatusDropdown
                                current={invoice.status}
                                onChange={(status) => updateStatus('status', status)}
                                isDarkMode={isDarkMode}
                            />
                            <PaymentStatusDropdown
                                current={invoice.paymentStatus}
                                onChange={(status) => updateStatus('paymentStatus', status)}
                                isDarkMode={isDarkMode}
                            />

                        </div>

                        {/* Customer Information */}
                        <div className={`p-6 rounded-xl ${
                            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                        }`}>
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <UserIcon className="h-5 w-5 text-cyan-500" />
                                Customer Information
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Customer</label>
                                    <select
                                        value={invoice.customerName || ''}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            if (v === '__create_new__') {
                                                setShowCustomerModal(true);
                                                return;
                                            }
                                            const cust = customers.find(c => c.name === v);
                                            if (cust) {
                                                setInvoice(prev => ({
                                                    ...prev,
                                                    customerId: cust.id,
                                                    customerName: cust.name,
                                                    customerEmail: cust.email || '',
                                                    customerPhone: cust.phone || '',
                                                    customerAddress: cust.address || ''
                                                }));
                                            } else {
                                                setInvoice(prev => ({ ...prev, customerName: v }));
                                            }
                                        }}
                                        className={inputBaseClass(isDarkMode)}
                                    >
                                        <option value="">-- Select customer --</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.name}>
                                                {c.name} {c.company ? `(${c.company})` : ''}
                                            </option>
                                        ))}
                                        <option value="__create_new__">+ Create New Customer</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Customer Email</label>
                                    <input 
                                        className={inputBaseClass(isDarkMode)}
                                        value={invoice.customerEmail} 
                                        onChange={(e) => setInvoice(prev => ({ ...prev, customerEmail: e.target.value }))} 
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Customer Phone</label>
                                    <input 
                                        className={inputBaseClass(isDarkMode)}
                                        value={invoice.customerPhone} 
                                        onChange={(e) => setInvoice(prev => ({ ...prev, customerPhone: e.target.value }))} 
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Customer Address</label>
                                    <input 
                                        className={inputBaseClass(isDarkMode)}
                                        value={invoice.customerAddress} 
                                        onChange={(e) => setInvoice(prev => ({ ...prev, customerAddress: e.target.value }))} 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Issue Date</label>
                                    <input 
                                        type="date" 
                                        className={inputBaseClass(isDarkMode)}
                                        value={invoice.issueDate} 
                                        onChange={(e) => setInvoice(prev => ({ ...prev, issueDate: e.target.value }))} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Due Date</label>
                                    <input 
                                        type="date" 
                                        className={inputBaseClass(isDarkMode)}
                                        value={invoice.dueDate} 
                                        onChange={(e) => setInvoice(prev => ({ ...prev, dueDate: e.target.value }))} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className={`p-6 rounded-xl ${
                            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                        }`}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-semibold text-lg">Invoice Items</h3>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setShowCatalog(true)}
                                        className={buttonBaseClass(isDarkMode, 'indigo')}
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                        Add from Catalog
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const name = prompt('Manual item name'); 
                                            if (!name) return;
                                            addItem({ name, salePrice: 0, quantity: 1 });
                                        }}
                                        className={buttonBaseClass(isDarkMode, 'gray')}
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                        Add Manual
                                    </button>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className={isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                                            <th className="p-3 text-left text-sm font-medium">Product</th>
                                            <th className="p-3 text-center text-sm font-medium w-24">Qty</th>
                                            <th className="p-3 text-right text-sm font-medium w-32">Unit Price</th>
                                            <th className="p-3 text-right text-sm font-medium w-32">Total</th>
                                            <th className="p-3 text-center text-sm font-medium w-28">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.items.map((it, i) => (
                                            <tr key={it.id} className={`border-b ${
                                                isDarkMode ? 'border-gray-700 hover:bg-gray-750' : 'border-gray-200 hover:bg-gray-50'
                                            } transition-colors`}>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-3">
                                                        {it.image && (
                                                            <img 
                                                                src={it.image} 
                                                                alt={it.name}
                                                                className="w-12 h-12 object-cover rounded-lg"
                                                                onError={(e) => { e.target.style.display = 'none'; }}
                                                            />
                                                        )}
                                                        <div>
                                                            <div className="font-medium text-sm">{it.name}</div>
                                                            {it.partNo && (
                                                                <div className="text-xs text-gray-400">Part: {it.partNo}</div>
                                                            )}
                                                            {it.unitCost > 0 && (
                                                                <div className="text-xs text-green-600">
                                                                    Cost: {formatMoney(it.unitCost)} | 
                                                                    Markup: {formatMoney(it.markupAmount)} ({it.markupPercentage?.toFixed(1)}%)
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    {editingItemId === it.id ? (
                                                        <input 
                                                            type="number" 
                                                            min="1" 
                                                            value={editingDraft.quantity}
                                                            onChange={(e) => setEditingDraft(prev => ({
                                                                ...prev,
                                                                quantity: Number(e.target.value)
                                                            }))}
                                                            className="w-20 px-2 py-1 rounded border text-center"
                                                        />
                                                    ) : (
                                                        <span className="font-medium">{it.quantity}</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right">
                                                    {editingItemId === it.id ? (
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={editingDraft.unitPrice}
                                                            onChange={(e) => setEditingDraft(prev => ({
                                                                ...prev,
                                                                unitPrice: Number(e.target.value)
                                                            }))}
                                                            className="w-28 px-2 py-1 rounded border text-right"
                                                        />
                                                    ) : (
                                                        <span className="font-medium">{formatMoney(it.unitPrice)}</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right font-semibold">
                                                    {formatMoney(Number(it.unitPrice) * Number(it.quantity))}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {editingItemId === it.id ? (
                                                        <div className="flex gap-2 justify-center">
                                                            <button
                                                                onClick={() => saveEditItem(it.id)}
                                                                className="p-1.5 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
                                                            >
                                                                <CheckCircleIcon className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={cancelEditItem}
                                                                className="p-1.5 rounded bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                                                            >
                                                                <XIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-2 justify-center">
                                                            <button
                                                                onClick={() => startEditItem(it)}
                                                                className="p-1.5 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                                                            >
                                                                <PencilAltIcon className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => removeItemLocal(it.id)}
                                                                className="p-1.5 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {invoice.items.length === 0 && (
                                    <div className={`text-center py-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                        }`}>
                                        <ShoppingCartIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p className="font-medium">No items added yet</p>
                                        <p className="text-sm mt-1">Add items from catalog or create manual items</p>
                                    </div>
                                )}
                            </div>

                            {/* Profit Summary */}
                            {profitMetrics.totalCost > 0 && (
                                <div className={`mt-4 p-4 rounded-lg border ${
                                    isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-green-50 border-green-200'
                                }`}>
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
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

                            {/* Totals Section */}
                            <div className="mt-6 space-y-3">
                                <div className="flex justify-between items-center border-t pt-4">
                                    <span className="font-medium text-gray-600 dark:text-gray-400">Subtotal:</span>
                                    <span className="font-bold text-lg">{formatMoney(subtotal)}</span>
                                </div>
                                
                                {invoice.discount > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-600 dark:text-gray-400">
                                            Discount:
                                        </span>
                                        <span className="font-bold text-lg text-red-600">-{formatMoney(invoice.discount)}</span>
                                    </div>
                                )}
                                
                                {showTax && (
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-600 dark:text-gray-400">
                                            Tax ({invoice.taxRate}%):
                                        </span>
                                        <span className="font-bold text-lg">{formatMoney(taxAmount)}</span>
                                    </div>
                                )}
                                
                                <div className={`flex justify-between items-center border-t pt-4 ${
                                    isDarkMode ? 'text-cyan-400' : 'text-cyan-600'
                                }`}>
                                    <span className="font-bold text-xl">Grand Total:</span>
                                    <span className="font-bold text-2xl">{formatMoney(totalAmount)}</span>
                                </div>
                            </div>

                            {/* Tax Toggle */}
                            <div className="mt-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowTax(prev => !prev)}
                                        title={showTax ? 'Hide tax row' : 'Show tax row'}
                                        className={buttonBaseClass(isDarkMode, 'gray', 'sm')}
                                    >
                                        {showTax ? <CheckCircleIcon className="h-4 w-4" /> : <XCircleIcon className="h-4 w-4" />}
                                        Tax Display
                                    </button>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        Toggle tax display (affects print)
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {invoice.items.length} items
                                </div>
                            </div>
                        </div>

                        {/* Payment & Shipping Information */}
                        <div className={`p-6 rounded-xl ${
                            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                        }`}>
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <CurrencyDollarIcon className="h-5 w-5 text-cyan-500" />
                                Payment & Shipping
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Payment Method</label>
                                    <select
                                        value={invoice.paymentMethod}
                                        onChange={(e) => setInvoice(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                        className={inputBaseClass(isDarkMode)}
                                    >
                                        <option value="">Select payment method</option>
                                        {PAYMENT_METHODS.map(method => (
                                            <option key={method} value={method}>{method}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Shipping Address</label>
                                    <textarea
                                        rows={2}
                                        className={inputBaseClass(isDarkMode)}
                                        value={invoice.shippingAddress}
                                        onChange={(e) => setInvoice(prev => ({ ...prev, shippingAddress: e.target.value }))}
                                        placeholder="Enter shipping address if different from customer address"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Tracking Number</label>
                                    <input
                                        className={inputBaseClass(isDarkMode)}
                                        value={invoice.trackingNumber}
                                        onChange={(e) => setInvoice(prev => ({ ...prev, trackingNumber: e.target.value }))}
                                        placeholder="Enter shipment tracking number"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Discount Amount</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className={inputBaseClass(isDarkMode)}
                                        value={invoice.discount}
                                        onChange={(e) => setInvoice(prev => ({ ...prev, discount: Number(e.target.value) || 0 }))}
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium mb-2">Notes</label>
                                <textarea
                                    rows={3}
                                    className={inputBaseClass(isDarkMode)}
                                    value={invoice.notes}
                                    onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Additional notes for this invoice..."
                                />
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium mb-2">Terms & Conditions</label>
                                <textarea
                                    rows={3}
                                    className={inputBaseClass(isDarkMode)}
                                    value={invoice.terms}
                                    onChange={(e) => setInvoice(prev => ({ ...prev, terms: e.target.value }))}
                                    placeholder="Payment terms and conditions..."
                                />
                            </div>
                        </div>

                        {/* Preview Section */}
                        {showPreview && (
                            <div className={`p-6 rounded-xl ${
                                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                            }`}>
                                <h3 className="font-semibold text-lg mb-6">Preview</h3>
                                <div className="p-6 border rounded-lg bg-white dark:bg-gray-900">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                                {invoice.companyInfo.name}
                                            </h2>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {invoice.companyInfo.address}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-gray-700 dark:text-gray-300">INVOICE</div>
                                            <div className="font-bold text-lg text-gray-900 dark:text-white mt-1">
                                                {invoice.invoiceNumber || '(unsaved)'}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                                Issue Date: {invoice.issueDate}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                Due Date: {invoice.dueDate}
                                            </div>
                                            <div className="mt-2 flex gap-1">
                                                {statusBadge(invoice.status)}
                                                {statusBadge(invoice.paymentStatus, 'payment')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-cyan-500 text-white">
                                                    <th className="p-3 text-left">#</th>
                                                    <th className="p-3 text-left">Product</th>
                                                    <th className="p-3 text-center">Qty</th>
                                                    <th className="p-3 text-center">Unit</th>
                                                    <th className="p-3 text-center">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {invoice.items.map((it, i) => (
                                                    <tr key={it.id} className="border-b border-gray-200 dark:border-gray-700">
                                                        <td className="p-3">{i + 1}</td>
                                                        <td className="p-3">{it.name}</td>
                                                        <td className="p-3 text-center">{it.quantity}</td>
                                                        <td className="p-3 text-center">{formatMoney(it.unitPrice)}</td>
                                                        <td className="p-3 text-center">{formatMoney(Number(it.unitPrice) * Number(it.quantity))}</td>
                                                    </tr>
                                                ))}
                                                <tr>
                                                    <td colSpan="3"></td>
                                                    <td className="p-3 text-right font-bold">Subtotal</td>
                                                    <td className="p-3 text-center font-bold">{formatMoney(subtotal)}</td>
                                                </tr>
                                                {invoice.discount > 0 && (
                                                    <tr>
                                                        <td colSpan="3"></td>
                                                        <td className="p-3 text-right font-bold text-red-600">Discount</td>
                                                        <td className="p-3 text-center font-bold text-red-600">-{formatMoney(invoice.discount)}</td>
                                                    </tr>
                                                )}
                                                {showTax && (
                                                    <tr>
                                                        <td colSpan="3"></td>
                                                        <td className="p-3 text-right font-bold">Tax</td>
                                                        <td className="p-3 text-center font-bold">{formatMoney(taxAmount)}</td>
                                                    </tr>
                                                )}
                                                <tr className="bg-cyan-50 dark:bg-cyan-900/20">
                                                    <td colSpan="3"></td>
                                                    <td className="p-3 text-right font-bold text-lg">Grand Total</td>
                                                    <td className="p-3 text-center font-bold text-lg">{formatMoney(totalAmount)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - 1 column */}
                    <aside className="space-y-6">
                        {/* Totals Summary */}
                        <div className={`p-6 rounded-xl ${
                            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                        }`}>
                            <h4 className="font-semibold text-lg mb-4">Invoice Summary</h4>
                            <div className="space-y-3">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-cyan-500">{formatMoney(totalAmount)}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Grand Total</div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Items:</span>
                                        <span className="font-medium">{invoice.items.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span className="font-medium">{formatMoney(subtotal)}</span>
                                    </div>
                                    {invoice.discount > 0 && (
                                        <div className="flex justify-between text-red-600">
                                            <span>Discount:</span>
                                            <span className="font-medium">-{formatMoney(invoice.discount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span>Tax:</span>
                                        <span className="font-medium">{formatMoney(taxAmount)}</span>
                                    </div>
                                    {profitMetrics.totalCost > 0 && (
                                        <>
                                            <div className="flex justify-between border-t pt-2">
                                                <span>Cost:</span>
                                                <span className="font-medium">{formatMoney(profitMetrics.totalCost)}</span>
                                            </div>
                                            <div className="flex justify-between text-green-600">
                                                <span>Profit:</span>
                                                <span className="font-medium">{formatMoney(profitMetrics.totalProfit)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent Invoices */}
                        <div className={`p-6 rounded-xl ${
                            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                        }`}>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-lg">Recent Invoices</h4>
                                <button
                                    onClick={loadSavedInvoices}
                                    className={buttonBaseClass(isDarkMode, 'gray', 'sm')}
                                >
                                    <RefreshIcon className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="space-y-3 max-h-96 overflow-auto">
                                {savedInvoices.slice(0, 8).map(inv => (
                                    <div
                                        key={inv.id}
                                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                                            isDarkMode
                                                ? 'border-gray-600 hover:border-cyan-500 hover:bg-gray-750'
                                                : 'border-gray-200 hover:border-cyan-500 hover:bg-gray-50'
                                        }`}
                                        onClick={() => {
                                            if (inv.status === 'SENT') {
                                                if (window.confirm('This invoice has been sent. Would you like to create a new version?')) {
                                                    // For sent invoices, create a new copy
                                                    const newInvoice = {
                                                        ...blankInvoice,
                                                        customerId: inv.customerId,
                                                        customerName: inv.customerName,
                                                        customerEmail: inv.customerEmail,
                                                        customerPhone: inv.customerPhone,
                                                        customerAddress: inv.customerAddress,
                                                        items: inv.items.map(item => ({
                                                            ...item,
                                                            id: `i-${Date.now()}-${Math.random()}`
                                                        }))
                                                    };
                                                    setInvoice(newInvoice);
                                                }
                                            } else {
                                                loadInvoiceForEdit(inv);
                                            }
                                        }}
                                    >
                                        <div className="font-medium text-sm">{inv.customerName || 'Unnamed'}</div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {inv.invoiceNumber} • {new Date(inv.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="flex gap-1">
                                                {statusBadge(inv.status)}
                                                {statusBadge(inv.paymentStatus, 'payment')}
                                            </div>
                                            <span className="font-semibold text-sm">
                                                {formatMoney(inv.totalAmount || 0)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {savedInvoices.length === 0 && (
                                    <div className="text-center text-gray-400 py-6 text-sm">
                                        <div className="text-2xl mb-2">🧾</div>
                                        <p>No invoices found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Compact Mobile-Friendly Catalog Modal */}
            {showCatalog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50">
                    <div className={`w-full max-w-2xl rounded-xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col ${
                        isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
                    }`}>
                        {/* Header - Compact */}
                        <div className={`px-4 py-3 border-b ${
                            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                        } flex items-center justify-between`}>
                            <h3 className="text-lg font-semibold">Select Products</h3>
                            <button
                                onClick={() => { setCatalogSelection([]); setShowCatalog(false); }}
                                className={`p-2 rounded-lg transition-colors ${
                                    isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                                }`}
                            >
                                <XIcon className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content - Scrollable */}
                        <div className="flex-1 overflow-auto p-4" style={{ minHeight: '300px' }}>
                            <GlobalProductCatalog
                                mode="catalog-modal"
                                onItemsUpdate={handleCatalogItemsUpdate}
                                onAddProducts={handleCatalogItemsUpdate}
                                onSelectProducts={handleCatalogItemsUpdate}
                                isDarkMode={isDarkMode}
                            />
                        </div>

                        {/* Footer - Stacked on mobile */}
                        <div className={`px-4 py-3 border-t ${
                            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                        }`}>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <div className={`flex-1 text-sm px-2 py-1.5 rounded ${
                                    isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                                }`}>
                                    <span className="font-medium">{catalogSelection.length}</span> items selected
                                </div>
                                <div className="flex gap-2 sm:gap-3">
                                    <button
                                        onClick={() => { setCatalogSelection([]); setShowCatalog(false); }}
                                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                                            isDarkMode
                                                ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300'
                                        }`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCatalogAddSelected}
                                        disabled={catalogSelection.length === 0}
                                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                                            catalogSelection.length === 0
                                                ? 'bg-gray-400 cursor-not-allowed text-white'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                        }`}
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                        <span className="hidden xs:inline">Add</span>
                                        <span className="xs:hidden">Add ({catalogSelection.length})</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fixed Compact Customer Modal */}
            {showCustomerModal && (
                <CompactModal 
                    title="Customer Management" 
                    onClose={() => setShowCustomerModal(false)}
                    size="lg"
                    showFooter={false}
                >
                    <div className="h-96 min-h-[300px]">
                        <CustomerManagement
                            isDarkMode={isDarkMode}
                            onBack={() => setShowCustomerModal(false)}
                            onCustomerSelect={handleCustomerSelect}
                        />
                    </div>
                </CompactModal>
            )}
        </div>
    );
};

// Status Dropdown Components
const InvoiceStatusDropdown = ({ current = 'DRAFT', onChange = () => { }, isDarkMode = false }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button 
                onClick={() => setOpen(p => !p)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border transition-colors ${
                    isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300'
                }`}
            >
                <span className="hidden sm:inline">Status: {current}</span>
                <span className="sm:hidden">{current}</span>
                <ChevronDownIcon className="h-4 w-4" />
            </button>

            {open && (
                <div className={`absolute right-0 mt-1 w-48 rounded-lg shadow-xl z-50 border ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                    <div className="py-1">
                        {INVOICE_STATUS_OPTIONS.map(s => (
                            <button
                                key={s}
                                onClick={() => { onChange(s); setOpen(false); }}
                                className={`w-full text-left px-3 sm:px-4 py-2 text-sm transition-colors ${
                                    isDarkMode 
                                        ? 'hover:bg-gray-700 text-white' 
                                        : 'hover:bg-gray-100 text-gray-900'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const PaymentStatusDropdown = ({ current = 'PENDING', onChange = () => { }, isDarkMode = false }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button 
                onClick={() => setOpen(p => !p)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border transition-colors ${
                    isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300'
                }`}
            >
                <span className="hidden sm:inline">Payment: {current}</span>
                <span className="sm:hidden">{current}</span>
                <ChevronDownIcon className="h-4 w-4" />
            </button>

            {open && (
                <div className={`absolute right-0 mt-1 w-48 rounded-lg shadow-xl z-50 border ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                    <div className="py-1">
                        {PAYMENT_STATUS_OPTIONS.map(s => (
                            <button
                                key={s}
                                onClick={() => { onChange(s); setOpen(false); }}
                                className={`w-full text-left px-3 sm:px-4 py-2 text-sm transition-colors ${
                                    isDarkMode 
                                        ? 'hover:bg-gray-700 text-white' 
                                        : 'hover:bg-gray-100 text-gray-900'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OutboundInvoiceFromCatalog;
//OutboundInvoiceFromCatalog