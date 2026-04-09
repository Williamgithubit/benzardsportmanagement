'use client'
import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  fetchAdminAnalytics,
  RegionalData,
  LevelData,
  GrowthData,
  AnalyticsMetrics
} from '@/services/adminDataService';
import { Skeleton } from '@/components/ui/Skeleton';

const SportsAnalytics = () => {
  const [regionData, setRegionData] = useState<RegionalData[]>([]);
  const [levelData, setLevelData] = useState<LevelData[]>([]);
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }
        setError(null);
        const data = await fetchAdminAnalytics();
        setRegionData(data.regionalData);
        setLevelData(data.levelData);
        setGrowthData(data.growthData);
        setMetrics(data.metrics);
      } catch (err) {
        console.error('Error loading analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    void loadAnalytics();

    const intervalId = window.setInterval(() => {
      void loadAnalytics(false);
    }, 45000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2 rounded-xl border border-slate-100 bg-white p-6">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="mt-6 h-[280px] w-full rounded-2xl" />
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-6 h-[280px] w-full rounded-2xl" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-6">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="mt-6 h-[300px] w-full rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-100 bg-white p-5 text-center"
            >
              <Skeleton className="mx-auto h-10 w-20" />
              <Skeleton className="mx-auto mt-3 h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-200 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold text-navy mb-6">
        Sports Analytics Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Athlete Growth Chart */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-[380px]">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Athlete & Event Growth (6 Months)
            </h3>
            {growthData.length > 0 ? (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="athletes" 
                      stroke="#E32845" 
                      strokeWidth={3}
                      name="Athletes"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="events" 
                      stroke="#000054" 
                      strokeWidth={3}
                      name="Events"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex justify-center items-center h-[280px]">
                <p className="text-slate-500 text-sm">
                  No growth data available yet. Add athletes and events to see trends.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Level Distribution */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-[380px]">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Athletes by Level
            </h3>
            {levelData.some(d => d.value > 0) ? (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={levelData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {levelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex justify-center items-center h-[280px]">
                <p className="text-slate-500 text-sm">
                  No athlete level data available yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Regional Distribution */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-[400px]">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Athletes & Events by Region (Liberia)
            </h3>
            {regionData.length > 0 ? (
              <div className="h-[300px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="athletes" fill="#E32845" name="Athletes" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="events" fill="#000054" name="Events" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex justify-center items-center h-[300px]">
                <p className="text-slate-500 text-sm">
                  No regional data available yet. Add athletes and events with locations.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="md:col-span-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {metrics?.eventAttendanceRate || 0}%
              </div>
              <div className="text-sm text-slate-500 font-medium">
                Event Attendance Rate
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 text-center">
              <div className="text-3xl font-bold text-navy mb-1">
                {metrics?.athletesScouted || 0}%
              </div>
              <div className="text-sm text-slate-500 font-medium">
                Athletes Scouted
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 text-center">
              <div className="text-3xl font-bold text-green-500 mb-1">
                {metrics?.trainingCompletion || 0}%
              </div>
              <div className="text-sm text-slate-500 font-medium">
                Training Completion
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 text-center">
              <div className="text-3xl font-bold text-orange-500 mb-1">
                {metrics?.activePrograms || 0}
              </div>
              <div className="text-sm text-slate-500 font-medium">
                Active Programs
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SportsAnalytics;
