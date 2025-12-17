// src/pages/admin/ClientManagement.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XIcon,
  LocationMarkerIcon,
  DownloadIcon,
  KeyIcon,
  LockClosedIcon,
  LockOpenIcon,
  ExclamationIcon,
  ShieldCheckIcon
} from "@heroicons/react/outline";
import Papa from "papaparse";
import socketService from "../../services/socket";

/**
 * ClientManagement - FIRST ADMIN ONLY
 * - Only the FIRST ADMIN (oldest admin) can create/update/delete users
 * - All admins can view users list
 * - First admin can reset passwords for any user (including themselves)
 * - Password requirements: Minimum 6 characters
 */
const ClientManagement = ({ isDarkMode }) => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null); // For success/info messages
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [isFirstAdmin, setIsFirstAdmin] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [modalData, setModalData] = useState({
    id: null,
    email: "",
    name: "",
    company: "",
    address: "",
    tel: "",
    gps: "",
    role: "CLIENT",
    password: "",
  });

  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({
    userId: null,
    userName: "",
    newPassword: "",
    confirmPassword: "",
    showPassword: false,
  });

  // Helper: base API (relative so Vite proxy or same origin works)
  const apiBase = "";

  // Check if current user is first admin - FIXED VERSION
  const checkFirstAdminStatus = async () => {
    if (!currentUser || currentUser.role !== 'ADMIN' || users.length === 0) {
      setIsFirstAdmin(false);
      return;
    }

    try {
      // Get all admin users
      const adminUsers = users.filter(u => u.role === 'ADMIN');
      
      if (adminUsers.length === 0) {
        setIsFirstAdmin(false);
        return;
      }

      // Sort by ORIGINAL createdAt timestamp from database
      const sortedAdmins = [...adminUsers].sort((a, b) => {
        // Parse PostgreSQL timestamp format: "2025-08-23 00:49:03.65"
        const parseTimestamp = (timestamp) => {
          if (!timestamp) return 0;
          try {
            // Convert PostgreSQL timestamp to ISO format for Date parsing
            const isoFormat = timestamp.includes('T') 
              ? timestamp 
              : timestamp.replace(' ', 'T');
            const date = new Date(isoFormat);
            return isNaN(date.getTime()) ? 0 : date.getTime();
          } catch {
            return 0;
          }
        };

        const timeA = parseTimestamp(a.createdAt);
        const timeB = parseTimestamp(b.createdAt);
        
        // If timestamps are equal, use ID as fallback (lower ID = older)
        if (timeA === timeB) {
          return a.id - b.id;
        }
        
        return timeA - timeB; // Oldest first
      });

      // The first admin is the oldest admin
      const firstAdmin = sortedAdmins[0];
      
      console.log('First admin check:', {
        firstAdminId: firstAdmin.id,
        firstAdminName: firstAdmin.name,
        firstAdminDate: firstAdmin.createdAt,
        currentUserId: currentUser.id,
        isFirstAdmin: currentUser.id === firstAdmin.id
      });
      
      setIsFirstAdmin(currentUser.id === firstAdmin.id);
      
    } catch (err) {
      console.error('Error checking first admin status:', err);
      setIsFirstAdmin(false);
    }
  };

  // Fetch all users - FIXED: Handle PostgreSQL timestamp
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`${apiBase}/api/clients`, {
        withCredentials: true,
        timeout: 10000,
      });

      const formatted = (res.data || []).map((u) => {
        // Keep original timestamp for sorting
        const originalTimestamp = u.createdAt; // "2025-08-23 00:49:03.65"
        
        // Create display date
        let displayDate = "-";
        if (originalTimestamp) {
          try {
            // Convert PostgreSQL timestamp to readable date
            const isoFormat = originalTimestamp.includes('T') 
              ? originalTimestamp 
              : originalTimestamp.replace(' ', 'T');
            const date = new Date(isoFormat);
            if (!isNaN(date.getTime())) {
              displayDate = date.toLocaleDateString();
            }
          } catch (e) {
            console.warn('Date parsing error:', e.message);
          }
        }
        
        return {
          ...u,
          address: u.address || "-",
          tel: u.tel || "-",
          gps: u.gps || "-",
          // Keep original timestamp for sorting
          createdAt: originalTimestamp,
          // Add formatted date for display
          createdAtDisplay: displayDate,
        };
      });

      setUsers(formatted);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError(
        err?.response?.data?.message ||
        "Failed to load users. Please check your connection."
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Check first admin status when users load
  useEffect(() => {
    if (users.length > 0 && currentUser?.role === 'ADMIN') {
      checkFirstAdminStatus();
    } else if (currentUser?.role !== 'ADMIN') {
      setIsFirstAdmin(false);
    }
  }, [users, currentUser]);

  // Optional: Ensure socket connection
  useEffect(() => {
    let mounted = true;
    const initSocket = async () => {
      try {
        await socketService.connect().catch(() => null);
      } catch (err) {
        console.warn("Socket init error:", err?.message || err);
      }
    };
    if (mounted) initSocket();
    return () => {
      mounted = false;
    };
  }, []);

  // Helper to show info messages
  const showInfo = (message, duration = 3000) => {
    setInfo(message);
    setTimeout(() => setInfo(null), duration);
  };

  // Helper to show errors
  const showError = (message, duration = 5000) => {
    setError(message);
    setTimeout(() => setError(null), duration);
  };

  const openAddModal = () => {
    if (!isFirstAdmin) {
      showError("Only the first admin can add new users");
      return;
    }
    
    setModalData({
      id: null,
      email: "",
      name: "",
      company: "",
      address: "",
      tel: "",
      gps: "",
      role: "CLIENT",
      password: "",
    });
    setOpenModal(true);
    setError(null);
  };

  const openEditModal = (user) => {
    if (!isFirstAdmin) {
      showError("Only the first admin can edit users");
      return;
    }
    
    setModalData({
      id: user.id,
      email: user.email || "",
      name: user.name || "",
      company: user.company || "",
      address: user.address === "-" ? "" : user.address,
      tel: user.tel === "-" ? "" : user.tel,
      gps: user.gps === "-" ? "" : user.gps,
      role: user.role || "CLIENT",
      password: "",
    });
    setOpenModal(true);
    setError(null);
  };

  const openResetPasswordModal = (user) => {
    if (!isFirstAdmin) {
      showError("Only the first admin can reset passwords");
      return;
    }
    
    setResetPasswordData({
      userId: user.id,
      userName: user.name,
      newPassword: "",
      confirmPassword: "",
      showPassword: false,
    });
    setResetPasswordModal(true);
    setError(null);
  };

  const handleChange = (e) => {
    setModalData({ ...modalData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isFirstAdmin) {
      showError("Only the first admin can modify users");
      return;
    }

    // basic validation
    if (!modalData.email || !modalData.name) {
      showError("Name and email are required");
      return;
    }

    // when creating a user, password required
    if (!modalData.id && (!modalData.password || modalData.password.length < 6)) {
      showError("Password is required and must be at least 6 characters");
      return;
    }

    try {
      setSaving(true);

      if (modalData.id) {
        // Update existing user
        const payload = {
          email: modalData.email,
          name: modalData.name,
          company: modalData.company,
          address: modalData.address,
          tel: modalData.tel,
          gps: modalData.gps,
          ...(modalData.role ? { role: modalData.role } : {}),
        };

        // Only include password if provided (for updating own account)
        if (modalData.password && modalData.password.length >= 6) {
          payload.password = modalData.password;
        }

        await axios.put(`${apiBase}/api/clients/${modalData.id}`, payload, {
          withCredentials: true,
          timeout: 10000,
        });
        
        showInfo("User updated successfully");
      } else {
        // Create new user
        const payload = {
          email: modalData.email,
          name: modalData.name,
          company: modalData.company,
          address: modalData.address,
          tel: modalData.tel,
          gps: modalData.gps,
          role: modalData.role || "CLIENT",
          password: modalData.password,
        };

        await axios.post(`${apiBase}/api/auth/register`, payload, {
          withCredentials: true,
          timeout: 10000,
        });
        
        showInfo("User created successfully");
      }

      setOpenModal(false);
      await fetchUsers();
    } catch (err) {
      console.error("Failed to save user:", err);
      const errorMsg = err?.response?.data?.message || "Error saving user. Please try again.";
      
      // Check if it's a first-admin restriction error
      if (err.response?.status === 403 && 
          err.response?.data?.message?.includes('first admin')) {
        showError("Only the first admin can modify users");
        setIsFirstAdmin(false);
      } else {
        showError(errorMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!isFirstAdmin) {
      showError("Only the first admin can delete users");
      return;
    }

    // Allow self-deletion if user confirms (with warning)
    if (id === currentUser?.id) {
      if (!window.confirm("⚠️ WARNING: You are about to delete YOUR OWN account!\n\nThis will permanently remove your access to the system.\n\nAre you absolutely sure?")) {
        return;
      }
    }

    const userToDelete = users.find(u => u.id === id);
    if (!userToDelete) return;

    if (!window.confirm(`Are you sure you want to delete ${userToDelete.name} (${userToDelete.email})? This action cannot be undone.`)) return;

    try {
      setDeleting(id);
      await axios.delete(`${apiBase}/api/clients/${id}`, {
        withCredentials: true,
        timeout: 10000,
      });
      
      showInfo("User deleted successfully");
      
      // If user deleted themselves, they should be logged out
      if (id === currentUser?.id) {
        showInfo("Your account has been deleted. You will be logged out.");
        // Redirect to logout or home page
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        await fetchUsers();
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
      const errorMsg = err?.response?.data?.message || "Error deleting user. Please try again.";
      
      if (err.response?.status === 403 && 
          err.response?.data?.message?.includes('first admin')) {
        showError("Only the first admin can delete users");
        setIsFirstAdmin(false);
      } else {
        showError(errorMsg);
      }
    } finally {
      setDeleting(null);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isFirstAdmin) {
      showError("Only the first admin can reset passwords");
      return;
    }

    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      showError("Passwords don't match");
      return;
    }
    if (resetPasswordData.newPassword.length < 6) {
      showError("Password must be at least 6 characters long");
      return;
    }

    try {
      setSaving(true);
      await axios.post(
        `${apiBase}/api/users/${resetPasswordData.userId}/reset-password`,
        { newPassword: resetPasswordData.newPassword },
        { withCredentials: true, timeout: 10000 }
      );

      setResetPasswordModal(false);
      showInfo(`Password reset successfully for ${resetPasswordData.userName}`);
      
      // If resetting own password, show special message
      if (resetPasswordData.userId === currentUser?.id) {
        showInfo("Your password has been reset. You can now log in with the new password.");
      }
    } catch (err) {
      console.error("Failed to reset password:", err);
      const errorMsg = err?.response?.data?.message || "Error resetting password. Please try again.";
      
      if (err.response?.status === 403 && 
          err.response?.data?.message?.includes('first admin')) {
        showError("Only the first admin can reset passwords");
        setIsFirstAdmin(false);
      } else {
        showError(errorMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  // Generate a secure-ish temporary password, set it and show it once to admin
  const generateTempPassword = async (userId, userName) => {
    if (!isFirstAdmin) {
      showError("Only the first admin can reset passwords");
      return;
    }

    if (!window.confirm(`Generate a temporary password for ${userName}?`)) return;

    const temp = makeTempPassword(10);
    try {
      setSaving(true);
      await axios.post(
        `${apiBase}/api/users/${userId}/reset-password`,
        { newPassword: temp },
        { withCredentials: true, timeout: 10000 }
      );

      // Show it to admin — instruct to give securely to user
      alert(
        `🔐 TEMPORARY PASSWORD for ${userName}:\n\n` +
        `📋 ${temp}\n\n` +
        `⚠️  IMPORTANT:\n` +
        `• Share this password SECURELY with the user\n` +
        `• User should change it immediately after login\n` +
        `• This password will only be shown ONCE\n\n` +
        `Click OK to copy to clipboard`
      );
      
      // Copy to clipboard
      navigator.clipboard.writeText(temp).then(() => {
        console.log('Password copied to clipboard');
      }).catch(err => {
        console.log('Failed to copy to clipboard:', err);
      });
      
      showInfo(`Temporary password generated for ${userName}`);
    } catch (err) {
      console.error("Failed to generate temp password:", err);
      const errorMsg = err?.response?.data?.message ||
          "Failed to generate temporary password. Please try again.";
      
      if (err.response?.status === 403 && 
          err.response?.data?.message?.includes('first admin')) {
        showError("Only the first admin can reset passwords");
        setIsFirstAdmin(false);
      } else {
        showError(errorMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  function makeTempPassword(len = 10) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~";
    let out = "";
    for (let i = 0; i < len; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return out;
  }

  // CSV export
  const exportUsers = () => {
    if (!users || users.length === 0) {
      showError("No users to export");
      return;
    }

    try {
      const csvData = [
        ["Name", "Email", "Company", "Address", "Tel", "GPS", "Role", "Created At"],
        ...users.map((u) => [
          u.name || "",
          u.email || "",
          u.company || "",
          u.address || "",
          u.tel || "",
          u.gps || "",
          u.role || "",
          u.createdAtDisplay || u.createdAt || "",
        ]),
      ];

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `users-export-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showInfo("CSV exported successfully");
    } catch (err) {
      console.error("Export failed:", err);
      showError("Failed to export users");
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchUsers();
  };

  // Show first admin badge
  const FirstAdminBadge = () => (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'}`}>
      <ShieldCheckIcon className="w-3 h-3 mr-1" />
      First Admin
    </div>
  );

  // Admin badge (non-first admin)
  const AdminBadge = () => (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
      Admin
    </div>
  );

  return (
    <div
      className={`p-4 sm:p-6 max-w-4xl mx-auto min-h-screen ${
        isDarkMode ? "text-white bg-gray-900" : "text-gray-900 bg-gray-50"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center">
            <h1
              className={`text-xl sm:text-2xl font-semibold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              User Management
            </h1>
            {currentUser?.role === 'ADMIN' && isFirstAdmin && <FirstAdminBadge />}
            {currentUser?.role === 'ADMIN' && !isFirstAdmin && <AdminBadge />}
          </div>
          <p className={`mt-1 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            {isFirstAdmin 
              ? "First Admin: You can manage all users (including yourself)" 
              : currentUser?.role === 'ADMIN' 
                ? "Admin: View-only access (only First Admin can modify users)" 
                : "Client: User list view"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportUsers}
            disabled={users.length === 0}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white transition-colors duration-200"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          {isFirstAdmin && (
            <button
              onClick={openAddModal}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add User
            </button>
          )}
        </div>
      </div>

      {/* Info Message */}
      {info && (
        <div
          className={`mb-4 p-4 rounded-lg border ${
            isDarkMode ? "bg-green-900/20 border-green-700 text-green-200" : "bg-green-50 border-green-200 text-green-800"
          }`}
        >
          <div className="flex justify-between items-center">
            <span>{info}</span>
            <button
              onClick={() => setInfo(null)}
              className="ml-4 px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className={`mb-4 p-4 rounded-lg border ${
            isDarkMode ? "bg-red-900/20 border-red-700 text-red-200" : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <div className="flex gap-2">
              <button
                onClick={handleRetry}
                className="ml-4 px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => setError(null)}
                className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className={`mt-2 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Loading users...
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.length === 0 ? (
            <div className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {error ? "Failed to load users" : "No users found"}
            </div>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                className={`border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 ${
                  isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"
                } ${u.id === currentUser?.id ? "ring-2 ring-blue-500" : ""}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <h3 className={`text-lg font-medium truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {u.name} {u.id === currentUser?.id && "(You)"}
                      </h3>
                      {u.role === 'ADMIN' && u.id === currentUser?.id && isFirstAdmin && <FirstAdminBadge />}
                      {u.role === 'ADMIN' && u.id === currentUser?.id && !isFirstAdmin && <AdminBadge />}
                    </div>
                    <p className={`text-sm ${u.role === "ADMIN" ? "text-red-500" : "text-blue-600"}`}>
                      {u.role} {u.role === 'ADMIN' && u.id !== currentUser?.id && '(Cannot modify users)'}
                    </p>
                  </div>

                  <div className="flex space-x-2 ml-2">
                    {/* Generate temp password (First Admin only) */}
                    {isFirstAdmin && (
                      <button
                        onClick={() => generateTempPassword(u.id, u.name)}
                        disabled={saving}
                        title="Generate temporary password (First Admin only)"
                        className={`text-indigo-600 hover:text-indigo-800 p-1 disabled:opacity-50 ${isDarkMode ? "hover:text-indigo-300" : ""}`}
                      >
                        <KeyIcon className="w-4 h-4" />
                      </button>
                    )}

                    {/* Reset password (manual) - First Admin only */}
                    {isFirstAdmin && (
                      <button
                        onClick={() => openResetPasswordModal(u)}
                        disabled={saving}
                        title="Reset password (First Admin only)"
                        className={`text-green-600 hover:text-green-900 p-1 disabled:opacity-50 ${isDarkMode ? "hover:text-green-400" : ""}`}
                      >
                        <LockClosedIcon className="w-4 h-4" />
                      </button>
                    )}

                    {/* Edit - First Admin only */}
                    {isFirstAdmin && (
                      <button
                        onClick={() => openEditModal(u)}
                        disabled={saving}
                        title="Edit user (First Admin only)"
                        className={`text-yellow-600 hover:text-yellow-900 p-1 disabled:opacity-50 ${isDarkMode ? "hover:text-yellow-400" : ""}`}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete - First Admin only, with warning for self-deletion */}
                    {isFirstAdmin && (
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={deleting === u.id}
                        title={u.id === currentUser?.id ? "Delete your own account (Warning!)" : "Delete user"}
                        className={`${u.id === currentUser?.id ? 'text-red-700 hover:text-red-900' : 'text-red-600 hover:text-red-900'} p-1 disabled:opacity-50 ${isDarkMode ? "hover:text-red-400" : ""}`}
                      >
                        {deleting === u.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <TrashIcon className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    {/* Info icons for non-first-admin admins */}
                    {currentUser?.role === 'ADMIN' && !isFirstAdmin && u.id !== currentUser?.id && (
                      <div className="flex items-center space-x-1 text-gray-400" title="Only First Admin can modify users">
                        <ExclamationIcon className="w-4 h-4" />
                        <span className="text-xs">View Only</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <div className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      <strong>Email:</strong>{" "}
                      <a href={`mailto:${u.email}`} className="text-indigo-600 hover:underline break-all">
                        {u.email}
                      </a>
                    </div>
                    <div className={`mt-1 sm:mt-0 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      <strong>Company:</strong> {u.company}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <div className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      <strong>Tel:</strong>{" "}
                      <a href={`tel:${u.tel}`} className="text-indigo-600 hover:underline">
                        {u.tel}
                      </a>
                    </div>
                    <div className={`mt-1 sm:mt-0 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {/* FIXED: Use createdAtDisplay for display */}
                      <strong>Created:</strong> {u.createdAtDisplay || "-"}
                    </div>
                  </div>

                  <div className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    <strong>Address:</strong> {u.address}
                  </div>

                  {u.gps && u.gps !== "-" && (
                    <div className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      <strong>GPS:</strong>{" "}
                      <a href={`https://www.google.com/maps?q=${u.gps}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center">
                        <LocationMarkerIcon className="w-4 h-4 mr-1" />
                        {u.gps}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add/Edit Modal (First Admin only) */}
      {openModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className={`rounded-lg shadow-xl w-full max-w-lg mx-auto my-4 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <div>
                <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {modalData.id ? (modalData.id === currentUser?.id ? "Edit My Account" : "Edit User") : "Add User"}
                </h2>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"} mt-1`}>
                  First Admin Only • Password: minimum 6 characters
                </p>
              </div>
              <button onClick={() => setOpenModal(false)} disabled={saving} className={`text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 ${isDarkMode ? "hover:text-gray-300" : ""}`}>
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col max-h-[80vh]">
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                {[
                  { label: "Name *", name: "name", type: "text", required: true },
                  { label: "Email *", name: "email", type: "email", required: true },
                  { label: "Company", name: "company", type: "text" },
                  { label: "Address", name: "address", type: "text" },
                  { label: "Tel", name: "tel", type: "text" },
                  { label: "GPS Location", name: "gps", type: "text", placeholder: "lat,lng" },
                ].map((field) => (
                  <div key={field.name}>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      name={field.name}
                      value={modalData[field.name]}
                      onChange={handleChange}
                      required={field.required}
                      placeholder={field.placeholder}
                      disabled={saving}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                        isDarkMode ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-400" : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                ))}

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Role</label>
                  <select
                    name="role"
                    value={modalData.role}
                    onChange={handleChange}
                    disabled={saving}
                    className={`w-full border rounded-md px-3 py-2 disabled:opacity-50 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}>
                    <option value="CLIENT">Client</option>
                    <option value="ADMIN">Admin (cannot modify users)</option>
                  </select>
                  <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Only First Admin can manage users. Other admins have view-only access.
                  </p>
                </div>

                {!modalData.id && (
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Password * (min. 6 characters)
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={modalData.password}
                      onChange={handleChange}
                      required
                      disabled={saving}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-400" : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"}`}
                    />
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Password must be at least 6 characters long.
                    </p>
                  </div>
                )}

                {/* Optional: Password field for updating own account */}
                {modalData.id && modalData.id === currentUser?.id && (
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      New Password (optional)
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={modalData.password}
                      onChange={handleChange}
                      placeholder="Leave blank to keep current password"
                      disabled={saving}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-400" : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"}`}
                    />
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Leave blank to keep your current password
                    </p>
                  </div>
                )}
              </div>

              <div className={`flex justify-end space-x-3 p-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <button type="button" onClick={() => setOpenModal(false)} disabled={saving} className={`px-4 py-2 border rounded-md text-sm font-medium disabled:opacity-50 ${isDarkMode ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300"} transition-colors`}>
                  Cancel
                </button>

                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center">
                  {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
                  {modalData.id ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal (First Admin only) */}
      {resetPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className={`rounded-lg shadow-xl w-full max-w-md mx-auto my-4 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {resetPasswordData.userId === currentUser?.id ? "Reset My Password" : "Reset Password"}
              </h2>
              <button onClick={() => setResetPasswordModal(false)} disabled={saving} className={`text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 ${isDarkMode ? "hover:text-gray-300" : ""}`}>
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-4 space-y-4">
              <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {resetPasswordData.userId === currentUser?.id 
                    ? "Reset your own password:" 
                    : `Reset password for: `}
                  <strong>{resetPasswordData.userName}</strong>
                </p>
                <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>First Admin Only • Password: minimum 6 characters</p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>New Password *</label>
                <div className="relative">
                  <input
                    type={resetPasswordData.showPassword ? "text" : "password"}
                    value={resetPasswordData.newPassword}
                    onChange={(e) => setResetPasswordData({ ...resetPasswordData, newPassword: e.target.value })}
                    required
                    disabled={saving}
                    className={`w-full border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                      isDarkMode ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-400" : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setResetPasswordData({ ...resetPasswordData, showPassword: !resetPasswordData.showPassword })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {resetPasswordData.showPassword ? (
                      <LockOpenIcon className="w-4 h-4" />
                    ) : (
                      <LockClosedIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Password must be at least 6 characters long.</p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Confirm Password *</label>
                <input
                  type="password"
                  value={resetPasswordData.confirmPassword}
                  onChange={(e) => setResetPasswordData({ ...resetPasswordData, confirmPassword: e.target.value })}
                  required
                  disabled={saving}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-400" : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"}`}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setResetPasswordModal(false)} disabled={saving} className={`px-4 py-2 border rounded-md text-sm font-medium disabled:opacity-50 ${isDarkMode ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300"} transition-colors`}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center">
                  {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;