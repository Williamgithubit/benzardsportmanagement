'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import type { UserRole } from '@/types/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/dashboard/admin');
  const isStatisticianRoute = pathname.startsWith('/dashboard/statistician');
  const isTeacherRoute = pathname.startsWith('/dashboard/teacher');
  const isParentRoute = pathname.startsWith('/dashboard/parent');
  const isStudentRoute = pathname.startsWith('/dashboard/student');

  // Determine the required role based on the route
  let requiredRole: UserRole = 'admin';
  if (isStatisticianRoute) requiredRole = 'statistician';
  if (isTeacherRoute) requiredRole = 'teacher';
  if (isParentRoute) requiredRole = 'parent';
  if (isStudentRoute) requiredRole = 'student';

  if (isAdminRoute || isStatisticianRoute) {
    return (
      <ProtectedRoute requiredRole={requiredRole}>
        {children}
        <Toaster position="top-right" />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar  */}
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navigation */}
          <header className="bg-white shadow-sm z-10">
            <div className="flex items-center justify-between p-4">
              <h1 className="text-xl font-semibold text-gray-800">
                {isAdminRoute && 'Admin Dashboard'}
                {isTeacherRoute && 'Teacher Dashboard'}
                {isParentRoute && 'Parent Dashboard'}
                {isStudentRoute && 'Student Dashboard'}
              </h1>
              <div className="flex items-center space-x-4">
                {/* Add user profile dropdown or other header elements */}
              </div>
            </div>
          </header>
          
          {/* Page Content */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4">
            {children}
          </main>
        </div>
      </div>
      <Toaster position="top-right" />
    </ProtectedRoute>
  );
}
