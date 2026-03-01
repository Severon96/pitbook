'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [setupComplete, setSetupComplete] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const { setupComplete } = await authApi.getSetupStatus();
        setSetupComplete(setupComplete);
      } catch (error) {
        console.error('Error checking setup status:', error);
        setSetupComplete(true);
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

  useEffect(() => {
    if (!isLoading && !checkingSetup && !isAuthenticated) {
      if (!setupComplete) {
        router.replace('/setup');
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, checkingSetup, isAuthenticated, setupComplete, router]);

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
    return null;
  }

  return <>{children}</>;
};
