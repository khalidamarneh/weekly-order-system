// src/components/admin/ReportManagement.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  ChartBarIcon,
  DocumentReportIcon,
  DownloadIcon,
  CalendarIcon,
  FilterIcon,
  CashIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  TruckIcon
} from '@heroicons/react/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ReportManagement = ({ isDarkMode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState('sales');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [timeFrame, setTimeFrame] = useState('weekly');
  const [reportData, setReportData] = useState(null);

  const reportTypes = [
    {
      id: 'sales',
      name: 'Sales Report',
      description: 'Product sales and revenue analysis',
      icon: CashIcon
    },
    {
      id: 'inventory',
      name: 'Inventory Report',
      description: 'Stock levels and turnover rates',
      icon: ShoppingBagIcon
    },
    {
      id: 'orders',
      name: 'Orders Report',
      description: 'Order volume and status analysis',
      icon: DocumentReportIcon
    },
    {
      id: 'clients',
      name: 'Clients Report',
      description: 'Client activity and ordering patterns',
      icon: UserGroupIcon
    },
    {
      id: 'suppliers',
      name: 'Suppliers Report',
      description: 'Supplier performance and order history',
      icon: TruckIcon
    }
  ];

  const timeFrames = [
    { id: 'daily', name: 'Daily' },
    { id: 'weekly', name: 'Weekly' },
    { id: 'monthly', name: 'Monthly' }
  ];

  const chartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: isDarkMode ? '#fff' : '#374151'
        }
      },
      title: {
        display: true,
        text: title,
        color: isDarkMode ? '#fff' : '#374151',
        font: {
          size: 16
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: isDarkMode ? '#fff' : '#374151'
        }
      },
      x: {
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: isDarkMode ? '#fff' : '#374151'
        }
      }
    }
  });

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/api/reports/${selectedReport}`, {
        params: {
          startDate: dateRange.start,
          endDate: dateRange.end,
          timeFrame: timeFrame
        }
      });
      
      setReportData(response.data);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data. Please try again.');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format = 'csv') => {
    try {
      const response = await api.get(`/api/reports/${selectedReport}/export`, {
        params: {
          startDate: dateRange.start,
          endDate: dateRange.end,
          format: format
        }
      });
      
      // Handle export response
      console.log('Export response:', response.data);
      alert(`Export requested for ${selectedReport} report. Check console for details.`);
      
    } catch (err) {
      console.error('Error exporting report:', err);
      setError('Failed to export report. Please try again.');
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedReport, dateRange, timeFrame]);

  const renderSalesCharts = () => {
    if (!reportData) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reportData.revenueTrend && (
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow`}>
            <div className="h-80">
              <Line 
                data={{
                  labels: reportData.revenueTrend.labels,
                  datasets: [
                    {
                      label: 'Revenue',
                      data: reportData.revenueTrend.data,
                      backgroundColor: 'rgba(79, 70, 229, 0.2)',
                      borderColor: 'rgba(79, 70, 229, 1)',
                      borderWidth: 2,
                      fill: true,
                      tension: 0.4
                    }
                  ]
                }} 
                options={chartOptions('Revenue Trend')} 
              />
            </div>
          </div>
        )}
        
        {reportData.salesByCategory && (
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow`}>
            <div className="h-80">
              <Doughnut 
                data={{
                  labels: reportData.salesByCategory.labels,
                  datasets: [
                    {
                      label: 'Sales by Category',
                      data: reportData.salesByCategory.data,
                      backgroundColor: [
                        'rgba(79, 70, 229, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                      ],
                      borderWidth: 1
                    }
                  ]
                }} 
                options={chartOptions('Sales by Category')} 
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInventoryCharts = () => {
    if (!reportData) return null;

    return (
      <div className="grid grid-cols-1 gap-6">
        {reportData.stockLevels && (
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow`}>
            <div className="h-80">
              <Bar 
                data={{
                  labels: reportData.stockLevels.labels,
                  datasets: [
                    {
                      label: 'Current Stock',
                      data: reportData.stockLevels.data,
                      backgroundColor: 'rgba(59, 130, 246, 0.6)',
                      borderColor: 'rgba(59, 130, 246, 1)',
                      borderWidth: 2
                    },
                    {
                      label: 'Minimum Required',
                      data: reportData.stockLevels.minLevels,
                      backgroundColor: 'rgba(239, 68, 68, 0.6)',
                      borderColor: 'rgba(239, 68, 68, 1)',
                      borderWidth: 2
                    }
                  ]
                }} 
                options={chartOptions('Stock Levels vs Minimum Requirements')} 
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderClientsCharts = () => {
    if (!reportData) return null;

    return (
      <div className="grid grid-cols-1 gap-6">
        {reportData.clientActivity && (
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow`}>
            <div className="h-80">
              <Bar 
                data={{
                  labels: reportData.clientActivity.labels,
                  datasets: [
                    {
                      label: 'Total Spent',
                      data: reportData.clientActivity.data,
                      backgroundColor: 'rgba(16, 185, 129, 0.6)',
                      borderColor: 'rgba(16, 185, 129, 1)',
                      borderWidth: 2
                    }
                  ]
                }} 
                options={chartOptions('Top Clients by Spending')} 
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSuppliersCharts = () => {
    if (!reportData) return null;

    return (
      <div className="grid grid-cols-1 gap-6">
        {reportData.supplierPerformance && (
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow`}>
            <div className="h-80">
              <Bar 
                data={{
                  labels: reportData.supplierPerformance.labels,
                  datasets: [
                    {
                      label: 'Total Order Volume',
                      data: reportData.supplierPerformance.data,
                      backgroundColor: 'rgba(245, 158, 11, 0.6)',
                      borderColor: 'rgba(245, 158, 11, 1)',
                      borderWidth: 2
                    }
                  ]
                }} 
                options={chartOptions('Supplier Performance')} 
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMetrics = () => {
    if (!reportData?.metrics) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {reportData.metrics.map((metric, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
            } shadow-sm`}
          >
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {metric.label}
            </p>
            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {metric.value}
            </p>
            {metric.change !== null && metric.change !== undefined && (
              <p className={`text-sm ${
                metric.change > 0 ? 'text-green-600' : metric.change < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {metric.change > 0 ? '↑' : metric.change < 0 ? '↓' : ''} 
                {Math.abs(metric.change)}%
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className={`ml-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Loading report data...
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'} mb-6`}>
          {error}
        </div>
      );
    }

    if (!reportData) {
      return (
        <div className="text-center py-12">
          <DocumentReportIcon className={`w-12 h-12 mx-auto ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Select a report type to view data
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        {renderMetrics()}

        {/* Charts */}
        {selectedReport === 'sales' && renderSalesCharts()}
        {selectedReport === 'inventory' && renderInventoryCharts()}
        {selectedReport === 'clients' && renderClientsCharts()}
        {selectedReport === 'suppliers' && renderSuppliersCharts()}

        {/* Additional Data Tables */}
        {reportData.topProducts && (
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow-sm`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Top Products
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className={isDarkMode ? "bg-gray-600" : "bg-gray-100"}>
                  <tr>
                    <th className="px-4 py-2 text-left">Product</th>
                    <th className="px-4 py-2 text-left">Quantity Sold</th>
                    <th className="px-4 py-2 text-left">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.topProducts.map((product, index) => (
                    <tr key={index} className={isDarkMode ? "border-gray-600" : "border-gray-200"}>
                      <td className="px-4 py-2">{product.name}</td>
                      <td className="px-4 py-2">{product.quantity}</td>
                      <td className="px-4 py-2">${product.revenue?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and filters remain the same as previous version */}
      {/* ... (keep the header and filter section from your working version) ... */}
      
      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {reportTypes.map((report) => {
          const IconComponent = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`p-4 rounded-lg text-left transition-all duration-200 ${
                selectedReport === report.id
                  ? isDarkMode
                    ? 'bg-indigo-700 text-white border-2 border-indigo-500'
                    : 'bg-indigo-100 text-indigo-800 border-2 border-indigo-500'
                  : isDarkMode
                  ? 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <IconComponent className="w-8 h-8 mb-2" />
              <h3 className="font-semibold mb-1">{report.name}</h3>
              <p className="text-sm opacity-75">{report.description}</p>
            </button>
          );
        })}
      </div>

      {/* Export Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => exportReport('csv')}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          <DownloadIcon className="w-4 h-4 mr-2" />
          Export CSV
        </button>
        <button
          onClick={() => exportReport('pdf')}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          <DownloadIcon className="w-4 h-4 mr-2" />
          Export PDF
        </button>
      </div>

      {/* Report Content */}
      <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        {renderReportContent()}
      </div>
    </div>
  );
};

export default ReportManagement;