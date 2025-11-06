'use client'
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert
} from '@mui/material';
import Grid from "@/components/ui/Grid";
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
  fetchAllAnalytics,
  RegionalData,
  LevelData,
  GrowthData,
  AnalyticsMetrics
} from '@/services/analyticsService';

const SportsAnalytics = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [regionData, setRegionData] = useState<RegionalData[]>([]);
  const [levelData, setLevelData] = useState<LevelData[]>([]);
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAllAnalytics();
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

    loadAnalytics();
  }, []);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={50} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading analytics...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography 
        variant="h6" 
        gutterBottom 
        sx={{ 
          color: '#000054', 
          fontWeight: 'bold',
          mb: 3
        }}
      >
        Sports Analytics Overview
      </Typography>

      <Grid container spacing={3}>
        {/* Athlete Growth Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 350 }}>
            <Typography variant="h6" gutterBottom>
              Athlete & Event Growth (6 Months)
            </Typography>
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="athletes" 
                    stroke="#E32845" 
                    strokeWidth={3}
                    name="Athletes"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="events" 
                    stroke="#000054" 
                    strokeWidth={3}
                    name="Events"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={280}>
                <Typography variant="body2" color="text.secondary">
                  No growth data available yet. Add athletes and events to see trends.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Level Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 350 }}>
            <Typography variant="h6" gutterBottom>
              Athletes by Level
            </Typography>
            {levelData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
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
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={280}>
                <Typography variant="body2" color="text.secondary">
                  No athlete level data available yet.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Regional Distribution */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 350 }}>
            <Typography variant="h6" gutterBottom>
              Athletes & Events by Region (Liberia)
            </Typography>
            {regionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={regionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="athletes" fill="#E32845" name="Athletes" />
                  <Bar dataKey="events" fill="#000054" name="Events" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={280}>
                <Typography variant="body2" color="text.secondary">
                  No regional data available yet. Add athletes and events with locations.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Key Metrics Cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Card sx={{ textAlign: 'center', p: 1 }}>
                <CardContent>
                  <Typography variant="h4" color="#E32845" fontWeight="bold">
                    {metrics?.eventAttendanceRate || 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Event Attendance Rate
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card sx={{ textAlign: 'center', p: 1 }}>
                <CardContent>
                  <Typography variant="h4" color="#000054" fontWeight="bold">
                    {metrics?.athletesScouted || 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Athletes Scouted
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card sx={{ textAlign: 'center', p: 1 }}>
                <CardContent>
                  <Typography variant="h4" color="#4caf50" fontWeight="bold">
                    {metrics?.trainingCompletion || 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Training Completion
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card sx={{ textAlign: 'center', p: 1 }}>
                <CardContent>
                  <Typography variant="h4" color="#ff9800" fontWeight="bold">
                    {metrics?.activePrograms || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Programs
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SportsAnalytics;
