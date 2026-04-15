'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectAuthState } from '@/store/Auth/authSlice';
import type { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = 'admin',
  redirectTo = '/login',
}) => {
  const router = useRouter();
  const user = useSelector(selectCurrentUser);
  const authState = useSelector(selectAuthState);
  const isLoading = authState.loading;

  useEffect(() => {
    if (!isLoading && !user) {
      // User is not logged in, redirect to login
      router.push(redirectTo);
    } else if (!isLoading && user && user.role !== requiredRole) {
      // User is logged in but doesn't have the required role
      router.push('/unauthorized');
    }
  }, [user, isLoading, requiredRole, router, redirectTo]);

  // Show loading state while checking auth status
  if (isLoading || !user || (user.role !== requiredRole && !isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-[#000054] border-gray-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
