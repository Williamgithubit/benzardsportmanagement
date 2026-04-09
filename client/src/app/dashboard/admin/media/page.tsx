'use client';

import { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/services/firebase';
import { useRouter } from 'next/navigation';
import BSMMediaLibrary from '@/components/admin/BSMMediaLibrary';
import AdminDashboardShell from '@/components/dashboard/AdminDashboardShell';
import type { AdminTabId } from '@/components/dashboard/admin-navigation';

export default function AdminMediaPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  const handleTabChange = (tab: AdminTabId) => {
    router.push(tab === 'dashboard' ? '/dashboard/admin' : `/dashboard/admin#${tab}`);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#000054]"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AdminDashboardShell activeTab="media" onTabChange={handleTabChange}>
        <BSMMediaLibrary />
    </AdminDashboardShell>
  );
}
