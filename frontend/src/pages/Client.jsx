// frontend/src/pages/Client.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProductCatalog from '../components/client/ProductCatalog';
import ClientOrderSummary from '../components/client/ClientOrderSummary';
import ClientClick from '../components/client/ClientClick'; // We might use this later for a detailed view
import MyOrders from '../components/client/MyOrders'; // create this to list orders
import { SearchIcon, ShoppingCartIcon, PlayIcon, ClipboardListIcon, XIcon } from "@heroicons/react/outline";
import api from '../services/api';
import socketService from '../services/socket'; // Add this import
import { useNotifications } from '../hooks/useNotifications';
import Notification from '../components/Notification';
import CustomMessageBanner from '../components/CustomMessageBanner';

// Helper functions for time calculations
const calculateTimeRemaining = (orderControl) => {
  if (!orderControl?.warningEnabled || !orderControl?.timeControlEnabled) {
    return null;
  }

  const now = new Date();
  const { timeControlType, timeControlSettings } = orderControl;

  switch (timeControlType) {
    case 'daily':
      return calculateDailyTimeRemaining(timeControlSettings, now);
    case 'weekly':
      return calculateWeeklyTimeRemaining(timeControlSettings, now);
    case 'monthly':
      return calculateMonthlyTimeRemaining(timeControlSettings, now);
    default:
      return null;
  }
};

const calculateDailyTimeRemaining = (settings, now) => {
  const dailyHours = settings?.daily?.hours || 24;
  const hoursRemaining = dailyHours;

  if (hoursRemaining <= 2) {
    return {
      message: `⏰ Only ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''} remaining to order!`,
      level: 'critical'
    };
  } else if (hoursRemaining <= 6) {
    return {
      message: `⏳ ${hoursRemaining} hours remaining to complete your order`,
      level: 'warning'
    };
  } else if (hoursRemaining <= 12) {
    return {
      message: `📋 You have ${hoursRemaining} hours to place your order`,
      level: 'info'
    };
  }

  return null;
};

const calculateWeeklyTimeRemaining = (settings, now) => {
  const weeklySettings = settings?.weekly || {};
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const startDay = weeklySettings.startDay || 'Monday';
  const endDay = weeklySettings.endDay || 'Sunday';
  const endHour = weeklySettings.endHour || 23;
  const endMinute = weeklySettings.endMinute || 59;

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const currentDayIndex = daysOfWeek.indexOf(currentDay);
  const endDayIndex = daysOfWeek.indexOf(endDay);
  let daysRemaining = 0;
  if (currentDayIndex <= endDayIndex) {
    daysRemaining = endDayIndex - currentDayIndex;
  } else {
    daysRemaining = (7 - currentDayIndex) + endDayIndex;
  }

  const totalMinutesRemainingToday = (endHour * 60 + endMinute) - (currentHour * 60 + currentMinute);
  const hoursRemainingToday = Math.floor(totalMinutesRemainingToday / 60);
  const minutesRemainingToday = totalMinutesRemainingToday % 60;

  if (daysRemaining === 0 && hoursRemainingToday <= 2) {
    return {
      message: `⏰ Ordering closes today at ${endHour}:${endMinute.toString().padStart(2, '0')}!`,
      level: 'critical'
    };
  } else if (daysRemaining === 0) {
    return {
      message: `⏳ Ordering closes today at ${endHour}:${endMinute.toString().padStart(2, '0')}`,
      level: 'warning'
    };
  } else if (daysRemaining === 1) {
    return {
      message: `📋 Ordering closes tomorrow at ${endHour}:${endMinute.toString().padStart(2, '0')}`,
      level: 'info'
    };
  } else if (daysRemaining <= 3) {
    return {
      message: `📅 Ordering closes ${endDay} at ${endHour}:${endMinute.toString().padStart(2, '0')}`,
      level: 'info'
    };
  }

  return null;
};

const calculateMonthlyTimeRemaining = (settings, now) => {
  const monthlySettings = settings?.monthly || {};
  const currentDay = now.getDate();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const endDay = monthlySettings.endDay || 31;
  const endHour = monthlySettings.endHour || 23;
  const endMinute = monthlySettings.endMinute || 59;

  const daysRemaining = endDay - currentDay;

  if (daysRemaining === 0) {
    const totalMinutesRemaining = (endHour * 60 + endMinute) - (currentHour * 60 + currentMinute);
    const hoursRemaining = Math.floor(totalMinutesRemaining / 60);
    const minutesRemaining = totalMinutesRemaining % 60;

    if (hoursRemaining <= 2) {
      return {
        message: `⏰ Monthly ordering closes today at ${endHour}:${endMinute.toString().padStart(2, '0')}!`,
        level: 'critical'
      };
    } else {
      return {
        message: `⏳ Monthly ordering closes today at ${endHour}:${endMinute.toString().padStart(2, '0')}`,
        level: 'warning'
      };
    }
  } else if (daysRemaining === 1) {
    return {
      message: `📋 Monthly ordering closes tomorrow at ${endHour}:${endMinute.toString().padStart(2, '0')}`,
      level: 'info'
    };
  } else if (daysRemaining <= 7) {
    return {
      message: `📅 Monthly ordering closes on day ${endDay} at ${endHour}:${endMinute.toString().padStart(2, '0')}`,
      level: 'info'
    };
  }

  return null;
};

// ================= COUNTDOWN CALCULATION FUNCTIONS =================
const calculateCountdown = (orderControl) => {
  if (!orderControl?.timeControlEnabled || !orderControl?.periodStartTime) {
    return null;
  }

  const { timeControlType, timeControlSettings, periodStartTime } = orderControl;

  switch (timeControlType) {
    case 'daily':
      return calculateDailyCountdown(timeControlSettings, periodStartTime);
    case 'weekly':
      return calculateWeeklyCountdown(timeControlSettings, periodStartTime);
    case 'monthly':
      return calculateMonthlyCountdown(timeControlSettings, periodStartTime);
    default:
      return null;
  }
};

const calculateDailyCountdown = (settings, periodStartTime) => {
  if (!periodStartTime) {
    return { expired: false, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
  }
  
  const periodStart = new Date(periodStartTime);
  const dailyHours = settings?.daily?.hours || 24;
  const periodEnd = new Date(periodStart);
  periodEnd.setHours(periodStart.getHours() + dailyHours);
  
  const timeRemaining = periodEnd - new Date();
  
  if (timeRemaining <= 0) {
    return { expired: true, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
  }
  
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
  
  return { expired: false, hours, minutes, seconds, totalSeconds: Math.floor(timeRemaining / 1000) };
};

const calculateWeeklyCountdown = (settings, periodStartTime) => {
  if (!periodStartTime) {
    return { expired: false, days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
  }
  
  const periodStart = new Date(periodStartTime);
  const weeklySettings = settings?.weekly || {};
  const now = new Date();
  
  // Calculate based on the period start time
  const endDay = weeklySettings.endDay || 'Sunday';
  const endHour = weeklySettings.endHour || 23;
  const endMinute = weeklySettings.endMinute || 59;
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Get the day of the week when the period started
  const startDayOfWeek = periodStart.toLocaleDateString('en-US', { weekday: 'long' });
  const startDayIndex = daysOfWeek.indexOf(startDayOfWeek);
  const endDayIndex = daysOfWeek.indexOf(endDay);
  
  // Calculate end date based on period start
  const endDate = new Date(periodStart);
  
  // Calculate days to add to reach the end day
  let daysToAdd = 0;
  if (startDayIndex <= endDayIndex) {
    daysToAdd = endDayIndex - startDayIndex;
  } else {
    daysToAdd = (7 - startDayIndex) + endDayIndex;
  }
  
  endDate.setDate(periodStart.getDate() + daysToAdd);
  endDate.setHours(endHour, endMinute, 59, 0);
  
  const timeRemaining = endDate - now;
  
  if (timeRemaining <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
  }
  
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
  
  return { expired: false, days, hours, minutes, seconds, totalSeconds: Math.floor(timeRemaining / 1000) };
};

const calculateMonthlyCountdown = (settings, periodStartTime) => {
  if (!periodStartTime) {
    return { expired: false, days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
  }
  
  const periodStart = new Date(periodStartTime);
  const monthlySettings = settings?.monthly || {};
  const now = new Date();
  
  const endDay = monthlySettings.endDay || 31;
  const endHour = monthlySettings.endHour || 23;
  const endMinute = monthlySettings.endMinute || 59;
  
  // Calculate end date based on period start month
  const endDate = new Date(periodStart);
  endDate.setDate(endDay);
  endDate.setHours(endHour, endMinute, 59, 0);
  
  // If end date is before period start, move to next month
  if (endDate < periodStart) {
    endDate.setMonth(endDate.getMonth() + 1);
  }
  
  const timeRemaining = endDate - now;
  
  if (timeRemaining <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
  }
  
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
  
  return { expired: false, days, hours, minutes, seconds, totalSeconds: Math.floor(timeRemaining / 1000) };
};

const formatCountdown = (countdown) => {
  if (!countdown) return null;
  
  if (countdown.expired) {
    return "Ordering period ended";
  }
  
  if (countdown.days > 0) {
    return `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`;
  } else if (countdown.hours > 0) {
    return `${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`;
  } else {
    return `${countdown.minutes}m ${countdown.seconds}s`;
  }
};
//////////////////////////////////////

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [orderControl, setOrderControl] = useState(null);
  const [canStartOrder, setCanStartOrder] = useState(true);
  const [orderMessage, setOrderMessage] = useState('');
  const [timeWarning, setTimeWarning] = useState(null);

  const [countdown, setCountdown] = useState(null);
  const [formattedCountdown, setFormattedCountdown] = useState('');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [nextPeriodInfo, setNextPeriodInfo] = useState(null);
  // In your ClientDashboard component, add the notification hook:
  const { notifications, addNotification, removeNotification } = useNotifications();
  const [manuallyClosedMessage, setManuallyClosedMessage] = useState(false);
  // Add these state variables properly (NOT inside the function):
  const [orderView, setOrderView] = useState('summary'); // 'summary' or 'draft-detail'
  const [productToAdd, setProductToAdd] = useState(null); // To pass product data to ClientClick
  const [draftItemCount, setDraftItemCount] = useState(0); // Add this for the cart count
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  // Add this function to handle manual closing:
  const handleCloseMessage = () => {
    setManuallyClosedMessage(true);
    // Optionally, you can also notify the server that the user dismissed the message
  };

  // Navigation helpers
  const goToCatalog = () => {
    setActiveTab("catalog");
    // do not reset orderView here, keep catalog as main
  };

  const goToSummary = () => {
    setActiveTab("order");
    setOrderView("summary");
  };

  // Add this function in Client.jsx
  const goToMyOrders = () => {
    setOrderView('my-orders');
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // ==================== SOCKET.IO LISTENERS ====================
  // In your Client.jsx, find the socket listener useEffect and fix the isConnected check:

  // ==================== SOCKET.IO LISTENERS ====================
  // ==================== SOCKET.IO LISTENERS ====================
  useEffect(() => {
    const setupSocketListeners = () => {
      const socket = socketService.getSocket();

      if (!socket) {
        console.log('Socket not available, will retry when connected');
        return;
      }

      // To this (development only):
if (process.env.NODE_ENV === 'development') {
  console.log("Setting up socket listeners for client");
  // ✅ REMOVED: user ID from log
}

      // Listen for order control updates from admin
      const handleOrderControlUpdate = (data) => {
        console.log('📦 Real-time order control update received:', data);

        // Update the order control state with new settings
        setOrderControl(prev => ({
          ...prev,
          ...data.updates,
          customMessage: data.message,
          customMessageActive: true,
          customMessageExpires: data.expiresAt
        }));


        // Show non-blocking notification
        if (data.updates.showSalePrice !== undefined || data.updates.showQuantity !== undefined) {
          addNotification('🔄 Display settings updated by admin', 'info');
        }
        if (data.updates.timeControlEnabled !== undefined) {
          addNotification('⏰ Time control settings updated by admin', 'info');
        }
      };

      // Listen for custom messages from admin
      const handleCustomMessage = (data) => {
        console.log('📨 Custom message received:', data);
        addNotification(`📢 ADMIN MESSAGE: ${data.message}`, 'info', 10000);

        // Reset manual close state when new message arrives
        setManuallyClosedMessage(false);

        // Update the order control state to show the custom message banner
        setOrderControl(prev => ({
          ...prev,
          customMessage: data.message,
          customMessageActive: true,
          customMessageExpires: data.expiresAt
        }));
      };
      // Listen for message disable
      const handleMessageDisabled = () => {
        console.log('Message disabled by admin');
        addNotification('📢 Admin message has been removed', 'info');
      };


      // Add event listeners
      socket.on('client_order_control_updated', handleOrderControlUpdate);
      socket.on('custom_message_received', handleCustomMessage);
      socket.on('custom_message_disabled', handleMessageDisabled);

      // Return cleanup function
      return () => {
        socket.off('client_order_control_updated', handleOrderControlUpdate);
        socket.off('custom_message_received', handleCustomMessage);
        socket.off('custom_message_disabled', handleMessageDisabled);
      };
    };

    // Set up listeners when socket is available
    if (socketService.isConnected) {
      const cleanup = setupSocketListeners();
      return cleanup;
    } else {
      // If socket isn't connected yet, wait for connection
      const socket = socketService.getSocket();
      if (socket) {
        socket.once('connect', setupSocketListeners);
        return () => {
          socket.off('connect', setupSocketListeners);
        };
      }
    }
  }, [user?.id, addNotification]); // Add addNotification to dependencies

  // In your Client.jsx and admin components, add:
  // Fix the welcome event listener:
  useEffect(() => {
    const socket = socketService.getSocket();
    if (socket) {
      const welcomeHandler = (data) => {
        console.log('✅ Server welcome:', data);
      };

      socket.on('welcome', welcomeHandler);

      return () => {
        socket.off('welcome', welcomeHandler);
      };
    }
  }, []);


  // ==================== EXISTING CODE ====================
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const fetchOrderControl = async () => {
      try {
        const response = await api.get('/api/client/order-control');
        setOrderControl(response.data)
      } catch (err) {
        console.error('Failed to fetch order control settings:', err);
        setOrderControl({});
      }
    };

    if (user?.id) {
      fetchOrderControl();
    }
  }, [user]);

  useEffect(() => {
    const calculateWarning = () => {
      const warning = calculateTimeRemaining(orderControl);
      setTimeWarning(warning);
    };

    calculateWarning();
    const interval = setInterval(calculateWarning, 60000);

    return () => clearInterval(interval);
  }, [orderControl]);

  useEffect(() => {
    const updateCountdown = () => {
      if (!orderControl?.timeControlEnabled) {
        setCountdown(null);
        setFormattedCountdown('');
        return;
      }

      // ✅ FIX: Pass the entire orderControl object, not separate parameters
      const countdownData = calculateCountdown(orderControl);

      setCountdown(countdownData);

      if (countdownData) {
        setFormattedCountdown(formatCountdown(countdownData));
      } else {
        setFormattedCountdown('');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [orderControl]);

  useEffect(() => {
    const checkOrderAvailability = () => {
      if (!orderControl || !orderControl.timeControlEnabled) {
        setCanStartOrder(true);
        setOrderMessage('Ordering is available');
        return;
      }
      // Get current countdown state
      const countdownData = calculateCountdown(orderControl);

      // If countdown has expired, disable ordering
      if (countdownData && countdownData.expired) {
        setCanStartOrder(false);
        setOrderMessage('Ordering period has ended');
        return;
      }
      const now = new Date();
      const { timeControlType, timeControlSettings } = orderControl;

      switch (timeControlType) {
        case 'daily':
          const dailyHours = timeControlSettings?.daily?.hours || 24;
          setCanStartOrder(true);
          setOrderMessage(`${dailyHours}h ordering window`);
          break;

        case 'weekly':
          const weeklySettings = timeControlSettings?.weekly || {};
          const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();

          const startDayIndex = daysOfWeek.indexOf(weeklySettings.startDay || 'Monday');
          const endDayIndex = daysOfWeek.indexOf(weeklySettings.endDay || 'Sunday');
          const currentDayIndex = daysOfWeek.indexOf(currentDay);

          let isWithinDays = false;
          if (startDayIndex <= endDayIndex) {
            isWithinDays = currentDayIndex >= startDayIndex && currentDayIndex <= endDayIndex;
          } else {
            isWithinDays = currentDayIndex >= startDayIndex || currentDayIndex <= endDayIndex;
          }

          let isWithinTime = true;
          if (currentDayIndex === startDayIndex) {
            const startTotalMinutes = (weeklySettings.startHour || 0) * 60 + (weeklySettings.startMinute || 0);
            const currentTotalMinutes = currentHour * 60 + currentMinute;
            isWithinTime = currentTotalMinutes >= startTotalMinutes;
          } else if (currentDayIndex === endDayIndex) {
            const endTotalMinutes = (weeklySettings.endHour || 23) * 60 + (weeklySettings.endMinute || 59);
            const currentTotalMinutes = currentHour * 60 + currentMinute;
            isWithinTime = currentTotalMinutes <= endTotalMinutes;
          } else if (currentDayIndex > startDayIndex && currentDayIndex < endDayIndex) {
            isWithinTime = true;
          } else if (startDayIndex > endDayIndex &&
            (currentDayIndex > startDayIndex || currentDayIndex < endDayIndex)) {
            isWithinTime = true;
          }

          setCanStartOrder(isWithinDays && isWithinTime);
          setOrderMessage(isWithinDays && isWithinTime ?
            `Ordering available until ${weeklySettings.endDay} ${weeklySettings.endHour}:${weeklySettings.endMinute?.toString().padStart(2, '0') || '00'}` :
            'Ordering not available'
          );
          break;

        case 'monthly':
          const monthlySettings = timeControlSettings?.monthly || {};
          const currentDayOfMonth = now.getDate();
          const currentHourMonthly = now.getHours();
          const currentMinuteMonthly = now.getMinutes();

          const isWithinMonthDays = currentDayOfMonth >= (monthlySettings.startDay || 1) &&
            currentDayOfMonth <= (monthlySettings.endDay || 31);

          let isWithinMonthTime = true;
          if (currentDayOfMonth === monthlySettings.startDay) {
            const startTotalMinutes = (monthlySettings.startHour || 0) * 60 + (monthlySettings.startMinute || 0);
            const currentTotalMinutes = currentHourMonthly * 60 + currentMinuteMonthly;
            isWithinMonthTime = currentTotalMinutes >= startTotalMinutes;
          } else if (currentDayOfMonth === monthlySettings.endDay) {
            const endTotalMinutes = (monthlySettings.endHour || 23) * 60 + (monthlySettings.endMinute || 59);
            const currentTotalMinutes = currentHourMonthly * 60 + currentMinuteMonthly;
            isWithinMonthTime = currentTotalMinutes <= endTotalMinutes;
          }

          setCanStartOrder(isWithinMonthDays && isWithinMonthTime);
          setOrderMessage(isWithinMonthDays && isWithinMonthTime ?
            `Ordering available until day ${monthlySettings.endDay}` :
            'Ordering not available'
          );
          break;

        default:
          setCanStartOrder(true);
          setOrderMessage('Ordering available');
      }
    };

    checkOrderAvailability();
    const interval = setInterval(checkOrderAvailability, 60000);

    return () => clearInterval(interval);
  }, [orderControl]);

  useEffect(() => {
    const now = new Date();
    setCurrentDate(now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };

  const handleStartOrder = () => {
    if (canStartOrder) {
      setActiveTab('catalog'); // Always go to product catalog to start ordering
      setOrderView(''); // Reset any order view
    } else {
      calculateNextPeriod();
      setShowOrderModal(true);
    }
  };

  const calculateNextPeriod = () => {
    if (!orderControl?.timeControlEnabled) {
      setNextPeriodInfo(null);
      return;
    }

    const now = new Date();
    const { timeControlType, timeControlSettings } = orderControl;

    switch (timeControlType) {
      case 'weekly':
        const weeklySettings = timeControlSettings?.weekly || {};
        const nextStart = new Date(now);
        const startDayIndex = daysOfWeek.indexOf(weeklySettings.startDay || 'Monday');
        const currentDayIndex = now.getDay() - 1;
        let daysToAdd = (startDayIndex - currentDayIndex + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7;
        nextStart.setDate(now.getDate() + daysToAdd);
        nextStart.setHours(weeklySettings.startHour || 0, weeklySettings.startMinute || 0, 0, 0);

        setNextPeriodInfo({
          type: 'weekly',
          start: nextStart,
          message: `Next ordering period starts: ${nextStart.toLocaleDateString()} at ${nextStart.toLocaleTimeString()}`
        });
        break;

      case 'monthly':
        const monthlySettings = timeControlSettings?.monthly || {};
        const nextMonthStart = new Date(now);
        nextMonthStart.setMonth(now.getMonth() + 1);
        nextMonthStart.setDate(monthlySettings.startDay || 1);
        nextMonthStart.setHours(monthlySettings.startHour || 0, monthlySettings.startMinute || 0, 0, 0);

        setNextPeriodInfo({
          type: 'monthly',
          start: nextMonthStart,
          message: `Next ordering period starts: ${nextMonthStart.toLocaleDateString()} at ${nextMonthStart.toLocaleTimeString()}`
        });
        break;

      default:
        setNextPeriodInfo(null);
    }
  };
  /////////////////
// Replace your useEffect with this fixed version:
useEffect(() => {
  const fetchDraftItemCount = async () => {
    try {
      const response = await api.get('/api/client/orders/draft');
      
      // ✅ FIXED: Handle null/undefined response and missing items
      const draftOrder = response.data;
      const items = draftOrder?.items || [];
      const count = items.reduce((total, item) => total + (item.quantity || 0), 0);
      
      setDraftItemCount(count);
    } catch (err) {
      console.error('Failed to fetch draft item count:', err);
      setDraftItemCount(0);
    }
  };

  if (activeTab === 'order') {
    fetchDraftItemCount();
  }
}, [activeTab, orderView]);
  ////////////////////


  //////////////
  const handleModalResponse = (startNextPeriod) => {
    if (startNextPeriod) {
      console.log('Preparing order for next period:', nextPeriodInfo);
      setActiveTab('order');
      setOrderView('draft-detail');
    }
    setShowOrderModal(false);
  };
  ////////

  // ADD THIS FUNCTION:
  const handleAddToOrder = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  // Add this new function to handle actual product addition
  const handleConfirmAddToOrder = async (product, quantity) => {
    try {
      const response = await api.post('/api/client/orders/draft/items', {
        productId: product.id,
        quantity: quantity
      });

      const count = response.data.items?.reduce((total, item) => total + item.quantity, 0) || 0;
      setDraftItemCount(count);
      addNotification(`✅ ${product.name} added to draft order`, 'success');

    } catch (err) {
      console.error('Failed to add product to order:', err);
      addNotification('❌ Failed to add product to order', 'error');
    }
  };


  ////////
  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900'}`}>
      {/* Notification container */}
      <div className="fixed right-0 left-0 z-50 space-y-2 p-4">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            notification={notification}
            onRemove={removeNotification}
          />
        ))}
      </div>
      <header
  className={`transition-colors duration-300 ${
    isDarkMode
      ? "bg-gray-800 border-gray-700"
      : "bg-white border-gray-200"
  } shadow-sm border-b`}
>
  <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-0">
    {/* --- TOP BAR --- */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 h-auto sm:h-16">
      {/* Title */}
      <h1
        className={`text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent text-center sm:text-left w-full sm:w-auto`}
      >
        Weekly Order – Client Dashboard
      </h1>

      {/* Right Controls */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end w-full sm:w-auto gap-3">
        <div className="text-left sm:text-right w-full sm:w-auto">
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Hello, {user?.name}
          </p>
          <p
            className={`text-xs ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {currentDate}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dark Mode Button */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-colors duration-300 ${
              isDarkMode
                ? "bg-gray-700 text-yellow-400 hover:bg-gray-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 01-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className={`border font-medium py-1.5 px-3 sm:py-2 sm:px-4 rounded-lg text-sm transition-all duration-200 ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                : "bg-white border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600"
            }`}
          >
            Logout
          </button>
        </div>
      </div>
    </div>

    {/* --- NAVIGATION BAR --- */}
    <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-8 mt-2 sm:mt-0">
      {/* Catalog */}
      <button
        onClick={() => {
          setActiveTab("catalog");
          setOrderView("");
        }}
        className={`py-2 sm:py-4 px-1 font-medium text-sm flex items-center transition-all duration-200 ${
          activeTab === "catalog"
            ? `${
                isDarkMode
                  ? "text-indigo-400 border-indigo-400"
                  : "text-indigo-600 border-indigo-600"
              } border-b-2`
            : `${
                isDarkMode
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-500 hover:text-gray-700"
              }`
        }`}
      >
        Product Catalog
      </button>

      {/* Draft */}
      <button
        onClick={() => {
          setActiveTab("order");
          setOrderView("draft-detail");
        }}
        className={`py-2 sm:py-4 px-1 font-medium text-sm flex items-center transition-all duration-200 relative ${
          activeTab === "order" && orderView === "draft-detail"
            ? `${
                isDarkMode
                  ? "text-indigo-400 border-indigo-400"
                  : "text-indigo-600 border-indigo-600"
              } border-b-2`
            : `${
                isDarkMode
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-500 hover:text-gray-700"
              }`
        }`}
      >
        <ShoppingCartIcon className="h-5 w-5 mr-1" />
        Draft Order
        {draftItemCount > 0 && (
          <span
            className={`absolute -top-1 -right-2 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${
              isDarkMode
                ? "bg-indigo-500 text-white"
                : "bg-indigo-600 text-white"
            }`}
          >
            {draftItemCount}
          </span>
        )}
      </button>

      {/* Summary */}
      <button
        onClick={() => {
          setActiveTab("order");
          setOrderView("summary");
        }}
        className={`py-2 sm:py-4 px-1 font-medium text-sm flex items-center transition-all duration-200 ${
          activeTab === "order" && orderView === "summary"
            ? `${
                isDarkMode
                  ? "text-indigo-400 border-indigo-400"
                  : "text-indigo-600 border-indigo-600"
              } border-b-2`
            : `${
                isDarkMode
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-500 hover:text-gray-700"
              }`
        }`}
      >
        <ClipboardListIcon className="h-5 w-5 mr-1" />
        Order Summary
      </button>
    </div>
  </div>
</header>


      {/* Order Control Status Message */}
      {orderControl && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className={`rounded-lg border p-3 text-center ${isDarkMode ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200'
            }`}>
            <div className="flex flex-col items-center justify-center space-y-1">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-blue-200' : 'text-blue-800'
                }`}>
                {orderMessage}
              </p>

              {/* Countdown in status message */}
              {formattedCountdown && canStartOrder && (
                <div className={`text-xs font-mono ${isDarkMode ? 'text-blue-300' : 'text-blue-600'
                  }`}>
                  ⏰ {formattedCountdown}
                </div>
              )}

              {orderControl.timeControlEnabled && (
                <div className="flex items-center space-x-2">
                  <span className={`text-xs ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                    Ordering {canStartOrder ? 'Available' : 'Closed'}
                  </span>
                  <span className={`text-sm font-bold ${canStartOrder ? 'text-green-500' : 'text-red-500'}`}>
                    {canStartOrder ? '✓' : '✗'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Message Banner (if active) */}
      {orderControl?.customMessageActive &&
        !manuallyClosedMessage &&
        orderControl.customMessage && (
          <CustomMessageBanner
            message={orderControl.customMessage}
            isDarkMode={isDarkMode}
            onClose={handleCloseMessage}
          />
        )}

      {/* Time-Based Warning Banner with Countdown */}
      {timeWarning && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2">
          <div className={`rounded-lg border p-3 text-center ${timeWarning.level === 'critical'
              ? (isDarkMode ? 'bg-red-900 border-red-700 animate-pulse' : 'bg-red-100 border-red-200 animate-pulse')
              : timeWarning.level === 'warning'
                ? (isDarkMode ? 'bg-orange-900 border-orange-700' : 'bg-orange-50 border-orange-200')
                : (isDarkMode ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200')
            }`}>
            <p className={`text-sm font-medium ${timeWarning.level === 'critical'
                ? (isDarkMode ? 'text-red-200' : 'text-red-800')
                : timeWarning.level === 'warning'
                  ? (isDarkMode ? 'text-orange-200' : 'text-orange-800')
                  : (isDarkMode ? 'text-blue-200' : 'text-blue-800')
              }`}>
              {timeWarning.message}
            </p>

            {/* Countdown Timer */}
            {formattedCountdown && (
              <div className={`mt-2 text-xs font-mono ${timeWarning.level === 'critical'
                  ? (isDarkMode ? 'text-red-300' : 'text-red-600')
                  : timeWarning.level === 'warning'
                    ? (isDarkMode ? 'text-orange-300' : 'text-orange-600')
                    : (isDarkMode ? 'text-blue-300' : 'text-blue-600')
                }`}>
                ⏰ Time remaining: {formattedCountdown}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <h1
                className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"
                  }`}
              >
                {activeTab === "catalog"
                  ? "Product Catalog"
                  : orderView === "summary"
                    ? "Order Summary"
                    : orderView === "draft-detail"
                      ? "Draft Order"
                      : ""}
              </h1>

              {/* Start Order Button - Only show in catalog or summary view */}
              {(activeTab === "catalog" || orderView === "summary") && (
                <button
                  onClick={handleStartOrder}
                  disabled={!canStartOrder && activeTab !== "order"}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${canStartOrder || activeTab === "order"
                    ? `${isDarkMode
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`
                    : `${isDarkMode
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`
                    }`}
                  title={
                    canStartOrder
                      ? "Start new order"
                      : "Ordering not available at this time"
                  }
                >
                  <PlayIcon className="h-4 w-4 mr-1" />
                  Start Order
                </button>
              )}

              {/* Back Button - Show in draft detail view */}
              {activeTab === "order" && orderView === "draft-detail" && (
                <button
                  onClick={() => setOrderView("summary")}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                >
                  ← Back to Summary
                </button>
              )}
            </div>

            {/* SEARCH BAR - Hide in Order Summary, My Orders, and Detailed Order View */}
            {!(activeTab === "order" && (orderView === "summary" || orderView === "my-orders" || orderView === "draft-detail")) && (
              <form onSubmit={handleSearch} className="relative max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon
                    className={`h-5 w-5 ${isDarkMode ? "text-gray-400" : "text-gray-400"}`}
                    aria-hidden="true"
                  />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`block w-full pl-10 pr-12 py-2 border rounded-lg leading-5 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-200 ${isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                    }`}
                  placeholder="Search products..."
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <button
                    type="submit"
                    className={`p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md ${isDarkMode ? "focus:ring-offset-gray-900" : ""}`}
                  >
                    <span className="sr-only">Search</span>
                    <svg
                      className={`h-5 w-5 ${isDarkMode
                        ? "text-gray-400 hover:text-indigo-400"
                        : "text-gray-400 hover:text-indigo-600"
                        }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* MAIN CONTENT RENDERING */}
          {activeTab === "catalog" && (
            <ProductCatalog
              searchQuery={searchQuery}
              isDarkMode={isDarkMode}
              onAddToOrder={handleAddToOrder}
            />
          )}

          {activeTab === "order" && orderView === "summary" && (
            <ClientOrderSummary
              isDarkMode={isDarkMode}
              onViewDraft={() => setOrderView("draft-detail")}
              onViewOrders={goToMyOrders} // add this
              orderControl={orderControl} // ← Add this line
            />
          )}

          {activeTab === "order" && orderView === "draft-detail" && (
            <ClientClick
              isDarkMode={isDarkMode}
              orderControl={orderControl}
              productToAdd={productToAdd}
              goToCatalog={goToCatalog}
              goToSummary={goToSummary}
              onBackToSummary={goToSummary}
              // FIXED PROPS - Check countdown state too!
              canSubmitOrder={canStartOrder && (!countdown || !countdown.expired)}
              orderMessage={orderMessage}
              onTimeRestriction={() => {
                calculateNextPeriod();
                setShowOrderModal(true);
              }}
            />
          )}

          {activeTab === "order" && orderView === "my-orders" && (
            <MyOrders
              isDarkMode={isDarkMode}
              orderControl={orderControl}
              onBack={() => setOrderView('summary')} // Add back navigation
            />
          )}

        </div>
      </main>


      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-xl w-full max-w-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="p-6">
              <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {countdown?.expired ? 'Ordering Period Ended' : 'Ordering Not Available'}
              </h3>
              <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {orderMessage || 'The current ordering period has ended.'}
              </p>

              {nextPeriodInfo && (
                <div className={`mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <strong>Next ordering period:</strong><br />
                    {nextPeriodInfo.message}
                  </p>
                </div>
              )}

              <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Do you want to prepare an order for the next available period?
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleModalResponse(false)}
                  className={`flex-1 py-2 px-4 border rounded-lg text-sm ${isDarkMode ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600' : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleModalResponse(true)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors`}
                >
                  Prepare Next Period Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Product Quantity Modal */}
      {showProductModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-xl w-full max-w-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Add to Order
                </h3>
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setSelectedProduct(null);
                  }}
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

              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  defaultValue="1"
                  id="quantityInput"
                  className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setSelectedProduct(null);
                  }}
                  className={`flex-1 py-2 px-4 border rounded-lg text-sm ${isDarkMode ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600' : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const quantity = parseInt(document.getElementById('quantityInput').value) || 1;
                    handleConfirmAddToOrder(selectedProduct, quantity);
                    setShowProductModal(false);
                    setSelectedProduct(null);
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors`}
                >
                  Add to Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default ClientDashboard;