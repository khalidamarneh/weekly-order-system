// frontend/src/components/admin/inbound_orders/OrderControl.jsx
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import socketService from '../../../services/socket';
import {
  ClockIcon,
  BellIcon,
  ChatIcon,
  PencilIcon,
  XCircleIcon,
  BanIcon
} from '@heroicons/react/outline';

const OrderControl = ({ isDarkMode }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [editType, setEditType] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  // Time control settings state
  const [timeSettings, setTimeSettings] = useState({
    type: 'daily',
    daily: { hours: 24 },
    weekly: { 
      startDay: 'Monday', 
      startHour: 0, 
      endDay: 'Sunday', 
      endHour: 23,
      startMinute: 0,
      endMinute: 59
    },
    monthly: { 
      startDay: 1, 
      startHour: 0, 
      endDay: 31, 
      endHour: 23,
      startMinute: 0,
      endMinute: 59
    }
  });
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const monthDays = Array.from({ length: 31 }, (_, i) => i + 1);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/admin/order-control/clients');
      setClients(response.data);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to load clients data');
    } finally {
      setLoading(false);
    }
  };

  // Add socket listeners for real-time updates
  useEffect(() => {
    const socket = socketService.getSocket();
    
    if (socket) {
      // Listen for order control updates from other admins
      socket.on('order_control_updated', (data) => {
        console.log('Order control updated by another admin:', data);
        fetchClients();
      });

      // Listen for custom message events
      socket.on('custom_message_sent', (data) => {
        console.log('Custom message sent by another admin:', data);
        fetchClients();
      });

      socket.on('custom_message_disabled_admin', (data) => {
        console.log('Custom message disabled by another admin:', data);
        fetchClients();
      });
    }

    // Clean up listeners on component unmount
    return () => {
      const socket = socketService.getSocket();
      if (socket) {
        socket.off('order_control_updated');
        socket.off('custom_message_sent');
        socket.off('custom_message_disabled_admin');
      }
    };
  }, []);

  useEffect(() => {
    fetchClients();
  }, []);

  // Initialize time settings when editing a client
  useEffect(() => {
    if (editingClient && editType === 'time' && editingClient.orderControl) {
      const control = editingClient.orderControl;
      setTimeSettings({
        type: control.timeControlType || 'daily',
        daily: control.timeControlSettings?.daily || { hours: 24 },
        weekly: control.timeControlSettings?.weekly || { 
          startDay: 'Monday', startHour: 0, endDay: 'Sunday', endHour: 23,
          startMinute: 0, endMinute: 59
        },
        monthly: control.timeControlSettings?.monthly || { 
          startDay: 1, startHour: 0, endDay: 31, endHour: 23,
          startMinute: 0, endMinute: 59
        }
      });
    }
  }, [editingClient, editType]);

  const updateOrderControl = async (clientId, updates) => {
  try {
    setError(null);
    
      // Add period start time when enabling time control
      if (updates.timeControlEnabled) {
        updates.periodStartTime = new Date().toISOString(); // Record when period started
      }

      await api.put(`/api/admin/order-control/clients/${clientId}`, updates);
      await fetchClients();
      setEditingClient(null);
      setEditType('');
    } catch (err) {
      console.error('Error updating order control:', err);
      setError('Failed to update settings');
    }
  };

  const sendCustomMessage = async (clientId) => {
    try {
      setError(null);
      await api.post(`/api/admin/order-control/clients/${clientId}/message`, {
        message: customMessage
      });
      setCustomMessage('');
      setEditingClient(null);
      setEditType('');
      await fetchClients();
    } catch (err) {
      console.error('Error sending custom message:', err);
      setError('Failed to send message');
    }
  };

  const disableCustomMessage = async (clientId) => {
    try {
      setError(null);
      await api.post(`/api/admin/order-control/clients/${clientId}/message/disable`);
      await fetchClients();
    } catch (err) {
      console.error('Error disabling custom message:', err);
      setError('Failed to disable message');
    }
  };

  const getDisplayInfoStatus = (client) => {
    const control = client.orderControl;
    if (!control) return 'Default';
    if (control.showSalePrice || control.showQuantity) return 'Active';
    return 'Default';
  };

  const getTimeControlStatus = (client) => {
    const control = client.orderControl;
    if (!control || !control.timeControlEnabled) return 'No Time Set';
    
    const type = control.timeControlType || 'daily';
    const settings = control.timeControlSettings || {};
    
    switch (type) {
      case 'daily':
        return `Daily: ${settings.daily?.hours || 24}h`;
      case 'weekly':
        return `Weekly: ${settings.weekly?.startDay} - ${settings.weekly?.endDay}`;
      case 'monthly':
        return `Monthly: Day ${settings.monthly?.startDay} - ${settings.monthly?.endDay}`;
      default:
        return 'Time Set';
    }
  };

  const getWarningStatus = (client) => {
    const control = client.orderControl;
    if (!control || !control.warningEnabled) return 'No Warning';
    if (control.customMessageActive) return 'Custom Message Active';
    return 'Warning Active';
  };

  const renderTimeControlForm = () => {
    const { type } = timeSettings;

    return (
      <div className="space-y-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            defaultChecked={editingClient?.orderControl?.timeControlEnabled || false}
            onChange={(e) => {
              if (e.target.checked) {
                setTimeSettings({
                  ...timeSettings,
                  type: timeSettings.type
                });
              }
            }}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className={`ml-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Enable Time Control
          </span>
        </label>

        <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Time Control Type
            </label>
            <select
              value={timeSettings.type}
              onChange={(e) => setTimeSettings({ ...timeSettings, type: e.target.value })}
              className={`w-full border rounded-lg px-3 py-2 ${
                isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {type === 'daily' && (
            <div className="space-y-3">
              <h4 className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Daily Ordering Window
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Ordering Window (hours)
                  </label>
                  <select
                    value={timeSettings.daily.hours}
                    onChange={(e) => setTimeSettings({
                      ...timeSettings,
                      daily: { ...timeSettings.daily, hours: parseInt(e.target.value) }
                    })}
                    className={`w-full border rounded-lg px-3 py-2 ${
                      isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {hours.map(hour => (
                      <option key={hour} value={hour}>{hour} hour{hour !== 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Client can order within {timeSettings.daily.hours} hours of order creation
                  </p>
                </div>
              </div>
            </div>
          )}

          {type === 'weekly' && (
            <div className="space-y-3">
              <h4 className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Weekly Ordering Schedule
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Start Day
                  </label>
                  <select
                    value={timeSettings.weekly.startDay}
                    onChange={(e) => setTimeSettings({
                      ...timeSettings,
                      weekly: { ...timeSettings.weekly, startDay: e.target.value }
                    })}
                    className={`w-full border rounded-lg px-3 py-2 ${
                      isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {daysOfWeek.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Start Time
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={timeSettings.weekly.startHour}
                      onChange={(e) => setTimeSettings({
                        ...timeSettings,
                        weekly: { ...timeSettings.weekly, startHour: parseInt(e.target.value) }
                      })}
                      className={`flex-1 border rounded-lg px-3 py-2 ${
                        isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {hours.map(hour => (
                        <option key={hour} value={hour}>{hour.toString().padStart(2, '0')}:00</option>
                      ))}
                    </select>
                    <select
                      value={timeSettings.weekly.startMinute}
                      onChange={(e) => setTimeSettings({
                        ...timeSettings,
                        weekly: { ...timeSettings.weekly, startMinute: parseInt(e.target.value) }
                      })}
                      className={`flex-1 border rounded-lg px-3 py-2 ${
                        isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {minutes.map(minute => (
                        <option key={minute} value={minute}>{minute.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    End Day
                  </label>
                  <select
                    value={timeSettings.weekly.endDay}
                    onChange={(e) => setTimeSettings({
                      ...timeSettings,
                      weekly: { ...timeSettings.weekly, endDay: e.target.value }
                    })}
                    className={`w-full border rounded-lg px-3 py-2 ${
                      isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {daysOfWeek.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    End Time
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={timeSettings.weekly.endHour}
                      onChange={(e) => setTimeSettings({
                        ...timeSettings,
                        weekly: { ...timeSettings.weekly, endHour: parseInt(e.target.value) }
                      })}
                      className={`flex-1 border rounded-lg px-3 py-2 ${
                        isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {hours.map(hour => (
                        <option key={hour} value={hour}>{hour.toString().padStart(2, '0')}:00</option>
                      ))}
                    </select>
                    <select
                      value={timeSettings.weekly.endMinute}
                      onChange={(e) => setTimeSettings({
                        ...timeSettings,
                        weekly: { ...timeSettings.weekly, endMinute: parseInt(e.target.value) }
                      })}
                      className={`flex-1 border rounded-lg px-3 py-2 ${
                        isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {minutes.map(minute => (
                        <option key={minute} value={minute}>{minute.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {type === 'monthly' && (
            <div className="space-y-3">
              <h4 className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Monthly Ordering Schedule
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Start Day
                  </label>
                  <select
                    value={timeSettings.monthly.startDay}
                    onChange={(e) => setTimeSettings({
                      ...timeSettings,
                      monthly: { ...timeSettings.monthly, startDay: parseInt(e.target.value) }
                    })}
                    className={`w-full border rounded-lg px-3 py-2 ${
                      isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {monthDays.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Start Time
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={timeSettings.monthly.startHour}
                      onChange={(e) => setTimeSettings({
                        ...timeSettings,
                        monthly: { ...timeSettings.monthly, startHour: parseInt(e.target.value) }
                      })}
                      className={`flex-1 border rounded-lg px-3 py-2 ${
                        isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {hours.map(hour => (
                        <option key={hour} value={hour}>{hour.toString().padStart(2, '0')}:00</option>
                      ))}
                    </select>
                    <select
                      value={timeSettings.monthly.startMinute}
                      onChange={(e) => setTimeSettings({
                        ...timeSettings,
                        monthly: { ...timeSettings.monthly, startMinute: parseInt(e.target.value) }
                      })}
                      className={`flex-1 border rounded-lg px-3 py-2 ${
                        isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {minutes.map(minute => (
                        <option key={minute} value={minute}>{minute.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    End Day
                  </label>
                  <select
                    value={timeSettings.monthly.endDay}
                    onChange={(e) => setTimeSettings({
                      ...timeSettings,
                      monthly: { ...timeSettings.monthly, endDay: parseInt(e.target.value) }
                    })}
                    className={`w-full border rounded-lg px-3 py-2 ${
                      isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {monthDays.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    End Time
                    </label>
                  <div className="flex space-x-2">
                    <select
                      value={timeSettings.monthly.endHour}
                      onChange={(e) => setTimeSettings({
                        ...timeSettings,
                        monthly: { ...timeSettings.monthly, endHour: parseInt(e.target.value) }
                      })}
                      className={`flex-1 border rounded-lg px-3 py-2 ${
                        isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {hours.map(hour => (
                        <option key={hour} value={hour}>{hour.toString().padStart(2, '0')}:00</option>
                      ))}
                    </select>
                    <select
                      value={timeSettings.monthly.endMinute}
                      onChange={(e) => setTimeSettings({
                        ...timeSettings,
                        monthly: { ...timeSettings.monthly, endMinute: parseInt(e.target.value) }
                      })}
                      className={`flex-1 border rounded-lg px-3 py-2 ${
                        isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {minutes.map(minute => (
                        <option key={minute} value={minute}>{minute.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4">
            <button
              onClick={() => updateOrderControl(editingClient.id, {
                timeControlEnabled: true,
                timeControlType: timeSettings.type,
                timeControlSettings: timeSettings
              })}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Save Time Settings
            </button>
          </div>
        </div>
      </div>
    );
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
    <div className="pl-5">   {/* ⬅️ Added left padding */}
      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Inbound Orders Control
      </h2>
      <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Manage client order visibility, time controls, and messaging
      </p>
    </div>


      {/* Error Message */}
      {error && (
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
          {error}
        </div>
      )}

      {/* Clients Table */}
      <div className={`rounded-xl shadow-sm overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Displayed Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Time Control
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Warning Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Extra Message
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {clients.map((client) => (
                <tr key={client.id} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                  {/* Client Info */}
                  <td className="px-6 py-4">
                    <div>
                      <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {client.name}
                      </div>
                      <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                        {client.company}
                      </div>
                    </div>
                  </td>

                  {/* Displayed Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {getDisplayInfoStatus(client)}
                      </span>
                      <button
                        onClick={() => {
                          setEditingClient(client);
                          setEditType('display');
                        }}
                        className="p-1 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        title="Edit display settings"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      {getDisplayInfoStatus(client) === 'Active' && (
                        <button
                          onClick={() => updateOrderControl(client.id, {
                            showSalePrice: false,
                            showQuantity: false
                          })}
                          className="p-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Reset to default"
                        >
                          <BanIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Time Control */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {getTimeControlStatus(client)}
                      </span>
                      <button
                        onClick={() => {
                          setEditingClient(client);
                          setEditType('time');
                        }}
                        className="p-1 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        title="Edit time control"
                      >
                        <ClockIcon className="w-4 h-4" />
                      </button>
                      {getTimeControlStatus(client) !== 'No Time Set' && (
                        <button
                          onClick={() => updateOrderControl(client.id, {
                            timeControlEnabled: false
                          })}
                          className="p-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Disable time control"
                        >
                          <BanIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Warning Message */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {getWarningStatus(client)}
                      </span>
                      <button
                        onClick={() => {
                          setEditingClient(client);
                          setEditType('warning');
                        }}
                        className="p-1 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        title="Manage warnings"
                      >
                        <BellIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>

                  {/* Extra Message */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingClient(client);
                          setEditType('message');
                          setCustomMessage('');
                        }}
                        className="p-1 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        title="Send custom message"
                      >
                        <ChatIcon className="w-4 h-4" />
                      </button>
                      {client.orderControl?.customMessageActive && (
                        <button
                          onClick={() => disableCustomMessage(client.id)}
                          className="p-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Disable custom message"
                        >
                          <XCircleIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modals */}
      {editingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-xl w-full max-w-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {editType === 'display' && 'Display Settings'}
                  {editType === 'time' && 'Time Control Settings'}
                  {editType === 'warning' && 'Warning Settings'}
                  {editType === 'message' && 'Send Custom Message'}
                </h3>
                <button
                  onClick={() => {
                    setEditingClient(null);
                    setEditType('');
                    setCustomMessage('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              {/* Display Settings Modal */}
              {editType === 'display' && (
                <div className="space-y-4">
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    Control what information {editingClient.name} can see:
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked={editingClient.orderControl?.showSalePrice || false}
                        onChange={(e) => {
                          updateOrderControl(editingClient.id, {
                            showSalePrice: e.target.checked,
                            showQuantity: editingClient.orderControl?.showQuantity || false
                          });
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className={`ml-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Show Sale Price
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked={editingClient.orderControl?.showQuantity || false}
                        onChange={(e) => {
                          updateOrderControl(editingClient.id, {
                            showSalePrice: editingClient.orderControl?.showSalePrice || false,
                            showQuantity: e.target.checked
                          });
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className={`ml-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Show Quantity
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Time Control Modal */}
              {editType === 'time' && renderTimeControlForm()}

              {/* Warning Settings Modal */}
              {editType === 'warning' && (
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked={editingClient.orderControl?.warningEnabled || false}
                      onChange={(e) => {
                        updateOrderControl(editingClient.id, {
                          warningEnabled: e.target.checked
                        });
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className={`ml-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Enable Warning Messages
                    </span>
                  </label>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    When enabled, the client will see warning messages about order deadlines.
                    {editingClient.orderControl?.timeControlEnabled && (
                      <span className="block mt-1 text-indigo-600 dark:text-indigo-400">
                        Based on configured time control settings
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Custom Message Modal */}
              {editType === 'message' && (
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Custom Message
                    </label>
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={3}
                      className={`mt-1 block w-full border rounded-lg px-3 py-2 ${
                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Enter your message here..."
                    />
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    This message will appear as a flying banner on the client's page for 10 minutes.
                  </p>
                  <button
                    onClick={() => sendCustomMessage(editingClient.id)}
                    disabled={!customMessage.trim()}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    title={!customMessage.trim() ? 'Please enter a message' : 'Send message'}
                  >
                    Send Message
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderControl;