import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  People as PeopleIcon,
  Sports as SportsIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
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
} from 'recharts';
import {
  getAnalyticsData,
  getUserEngagementMetrics,
  getProgramPerformanceMetrics,
  AnalyticsData,
  ProgramPerformance,
  UserEngagementMetrics,
} from '@/services/reportsService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const formatDate = (date: Date | string | undefined): string => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-CA'); // YYYY-MM-DD format
};

const Reports: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [engagementMetrics, setEngagementMetrics] = useState<UserEngagementMetrics | null>(null);
  const [programPerformance, setProgramPerformance] = useState<Array<{
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    enrollments: number;
    completions: number;
    completionRate: number;
    rating: number;
  }>>([]);
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
      const transformedPerformance = performance.map((program: ProgramPerformance) => ({
        name: program.name,
        status: program.status,
        startDate: formatDate(program.startDate),
        endDate: formatDate(program.endDate),
        enrollments: program.enrollments,
        completions: program.completions,
        completionRate: program.completionRate,
        rating: parseFloat(program.rating.toString()),
      }));

      setAnalyticsData(analytics);
      setEngagementMetrics(engagement);
      setProgramPerformance(transformedPerformance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'info' | 'default' => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'draft': return 'warning';
      case 'upcoming': return 'info';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading Reports...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box 
        sx={{
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: { xs: 2, sm: 0 },
          mb: 3
        }}
      >
        <Typography 
          variant="h5" 
          component="h2" 
          sx={{ 
            color: '#000054', 
            fontWeight: 'bold',
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}
        >
          Reports & Analytics
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadReportsData}
          disabled={loading}
          fullWidth={isMobile}
          size={isMobile ? "small" : "medium"}
          sx={{
            borderColor: '#000054',
            color: '#000054',
            '&:hover': {
              borderColor: '#1a1a6e',
              backgroundColor: 'rgba(0, 0, 84, 0.04)',
            },
          }}
        >
          {isMobile ? "Refresh" : "Refresh Data"}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {analyticsData && (
        <>
          {/* Key Metrics Cards */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Total Users
                      </Typography>
                      <Typography variant="h4">
                        {analyticsData.totalUsers}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {analyticsData.activeUsers} active
                      </Typography>
                    </Box>
                    <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Training Programs
                      </Typography>
                      <Typography variant="h4">
                        {analyticsData.totalPrograms}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {analyticsData.activePrograms} active
                      </Typography>
                    </Box>
                    <SportsIcon color="primary" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Events
                      </Typography>
                      <Typography variant="h4">
                        {analyticsData.totalEvents}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {analyticsData.upcomingEvents} upcoming
                      </Typography>
                    </Box>
                    <EventIcon color="primary" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Training Completion
                      </Typography>
                      <Typography variant="h4">
                        {analyticsData.completionRate}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {analyticsData.completedTasks}/{analyticsData.totalTasks} sessions
                      </Typography>
                    </Box>
                    <AssignmentIcon color="primary" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Charts Section */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
            {/* User Growth Chart */}
            <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 calc(66.67% - 12px)' } }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Athlete & Staff Growth (Last 30 Days)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="totalUsers"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      name="Total Users"
                    />
                    <Area
                      type="monotone"
                      dataKey="newUsers"
                      stackId="2"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      name="New Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Paper>
            </Box>

            {/* User Engagement */}
            <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 calc(33.33% - 12px)' } }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  User Engagement
                </Typography>
                {engagementMetrics && (
                  <Box>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Weekly Engagement
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={engagementMetrics.weeklyEngagement} 
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body2">
                        {engagementMetrics.weeklyEngagement}% ({engagementMetrics.activeLastWeek} users)
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Monthly Engagement
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={engagementMetrics.monthlyEngagement} 
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body2">
                        {engagementMetrics.monthlyEngagement}% ({engagementMetrics.activeLastMonth} users)
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Paper>
            </Box>
          </Box>

          {/* Training Session Trends */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
            <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 calc(66.67% - 12px)' } }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Training Session Trends (Last 30 Days)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.taskCompletion}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="#00C49F"
                      strokeWidth={2}
                      name="Completed"
                    />
                    <Line
                      type="monotone"
                      dataKey="pending"
                      stroke="#FFBB28"
                      strokeWidth={2}
                      name="Pending"
                    />
                    <Line
                      type="monotone"
                      dataKey="overdue"
                      stroke="#FF8042"
                      strokeWidth={2}
                      name="Overdue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Box>

            {/* Training Program Status */}
            <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 calc(33.33% - 12px)' } }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Training Program Status
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Active', value: analyticsData.activePrograms },
                        { name: 'Inactive', value: analyticsData.totalPrograms - analyticsData.activePrograms },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Active', value: analyticsData.activePrograms },
                        { name: 'Inactive', value: analyticsData.totalPrograms - analyticsData.activePrograms },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Box>
          </Box>

          {/* Training Program Performance */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Training Program Performance
            </Typography>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size={isMobile ? "small" : "medium"}>
                <TableHead>
                  <TableRow>
                    <TableCell>Training Program</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Start Date</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>End Date</TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Athletes</TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Completed</TableCell>
                    <TableCell align="right">Completion Rate</TableCell>
                    <TableCell align="right">Rating</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {programPerformance.map((program, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ maxWidth: { xs: '120px', sm: '200px' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {program.name}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={program.status}
                          color="default"
                          size="small"
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.8125rem' } }}
                        />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{program.startDate}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{program.endDate}</TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{program.enrollments}</TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{program.completions}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'flex-end',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}>
                          <LinearProgress
                            variant="determinate"
                            value={program.completionRate || 0}
                            sx={{ width: { xs: 40, sm: 60 }, mr: 1 }}
                          />
                          {program.completionRate || 0}%
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'flex-end',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}>
                          ⭐ {program.rating || 0}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default Reports;
