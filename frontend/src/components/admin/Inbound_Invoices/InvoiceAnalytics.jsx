// frontend/src/components/admin/Inbound_Invoices/InvoiceAnalytics.jsx
import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  TrendingUpIcon,
  ClipboardListIcon,
  CalendarIcon,
  FilterIcon
} from '@heroicons/react/outline';
import api from '../../../services/api';

const InvoiceAnalytics = ({ isDarkMode, setActiveSubTab, onNavigate, onViewInvoiceHistory }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days'); // 7days, 30days, 90days, 1year
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, dateRange]);

  const fetchAnalyticsData = async () => {
  try {
    setLoading(true);
    // Use relative URL only
    const response = await api.get('/api/outbound-invoices/analytics', {
      params: {
        timeRange,
        startDate: timeRange === 'custom' ? dateRange.start : undefined,
        endDate: timeRange === 'custom' ? dateRange.end : undefined
      }
    });
    setAnalyticsData(response.data);
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    alert('Failed to load analytics data. Please check if the server is running.');
  } finally {
    setLoading(false);
  }
};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className={`p-8 text-center rounded-lg ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <ChartBarIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className={`text-lg font-semibold mb-2 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>No Data Available</h3>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
          Unable to load analytics data. Please try again.
        </p>
        <button
          onClick={fetchAnalyticsData}
          className={`mt-4 px-4 py-2 rounded-lg ${
            isDarkMode 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          Retry
        </button>
      </div>
    );
  }

  const {
    summary,
    revenueTrends,
    topCustomers,
    productPerformance,
    statusDistribution,
    paymentAnalytics
  } = analyticsData;

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className={`p-6 rounded-xl ${
          isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ChartBarIcon className="h-8 w-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold">Invoice Analytics & Reports</h1>
                <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Comprehensive insights into your invoice performance
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className={`px-3 py-2 border rounded-lg ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="1year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>

              {timeRange === 'custom' && (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className={`px-3 py-2 border rounded-lg ${
                      isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className={`px-3 py-2 border rounded-lg ${
                      isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              )}

              <button
                onClick={fetchAnalyticsData}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <FilterIcon className="h-4 w-4" />
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue */}
          <div className={`p-6 rounded-xl ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-green-500 mt-1">
                  {formatCurrency(summary.totalRevenue)}
                </p>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {summary.invoiceCount} invoices
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>

          {/* Total Profit */}
          <div className={`p-6 rounded-xl ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Profit
                </p>
                <p className="text-2xl font-bold text-blue-500 mt-1">
                  {formatCurrency(summary.totalProfit)}
                </p>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {summary.avgProfitMargin?.toFixed(1)}% avg margin
                </p>
              </div>
              <TrendingUpIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          {/* Active Customers */}
          <div className={`p-6 rounded-xl ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Active Customers
                </p>
                <p className="text-2xl font-bold text-purple-500 mt-1">
                  {formatNumber(summary.activeCustomers)}
                </p>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {summary.newCustomers} new this period
                </p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          {/* Products Sold */}
          <div className={`p-6 rounded-xl ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Products Sold
                </p>
                <p className="text-2xl font-bold text-orange-500 mt-1">
                  {formatNumber(summary.productsSold)}
                </p>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {summary.uniqueProducts} unique products
                </p>
              </div>
              <ShoppingCartIcon className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Charts and Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trends */}
          <div className={`p-6 rounded-xl ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5 text-green-500" />
              Revenue Trends
            </h3>
            <div className="space-y-3">
              {revenueTrends?.map((trend, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {trend.period}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatCurrency(trend.revenue)}</span>
                    <div className={`w-20 h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div 
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: `${Math.min((trend.revenue / (summary.totalRevenue || 1)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Distribution */}
          <div className={`p-6 rounded-xl ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ClipboardListIcon className="h-5 w-5 text-blue-500" />
              Invoice Status Distribution
            </h3>
            <div className="space-y-3">
              {statusDistribution?.map((status, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {status.status}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{status.count}</span>
                    <div className={`w-20 h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div 
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${(status.count / summary.invoiceCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Customers */}
        <div className={`p-6 rounded-xl ${
          isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-purple-500" />
            Top Customers
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                  <th className="px-4 py-2 text-left">Customer</th>
                  <th className="px-4 py-2 text-right">Invoices</th>
                  <th className="px-4 py-2 text-right">Total Revenue</th>
                  <th className="px-4 py-2 text-right">Avg. Order</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers?.map((customer, index) => (
                  <tr key={index} className={index % 2 === 0 ? (isDarkMode ? 'bg-gray-750' : 'bg-gray-50') : ''}>
                    <td className="px-4 py-2">{customer.name}</td>
                    <td className="px-4 py-2 text-right">{customer.invoiceCount}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(customer.totalRevenue)}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(customer.averageOrder)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Performance */}
        <div className={`p-6 rounded-xl ${
          isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShoppingCartIcon className="h-5 w-5 text-orange-500" />
            Top Performing Products
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                  <th className="px-4 py-2 text-left">Product</th>
                  <th className="px-4 py-2 text-left">Part No</th>
                  <th className="px-4 py-2 text-right">Quantity Sold</th>
                  <th className="px-4 py-2 text-right">Revenue</th>
                  <th className="px-4 py-2 text-right">Profit Margin</th>
                </tr>
              </thead>
              <tbody>
                {productPerformance?.map((product, index) => (
                  <tr key={index} className={index % 2 === 0 ? (isDarkMode ? 'bg-gray-750' : 'bg-gray-50') : ''}>
                    <td className="px-4 py-2">{product.name}</td>
                    <td className="px-4 py-2 font-mono">{product.partNo}</td>
                    <td className="px-4 py-2 text-right">{formatNumber(product.quantitySold)}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(product.revenue)}</td>
                    <td className="px-4 py-2 text-right">
                      <span className={product.profitMargin >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {product.profitMargin?.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceAnalytics;