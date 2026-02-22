import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [setupComplete, setSetupComplete] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const { setupComplete } = await authApi.getSetupStatus();
        setSetupComplete(setupComplete);
      } catch (error) {
        console.error('Error checking setup status:', error);
        setSetupComplete(true); // Assume setup is complete on error
      } finally {
        setCheckingSetup(false);
      }
    };

    if (!isAuthenticated) {
      checkSetup();
    } else {
      setCheckingSetup(false);
    }
  }, [isAuthenticated]);

  if (isLoading || checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // If setup is not complete, redirect to setup page
    if (!setupComplete) {
      return <Navigate to="/setup" replace />;
    }
    // Otherwise, redirect to login
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
