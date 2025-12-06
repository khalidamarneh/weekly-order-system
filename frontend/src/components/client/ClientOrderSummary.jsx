// frontend/src/components/client/ClientOrderSummary.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  ClipboardListIcon, 
  ShoppingCartIcon, 
  CreditCardIcon, 
  TruckIcon 
} from '@heroicons/react/outline';

const ClientOrderSummary = ({ isDarkMode, onViewDraft, onViewOrders, orderControl }) => {
  const [draftOrder, setDraftOrder] = useState(null);
  const [ordersCount, setOrdersCount] = useState({ active: 0, history: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    setLoading(true);
    setError(null);
    try {
      const draftResponse = await api.get('/api/client/orders/draft');
      setDraftOrder(draftResponse.data);

      const summaryResponse = await api.get('/api/client/orders/summary');
      setOrdersCount(summaryResponse.data);

    } catch (err) {
      console.error('Failed to fetch order summary data:', err);
      setError('Could not load your order data. Please try again.');
      setOrdersCount({ active: 0, history: 0 });
    } finally {
      setLoading(false);
    }
  };

    // In ClientOrderSummary.jsx and ClientClick.jsx, check for empty draft:
    const getDraftItemCount = () => {
        if (!draftOrder || !draftOrder.items || draftOrder.items.length === 0) return 0;
        return draftOrder.items.reduce((total, item) => total + item.quantity, 0);
    };

  const getDraftTotalValue = () => {
    if (!draftOrder || !draftOrder.items || !orderControl?.showSalePrice) return null;
    return draftOrder.items.reduce((total, item) => {
      const itemPrice = item.unitPrice || item.product?.salePrice || 0;
      return total + (itemPrice * item.quantity);
    }, 0);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`rounded-xl p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} shadow-sm`} />
        ))}
      </div>
    );
  }

  const draftTotalValue = getDraftTotalValue();

  const cardData = [
    {
      title: 'Draft Order',
      icon: ClipboardListIcon,
      color: isDarkMode ? 'from-blue-700 to-blue-500' : 'from-blue-100 to-blue-50',
      value: draftOrder ? 
        (orderControl?.showSalePrice && draftTotalValue ? 
          `${getDraftItemCount()} item(s) • $${draftTotalValue.toFixed(2)}` : 
          `${getDraftItemCount()} item(s)`) : 
        'No active draft',
      subtitle: draftOrder ? 'Click to continue editing' : 'Start a new order',
      onClick: () => (onViewDraft ? onViewDraft() : (window.location.hash = '#draft-detail'))
    },
      {
          title: 'My Orders',
          icon: ShoppingCartIcon,
          color: isDarkMode ? 'from-green-700 to-green-500' : 'from-green-100 to-green-50',
          value: orderControl?.showQuantity ?
              `${ordersCount.active} Active, ${ordersCount.history} History` :
              'View order history',
          subtitle: 'View current and past orders',
          onClick: () => {
              if (onViewOrders) {
                  onViewOrders(); // This should navigate to My Orders
              } else {
                  // Fallback navigation
                  window.location.hash = '#my-orders';
              }
          },
          enabled: true
      },
    {
      title: 'Payment',
      icon: CreditCardIcon,
      color: isDarkMode ? 'from-purple-700 to-purple-500' : 'from-purple-100 to-purple-50',
      value: orderControl?.showSalePrice ? 'Balance, Methods' : 'Payment Info',
      subtitle: 'Checkout & payment info',
      enabled: false
    },
    {
      title: 'Shipping',
      icon: TruckIcon,
      color: isDarkMode ? 'from-orange-700 to-orange-500' : 'from-orange-100 to-orange-50',
      value: orderControl?.showQuantity ? 'Tracking, Status' : 'Delivery Info',
      subtitle: 'Delivery information',
      enabled: false
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {error && (
        <div className="col-span-full">
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
            {error}
          </div>
        </div>
      )}
      {cardData.map((card, index) => {
        const cardContent = (
          <>
            <div className="flex items-start justify-between mb-3">
              <card.icon className={`h-8 w-8 ${isDarkMode ? 'text-white' : 'text-gray-800'}`} />
            </div>
            <h3 className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {card.title}
            </h3>
            <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>
              {card.value}
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
              {card.subtitle}
            </p>
          </>
        );

        const baseClasses = `rounded-xl p-5 shadow-md transition-all duration-300 bg-gradient-to-br ${card.color}`;

        if (card.enabled === false) {
          return (
            <div
              key={index}
              className={`${baseClasses} opacity-60 cursor-not-allowed`}
            >
              {cardContent}
            </div>
          );
        }

        return (
          <div
            key={index}
            onClick={card.onClick}
            className={`${baseClasses} cursor-pointer transform hover:scale-105 hover:shadow-lg`}
          >
            {cardContent}
          </div>
        );
      })}
    </div>
  );
};

export default ClientOrderSummary;
