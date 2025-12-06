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
} from "@heroicons/react/outline";
import Papa from "papaparse";
import socketService from "../../services/socket";

/**
 * ClientManagement
 * - cookie-based auth (no token in localStorage)
 * - admin can create/update/delete users
 * - admin can reset password or generate a temporary password (shown once)
 *
 * NOTE: We do NOT attempt to retrieve plaintext passwords from the DB (impossible / insecure).
 * Instead we provide a generate-temp-password action that resets password to a random one
 * and returns it to the admin so they can communicate it securely to the user.
 */
const ClientManagement = ({ isDarkMode }) => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

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
  });

  // Helper: base API (relative so Vite proxy or same origin works)
  const apiBase = "";

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`${apiBase}/api/clients`, {
        withCredentials: true,
        timeout: 10000,
      });

      const formatted = (res.data || []).map((u) => ({
        ...u,
        address: u.address || "-",
        tel: u.tel || "-",
        gps: u.gps || "-",
        createdAt:
          u.createdAt && !isNaN(new Date(u.createdAt))
            ? new Date(u.createdAt).toLocaleDateString()
            : u.createdAt || "-",
      }));

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

  // Optional: Ensure socket connection (if this screen uses real-time updates)
  useEffect(() => {
    let mounted = true;
    const initSocket = async () => {
      try {
        // Try to connect using cookie token if available server-side
        await socketService.connect().catch(() => null);
      } catch (err) {
        // not critical
        console.warn("Socket init error:", err?.message || err);
      }
    };
    if (mounted) initSocket();
    return () => {
      mounted = false;
    };
  }, []);

  const openAddModal = () => {
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
    setResetPasswordData({
      userId: user.id,
      userName: user.name,
      newPassword: "",
      confirmPassword: "",
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

    // basic validation
    if (!modalData.email || !modalData.name) {
      setError("Name and email are required");
      return;
    }

    // when creating a user, password required
    if (!modalData.id && (!modalData.password || modalData.password.length < 6)) {
      setError("Password is required and must be at least 6 characters");
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
          // role optional: only send if admin provided it
          ...(modalData.role ? { role: modalData.role } : {}),
          // password: only send if provided
          ...(modalData.password ? { password: modalData.password } : {}),
        };

        await axios.put(`${apiBase}/api/clients/${modalData.id}`, payload, {
          withCredentials: true,
          timeout: 10000,
        });
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
      }

      setOpenModal(false);
      await fetchUsers();
    } catch (err) {
      console.error("Failed to save user:", err);
      setError(
        err?.response?.data?.message || "Error saving user. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (id === currentUser?.id) {
      setError("You cannot delete your own account");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      setDeleting(id);
      await axios.delete(`${apiBase}/api/clients/${id}`, {
        withCredentials: true,
        timeout: 10000,
      });
      await fetchUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
      setError(
        err?.response?.data?.message || "Error deleting user. Please try again."
      );
    } finally {
      setDeleting(null);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (resetPasswordData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
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
      setError("Password reset successfully!");
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error("Failed to reset password:", err);
      setError(
        err?.response?.data?.message || "Error resetting password. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Generate a secure-ish temporary password, set it and show it once to admin
  const generateTempPassword = async (userId, userName) => {
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
        `Temporary password for ${userName}:\n\n${temp}\n\nShare it securely with the user. They should change it after login.`
      );
    } catch (err) {
      console.error("Failed to generate temp password:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to generate temporary password. Please try again."
      );
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
      setError("No users to export");
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
          u.createdAt || "",
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
    } catch (err) {
      console.error("Export failed:", err);
      setError("Failed to export users");
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchUsers();
  };

  return (
    <div
      className={`p-4 sm:p-6 max-w-4xl mx-auto min-h-screen ${
        isDarkMode ? "text-white bg-gray-900" : "text-gray-900 bg-gray-50"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1
            className={`text-xl sm:text-2xl font-semibold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            User Management
          </h1>
          <p className={`mt-1 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Manage all users (Admins & Clients)
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
          <button
            onClick={openAddModal}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className={`mb-4 p-4 rounded-lg border ${
            isDarkMode ? "bg-red-900/20 border-red-700 text-red-200" : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={handleRetry}
              className="ml-4 px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              Retry
            </button>
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
                    <h3 className={`text-lg font-medium truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {u.name} {u.id === currentUser?.id && "(You)"}
                    </h3>
                    <p className={`text-sm ${u.role === "ADMIN" ? "text-red-500" : "text-blue-600"}`}>{u.role}</p>
                  </div>

                  <div className="flex space-x-2 ml-2">
                    {/* Generate temp password */}
                    {currentUser?.role === "ADMIN" && (
                      <button
                        onClick={() => generateTempPassword(u.id, u.name)}
                        disabled={saving}
                        title="Generate temporary password"
                        className={`text-indigo-600 hover:text-indigo-800 p-1 disabled:opacity-50 ${isDarkMode ? "hover:text-indigo-300" : ""}`}
                      >
                        <KeyIcon className="w-4 h-4" />
                      </button>
                    )}

                    {/* Reset password (manual) */}
                    <button
                      onClick={() => openResetPasswordModal(u)}
                      disabled={saving}
                      title="Reset password (set manually)"
                      className={`text-green-600 hover:text-green-900 p-1 disabled:opacity-50 ${isDarkMode ? "hover:text-green-400" : ""}`}
                    >
                      <KeyIcon className="w-4 h-4" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEditModal(u)}
                      disabled={saving}
                      title="Edit"
                      className={`text-yellow-600 hover:text-yellow-900 p-1 disabled:opacity-50 ${isDarkMode ? "hover:text-yellow-400" : ""}`}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>

                    {/* Delete (not self) */}
                    {u.id !== currentUser?.id && currentUser?.role === "ADMIN" && (
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={deleting === u.id}
                        title="Delete"
                        className={`text-red-600 hover:text-red-900 p-1 disabled:opacity-50 ${isDarkMode ? "hover:text-red-400" : ""}`}
                      >
                        {deleting === u.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <TrashIcon className="w-4 h-4" />
                        )}
                      </button>
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
                      <strong>Created:</strong> {u.createdAt}
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

      {/* Add/Edit Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className={`rounded-lg shadow-xl w-full max-w-lg mx-auto my-4 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {modalData.id ? "Edit User" : "Add User"}
              </h2>
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
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                {!modalData.id && (
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={modalData.password}
                      onChange={handleChange}
                      required
                      disabled={saving}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-400" : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"}`}
                    />
                  </div>
                )}
              </div>

              <div className={`flex justify-end space-x-3 p-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <button type="button" onClick={() => setOpenModal(false)} disabled={saving} className={`px-4 py-2 border rounded-md text-sm font-medium disabled:opacity-50 ${isDarkMode ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300"} transition-colors`}>
                  Cancel
                </button>

                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center">
                  {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
                  {modalData.id ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className={`rounded-lg shadow-xl w-full max-w-md mx-auto my-4 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Reset Password</h2>
              <button onClick={() => setResetPasswordModal(false)} disabled={saving} className={`text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 ${isDarkMode ? "hover:text-gray-300" : ""}`}>
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-4 space-y-4">
              <div>
                <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Reset password for: <strong>{resetPasswordData.userName}</strong></p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>New Password *</label>
                <input
                  type="password"
                  value={resetPasswordData.newPassword}
                  onChange={(e) => setResetPasswordData({ ...resetPasswordData, newPassword: e.target.value })}
                  required
                  disabled={saving}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-400" : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"}`}
                />
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
