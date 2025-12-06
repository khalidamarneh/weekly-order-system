// src/components/admin/sales/CustomerManagement.jsx
import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ArrowLeftIcon, MapIcon } from '@heroicons/react/outline';
import api from '../../../services/api';

const CustomerManagement = ({ isDarkMode, onBack, onCustomerSelect }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    gps: '',
    company: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/customers');
      setCustomers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading customers:', error);
      alert('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Customer name is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      if (editingCustomer) {
        await api.put(`/api/customers/${editingCustomer.id}`, formData);
        alert('Customer updated successfully!');
      } else {
        await api.post('/api/customers', formData);
        alert('Customer created successfully!');
      }
      
      resetForm();
      loadCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      gps: '',
      company: ''
    });
    setFormErrors({});
    setEditingCustomer(null);
    setShowForm(false);
  };

  const editCustomer = (customer) => {
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      gps: customer.gps || '',
      company: customer.company || ''
    });
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const deleteCustomer = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;

    try {
      await api.delete(`/api/customers/${customerId}`);
      alert('Customer deleted successfully!');
      loadCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete customer';
      alert(errorMessage);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      // Show permission request message
      if (!window.confirm('This will request your current location. Allow location access?')) {
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({
            ...prev,
            gps: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          }));
          alert('Location captured successfully!');
        },
        (error) => {
          console.error('Error getting location:', error);
          let errorMessage = 'Could not get current location';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access was denied. Please enable location permissions in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
            default:
              errorMessage = 'An unknown error occurred while getting location.';
              break;
          }
          
          alert(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      alert('Geolocation is not supported by this browser');
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} p-4`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
           <div className="flex gap-3">
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Customer</span>
              </button>
            )}
          </div>
        </div>

        {/* Customer Form */}
        {showForm && (
          <div className={`mb-6 rounded-lg border p-6 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  } ${formErrors.name ? 'border-red-500' : ''}`}
                  required
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full border rounded px-3 py-2 ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  GPS Coordinates (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="gps"
                    value={formData.gps}
                    onChange={handleInputChange}
                    placeholder="Latitude, Longitude (e.g., 40.7128, -74.0060)"
                    className={`flex-1 border rounded px-3 py-2 ${
                      isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className={`flex items-center space-x-2 px-3 py-2 rounded border ${
                      isDarkMode 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white border-blue-400'
                    }`}
                  >
                    <MapIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Get Location</span>
                  </button>
                </div>
                <p className={`text-xs mt-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  📍 Gets your current GPS coordinates. Useful for delivery or service locations.
                </p>
              </div>

              <div className="md:col-span-2 flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Saving...' : (editingCustomer ? 'Update Customer' : 'Create Customer')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    isDarkMode 
                      ? 'border-gray-600 hover:bg-gray-700 text-white' 
                      : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Customers List */}
        <div className={`rounded-lg border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="p-4 border-b border-gray-700">
            <h2 className={`text-xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Customers ({customers.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Loading customers...
              </p>
            </div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center">
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                No customers found. Add your first customer to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-100"}>
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">Company</th>
                    <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">Address</th>
                    <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  isDarkMode ? "divide-gray-700" : "divide-gray-200"
                }`}>
                  {customers.map((customer) => (
                    <tr key={customer.id} className={
                      isDarkMode ? "hover:bg-gray-750" : "hover:bg-gray-50"
                    }>
                      <td className="px-4 py-3">
                        <div className={`font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {customer.name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                          {customer.company || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {customer.email && (
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {customer.address || '-'}
                        </span>
                        {customer.gps && (
                          <div className={`text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            📍 {customer.gps}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => editCustomer(customer)}
                            className={`p-1 rounded ${
                              isDarkMode 
                                ? 'text-blue-400 hover:bg-blue-900' 
                                : 'text-blue-500 hover:bg-blue-100'
                            }`}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteCustomer(customer.id)}
                            className={`p-1 rounded ${
                              isDarkMode 
                                ? 'text-red-400 hover:bg-red-900' 
                                : 'text-red-500 hover:bg-red-100'
                            }`}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerManagement;