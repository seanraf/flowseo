
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Success from "./pages/Success";
import Cancel from "./pages/Cancel";
import NotFound from "./pages/NotFound";
import LoadingScreen from "./components/LoadingScreen";

const AppRoutes = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Add a short delay to ensure proper initialization
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 1000);

    // Check for any Stripe redirect artifacts and clean them up
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('checkout') || urlParams.has('session_id')) {
      // This is likely a redirect from Stripe, let's make sure we don't lose our checkout state
      if (window.location.pathname !== '/success' && window.location.pathname !== '/cancel') {
        localStorage.setItem('checkoutInProgress', 'true');
        localStorage.setItem('subscriptionActivated', 'true');
      }
    }

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <AuthProvider>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/success" element={<Success />} />
        <Route path="/cancel" element={<Cancel />} />
        <Route path="/" element={<Index />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
};

export default AppRoutes;
