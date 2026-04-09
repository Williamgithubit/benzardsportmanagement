"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/store";
import { selectAuthState, initializeAuth } from "@/store/Auth/authSlice";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { user, isAuthenticated, loading } = useAppSelector(selectAuthState);
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && !loading && !user) {
      dispatch(initializeAuth());
    }
  }, [dispatch, isAuthenticated, loading, user]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const currentPath = window.location.pathname;
      router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (!loading && isAuthenticated && user && user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading) {
    return (
      <GuardStatusCard
        title="Checking authentication"
        description="We’re verifying your admin session before loading the dashboard."
      />
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <GuardStatusCard
        title="Redirecting to login"
        description="Please wait while we send you to the sign-in screen."
      />
    );
  }

  if (user.role !== "admin") {
    return (
      <GuardStatusCard
        title="Checking permissions"
        description="Your account is signed in, but we still need to confirm access to this area."
      />
    );
  }

  return <>{children}</>;
}

function GuardStatusCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel w-full max-w-md rounded-[32px] px-8 py-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[28px] bg-secondary text-white shadow-[0_24px_60px_-32px_rgba(0,0,84,0.75)]">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
        <h2 className="mt-6 text-xl font-semibold text-secondary">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
      </div>
    </div>
  );
}
