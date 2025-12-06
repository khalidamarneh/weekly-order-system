// src/components/admin/SupplierManagement.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  PhoneIcon,
  MailIcon,
  LocationMarkerIcon // Changed from MapPinIcon to LocationMarkerIcon
} from '@heroicons/react/outline';

const SupplierManagement = ({ isDarkMode }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: ''
  });

  // Fetch all suppliers
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/suppliers');
      setSuppliers(response.data);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      contact: '',
      email: '',
      phone: '',
      address: ''
    });
    setEditingSupplier(null);
  };

  // Open form for editing
  const handleEdit = (supplier) => {
    setFormData({
      name: supplier.name,
      contact: supplier.contact || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || ''
    });
    setEditingSupplier(supplier);
    setShowForm(true);
  };

  // Open form for creating new supplier
  const handleCreate = () => {
    resetForm();
    setShowForm(true);
  };

  // Submit form (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Supplier name is required');
      return;
    }

    try {
      setError(null);
      
      if (editingSupplier) {
        // Update existing supplier
        await api.put(`/api/suppliers/${editingSupplier.id}`, formData);
      } else {
        // Create new supplier
        await api.post('/api/suppliers', formData);
      }

      // Refresh list and close form
      await fetchSuppliers();
      setShowForm(false);
      resetForm();
      
    } catch (err) {
      console.error('Error saving supplier:', err);
      setError(err.response?.data?.message || 'Failed to save supplier');
    }
  };

  // Delete supplier
  const handleDelete = async (supplierId) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) {
      return;
    }

    try {
      setError(null);
      await api.delete(`/api/suppliers/${supplierId}`);
      await fetchSuppliers();
    } catch (err) {
      console.error('Error deleting supplier:', err);
      setError(err.response?.data?.message || 'Failed to delete supplier');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Supplier Management
          </h2>
          <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your suppliers and vendor information
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Supplier
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
          {error}
        </div>
      )}

      {/* Supplier Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-xl w-full max-w-md ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-400' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'} focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Contact Person
                  </label>
                  <input
                    type="text"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-400' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'} focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-400' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'} focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-400' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'} focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-400' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'} focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className={`px-4 py-2 border rounded-lg text-sm ${isDarkMode ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600' : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'} transition-colors duration-200`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
                  >
                    {editingSupplier ? 'Update Supplier' : 'Create Supplier'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Suppliers List */}
      <div className={`rounded-xl shadow-sm overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {suppliers.length === 0 ? (
          <div className="text-center py-12">
            <UserGroupIcon className={`w-12 h-12 mx-auto ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`mt-4 text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
              No suppliers yet
            </h3>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              Get started by adding your first supplier.
            </p>
            <button
              onClick={handleCreate}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200"
            >
              Add Your First Supplier
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Supplier
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Contact Info
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Address
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700 bg-gray-800" : "divide-gray-200 bg-white"}`}>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className={`hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors duration-150`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                          <UserGroupIcon className="w-5 h-5" />
                        </div>
                        <div className="ml-4">
                          <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {supplier.name}
                          </div>
                          {supplier.contact && (
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {supplier.contact}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {supplier.email && (
                          <div className="flex items-center text-sm">
                            <MailIcon className="w-4 h-4 mr-2" />
                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{supplier.email}</span>
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center text-sm">
                            <PhoneIcon className="w-4 h-4 mr-2" />
                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{supplier.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {supplier.address && (
                        <div className="flex items-center text-sm">
                          <LocationMarkerIcon className="w-4 h-4 mr-2 flex-shrink-0" /> {/* Changed from MapPinIcon to LocationMarkerIcon */}
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{supplier.address}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors duration-200 p-1"
                          title="Edit supplier"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200 p-1"
                          title="Delete supplier"
                        >
                          <TrashIcon className="w-4 h-4" />
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
  );
};

export default SupplierManagement;