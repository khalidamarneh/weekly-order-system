// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LockClosedIcon } from '@heroicons/react/solid';
import socketService from '../services/socket';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // ✅ ADDED: Clear any stale tokens on login page load
  useEffect(() => {
    const clearStaleTokens = async () => {
      try {
        // Clear frontend tokens
        localStorage.removeItem('socket_token');
        
        // Disconnect any existing socket connections
        socketService.disconnect();
        
        // Optional: Call backend logout to clear cookies
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        }).catch(() => {}); // Ignore errors
      } catch (error) {
        console.log('Token cleanup completed');
      }
    };

    clearStaleTokens();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(email, password);

      if (!userData) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      // Redirect based on role (userData is authoritative)
      switch (userData.role) {
        case 'ADMIN':
          navigate('/admin');
          break;
        case 'CLIENT':
          navigate('/client');
          break;
        case 'PUBLIC_USER':
          navigate('/public');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      console.error('Login attempt failed:', err);
      setError('Unexpected error during sign-in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-2xl font-bold">
              Weekly Order
            </div>
          </div>

          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Al-Waleed Inc
          </h2>

          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 
                           placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none 
                           focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 
                           placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none 
                           focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center p-2 rounded bg-red-100 border border-red-300">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent 
                         text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
                         disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center">
                  <LockClosedIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                  Sign in
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-500">
          <p>Hello:</p>
          <p>Please Sign In With Your Credentials Given For You</p>
        </div>
      </div>
    </div>
  );
};

export default Login;