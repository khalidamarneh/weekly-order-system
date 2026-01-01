// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import AdminDashboard from "./pages/Admin";
import ClientDashboard from "./pages/Client";
import PublicLandingPage from "./components/PublicLandingPage";
import { useEffect } from "react";

// Simple hook that shows warning on EVERY back button click
// Replace the entire usePreventExit hook with this:
const usePreventExit = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const handleBeforeUnload = (event) => {
      // Only show warning when actually closing the window/tab
      event.preventDefault();
      event.returnValue = 'Are you sure you want to leave? Your changes may not be saved.';
      return event.returnValue;
    };

    const handleBackButton = (event) => {
      // Only prevent back navigation to login when user is authenticated
      if (window.location.pathname === '/login') {
        event.preventDefault();
        window.history.pushState(null, '', window.location.href);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handleBackButton);
    
    // Set initial state
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [user]);
};

const PrivateRoute = ({ children, adminOnly }) => {
  const { user, loading, isAdmin, isClient } = useAuth();
  

  // Use the exit prevention
  usePreventExit();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-indigo-300 rounded-full animate-spin border-t-transparent"></div>
          <span className="absolute inset-0 flex items-center justify-center text-indigo-600 font-semibold animate-pulse">
            ...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/client" replace />;
  }

  if (!adminOnly && !isClient && !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-white via-indigo-50 to-indigo-100">
          <Routes>
            {/* Public routes - accessible without authentication */}
            <Route path="/public" element={<PublicLandingPage />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected admin routes */}
            <Route
              path="/admin/*"
              element={
                <PrivateRoute adminOnly={true}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            
            {/* Protected client routes */}
            <Route
              path="/client/*"
              element={
                <PrivateRoute adminOnly={false}>
                  <ClientDashboard />
                </PrivateRoute>
              }
            />
            
            {/* Default redirect - show public site as default landing */}
            <Route path="/" element={<Navigate to="/public" replace />} />
            
            {/* Catch all - redirect to public site */}
            <Route path="*" element={<Navigate to="/public" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;