// src/components/admin/sales/SalesQuotationUnified.jsx
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
    ShoppingCartIcon
} from '@heroicons/react/outline';
import api from '../../../services/api';
import GlobalProductCatalog from '../../shared/GlobalProductCatalog';
import CustomerManagement from './CustomerManagement';

const STATUS_OPTIONS = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'];

// Create fallback for XCircleIcon
const XCircleIcon = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const inputBaseClass = (isDark) =>
    `w-full rounded-lg px-3 py-2 text-sm outline-none transition-all duration-200 border ${
        isDark 
            ? 'bg-gray-800 border-gray-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-white' 
            : 'bg-white border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-900'
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
        purple: 'bg-purple-600 hover:bg-purple-700 text-white border border-purple-700'
    };
    return `${base} ${colors[color]}`;
};

const SalesQuotationUnified = ({ isDarkMode = false }) => {
    // blank template
    const blankQuotation = {
        id: null,
        quotationId: null,
        customerId: null,
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        creatorName: '',
        creatorPosition: '',
        offerDate: new Date().toISOString().split('T')[0],
        offerNote: '',
        items: [],
        taxRate: 0,
        validityDays: 30,
        companyInfo: {
            name: 'Your Company Name',
            address: '123 Business St, City',
            phone: '(555) 123-4567',
            email: 'sales@company.com'
        },
        terms: [
            'This quotation is valid for 30 days from the date of issue.',
            'Prices are subject to change without notice.'
        ],
        status: 'DRAFT',
        createdAt: new Date().toISOString()
    };

    const [quotation, setQuotation] = useState(blankQuotation);
    const [savedQuotations, setSavedQuotations] = useState([]);
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
        loadSavedQuotations();
        loadCustomers();
    }, []);

    const loadSavedQuotations = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/quotations');
            setSavedQuotations(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error loading quotations', err);
            setSavedQuotations([]);
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
        return quotation.items.reduce((s, it) => s + (Number(it.unitPrice || 0) * Number(it.quantity || 0)), 0);
    }, [quotation.items]);

    const taxAmount = useMemo(() => {
        return (subtotal * (Number(quotation.taxRate || 0) / 100));
    }, [subtotal, quotation.taxRate]);

    const total = useMemo(() => subtotal + (showTax ? taxAmount : 0), [subtotal, taxAmount, showTax]);

    const formatMoney = (v) => `$${Number(v || 0).toFixed(2)}`;

    // Generate revised quotation ID
    const generateRevisedQuotationId = (originalId) => {
        try {
            const baseId = originalId.replace(/-REV\d+$/, '');
            const revisionPattern = new RegExp(`^${baseId}-REV(\\d+)$`);
            const revisions = savedQuotations.filter(q => 
                q.quotationId && revisionPattern.test(q.quotationId)
            );
            const revisionNumbers = revisions.map(q => {
                const match = q.quotationId.match(revisionPattern);
                return match ? parseInt(match[1]) : 0;
            });
            const nextRevision = revisionNumbers.length > 0 ? Math.max(...revisionNumbers) + 1 : 1;
            return `${baseId}-REV${nextRevision}`;
        } catch (error) {
            console.error('Error generating revised quotation ID:', error);
            return `${originalId}-REV${Date.now()}`;
        }
    };

    // Map items to backend payload
    const buildItemsPayload = (items) => items.map(it => ({
        productId: it.productId ? parseInt(it.productId) : null,
        name: it.name || 'Unnamed Product',
        partNo: it.partNo || '',
        description: it.description || '',
        image: it.image || '',
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        totalPrice: Number(it.unitPrice || 0) * Number(it.quantity || 0)
    }));

    // Validation rules
    const validateForCreate = () => {
        if (!quotation.customerName || quotation.customerName.trim() === '') { 
            alert('Customer name is required.'); 
            return false; 
        }
        if (!quotation.items || quotation.items.length === 0) { 
            alert('At least one item is required.'); 
            return false; 
        }
        return true;
    };

    // Save quotation with proper revision handling
    const saveQuotation = async ({ forceNew = false, isRevision = false } = {}) => {
        try {
            setLoading(true);
            let quotationId = quotation.quotationId;
            if (isRevision && quotation.quotationId) {
                quotationId = generateRevisedQuotationId(quotation.quotationId);
            }

            const payload = {
                customerName: quotation.customerName,
                customerEmail: quotation.customerEmail || '',
                customerPhone: quotation.customerPhone || '',
                offerDate: quotation.offerDate,
                validUntil: new Date(new Date(quotation.offerDate).getTime() + (quotation.validityDays || 30) * 24 * 60 * 60 * 1000).toISOString(),
                notes: quotation.offerNote || '',
                items: buildItemsPayload(quotation.items),
                subtotal,
                taxRate: Number(quotation.taxRate || 0),
                taxAmount: Number(taxAmount || 0),
                total: Number(total || 0),
                creatorName: quotation.creatorName || '',
                creatorPosition: quotation.creatorPosition || '',
                status: isRevision ? 'DRAFT' : quotation.status
            };

            if (isRevision && quotationId) {
                payload.quotationId = quotationId;
            }

            let response;
            
            if (isRevision || !quotation.id || forceNew) {
                if (!validateForCreate()) return null;
                response = await api.post('/api/quotations', payload);
                const created = response.data;
                setQuotation(prev => ({
                    ...prev,
                    id: created.id,
                    quotationId: created.quotationId,
                    status: 'DRAFT',
                    isNew: false,
                    createdAt: created.createdAt || prev.createdAt
                }));
                setSavedQuotations(prev => [created, ...prev]);
                alert(isRevision ? `New quotation revision created! ID: ${created.quotationId}` : `Quotation saved as draft! ID: ${created.quotationId}`);
                return created;
            } else {
                if (quotation.status !== 'DRAFT') {
                    alert('Cannot update a sent quotation. Please use "Save/Revise" to create a new revision.');
                    return null;
                }
                response = await api.put(`/api/quotations/${quotation.id}`, payload);
                const updated = response.data;
                setSavedQuotations(prev => prev.map(q => q.id === updated.id ? updated : q));
                setQuotation(prev => ({ ...prev, status: updated.status || prev.status }));
                alert('Draft quotation updated successfully!');
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
    const updateStatus = async (newStatus) => {
        try {
            setQuotation(prev => ({ ...prev, status: newStatus }));
            if (quotation.id) {
                await api.put(`/api/quotations/${quotation.id}/status`, { status: newStatus });
                await loadSavedQuotations();
            }
        } catch (err) {
            console.error('Status update failed', err);
            alert('Failed to update status');
        }
    };

    // Send quotation
    const sendQuotation = async () => {
        try {
            if (!quotation.id) {
                const created = await saveQuotation();
                if (!created) return;
            }
            await updateStatus('SENT');
            alert('Quotation sent (status updated).');
        } catch (err) {
            console.error('send failed', err);
        }
    };

    const deleteQuotation = async (id) => {
        if (!window.confirm('Delete quotation?')) return;
        try {
            await api.delete(`/api/quotations/${id}`);
            setSavedQuotations(prev => prev.filter(q => q.id !== id));
            if (quotation.id === id) setQuotation(blankQuotation);
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
            totalPrice: (Number(product.salePrice ?? product.unitPrice ?? 0) * (Number(product.quantity) || 1))
        };
        setQuotation(prev => ({ ...prev, items: [...prev.items, newItem] }));
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
            totalPrice: (Number(p.salePrice ?? p.unitPrice ?? 0) * (Number(p.quantity) || 1))
        }));
        setQuotation(prev => ({ ...prev, items: [...prev.items, ...items] }));
    };

    const removeItemLocal = (itemId) => {
        if (!window.confirm('Remove item?')) return;
        setQuotation(prev => ({ ...prev, items: prev.items.filter(it => it.id !== itemId) }));
    };

    const startEditItem = (it) => {
        setEditingItemId(it.id);
        setEditingDraft({ quantity: it.quantity, unitPrice: it.unitPrice });
    };

    const saveEditItem = (id) => {
        setQuotation(prev => ({
            ...prev,
            items: prev.items.map(it => it.id === id ? { 
                ...it, 
                quantity: Number(editingDraft.quantity) || 1, 
                unitPrice: Number(editingDraft.unitPrice) || 0 
            } : it)
        }));
        setEditingItemId(null);
        setEditingDraft({ quantity: 1, unitPrice: 0 });
    };

    const cancelEditItem = () => {
        setEditingItemId(null);
        setEditingDraft({ quantity: 1, unitPrice: 0 });
    };

    // Catalog selection callback - FIXED: Ensure proper state updates
    const handleCatalogItemsUpdate = (items) => {
        const arr = Array.isArray(items) ? items : [items];
        setCatalogSelection(arr);
    };

    // FIXED: Proper catalog add function with state validation
    const handleCatalogAddSelected = () => {
        if (!catalogSelection || catalogSelection.length === 0) {
            alert('No items selected in catalog. Please select items first.');
            return;
        }
        
        // Create a stable copy of the selection
        const itemsToAdd = [...catalogSelection];
        
        // Clear selection first
        setCatalogSelection([]);
        
        // Add items to quotation
        addMultipleItems(itemsToAdd);
        
        // Close modal
        setShowCatalog(false);
        
        // Optional: Show success feedback
        if (itemsToAdd.length === 1) {
            alert(`Added "${itemsToAdd[0].name}" to quotation`);
        } else {
            alert(`Added ${itemsToAdd.length} items to quotation`);
        }
    };

    // Customer selection with immediate refresh
    const handleCustomerSelect = (customer) => {
        if (!customer) return;
        setQuotation(prev => ({
            ...prev,
            customerId: customer.id,
            customerName: customer.name || prev.customerName,
            customerEmail: customer.email || prev.customerEmail,
            customerPhone: customer.phone || prev.customerPhone
        }));
        setShowCustomerModal(false);
        setTimeout(() => {
            loadCustomers();
        }, 500);
    };

    // Load quotation for edit with revision logic
    const loadQuotationForEdit = (q) => {
        const items = (q.items || []).map(it => ({
            id: it.id ? `it-${it.id}` : `it-${Math.random()}`,
            productId: it.productId || null,
            name: it.name || '',
            partNo: it.partNo || '',
            description: it.description || '',
            image: it.image || '',
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            totalPrice: Number(it.totalPrice) || 0
        }));

        setQuotation({
            id: q.id,
            quotationId: q.quotationId,
            customerId: null,
            customerName: q.customerName || '',
            customerEmail: q.customerEmail || '',
            customerPhone: q.customerPhone || '',
            creatorName: (q.createdBy && q.createdBy.name) || q.creatorName || '',
            creatorPosition: q.creatorPosition || '',
            offerDate: q.offerDate ? new Date(q.offerDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            offerNote: q.notes || '',
            items,
            taxRate: Number(q.taxRate || 0),
            validityDays: q.validityDays || 30,
            companyInfo: q.companyInfo || blankQuotation.companyInfo,
            terms: q.terms || blankQuotation.terms,
            status: q.status || 'DRAFT',
            createdAt: q.createdAt || new Date().toISOString()
        });
        setShowPreview(false);
    };

    // Print HTML generator
    const generatePrintHtml = () => {
        const itemsHtml = quotation.items.map((it, idx) => `
            <tr style="background:${idx % 2 === 0 ? '#fff' : '#f8faf0'}">
                <td style="padding:8px;text-align:center">${idx + 1}</td>
                <td style="padding:8px">${it.image ? `<img src="${it.image}" style="width:48px;height:48px;object-fit:cover;border-radius:4px;margin-right:8px;vertical-align:middle" />` : ''}${it.name}<br/><small>Part: ${it.partNo || '-'}</small></td>
                <td style="padding:8px;text-align:center">${it.quantity}</td>
                <td style="padding:8px;text-align:center">${formatMoney(it.unitPrice)}</td>
                <td style="padding:8px;text-align:center">${formatMoney(Number(it.unitPrice) * Number(it.quantity))}</td>
            </tr>
        `).join('');

        const taxRow = showTax ? `<tr><td colspan="3"></td><td style="text-align:right;padding:8px">Tax (${quotation.taxRate}%)</td><td style="text-align:center;padding:8px">${formatMoney(taxAmount)}</td></tr>` : '';

        return `<!doctype html>
            <html>
            <head>
                <meta charset="utf-8"/>
                <title>Quotation ${quotation.quotationId || '(unsaved)'}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin:20px; color:#222; }
                    h1 { margin:0 0 6px 0; }
                    .top { display:flex; justify-content:space-between; align-items:flex-start; gap:20px; }
                    table { width:100%; border-collapse:collapse; margin-top:20px; }
                    th { background:#f59e0b; color:#fff; padding:8px; text-align:center; }
                    td { padding:8px; border-bottom:1px solid #eee; }
                    .company-header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #f59e0b; }
                </style>
            </head>
            <body>
                <div class="company-header">
                    <h1>${quotation.companyInfo.name}</h1>
                    <div>${quotation.companyInfo.address}</div>
                    <div>Phone: ${quotation.companyInfo.phone} | Email: ${quotation.companyInfo.email}</div>
                </div>

                <div class="top">
                    <div>
                        <strong>Bill To:</strong><br/>
                        ${quotation.customerName || '-'}<br/>
                        ${quotation.customerEmail ? `<a href="mailto:${quotation.customerEmail}">${quotation.customerEmail}</a><br/>` : ''}
                        ${quotation.customerPhone ? `${quotation.customerPhone}<br/>` : ''}
                    </div>
                    <div style="text-align:right">
                        <div style="font-weight:700">QUOTATION</div>
                        <div style="font-size:18px;margin-top:6px">${quotation.quotationId || '(unsaved)'}</div>
                        <div style="margin-top:6px">Status: ${quotation.status}</div>
                        <div style="margin-top:6px">Date: ${quotation.offerDate}</div>
                        ${quotation.creatorName ? `<div style="margin-top:6px">Prepared By: ${quotation.creatorName}</div>` : ''}
                        ${quotation.creatorPosition ? `<div style="margin-top:2px">Position: ${quotation.creatorPosition}</div>` : ''}
                    </div>
                </div>

                <table>
                    <thead><tr><th>#</th><th style="text-align:left">Product</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
                    <tbody>
                        ${itemsHtml}
                        <tr><td colspan="3"></td><td style="text-align:right;padding:8px">Subtotal</td><td style="text-align:center;padding:8px">${formatMoney(subtotal)}</td></tr>
                        ${taxRow}
                        <tr style="font-weight:700;background:#fff7ea"><td colspan="3"></td><td style="text-align:right;padding:8px">Grand Total</td><td style="text-align:center;padding:8px">${formatMoney(total)}</td></tr>
                    </tbody>
                </table>

                <div style="margin-top:20px">
                    <strong>Notes</strong>
                    <div>${quotation.offerNote || '-'}</div>
                </div>

                <div style="margin-top:20px">
                    <strong>Terms & Conditions</strong>
                    <ul>${quotation.terms.map(t => `<li>${t}</li>`).join('')}</ul>
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
    const statusBadge = (status) => {
        const map = {
            DRAFT: { text: 'Draft', color: 'bg-gray-500' },
            SENT: { text: 'Sent', color: 'bg-green-500' },
            ACCEPTED: { text: 'Accepted', color: 'bg-blue-500' },
            REJECTED: { text: 'Rejected', color: 'bg-red-500' }
        };
        const s = map[status] || map.DRAFT;
        return <span className={`px-2 py-1 rounded text-xs ${s.color} text-white font-medium`}>{s.text}</span>;
    };

    // New quotation
    const startNew = () => {
        setQuotation({ ...blankQuotation, offerDate: new Date().toISOString().split('T')[0] });
        setShowPreview(false);
    };

    // FIXED: Compact Modal Wrapper with proper event handling
    const CompactModal = ({ title, children, onClose, size = 'md', showFooter = true, onAddSelected }) => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
            <div className={`rounded-xl shadow-2xl ${
                isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            } ${
                size === 'sm' ? 'max-w-md' : 
                size === 'md' ? 'max-w-2xl' : 
                'max-w-4xl'
            } w-full max-h-[95vh] overflow-hidden flex flex-col`}>
                {/* Header */}
                <div className={`px-4 sm:px-6 py-4 border-b ${
                    isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
                } flex items-center justify-between`}>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg transition-colors ${
                            isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
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
                    <div className={`px-4 sm:px-6 py-4 border-t ${
                        isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
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
                <div className={`p-4 sm:p-6 rounded-xl ${
                    isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                } shadow-sm`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3 truncate">
                                <ShoppingCartIcon className="h-6 w-6 sm:h-7 sm:w-7 text-orange-500 flex-shrink-0" />
                                <span className="truncate">Sales Quotation Builder</span>
                            </h1>
                            <p className="text-gray-400 mt-1 text-sm sm:text-base truncate">
                                Create and manage professional sales quotations
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            {/* Mobile: Stack these vertically on small screens */}
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                                <div className={`px-3 py-1.5 rounded-lg border text-sm font-medium flex-shrink-0 ${
                                    isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
                                }`}>
                                    <span className="hidden sm:inline">
                                        {quotation.quotationId ? `ID: ${quotation.quotationId}` : 'Unsaved Draft'}
                                    </span>
                                    <span className="sm:hidden">
                                        {quotation.quotationId ? quotation.quotationId : 'Draft'}
                                    </span>
                                </div>
                                <div className="flex-shrink-0">
                                    {statusBadge(quotation.status)}
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
                                    onClick={loadSavedQuotations}
                                    className={`${buttonBaseClass(isDarkMode, 'gray', 'sm')} flex-1 sm:flex-none`}
                                    title="Refresh quotations"
                                >
                                    <RefreshIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-4 gap-6">
                    {/* Main Content - 3 columns */}
                    <div className="lg:col-span-3 space-y-6">
                       {/* Quick Actions Bar - Responsive */}
                <div className={`p-3 sm:p-4 rounded-xl ${
                    isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                }`}>
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
                                if (quotation.status === 'SENT') {
                                    alert('Cannot save changes to a sent quotation. Please use "Save/Revise" to create a new revision.');
                                    return;
                                }
                                saveQuotation();
                            }}
                            disabled={loading || quotation.status === 'SENT'}
                            className={`${buttonBaseClass(isDarkMode, 'green', 'sm')} ${
                                (loading || quotation.status === 'SENT') ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            <SaveIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Save Draft</span>
                            <span className="sm:hidden">Save</span>
                        </button>
                        <button
                            onClick={async () => {
                                if (quotation.status === 'SENT' && quotation.id) {
                                    if (!window.confirm('Create a new revision of this sent quotation?')) return;
                                    await saveQuotation({ isRevision: true });
                                } else {
                                    await saveQuotation();
                                }
                            }}
                            disabled={loading}
                            className={`${buttonBaseClass(isDarkMode, 'orange', 'sm')} ${
                                loading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            <MailIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Save/Revise</span>
                            <span className="sm:hidden">Revise</span>
                        </button>
                        <StatusDropdown 
                            current={quotation.status} 
                            onChange={updateStatus} 
                            isDarkMode={isDarkMode} 
                        />
                        <button 
                            onClick={sendQuotation}
                            className={buttonBaseClass(isDarkMode, 'purple', 'sm')}
                        >
                            <ShareIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Send</span>
                        </button>
                    </div>
                </div>

                        {/* Customer Information */}
                        <div className={`p-6 rounded-xl ${
                            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                        }`}>
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <UserIcon className="h-5 w-5 text-orange-500" />
                                Customer Information
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Customer</label>
                                    <select
                                        value={quotation.customerName || ''}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            if (v === '__create_new__') {
                                                setShowCustomerModal(true);
                                                return;
                                            }
                                            const cust = customers.find(c => c.name === v);
                                            if (cust) {
                                                setQuotation(prev => ({
                                                    ...prev,
                                                    customerId: cust.id,
                                                    customerName: cust.name,
                                                    customerEmail: cust.email || '',
                                                    customerPhone: cust.phone || ''
                                                }));
                                            } else {
                                                setQuotation(prev => ({ ...prev, customerName: v }));
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
                                        value={quotation.customerEmail} 
                                        onChange={(e) => setQuotation(prev => ({ ...prev, customerEmail: e.target.value }))} 
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Customer Phone</label>
                                    <input 
                                        className={inputBaseClass(isDarkMode)}
                                        value={quotation.customerPhone} 
                                        onChange={(e) => setQuotation(prev => ({ ...prev, customerPhone: e.target.value }))} 
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Offer Date</label>
                                    <input 
                                        type="date" 
                                        className={inputBaseClass(isDarkMode)}
                                        value={quotation.offerDate} 
                                        onChange={(e) => setQuotation(prev => ({ ...prev, offerDate: e.target.value }))} 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Prepared By</label>
                                    <input 
                                        className={inputBaseClass(isDarkMode)}
                                        value={quotation.creatorName} 
                                        onChange={(e) => setQuotation(prev => ({ ...prev, creatorName: e.target.value }))} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Position</label>
                                    <input 
                                        className={inputBaseClass(isDarkMode)}
                                        value={quotation.creatorPosition} 
                                        onChange={(e) => setQuotation(prev => ({ ...prev, creatorPosition: e.target.value }))} 
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium mb-2">Offer Notes</label>
                                <textarea 
                                    className={inputBaseClass(isDarkMode)} 
                                    rows={3} 
                                    value={quotation.offerNote} 
                                    onChange={(e) => setQuotation(prev => ({ ...prev, offerNote: e.target.value }))} 
                                />
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className={`p-6 rounded-xl ${
                            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                        }`}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-semibold text-lg">Quotation Items</h3>
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
                                        {quotation.items.map((it, i) => (
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

                                {quotation.items.length === 0 && (
                                    <div className={`text-center py-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                        }`}>
                                        <ShoppingCartIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p className="font-medium">No items added yet</p>
                                        <p className="text-sm mt-1">Add items from catalog or create manual items</p>
                                    </div>
                                )}
                            </div>

                            {/* Totals Section */}
                            <div className="mt-6 space-y-3">
                                <div className="flex justify-between items-center border-t pt-4">
                                    <span className="font-medium text-gray-600 dark:text-gray-400">Subtotal:</span>
                                    <span className="font-bold text-lg">{formatMoney(subtotal)}</span>
                                </div>
                                {showTax && (
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-600 dark:text-gray-400">
                                            Tax ({quotation.taxRate}%):
                                        </span>
                                        <span className="font-bold text-lg">{formatMoney(taxAmount)}</span>
                                    </div>
                                )}
                                <div className={`flex justify-between items-center border-t pt-4 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'
                                    }`}>
                                    <span className="font-bold text-xl">Grand Total:</span>
                                    <span className="font-bold text-2xl">{formatMoney(total)}</span>
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
                                    {quotation.items.length} items
                                </div>
                            </div>
                        </div>

                        {/* Company Settings & Terms */}
                        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                            }`}>
                            <h3 className="font-semibold text-lg mb-6">Company & Settings</h3>

                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Company Name</label>
                                    <input
                                        className={inputBaseClass(isDarkMode)}
                                        value={quotation.companyInfo.name}
                                        onChange={(e) => setQuotation(prev => ({ ...prev, companyInfo: { ...prev.companyInfo, name: e.target.value } }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Company Email</label>
                                    <input
                                        className={inputBaseClass(isDarkMode)}
                                        value={quotation.companyInfo.email}
                                        onChange={(e) => setQuotation(prev => ({ ...prev, companyInfo: { ...prev.companyInfo, email: e.target.value } }))}
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">Company Address</label>
                                <textarea
                                    rows={2}
                                    className={inputBaseClass(isDarkMode)}
                                    value={quotation.companyInfo.address}
                                    onChange={(e) => setQuotation(prev => ({ ...prev, companyInfo: { ...prev.companyInfo, address: e.target.value } }))}
                                />
                            </div>

                            <div className="grid md:grid-cols-3 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Tax Rate (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        className={inputBaseClass(isDarkMode)}
                                        value={quotation.taxRate}
                                        onChange={(e) => setQuotation(prev => ({ ...prev, taxRate: Number(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Validity (days)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className={inputBaseClass(isDarkMode)}
                                        value={quotation.validityDays}
                                        onChange={(e) => setQuotation(prev => ({ ...prev, validityDays: Number(e.target.value) || 30 }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Company Phone</label>
                                    <input
                                        className={inputBaseClass(isDarkMode)}
                                        value={quotation.companyInfo.phone}
                                        onChange={(e) => setQuotation(prev => ({ ...prev, companyInfo: { ...prev.companyInfo, phone: e.target.value } }))}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold">Terms & Conditions</h4>
                                    <button
                                        onClick={() => setQuotation(prev => ({ ...prev, terms: [...prev.terms, 'New term...'] }))}
                                        className={buttonBaseClass(isDarkMode, 'green', 'sm')}
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                        Add Term
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {quotation.terms.map((t, idx) => (
                                        <div key={idx} className="flex gap-3 items-start">
                                            <input
                                                value={t}
                                                onChange={(e) => {
                                                    const arr = [...quotation.terms];
                                                    arr[idx] = e.target.value;
                                                    setQuotation(prev => ({ ...prev, terms: arr }));
                                                }}
                                                className={`flex-1 ${inputBaseClass(isDarkMode)}`}
                                            />
                                            <button
                                                onClick={() => setQuotation(prev => ({ ...prev, terms: prev.terms.filter((_, i) => i !== idx) }))}
                                                className={buttonBaseClass(isDarkMode, 'red', 'sm')}
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Preview Section */}
                        {showPreview && (
                            <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                                }`}>
                                <h3 className="font-semibold text-lg mb-6">Preview</h3>
                                <div className="p-6 border rounded-lg bg-white dark:bg-gray-900">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                                {quotation.companyInfo.name}
                                            </h2>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {quotation.companyInfo.address}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-gray-700 dark:text-gray-300">QUOTATION</div>
                                            <div className="font-bold text-lg text-gray-900 dark:text-white mt-1">
                                                {quotation.quotationId || '(unsaved)'}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                                Date: {quotation.offerDate}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                Validity: {quotation.validityDays} days
                                            </div>
                                            <div className="mt-2">{statusBadge(quotation.status)}</div>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-orange-500 text-white">
                                                    <th className="p-3 text-left">#</th>
                                                    <th className="p-3 text-left">Product</th>
                                                    <th className="p-3 text-center">Qty</th>
                                                    <th className="p-3 text-center">Unit</th>
                                                    <th className="p-3 text-center">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {quotation.items.map((it, i) => (
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
                                                {showTax && (
                                                    <tr>
                                                        <td colSpan="3"></td>
                                                        <td className="p-3 text-right font-bold">Tax</td>
                                                        <td className="p-3 text-center font-bold">{formatMoney(taxAmount)}</td>
                                                    </tr>
                                                )}
                                                <tr className="bg-orange-50 dark:bg-orange-900/20">
                                                    <td colSpan="3"></td>
                                                    <td className="p-3 text-right font-bold text-lg">Grand Total</td>
                                                    <td className="p-3 text-center font-bold text-lg">{formatMoney(total)}</td>
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
                        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                            }`}>
                            <h4 className="font-semibold text-lg mb-4">Summary</h4>
                            <div className="space-y-3">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-orange-500">{formatMoney(total)}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Grand Total</div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Items:</span>
                                        <span className="font-medium">{quotation.items.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span className="font-medium">{formatMoney(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tax:</span>
                                        <span className="font-medium">{formatMoney(taxAmount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Quotations */}
                        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                            }`}>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-lg">Recent Quotations</h4>
                                <button
                                    onClick={loadSavedQuotations}
                                    className={buttonBaseClass(isDarkMode, 'gray', 'sm')}
                                >
                                    <RefreshIcon className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="space-y-3 max-h-96 overflow-auto">
                                {savedQuotations.slice(0, 8).map(q => (
                                    <div
                                        key={q.id}
                                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${isDarkMode
                                                ? 'border-gray-600 hover:border-orange-500 hover:bg-gray-750'
                                                : 'border-gray-200 hover:border-orange-500 hover:bg-gray-50'
                                            }`}
                                        onClick={() => {
                                            if (q.status === 'SENT') {
                                                if (window.confirm('This quotation has been sent. Would you like to create a revised version?')) {
                                                    loadQuotationForEdit(q);
                                                }
                                            } else {
                                                loadQuotationForEdit(q);
                                            }
                                        }}
                                    >
                                        <div className="font-medium text-sm">{q.customerName || 'Unnamed'}</div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {q.quotationId} • {new Date(q.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            {statusBadge(q.status)}
                                            <span className="font-semibold text-sm">
                                                {formatMoney(q.total || 0)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {savedQuotations.length === 0 && (
                                    <div className="text-center text-gray-400 py-6 text-sm">
                                        <div className="text-2xl mb-2">📝</div>
                                        <p>No quotations found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* FIXED: Compact Catalog Modal with proper event handling */}
            {/* Catalog modal */}
            {/* Compact Mobile-Friendly Catalog Modal */}
            {showCatalog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50">
                    <div className={`w-full max-w-2xl rounded-xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
                        }`}>
                        {/* Header - Compact */}
                        <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                            } flex items-center justify-between`}>
                            <h3 className="text-lg font-semibold">Select Products</h3>
                            <button
                                onClick={() => { setCatalogSelection([]); setShowCatalog(false); }}
                                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
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
                        <div className={`px-4 py-3 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                            }`}>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <div className="flex-1 text-sm px-2 py-1.5 rounded ${
                        isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }">
                                    <span className="font-medium">{catalogSelection.length}</span> items selected
                                </div>
                                <div className="flex gap-2 sm:gap-3">
                                    <button
                                        onClick={() => { setCatalogSelection([]); setShowCatalog(false); }}
                                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${isDarkMode
                                                ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300'
                                            }`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCatalogAddSelected}
                                        disabled={catalogSelection.length === 0}
                                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${catalogSelection.length === 0
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

// StatusDropdown component
const StatusDropdown = ({ current = 'DRAFT', onChange = () => { }, isDarkMode = false }) => {
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
                <div className={`absolute right-0 mt-1 w-40 sm:w-48 rounded-lg shadow-xl z-50 border ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                    <div className="py-1">
                        {STATUS_OPTIONS.map(s => (
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

export default SalesQuotationUnified;