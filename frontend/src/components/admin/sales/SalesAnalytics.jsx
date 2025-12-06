// src/components/admin/sales/SalesAnalytics.jsx
import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  XCircleIcon,
  TrendingUpIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  DownloadIcon,
  CalendarIcon,
  ArrowSmUpIcon,
  ArrowSmDownIcon,
  UsersIcon
} from '@heroicons/react/outline';
import api from '../../../services/api';

const SalesAnalytics = ({ isDarkMode }) => {
  const [analytics, setAnalytics] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    fetchRecentActivity();
    fetchTopCustomers();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/quotations/analytics/summary?timeRange=${timeRange}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      setActivityLoading(true);
      // We'll use the main quotations endpoint and filter for recent activity
      const response = await api.get('/api/quotations?limit=10');
      setRecentActivity(response.data);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchTopCustomers = async () => {
    try {
      const response = await api.get('/api/customers');
      const customers = response.data;
      
      // For each customer, fetch their quotations to calculate stats
      const customersWithStats = await Promise.all(
        customers.map(async (customer) => {
          const customerQuotations = await api.get(`/api/quotations?customerId=${customer.id}`);
          const acceptedQuotations = customerQuotations.data.filter(q => q.status === 'ACCEPTED');
          const totalValue = acceptedQuotations.reduce((sum, q) => sum + q.total, 0);
          const quotationCount = acceptedQuotations.length;
          const averageValue = quotationCount > 0 ? totalValue / quotationCount : 0;
          
          return {
            ...customer,
            quotationCount,
            totalValue,
            averageValue
          };
        })
      );
      
      const topCustomers = customersWithStats
        .filter(customer => customer.quotationCount > 0)
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 5);
      
      setTopCustomers(topCustomers);
    } catch (error) {
      console.error('Error fetching top customers:', error);
    }
  };

  const generateReport = async () => {
  try {
    const response = await api.get(`/api/analytics/export?timeRange=${timeRange}`, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales-report-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url); // Clean up memory
  } catch (error) {
    console.error('Error generating report:', error);
    alert('Failed to generate report');
  }
};
 

  const StatCard = ({ title, value, subtitle, icon: Icon, color, change }) => (
    <div className={`p-6 rounded-lg border transition-all hover:shadow-md ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
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
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {change > 0 ? (
                <ArrowSmUpIcon className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowSmDownIcon className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm ml-1 ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {change > 0 ? '+' : ''}{change}% from last period
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  const StatusPill = ({ status, count, percentage }) => {
    const statusConfig = {
      DRAFT: { color: 'bg-gray-500', icon: ClockIcon, text: 'Draft' },
      SENT: { color: 'bg-blue-500', icon: EyeIcon, text: 'Sent' },
      VIEWED: { color: 'bg-purple-500', icon: EyeIcon, text: 'Viewed' },
      ACCEPTED: { color: 'bg-green-500', icon: CheckCircleIcon, text: 'Accepted' },
      REJECTED: { color: 'bg-red-500', icon: XCircleIcon, text: 'Rejected' },
      EXPIRED: { color: 'bg-orange-500', icon: ClockIcon, text: 'Expired' }
    };

    const config = statusConfig[status] || statusConfig.DRAFT;
    const Icon = config.icon;

    return (
      <div className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
        isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
      }`}>
        <div className="flex items-center space-x-3 flex-1">
          <div className={`p-2 rounded-full ${config.color} bg-opacity-10`}>
            <Icon className={`h-4 w-4 ${config.color}`} />
          </div>
          <div className="flex-1">
            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {config.text}
            </span>
            {percentage && (
              <div className={`w-full rounded-full h-2 mt-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}>
                <div 
                  className={`h-2 rounded-full ${config.color}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {count}
          </span>
          {percentage && (
            <span className={`text-sm block ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {percentage}%
            </span>
          )}
        </div>
      </div>
    );
  };

  const ActivityItem = ({ activity }) => {
    const getActivityConfig = (status) => {
      const configs = {
        DRAFT: { color: 'bg-gray-100 text-gray-800', icon: ClockIcon },
        SENT: { color: 'bg-blue-100 text-blue-800', icon: EyeIcon },
        VIEWED: { color: 'bg-purple-100 text-purple-800', icon: EyeIcon },
        ACCEPTED: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
        REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircleIcon },
        EXPIRED: { color: 'bg-orange-100 text-orange-800', icon: ClockIcon }
      };
      return configs[status] || configs.DRAFT;
    };

    const formatTimeAgo = (timestamp) => {
      const now = new Date();
      const time = new Date(timestamp);
      const diffInMinutes = Math.floor((now - time) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount || 0);
    };

    const config = getActivityConfig(activity.status);
    const Icon = config.icon;

    return (
      <div className={`flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-sm ${
        isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center space-x-4 flex-1">
          <div className={`p-2 rounded-full ${config.color} bg-opacity-20`}>
            <Icon className={`h-5 w-5 ${config.color.split(' ')[1]}`} />
          </div>
          <div className="flex-1">
            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {activity.customerName ? `Quotation for ${activity.customerName}` : 'Unnamed Customer'}
            </p>
            <div className="flex items-center space-x-4 mt-1">
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {activity.quotationId} • {formatCurrency(activity.total)}
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {formatTimeAgo(activity.updatedAt)}
              </p>
            </div>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
          {activity.status.toLowerCase()}
        </span>
      </div>
    );
  };

  const CustomerRanking = ({ customer, index }) => (
    <div className={`flex items-center justify-between p-3 rounded-lg ${
      isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
    } transition-colors`}>
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
          index === 0 ? 'bg-yellow-500' : 
          index === 1 ? 'bg-gray-400' : 
          index === 2 ? 'bg-orange-500' : 'bg-blue-500'
        }`}>
          {index + 1}
        </div>
        <div>
          <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {customer.name}
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {customer.quotationCount} quotations
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(customer.totalValue)}
        </p>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Avg: {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(customer.averageValue)}
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Sales Analytics
          </h2>
          <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Real-time insights from your quotation data
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className={`px-3 py-2 border rounded-lg ${
              isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
            }`}
          >
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          
          <button
            onClick={generateReport}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <DownloadIcon className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Quotations"
          value={analytics?.totalQuotations || 0}
          subtitle={`${analytics?.activeQuotations || 0} active`}
          icon={DocumentTextIcon}
          color="text-blue-500"
          change={analytics?.quotationGrowth || 0}
        />
        <StatCard
          title="Total Revenue"
          value={new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(analytics?.totalRevenue || 0)}
          subtitle={`${analytics?.acceptedQuotations || 0} accepted`}
          icon={CurrencyDollarIcon}
          color="text-green-500"
          change={analytics?.revenueGrowth || 0}
        />
        <StatCard
          title="Conversion Rate"
          value={`${analytics?.conversionRate || 0}%`}
          subtitle={`${analytics?.acceptedQuotations || 0}/${analytics?.totalQuotations || 0} won`}
          icon={TrendingUpIcon}
          color="text-purple-500"
          change={analytics?.conversionGrowth || 0}
        />
        <StatCard
          title="Active Customers"
          value={analytics?.activeCustomers || 0}
          subtitle={`${analytics?.newCustomers || 0} new this period`}
          icon={UsersIcon}
          color="text-orange-500"
          change={analytics?.customerGrowth || 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quotation Status Breakdown */}
        <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Quotation Status
          </h3>
          <div className="space-y-3">
            {analytics?.statusBreakdown?.map((status) => (
              <StatusPill 
                key={status.status}
                status={status.status}
                count={status.count}
                percentage={status.percentage}
              />
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Performance Metrics
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Conversion Rate
                </span>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {analytics?.conversionRate || 0}%
                </span>
              </div>
              <div className={`w-full rounded-full h-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${analytics?.conversionRate || 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Response Rate
                </span>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {analytics?.responseRate || 0}%
                </span>
              </div>
              <div className={`w-full rounded-full h-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${analytics?.responseRate || 0}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(analytics?.averageDealSize || 0)}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Avg Deal Size
                </div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  {analytics?.completionRate || 0}%
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Completion Rate
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Customers */}
        <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Top Customers
            </h3>
            <UserGroupIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {topCustomers.slice(0, 5).map((customer, index) => (
              <CustomerRanking key={customer.id} customer={customer} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Recent Activity
          </h3>
          <CalendarIcon className="h-5 w-5 text-gray-400" />
        </div>
        
        {activityLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No recent activity found.
              </p>
            ) : (
              recentActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesAnalytics;