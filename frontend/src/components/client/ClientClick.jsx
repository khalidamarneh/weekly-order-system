// frontend/src/components/client/ClientClick.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import socketService from '../../services/socket';
import {
  PlusIcon,
  MinusIcon,
  TrashIcon,
  XIcon,
  PhotographIcon,
  PaperAirplaneIcon,
  CameraIcon
} from '@heroicons/react/outline';

// Define BACKEND_URL constant
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";


const ClientClick = ({ isDarkMode, orderControl, productToAdd, goToCatalog, goToSummary, onBackToSummary, canSubmitOrder, orderMessage, onTimeRestriction }) => {
  // State for the draft order
  const [draftOrder, setDraftOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // State for the "Add Product" modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // State for "Add Unlisted Product"
  const [showUnlistedModal, setShowUnlistedModal] = useState(false);
  const [unlistedProduct, setUnlistedProduct] = useState({
    description: '',
    quantity: 1,
    image: null
  });

  

  // ADD THIS STATE FOR TIME RESTRICTION MODAL:
  const [showTimeRestrictionModal, setShowTimeRestrictionModal] = useState(false);

  // Fetch the current draft order on component mount
  useEffect(() => {
    fetchDraftOrder();
  }, []);

  // Add this useEffect to automatically open the product modal when a product is passed:
  useEffect(() => {
    if (productToAdd) {
      setSelectedProduct(productToAdd);
      setQuantity(1);
      setShowProductModal(true);
    }
  }, [productToAdd]);

  const fetchDraftOrder = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/client/orders/draft');
      setDraftOrder(response.data);
    } catch (err) {
      console.error('Failed to fetch draft order:', err);
      setDraftOrder({
        id: null,
        status: 'DRAFT',
        items: []
      });
    } finally {
      setLoading(false);
    }
  };

///////////////////////////////////////////////////////
  // ---------- Camera state & refs ----------
const [cameraActive, setCameraActive] = useState(false);
const [videoReady, setVideoReady] = useState(false);   // true when video has real frames
const [capturedImage, setCapturedImage] = useState(null);
const [showCameraModal, setShowCameraModal] = useState(false);

const videoRef = useRef(null);
const canvasRef = useRef(null);
const streamRef = useRef(null); // store MediaStream

// Progressive constraints (attempt these in order)
const constraintsList = [
  { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
  { video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
  { video: true, audio: false }
];

// ---------- startCamera: try constraints progressively ----------
const startCamera = async () => {
  try {
    stopCamera();

    let stream = null;
    for (const c of constraintsList) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(c);
        console.log('[camera] getUserMedia succeeded with', c);
        break;
      } catch (err) {
        console.warn('[camera] getUserMedia failed for', c, err);
      }
    }

    if (!stream) {
      throw new Error('No usable camera stream (all constraints failed)');
    }

    // Save stream & flip flags; the effect below will attach the stream to <video>
    streamRef.current = stream;
    setVideoReady(false);
    setCameraActive(true); // render video; effect will attach srcObject and call play()
  } catch (err) {
    console.error('[camera] startCamera error:', err);
    alert('Unable to access camera. See console for details.');
    stopCamera();
  }
};

// ---------- effect to attach stream to the <video> after video mounts ----------
useEffect(() => {
  let mounted = true;
  if (!cameraActive) {
    // camera closed: clear flags
    setVideoReady(false);
    return;
  }

  const attachStreamToVideo = async () => {
    const stream = streamRef.current;
    if (!stream) {
      console.warn('[camera] attach: no streamRef available');
      return;
    }

    // Wait a tick in case video element is still mounting
    for (let i = 0; i < 6 && !videoRef.current; i++) {
      await new Promise(r => setTimeout(r, 80));
    }
    if (!videoRef.current) {
      console.warn('[camera] attach: video element not mounted after wait');
      return;
    }

    const videoEl = videoRef.current;
    try {
      videoEl.srcObject = stream;

      // Diagnostic logs
      const tracks = stream.getVideoTracks();
      console.log('[camera] stream.getVideoTracks():', tracks);
      if (tracks && tracks[0] && typeof tracks[0].getSettings === 'function') {
        console.log('[camera] track.getSettings():', tracks[0].getSettings());
      }

      // Wait for loadedmetadata or fallback timeout
      await new Promise((resolve) => {
        let resolved = false;
        const onLoaded = () => {
          if (resolved) return;
          resolved = true;
          videoEl.removeEventListener('loadedmetadata', onLoaded);
          resolve();
        };
        videoEl.addEventListener('loadedmetadata', onLoaded);
        // fallback to resolve after 1200ms (some devices are slow)
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            try { videoEl.removeEventListener('loadedmetadata', onLoaded); } catch(e){}
            resolve();
          }
        }, 1200);
      });

      // Try to play (some browsers need explicit play)
      try {
        await videoEl.play();
      } catch (playErr) {
        console.warn('[camera] video.play() failed:', playErr);
      }

      // Check if real dimensions are available
      const vW = videoEl.videoWidth;
      const vH = videoEl.videoHeight;
      console.log('[camera] after attach video size:', vW, vH);

      if (mounted && vW > 0 && vH > 0) {
        setVideoReady(true);
        console.log('[camera] videoReady=true');
      } else {
        // no frames - log and show helpful message
        console.warn('[camera] video dimensions are zero (no frames). Check track settings above.');
        // Give user a single alert (don't spam)
        alert('Camera attached but no frames are available (black preview). See console for track settings. Try another browser or camera.');
        // keep cameraActive true so user can attempt to close & re-open; don't loop automatically
      }
    } catch (err) {
      console.error('[camera] attach failed:', err);
      stopCamera();
    }
  };

  attachStreamToVideo();

  return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [cameraActive]);

// ---------- stopCamera ----------
const stopCamera = () => {
  try {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (e) { /* ignore */ }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      try { videoRef.current.srcObject = null; } catch (e) { /* ignore */ }
    }
  } finally {
    setVideoReady(false);
    setCameraActive(false);
  }
};

// ---------- capturePhoto ----------
const capturePhoto = () => {
  if (!videoRef.current || !videoReady) {
    alert('Camera not ready — please wait until the preview shows (or check console).');
    return;
  }

  const video = videoRef.current;
  const canvas = canvasRef.current || document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob((blob) => {
    if (!blob) {
      alert('Failed to capture photo.');
      return;
    }
    const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });
    setUnlistedProduct(prev => ({ ...prev, image: file }));
    setCapturedImage(canvas.toDataURL('image/jpeg'));
    stopCamera();
  }, 'image/jpeg');
};

  ////////////////////////////

  // Handler for opening the product modal
  const handleAddProductClick = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setShowProductModal(true);
  };

  // Handler for adding a listed product to the draft
  const handleAddToListedOrder = async () => {
    if (!selectedProduct || quantity < 1) return;

    setSaving(true);
    try {
      const response = await api.post('/api/client/orders/draft/items', {
        productId: selectedProduct.id,
        quantity: quantity
      });

      setDraftOrder(response.data);
      setShowProductModal(false);
      setSelectedProduct(null);
      setQuantity(1);
    } catch (err) {
      console.error('Failed to add product to draft:', err);
      if (err.response?.data?.error?.includes('stock') || err.response?.data?.error?.includes('quantity')) {
        alert(`Error: ${err.response.data.error}. This item has been flagged for restocking.`);
      } else {
        alert('Failed to add product to your order. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Handler for adding an unlisted product
  const handleAddUnlistedProduct = async () => {
    if (!unlistedProduct.description || unlistedProduct.quantity < 1) return;

    setSaving(true);
    const formData = new FormData();
    formData.append('description', unlistedProduct.description);
    formData.append('quantity', unlistedProduct.quantity.toString());

    if (unlistedProduct.image) {
      formData.append('image', unlistedProduct.image);
    }

    try {
      const response = await api.post('/api/client/orders/draft/items/unlisted', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setDraftOrder(response.data);
      setShowUnlistedModal(false);
      setUnlistedProduct({ description: '', quantity: 1, image: null });
      setCapturedImage(null);
    } catch (err) {
      console.error('Failed to add unlisted product:', err);
      alert('Failed to add custom item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handler for quantity changes
  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    setDraftOrder(prev => (prev ? ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    }) : prev));

    try {
      await api.put(`/api/client/orders/draft/items/${itemId}`, {
        quantity: newQuantity
      });
    } catch (err) {
      console.error("Failed to update item quantity:", err);
      try {
        const originalData = await api.get("/api/client/orders/draft");
        setDraftOrder(originalData.data);
      } catch (reloadErr) {
        console.error("Failed to reload draft order:", reloadErr);
      }
    }
  };

  // Handler for removing an item from the draft with image cleanup
  const removeItemFromDraft = async (itemId, imagePath) => {
    if (!window.confirm('Are you sure you want to remove this item from your order?')) {
      return;
    }

    try {
      // First delete the image file if it exists
      if (imagePath) {
        try {
          await api.delete(`/api/client/orders/draft/items/${itemId}/image`);
          console.log('Image deleted successfully');
        } catch (imageErr) {
          console.warn('Could not delete image file:', imageErr);
          // Continue with item deletion even if image deletion fails
        }
      }

      // Then delete the item
      await api.delete(`/api/client/orders/draft/items/${itemId}`);
      setDraftOrder(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId)
      }));
    } catch (err) {
      console.error('Failed to remove item from draft:', err);
      alert('Failed to remove item. Please try again.');
    }
  };

  // Handler for submitting the final order
  const handleSubmitOrder = async () => {
    if (!canSubmitOrder) {
      setShowTimeRestrictionModal(true);
      return;
    }

    if (!draftOrder || !draftOrder.items || draftOrder.items.length === 0) {
      alert('Your order is empty. Please add items before submitting.');
      return;
    }

    if (!window.confirm('Are you sure you want to submit this order? You cannot edit it after submission.')) {
      return;
    }

    setSaving(true);
    setSubmitError(null);
    try {
      const response = await api.post('/api/client/orders/draft/submit');
      const submittedOrder = response.data;

      const socket = socketService.getSocket();
      if (socket && socketService.isConnected) {
        socket.emit('inbound_order_submitted', {
          orderId: submittedOrder.id,
          orderNumber: submittedOrder.orderNumber,
          clientId: submittedOrder.clientId,
          clientName: submittedOrder.client?.name || 'A client',
          itemCount: submittedOrder.items.length
        });
      }

      alert(`Order #${submittedOrder.orderNumber} submitted successfully!`);
      setDraftOrder({
        id: null,
        status: 'DRAFT',
        items: []
      });

    } catch (err) {
      console.error('Failed to submit order:', err);
      setSubmitError(err.response?.data?.error || 'Failed to submit order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Calculate total items and estimated total
  const totalItems = draftOrder?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const estimatedTotal = orderControl?.showSalePrice
    ? draftOrder?.items?.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0) || 0
    : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Your Draft Order
        </h2>
        <div className="flex items-center space-x-4">
          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {totalItems} item(s)
            {estimatedTotal !== null && ` • Est. Total: $${estimatedTotal.toFixed(2)}`}
          </span>
          <button
            onClick={() => setShowUnlistedModal(true)}
            className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Unlisted Item
          </button>
        </div>
      </div>

      {/* Order Items Table */}
      {(!draftOrder?.items || draftOrder.items.length === 0) ? (
        <div className={`text-center py-12 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            Your draft order is empty. Add products from the catalog or add an unlisted item.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className={isDarkMode ? "bg-yellow-600" : "bg-yellow-400"}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wider">Product</th>
                {orderControl?.showSalePrice && <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wider">Unit Price</th>}
                <th className="px-4 py-3 text-center text-sm font-bold uppercase tracking-wider">Qty</th>
                {orderControl?.showSalePrice && <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wider">Total</th>}
                <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wider">Image</th>
                <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {draftOrder.items.map((item, index) => {
                const isUnlisted = !item.product;
                return (
                  <tr key={`item-${item.id || index}`} className={isDarkMode ? "hover:bg-gray-750" : "hover:bg-gray-50"}>

                    {/* Row Number */}
                    <td className="px-4 py-3">
                      <span className={`font-medium ${isUnlisted ? 'text-red-500' : (isDarkMode ? 'text-gray-300' : 'text-gray-700')}`}>
                        {index + 1}
                      </span>
                    </td>

                    {/* Product Info */}
                    <td className="px-4 py-3">
                      <div>
                        <div className={`font-medium ${isUnlisted ? 'text-red-500' : (isDarkMode ? 'text-white' : 'text-gray-900')}`}>
                          {item.product?.name || item.description || 'Unlisted Item'}
                        </div>
                        {item.product?.partNo && (
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Part #: {item.product.partNo}
                          </div>
                        )}
                        {isUnlisted && (
                          <div className={`text-xs italic ${isUnlisted ? 'text-red-400' : (isDarkMode ? 'text-gray-400' : 'text-gray-500')}`}>
                            Unlisted Item
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Unit Price */}
                    {orderControl?.showSalePrice && (
                      <td className="px-4 py-3">
                        <span className={isUnlisted ? 'text-red-400' : (isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
                          {isUnlisted ? '-' : `$${(item.unitPrice || item.product?.salePrice || 0).toFixed(2)}`}
                        </span>
                      </td>
                    )}

                    {/* Quantity Controls */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleQuantityChange(item.id, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                          className={`p-1 rounded ${item.quantity <= 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : isDarkMode
                              ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                            }`}
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        <span className={`w-8 text-center font-medium ${isUnlisted ? 'text-red-500' : (isDarkMode ? 'text-white' : 'text-gray-900')}`}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className={`p-1 rounded ${isDarkMode
                            ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                            }`}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>

                    {/* Total Price */}
                    {orderControl?.showSalePrice && (
                      <td className="px-4 py-3">
                        <span className={`font-medium ${isUnlisted ? 'text-red-400' : (isDarkMode ? 'text-green-400' : 'text-green-600')}`}>
                          {isUnlisted ? '-' : `$${(((item.unitPrice || item.product?.salePrice || 0) * item.quantity)).toFixed(2)}`}
                        </span>
                      </td>
                    )}

                    {/* Image Preview Column - FIXED */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.imagePath || item.product?.imagePath ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const imagePath = item.imagePath || item.product?.imagePath;

                            console.log('Image path details:', {
                              itemImagePath: item.imagePath,
                              productImagePath: item.product?.imagePath,
                              finalPath: imagePath
                            });

                            if (!imagePath) return;

                            // Determine the correct image URL
                            let imageUrl;
                            if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
                              // Already a full URL
                              imageUrl = imagePath;
                            } else if (imagePath.startsWith('/')) {
                              // Relative path (e.g., /uploads/images/xxx.webp)
                              // Don't prepend BACKEND_URL - browser will use current domain
                              imageUrl = imagePath;
                            } else {
                              // Assume it's a filename in uploads folder
                              imageUrl = `/uploads/${imagePath}`;
                            }

                            console.log('Final image URL:', imageUrl);
                            window.open(imageUrl, '_blank', 'width=600,height=600');
                          }}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isUnlisted
                            ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800'
                            : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800'
                            } transition-colors`}
                        >
                          <PhotographIcon className="w-3 h-3 mr-1" />
                          View
                        </button>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isUnlisted
                          ? 'bg-red-50 text-red-600 dark:bg-red-900 dark:text-red-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                          No Image
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeItemFromDraft(item.id, item.imagePath)}
                        className={`p-1 rounded ${isDarkMode
                          ? 'text-red-400 hover:text-red-300 hover:bg-gray-700'
                          : 'text-red-600 hover:text-red-900 hover:bg-gray-200'
                          }`}
                        title="Remove item"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Grand Total Row */}
              {orderControl?.showSalePrice && draftOrder.items.length > 0 && (
                <tr className={isDarkMode ? "bg-gray-700" : "bg-gray-100"}>
                  <td colSpan={3} className="px-4 py-3 text-right font-bold">
                    Grand Total:
                  </td>
                  <td className="px-4 py-3 font-bold text-center">
                    {draftOrder.items.reduce((total, item) => total + item.quantity, 0)}
                  </td>
                  <td className="px-4 py-3 font-bold">
                    <span className={isDarkMode ? 'text-green-400' : 'text-green-600'}>
                      ${draftOrder.items.reduce((total, item) =>
                        total + ((item.unitPrice || item.product?.salePrice || 0) * item.quantity), 0
                      ).toFixed(2)}
                    </span>
                  </td>
                  <td colSpan={2}></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Add More Items Button - UPDATED SIZE */}
      <div className="mt-6 flex justify-end space-x-4">
        <button
          onClick={goToCatalog}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${isDarkMode
            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
            : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
        >
          Add More Items
        </button>

        <button
          onClick={handleSubmitOrder}
          disabled={saving || !draftOrder?.items || draftOrder.items.length === 0 || !canSubmitOrder}
          className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${saving || !draftOrder?.items || draftOrder.items.length === 0 || !canSubmitOrder
            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          title={!canSubmitOrder ? orderMessage : 'Submit your order'}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </>
          ) : !canSubmitOrder ? (
            <>
              <XIcon className="h-5 w-5 mr-2" />
              Ordering Closed
            </>
          ) : (
            <>
              <PaperAirplaneIcon className="h-5 w-5 mr-2" />
              Submit Order
            </>
          )}
        </button>
      </div>

      {submitError && (
        <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
          {submitError}
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-xl w-full max-w-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Add to Order
                </h3>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedProduct.name}
                </h4>
                {selectedProduct.partNo && (
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Part #: {selectedProduct.partNo}
                  </p>
                )}
              </div>

              {orderControl?.showSalePrice && selectedProduct.salePrice && (
                <p className={`mb-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  Price: ${selectedProduct.salePrice}
                </p>
              )}

              {orderControl?.showQuantity && selectedProduct.quantity !== undefined && (
                <p className={`mb-4 text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  Available: {selectedProduct.quantity}
                </p>
              )}

              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowProductModal(false)}
                  className={`flex-1 py-2 px-4 border rounded-lg text-sm ${isDarkMode ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600' : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddToListedOrder}
                  disabled={saving}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors`}
                >
                  {saving ? 'Adding...' : 'Add to Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Unlisted Product Modal */}
      {showUnlistedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-xl w-full max-w-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Add Unlisted Item
                </h3>
                <button
                  onClick={() => {
                    setShowUnlistedModal(false);
                    stopCamera();
                    setUnlistedProduct({ description: '', quantity: 1, image: null });
                    setCapturedImage(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Item Description *
                  </label>
                  <textarea
                    value={unlistedProduct.description}
                    onChange={(e) => setUnlistedProduct({ ...unlistedProduct, description: e.target.value })}
                    rows={3}
                    className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    placeholder="Describe the item you need..."
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={unlistedProduct.quantity}
                    onChange={(e) => setUnlistedProduct({ ...unlistedProduct, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Image (Optional)
                  </label>

                  {/* Camera View - IMPROVED */}
                  {cameraActive && (
                    <div className="mb-4">
                      <div className="relative w-full h-48 bg-black rounded-lg overflow-hidden">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                          style={{ background: "#000" }}
                        />
                        {/* hidden canvas for capture */}
                        <canvas ref={canvasRef} style={{ display: "none" }} />
                      </div>

                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={capturePhoto}
                          disabled={!videoReady}
                          className={`flex-1 py-2 px-4 rounded-lg text-white ${videoReady
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-gray-400 cursor-not-allowed"
                            }`}
                        >
                          {videoReady ? "Capture Photo" : "Starting camera..."}
                        </button>

                        <button
                          onClick={stopCamera}
                          className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Image Preview */}
                  {capturedImage && !cameraActive && (
                    <div className="mb-4">
                      <img
                        src={capturedImage}
                        alt="Captured"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => {
                          setCapturedImage(null);
                          setUnlistedProduct({ ...unlistedProduct, image: null });
                        }}
                        className="mt-2 text-red-600 text-sm"
                      >
                        Remove Photo
                      </button>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <label
                      className={`flex-1 cursor-pointer border-2 border-dashed rounded-lg p-4 text-center ${isDarkMode
                          ? "border-gray-600 hover:border-gray-500 bg-gray-700"
                          : "border-gray-300 hover:border-gray-400 bg-gray-50"
                        }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          setUnlistedProduct({ ...unlistedProduct, image: file });
                          setCapturedImage(URL.createObjectURL(file));
                          stopCamera(); // Ensure camera is off when uploading file
                        }}
                        className="hidden"
                      />
                      <PhotographIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <span
                        className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                      >
                        {unlistedProduct.image ? "Change Image" : "Upload Image"}
                      </span>
                    </label>

                    <button
                      onClick={() => {
                        if (cameraActive) {
                          capturePhoto();
                        } else {
                          startCamera();
                        }
                      }}
                      className={`p-3 rounded-lg text-white ${isDarkMode
                          ? cameraActive
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-blue-600 hover:bg-blue-700"
                          : cameraActive
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      title={cameraActive ? "Capture Photo" : "Take Photo"}
                    >
                      {cameraActive ? (
                        <span className="flex items-center">
                          <CameraIcon className="h-6 w-6 mr-1" />
                          Capture
                        </span>
                      ) : (
                        <CameraIcon className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowUnlistedModal(false);
                    stopCamera();
                    setUnlistedProduct({ description: "", quantity: 1, image: null });
                    setCapturedImage(null);
                  }}
                  className={`flex-1 py-2 px-4 border rounded-lg text-sm ${isDarkMode
                      ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                      : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUnlistedProduct}
                  disabled={saving || !unlistedProduct.description.trim()}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors`}
                >
                  {saving ? "Adding..." : "Add Custom Item"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Time Restriction Modal */}
      {showTimeRestrictionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-xl w-full max-w-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Ordering Period Closed
                </h3>
                <button
                  onClick={() => setShowTimeRestrictionModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {orderMessage || 'The current ordering period has ended.'}
                </p>
                <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  You cannot submit new orders at this time. Please try again during the next ordering period.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowTimeRestrictionModal(false)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}
                >
                  OK
                </button>
                <button
                  onClick={() => {
                    setShowTimeRestrictionModal(false);
                    onTimeRestriction && onTimeRestriction();
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors`}
                >
                  Prepare Next Period Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientClick;
