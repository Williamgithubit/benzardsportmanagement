import React, { useState, useEffect } from 'react';
import {
  MdSportsSoccer,
  MdEvent,
  MdCheckCircle,
  MdPersonAdd,
  MdAdd,
  MdSchedule,
  MdRefresh,
  MdStorage,
  MdOutlineFitnessCenter,
  MdEmojiEvents,
  MdCreate,
  MdContactMail,
  MdArrowOutward,
  MdTrendingUp,
  MdWorkspacePremium,
  MdFlashOn,
} from 'react-icons/md';
import {
  fetchAdminDashboardData,
  getTimeAgo,
  DashboardStats,
  RecentActivity 
} from '@/services/adminDataService';
import { seedSampleData } from '@/utils/seedDashboardData';
import QuickActions from './QuickActions';
import SportsAnalytics from './SportsAnalytics';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAppSelector } from '@/store/store';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const currentUser = useAppSelector((state) => state.auth.user);

  const loadDashboardData = async (
    showLoader = true,
    showRefreshing = !showLoader
  ) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else if (showRefreshing) {
        setRefreshing(true);
      }
      setError(null);
      
      const dashboardData = await fetchAdminDashboardData(10);

      setStats(dashboardData.stats);
      setRecentActivity(dashboardData.recentActivity);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await loadDashboardData(false, true);
  };

  const handleSeedData = async () => {
    try {
      setSeeding(true);
      await seedSampleData();
      // Refresh data after seeding
      await loadDashboardData(false, true);
    } catch (err) {
      console.error('Error seeding data:', err);
      setError('Failed to seed sample data');
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    void loadDashboardData();

    const intervalId = window.setInterval(() => {
      void loadDashboardData(false, false);
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const formatCount = (value?: number) =>
    new Intl.NumberFormat("en-US").format(value ?? 0);

  // Activity icons
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return <MdPersonAdd className="text-primary" size={24} />;
      case 'athlete_added':
        return <MdOutlineFitnessCenter className="text-purple-600" size={24} />;
      case 'event_created':
        return <MdSchedule className="text-green-500" size={24} />;
      case 'training_completed':
        return <MdCheckCircle className="text-slate-500" size={24} />;
      case 'contact_received':
        return <MdContactMail className="text-blue-500" size={24} />;
      default:
        return <MdAdd className="text-slate-500" size={24} />;
    }
  };
  
  // Activity colors
  const getActivityClasses = (type: string) => {
    switch (type) {
      case 'user_registered':
        return 'text-primary border-primary bg-primary/5';
      case 'athlete_added':
        return 'text-purple-600 border-purple-600 bg-purple-50';
      case 'event_created':
        return 'text-green-600 border-green-600 bg-green-50';
      case 'training_completed':
        return 'text-slate-600 border-slate-600 bg-slate-50';
      case 'contact_received':
        return 'text-blue-600 border-blue-600 bg-blue-50';
      default:
        return 'text-slate-600 border-slate-600 bg-slate-50';
    }
  };

  const dashboardStatsCards = [
    { 
      title: 'Total Athletes', 
      value: formatCount(stats?.totalAthletes), 
      icon: MdOutlineFitnessCenter,
      trend: '+12%',
      trendUp: true,
      accent: 'from-primary/20 via-primary/8 to-transparent',
      iconColor: 'text-primary',
    },
    { 
      title: 'Scouted Athletes', 
      value: formatCount(stats?.scoutedAthletes), 
      icon: MdEmojiEvents,
      trend: stats && stats.scoutedAthletes > 0 ? `+${Math.min(15, Math.floor(stats.scoutedAthletes * 0.1))}%` : '0%',
      trendUp: true,
      accent: 'from-amber-400/20 via-amber-200/10 to-transparent',
      iconColor: 'text-amber-500',
    },
    { 
      title: 'Upcoming Events', 
      value: formatCount(stats?.upcomingEvents), 
      icon: MdEvent,
      trend: stats && stats.upcomingEvents > 0 ? `+${Math.min(5, stats.upcomingEvents)}` : '0',
      trendUp: true,
      accent: 'from-sky-500/20 via-sky-200/10 to-transparent',
      iconColor: 'text-sky-500',
    },
    { 
      title: 'Training Programs', 
      value: formatCount(stats?.activeTrainingPrograms), 
      icon: MdSportsSoccer,
      trend: stats && stats.activeTrainingPrograms > 0 ? `+${Math.min(3, stats.activeTrainingPrograms)}` : '0',
      trendUp: true,
      accent: 'from-emerald-500/20 via-emerald-200/10 to-transparent',
      iconColor: 'text-emerald-500',
    },
    { 
      title: 'Recent Registrations', 
      value: formatCount(stats?.recentRegistrations), 
      icon: MdPersonAdd,
      trend: stats && stats.recentRegistrations > 0 ? `+${Math.min(15, Math.floor(stats.recentRegistrations * 0.1))}%` : '0%',
      trendUp: true,
      accent: 'from-violet-500/20 via-violet-200/10 to-transparent',
      iconColor: 'text-violet-500',
    },
    { 
      title: 'Blog Posts', 
      value: formatCount(stats?.totalBlogPosts), 
      icon: MdCreate,
      trend: stats && stats.totalBlogPosts > 0 ? `+${Math.min(5, Math.floor(stats.totalBlogPosts * 0.1))}` : '0',
      trendUp: true,
      accent: 'from-secondary/20 via-secondary/8 to-transparent',
      iconColor: 'text-secondary',
    },
    { 
      title: 'Contact Submissions', 
      value: formatCount(stats?.contactSubmissions), 
      icon: MdContactMail,
      trend: stats && stats.contactSubmissions > 0 ? `+${Math.min(3, Math.floor(stats.contactSubmissions * 0.1))}` : '0',
      trendUp: true,
      accent: 'from-rose-500/20 via-rose-200/10 to-transparent',
      iconColor: 'text-rose-500',
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-panel rounded-[32px] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <Skeleton className="h-4 w-32 rounded-full" />
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-5 w-full max-w-xl" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-12 w-full rounded-2xl sm:w-40" />
              <Skeleton className="h-12 w-full rounded-2xl sm:w-40" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="glass-panel rounded-[28px] p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-3 w-24 rounded-full" />
                  <Skeleton className="h-9 w-28" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <Skeleton variant="circular" className="h-14 w-14" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
          <div className="glass-panel rounded-[32px] p-6">
            <div className="mb-6 flex items-center justify-between">
              <Skeleton className="h-7 w-52" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex gap-4">
                  <Skeleton variant="circular" className="h-12 w-12" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3 w-2/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[32px] p-6">
            <div className="mb-6 flex items-center justify-between">
              <Skeleton className="h-7 w-40" />
              <Skeleton variant="circular" className="h-9 w-9" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-14 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-200 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <section className="glass-panel relative overflow-hidden rounded-[32px] px-6 py-7 sm:px-8">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(227,40,69,0.16),transparent_55%)]" />
        <div className="pointer-events-none absolute -left-10 top-0 h-48 w-48 rounded-full bg-secondary/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <MdWorkspacePremium size={16} />
              Performance Snapshot
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-secondary sm:text-4xl">
              Welcome back{currentUser?.displayName ? `, ${currentUser.displayName}` : ""}.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Keep your scouting pipeline, event calendar, and communication flow moving from one place. Today’s dashboard highlights the live state of your athletes, content, and registrations.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                <MdFlashOn size={16} />
                Real-time Firestore insights
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600">
                <MdArrowOutward size={16} />
                Tailwind dashboard shell active
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-auto">
            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-secondary/20 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MdRefresh
                size={18}
                className={loading || refreshing ? "animate-spin" : ""}
              />
              <span>Refresh Data</span>
            </button>

          <button
            onClick={handleSeedData}
            disabled={loading || refreshing || seeding}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-secondary px-4 text-sm font-semibold text-white shadow-[0_24px_48px_-28px_rgba(0,0,84,0.75)] transition hover:bg-secondary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <MdStorage size={18} />
            <span>{seeding ? 'Seeding...' : 'Seed Sample Data'}</span>
          </button>
        </div>
      </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStatsCards.map((stat) => (
          <div key={stat.title} className="glass-panel group relative overflow-hidden rounded-[28px] p-5">
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-br ${stat.accent}`} />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-secondary">
                  {stat.value}
                </p>
                {stat.trend ? (
                  <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <MdTrendingUp
                      className={!stat.trendUp ? "rotate-180" : ""}
                      size={16}
                    />
                    {stat.trend}
                  </div>
                ) : null}
              </div>

              <div className={`rounded-2xl border border-white/70 bg-white p-3 shadow-sm transition group-hover:-translate-y-0.5 ${stat.iconColor}`}>
                <stat.icon size={28} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <div className="glass-panel rounded-[32px] p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-secondary">
                Recent Sports Activity
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                The latest registrations, updates, and contact activity across the platform.
              </p>
            </div>
            <div className="hidden rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:block">
              Live Feed
            </div>
          </div>

          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="group rounded-[26px] border border-white/70 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/15"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100">
                      {getActivityIcon(activity.type)}
                    </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <p className="pr-4 text-sm leading-6 text-slate-800 sm:text-base">
                        {activity.description}
                      </p>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-slate-500">
                              {getTimeAgo(activity.timestamp)}
                            </span>
                            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${getActivityClasses(activity.type)}`}>
                              {activity.type.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[26px] border border-dashed border-slate-200 bg-white/70 p-8 text-center text-slate-500">
                No recent activity found.
              </div>
            )}
          </div>
        </div>

        <div>
          <QuickActions />
        </div>
      </section>
      
      {/* Sports Analytics Section */}
      <section className="glass-panel rounded-[32px] p-5 sm:p-6">
        <SportsAnalytics />
      </section>
    </div>
  );
};

export default Dashboard;
