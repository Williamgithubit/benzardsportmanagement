import React, { useState, useEffect } from "react";
import {
  MdRefresh,
  MdPeople,
  MdSportsMartialArts,
  MdEvent,
  MdAssignment,
} from "react-icons/md";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getAnalyticsData,
  getUserEngagementMetrics,
  getProgramPerformanceMetrics,
  AnalyticsData,
  ProgramPerformance,
  UserEngagementMetrics,
} from "@/services/reportsService";
import { Skeleton } from "@/components/ui/Skeleton";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

const formatDate = (date: Date | string | undefined): string => {
  if (!date) return "N/A";
  const d = new Date(date);
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD format
};

const Reports: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [engagementMetrics, setEngagementMetrics] =
    useState<UserEngagementMetrics | null>(null);
  const [programPerformance, setProgramPerformance] = useState<
    Array<{
      name: string;
      status: string;
      startDate: string;
      endDate: string;
      enrollments: number;
      completions: number;
      completionRate: number;
      rating: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [analytics, engagement, performance] = await Promise.all([
        getAnalyticsData() as Promise<AnalyticsData>,
        getUserEngagementMetrics() as Promise<UserEngagementMetrics>,
        getProgramPerformanceMetrics() as Promise<ProgramPerformance[]>,
      ]);

      // Transform performance data to match state type
      const transformedPerformance = performance.map(
        (program: ProgramPerformance) => ({
          name: program.name,
          status: program.status,
          startDate: formatDate(program.startDate),
          endDate: formatDate(program.endDate),
          enrollments: program.enrollments,
          completions: program.completions,
          completionRate: program.completionRate,
          rating: parseFloat(program.rating.toString()),
        }),
      );

      setAnalyticsData(analytics);
      setEngagementMetrics(engagement);
      setProgramPerformance(transformedPerformance);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load reports data",
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
        return "bg-red-100 text-red-800 border-red-200";
      case "draft":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "upcoming":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats Grid Loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
            >
              <Skeleton className="h-6 w-20 mb-4" />
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>

        {/* Charts Loading */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
            >
              <Skeleton className="h-6 w-40 mb-4" />
              <Skeleton className="h-64 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#000054]">
          Reports & Analytics
        </h2>
        <button
          onClick={loadReportsData}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border-2 border-[#000054] text-[#000054] hover:bg-[#000054] hover:text-white transition-colors font-bold w-full sm:w-auto disabled:opacity-50"
        >
          <MdRefresh size={20} className={loading ? "animate-spin" : ""} />
          <span>{window.innerWidth < 640 ? "Refresh" : "Refresh Data"}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded flex justify-between items-center group">
          <div className="flex items-center">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 opacity-50 group-hover:opacity-100 transition-opacity"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
      )}

      {analyticsData && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-[#ADF802] transition-colors relative overflow-hidden group">
              <div className="flex justify-between items-start z-10 relative">
                <div>
                  <p className="text-sm font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    Total Users
                  </p>
                  <h3 className="text-3xl font-extrabold text-[#000054] mb-1">
                    {analyticsData.totalUsers}
                  </h3>
                  <p className="text-sm font-medium text-green-600 bg-green-50 inline-block px-2 py-0.5 rounded-md border border-green-100">
                    {analyticsData.activeUsers} active
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 transition-transform group-hover:scale-110">
                  <MdPeople size={28} />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-50/50 rounded-full blur-2xl z-0 pointer-events-none"></div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-[#ADF802] transition-colors relative overflow-hidden group">
              <div className="flex justify-between items-start z-10 relative">
                <div>
                  <p className="text-sm font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    Programs
                  </p>
                  <h3 className="text-3xl font-extrabold text-[#000054] mb-1">
                    {analyticsData.totalPrograms}
                  </h3>
                  <p className="text-sm font-medium text-green-600 bg-green-50 inline-block px-2 py-0.5 rounded-md border border-green-100">
                    {analyticsData.activePrograms} active
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 transition-transform group-hover:scale-110">
                  <MdSportsMartialArts size={28} />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-purple-50/50 rounded-full blur-2xl z-0 pointer-events-none"></div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-[#ADF802] transition-colors relative overflow-hidden group">
              <div className="flex justify-between items-start z-10 relative">
                <div>
                  <p className="text-sm font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    Events
                  </p>
                  <h3 className="text-3xl font-extrabold text-[#000054] mb-1">
                    {analyticsData.totalEvents}
                  </h3>
                  <p className="text-sm font-medium text-amber-600 bg-amber-50 inline-block px-2 py-0.5 rounded-md border border-amber-100">
                    {analyticsData.upcomingEvents} upcoming
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 transition-transform group-hover:scale-110">
                  <MdEvent size={28} />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-amber-50/50 rounded-full blur-2xl z-0 pointer-events-none"></div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-[#ADF802] transition-colors relative overflow-hidden group">
              <div className="flex justify-between items-start z-10 relative">
                <div>
                  <p className="text-sm font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    Completion
                  </p>
                  <h3 className="text-3xl font-extrabold text-[#000054] mb-1">
                    {analyticsData.completionRate}%
                  </h3>
                  <p className="text-sm font-medium text-slate-600">
                    {analyticsData.completedTasks}/{analyticsData.totalTasks}{" "}
                    sessions
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
                  <MdAssignment size={28} />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-50/50 rounded-full blur-2xl z-0 pointer-events-none"></div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* User Growth Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="text-lg font-bold text-[#000054] mb-4">
                Athlete & Staff Growth (Last 30 Days)
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={analyticsData.userGrowth}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E2E8F0"
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })
                      }
                      tick={{ fill: "#64748B", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis
                      tick={{ fill: "#64748B", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString()
                      }
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow:
                          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ paddingTop: "20px" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="totalUsers"
                      stackId="1"
                      stroke="#000054"
                      fill="url(#colorTotal)"
                      name="Total Users"
                      strokeWidth={3}
                    />
                    <Area
                      type="monotone"
                      dataKey="newUsers"
                      stackId="2"
                      stroke="#ADF802"
                      fill="url(#colorNew)"
                      name="New Users"
                      strokeWidth={3}
                    />
                    <defs>
                      <linearGradient
                        id="colorTotal"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#000054"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#000054"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#ADF802"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#ADF802"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* User Engagement */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="text-lg font-bold text-[#000054] mb-6">
                User Engagement
              </h3>

              {engagementMetrics && (
                <div className="space-y-8 mt-4">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-sm font-bold text-slate-600">
                        Weekly Engagement
                      </p>
                      <span className="text-lg font-extrabold text-[#000054]">
                        {engagementMetrics.weeklyEngagement}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
                      <div
                        className="bg-blue-500 h-3 rounded-full"
                        style={{
                          width: `${engagementMetrics.weeklyEngagement}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 text-right">
                      <span className="text-blue-600">
                        {engagementMetrics.activeLastWeek}
                      </span>{" "}
                      active users
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-sm font-bold text-slate-600">
                        Monthly Engagement
                      </p>
                      <span className="text-lg font-extrabold text-[#000054]">
                        {engagementMetrics.monthlyEngagement}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
                      <div
                        className="bg-emerald-500 h-3 rounded-full"
                        style={{
                          width: `${engagementMetrics.monthlyEngagement}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 text-right">
                      <span className="text-emerald-600">
                        {engagementMetrics.activeLastMonth}
                      </span>{" "}
                      active users
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Training Session Trends & Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="text-lg font-bold text-[#000054] mb-4">
                Training Session Trends (Last 30 Days)
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={analyticsData.taskCompletion}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E2E8F0"
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })
                      }
                      tick={{ fill: "#64748B", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis
                      tick={{ fill: "#64748B", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString()
                      }
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow:
                          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ paddingTop: "20px" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="#10B981"
                      strokeWidth={3}
                      name="Completed"
                      dot={{ r: 4, strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pending"
                      stroke="#F59E0B"
                      strokeWidth={3}
                      name="Pending"
                      dot={{ r: 4, strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="overdue"
                      stroke="#EF4444"
                      strokeWidth={3}
                      name="Overdue"
                      dot={{ r: 4, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Training Program Status */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="text-lg font-bold text-[#000054] mb-4">
                Program Status
              </h3>
              <div className="h-[300px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Active", value: analyticsData.activePrograms },
                        {
                          name: "Inactive",
                          value:
                            analyticsData.totalPrograms -
                            analyticsData.activePrograms,
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell key="cell-active" fill="#ADF802" />
                      <Cell key="cell-inactive" fill="#000054" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow:
                          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                      }}
                      itemStyle={{ fontWeight: "bold" }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Training Program Performance Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-[#000054]">
                Training Program Performance
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-200 text-sm font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Program Name</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 hidden md:table-cell">Duration</th>
                    <th className="p-4 text-right hidden sm:table-cell">
                      Athletes
                    </th>
                    <th className="p-4 text-center">Progress</th>
                    <th className="p-4 text-right">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {programPerformance.map((program, index) => (
                    <tr
                      key={index}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4">
                        <p className="font-bold text-slate-800 text-sm">
                          {program.name}
                        </p>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-bold border ${getStatusColor(program.status)}`}
                        >
                          {program.status.charAt(0).toUpperCase() +
                            program.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <div className="text-xs text-slate-600 font-medium">
                          <span className="block">{program.startDate} to</span>
                          <span className="block">{program.endDate}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right hidden sm:table-cell font-bold text-slate-700">
                        {program.enrollments}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3 justify-center sm:justify-start">
                          <div className="w-16 sm:w-24 bg-slate-100 rounded-full h-2 hidden sm:block">
                            <div
                              className="bg-[#ADF802] h-2 rounded-full"
                              style={{
                                width: `${program.completionRate || 0}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-slate-700 w-12 text-right">
                            {program.completionRate || 0}%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium text-center sm:text-left mt-1 block sm:hidden">
                          {program.completions} / {program.enrollments} done
                        </p>
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-md border border-amber-100 font-bold text-xs">
                          ⭐ {program.rating || 0}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {programPerformance.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-slate-500"
                      >
                        No program performance data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
