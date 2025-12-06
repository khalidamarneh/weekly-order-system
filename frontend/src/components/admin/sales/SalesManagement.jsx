// src/components/admin/sales/SalesManagement.jsx
import React, { useState, useEffect } from 'react';
import SalesQuotationUnified from './SalesQuotationUnified';
import QuotationHistory from './QuotationHistory';
import SalesAnalytics from './SalesAnalytics';
import CustomerManagement from './CustomerManagement';

const SalesManagement = ({ isDarkMode, activeSubTab = 'dashboard', setActiveSubTab }) => {
  // Internal state fallback
  const [internalActiveTab, setInternalActiveTab] = useState('dashboard');
  
  // Determine navigation mode
  const isUsingMainNavigation = typeof setActiveSubTab === 'function';
  const currentActiveTab = isUsingMainNavigation ? (activeSubTab || 'dashboard') : internalActiveTab;

  const tabs = [
    { id: 'dashboard', label: 'Sales Dashboard', icon: '📊', description: 'Overview and quick actions' },
    { id: 'quotations', label: 'Create Quotation', icon: '📝', description: 'Create new sales quotations' },
    { id: 'history', label: 'Quotation History', icon: '🕒', description: 'View and manage quotation history' },
    { id: 'analytics', label: 'Sales Analytics', icon: '📈', description: 'Analyze sales performance' },
    { id: 'customers', label: 'Customers', icon: '👥', description: 'Manage customer relationships' }
  ];

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
  };

  const renderContent = () => {
    switch (currentActiveTab) {
      case 'quotations':
        return <SalesQuotationUnified isDarkMode={isDarkMode} />;
      case 'history':
        return <QuotationHistory isDarkMode={isDarkMode} />;
      case 'analytics':
        return <SalesAnalytics isDarkMode={isDarkMode} />;
      case 'customers':
        return <CustomerManagement isDarkMode={isDarkMode} />;
      case 'dashboard':
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <div className={`p-6 rounded-xl ${
      isDarkMode ? 'bg-gray-800' : 'bg-white'
    } border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🏪</div>
        <h2 className={`text-3xl font-bold mb-4 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Sales Management Dashboard
        </h2>
        <p className={`text-lg mb-8 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Manage your sales operations from one centralized location
        </p>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Active Quotations', value: '12', color: 'blue', icon: '📝' },
            { label: 'Pending Orders', value: '8', color: 'orange', icon: '🕒' },
            { label: 'This Month Revenue', value: '$24,580', color: 'green', icon: '💰' }
          ].map((stat, index) => (
            <div
              key={index}
              className={`p-6 rounded-xl ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
              } border-l-4 ${
                stat.color === 'blue' ? 'border-blue-500' :
                stat.color === 'orange' ? 'border-orange-500' : 'border-green-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl">{stat.icon}</div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {stat.value}
                </div>
              </div>
              <div className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {tabs.filter(tab => tab.id !== 'dashboard').map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`p-6 rounded-xl border-2 transition-all duration-200 group text-left ${
                currentActiveTab === tab.id
                  ? isDarkMode
                    ? 'border-orange-500 bg-orange-900/20'
                    : 'border-orange-500 bg-orange-50'
                  : isDarkMode
                  ? 'border-gray-600 bg-gray-700 hover:border-orange-500 hover:bg-gray-600'
                  : 'border-gray-200 bg-white hover:border-orange-500 hover:bg-gray-50'
              }`}
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">
                {tab.icon}
              </div>
              <div className={`font-semibold text-lg mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {tab.label}
              </div>
              <div className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {tab.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Show tabs only when not on dashboard */}
        {currentActiveTab !== 'dashboard' && (
          <>
            {/* Modern Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className={`text-2xl sm:text-3xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  } mb-2`}>
                    {tabs.find(tab => tab.id === currentActiveTab)?.label || 'Sales Management'}
                  </h1>
                  <p className={`text-base ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {tabs.find(tab => tab.id === currentActiveTab)?.description || 'Manage sales operations'}
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
          </>
        )}

        {/* Content */}
        <div className="rounded-lg">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SalesManagement;