'use client';
import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../services/firebase';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const [user, loading, error] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult();
          setIsAdmin(!!idTokenResult.claims.admin);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setCheckingAdmin(false);
    };

    if (!loading) {
      checkAdminStatus();
    }
  }, [user, loading]);

  if (loading || checkingAdmin) {
    return (
      <Card className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#000054] mx-auto mb-4"></div>
        <p className="text-gray-600">Verifying permissions...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Authentication Error</h2>
        <p className="text-gray-600 mb-4">There was an error verifying your authentication.</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Card>
    );
  }

  if (!user) {
    return fallback || (
      <Card className="p-6 text-center">
        <h2 className="text-xl font-semibold text-[#000054] mb-4">Authentication Required</h2>
        <p className="text-gray-600 mb-4">You must be logged in to access this page.</p>
        <Button as="link" href="/login">
          Go to Login
        </Button>
      </Card>
    );
  }

  if (!isAdmin) {
    return fallback || (
      <Card className="p-6 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Access Denied</h2>
        <p className="text-gray-600 mb-4">
          You don&apos;t have administrator privileges to access this page.
        </p>
        <div className="space-x-4">
          <Button as="link" href="/dashboard" variant="outline">
            Go to Dashboard
          </Button>
          <Button onClick={() => auth.signOut()} variant="secondary">
            Sign Out
          </Button>
        </div>
      </Card>
    );
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
