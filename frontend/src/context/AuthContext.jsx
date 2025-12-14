// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext, useRef } from "react";
import socketService from "../services/socket";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Prevent duplicate runs in StrictMode or immediately after login
  const hasRestoredRef = useRef(false);
  const loginJustHappened = useRef(false);

  // Small helper to wait for cookie to be set by browser (tiny delay)
  const waitForCookie = (ms = 60) => new Promise((resolve) => setTimeout(resolve, ms));

  // ------------------------------
  // SECURE SOCKET TOKEN MANAGEMENT
  // ------------------------------
  
  // ✅ SECURE: Extract socket token from cookies and store in localStorage
  const extractAndStoreSocketToken = () => {
    if (typeof window === 'undefined') return null;
    
    try {
      const cookies = document.cookie.split(';');
      const socketTokenCookie = cookies.find(cookie =>
        cookie.trim().startsWith('socket_token=')
      );

      if (socketTokenCookie) {
        const token = socketTokenCookie.split('=')[1];
        if (token) {
          // ✅ Store in localStorage for secure socket connections
          socketService.storeSocketToken(token);
          return token;
        }
      }
    } catch (error) {
      console.warn('Failed to extract socket token:', error);
    }

    return null;
  };

  // ✅ SECURE: Clear all auth tokens on logout
  const clearAllAuthTokens = () => {
    if (typeof window !== 'undefined') {
      // Clear localStorage tokens
      localStorage.removeItem('socket_token');
      // Cookies are cleared by backend logout endpoint
    }
  };

  // ------------------------------
  // CHECK AUTH ON INITIAL LOAD (FIXED VERSION)
  // ------------------------------
  const checkAuth = async () => {
    // If we just logged in, skip one check (avoids race)
    if (loginJustHappened.current) {
      loginJustHappened.current = false;
      return;
    }
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    try {
      setLoading(true);

      const res = await fetch("/api/auth/user", {
        method: "GET",
        credentials: "include",
      });

      // ✅ FIXED: Handle 401 silently - it means user is not authenticated
      if (res.status === 401) {
        console.log('🔄 User not authenticated (expected 401)');
        setUser(null);
        // Don't clear tokens on 401 - it's a normal state
        return;
      }

      // Handle other non-OK responses
      if (!res.ok) {
        console.warn('Auth check failed with status:', res.status);
        setUser(null);
        clearAllAuthTokens();
        return;
      }

      const currentUser = await res.json().catch(() => null);
      if (!currentUser) {
        setUser(null);
        clearAllAuthTokens();
        return;
      }

      setUser(currentUser);

      // ✅ SECURE: Extract and store socket token before connecting
      extractAndStoreSocketToken();

      // Connect socket only when we have a user
      await socketService.connect();
      await socketService.waitForConnection();

      switch (currentUser.role) {
        case "CLIENT":
          await socketService.joinClientRoom(currentUser.id);
          break;
        case "ADMIN":
          await socketService.joinAdminRoom();
          break;
        case "PUBLIC_USER":
          await socketService.joinPublicRoom(currentUser.id);
          break;
        default:
          break;
      }
    } catch (err) {
      // Network errors, etc.
      console.log('🔌 Network error during auth check (normal):', err?.message || err);
      setUser(null);
      // Don't clear tokens on network errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      if (!isMounted) return;
      await checkAuth();
    };
    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // ------------------------------
  // LOGIN (SECURE VERSION)
  // ------------------------------
  /**
   * Returns authenticated user object on success, or null on failure.
   * Uses the login endpoint's JSON response (backend already returns user info),
   * and sets the HttpOnly cookie on the response. We set user immediately
   * from the login response to avoid races with cookie storage timing.
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      loginJustHappened.current = true;

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // must include cookie handling
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        // try to get backend message (friendly)
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Login failed");
      }

      // Backend returns user info in login response (id,email,name,role)
      const loginBody = await res.json().catch(() => null);
      if (!loginBody) {
        // As a fallback, wait briefly for cookie and attempt to fetch /api/auth/user
        await waitForCookie(120);
        const userRes = await fetch("/api/auth/user", { credentials: "include" });
        if (!userRes.ok) throw new Error("Failed to load user data after login");
        const fallbackUser = await userRes.json();
        if (!fallbackUser) throw new Error("Failed to load user data after login");
        
        setUser(fallbackUser);
        
        // ✅ SECURE: Extract and store socket token
        extractAndStoreSocketToken();
        
        // socket connect
        await socketService.connect();
        await socketService.waitForConnection();
        
        switch (fallbackUser.role) {
          case "CLIENT":
            await socketService.joinClientRoom(fallbackUser.id);
            break;
          case "ADMIN":
            await socketService.joinAdminRoom();
            break;
          case "PUBLIC_USER":
            await socketService.joinPublicRoom(fallbackUser.id);
            break;
          default:
            break;
        }
        return fallbackUser;
      }

      // **Primary path**: use login response directly
      setUser(loginBody);

      // ✅ SECURE: Extract and store socket token from cookies
      // Wait a bit for cookies to be set by browser
      await waitForCookie(50);
      extractAndStoreSocketToken();

      // connect sockets
      await socketService.connect();
      await socketService.waitForConnection();

      switch (loginBody.role) {
        case "CLIENT":
          await socketService.joinClientRoom(loginBody.id);
          break;
        case "ADMIN":
          await socketService.joinAdminRoom();
          break;
        case "PUBLIC_USER":
          await socketService.joinPublicRoom(loginBody.id);
          break;
        default:
          break;
      }

      return loginBody;
    } catch (error) {
      console.error("Login error:", error);
      // ✅ CLEAR: Clear tokens on login failure
      clearAllAuthTokens();
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------
  // PUBLIC LOGIN/REGISTER
  // ------------------------------
  
  // ✅ ADDED: Secure public authentication methods
  const publicLogin = async (email, password) => {
    try {
      setLoading(true);
      loginJustHappened.current = true;

      const res = await fetch("/api/public/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Public login failed");
      }

      const userData = await res.json();
      setUser(userData);

      // ✅ SECURE: Extract and store socket token
      await waitForCookie(50);
      extractAndStoreSocketToken();

      // Public users typically don't need socket rooms, but connect anyway
      await socketService.connect();
      
      return userData;
    } catch (error) {
      console.error("Public login error:", error);
      clearAllAuthTokens();
      return null;
    } finally {
      setLoading(false);
    }
  };

  const publicRegister = async (email, password, name) => {
    try {
      setLoading(true);

      const res = await fetch("/api/public/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, name }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Public registration failed");
      }

      const userData = await res.json();
      setUser(userData);

      // ✅ SECURE: Extract and store socket token
      await waitForCookie(50);
      extractAndStoreSocketToken();

      await socketService.connect();
      
      return userData;
    } catch (error) {
      console.error("Public register error:", error);
      clearAllAuthTokens();
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------
  // LOGOUT (SECURE VERSION)
  // ------------------------------
  const logout = async () => {
    try {
      // ✅ SECURE: Clear all tokens first
      clearAllAuthTokens();
      
      // Disconnect socket
      socketService.disconnect();
      
      // Clear user state
      setUser(null);
      
      // Call backend logout to clear cookies
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
    } catch (err) {
      // ignore errors but ensure tokens are cleared
      clearAllAuthTokens();
    }
  };

  // ------------------------------
  // TOKEN REFRESH
  // ------------------------------
  
  // ✅ ADDED: Secure token refresh method
  const refreshTokens = async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        // ✅ SECURE: Extract new socket token after refresh
        await waitForCookie(50);
        extractAndStoreSocketToken();
        
        // Reconnect socket with new token if needed
        if (socketService.isConnected()) {
          await socketService.secureReconnect();
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        publicLogin,
        publicRegister,
        refreshTokens,
        isAdmin: user?.role === "ADMIN",
        isClient: user?.role === "CLIENT",
        isPublicUser: user?.role === "PUBLIC_USER",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);