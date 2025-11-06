import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  IconButton,
  Chip,
  Badge,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import Grid from "@/components/ui/Grid";
import {
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
  FitnessCenter as AthleteIcon,
  Event as EventIcon,
  SportsFootball as SportsIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  ContactMail as ContactIcon,
  Article as BlogIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  CloudDone as CloudDoneIcon,
  Error as ErrorIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
} from "@mui/icons-material";

interface PendingItem {
  id: string;
  type: "athlete" | "user" | "event" | "contact" | "training";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  createdAt: Date;
}

interface SystemHealth {
  database: "healthy" | "warning" | "error";
  storage: "healthy" | "warning" | "error";
  email: "healthy" | "warning" | "error";
  backup: "healthy" | "warning" | "error";
  lastUpdated: Date;
}

interface QuickActionsProps {
  onAddUser?: () => void;
  onAddAthlete?: () => void;
  onAddEvent?: () => void;
  onAddBlog?: () => void;
  onAddProgram?: () => void;
  onAddAdmission?: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onAddUser,
  onAddAthlete,
  onAddEvent,
  onAddBlog,
  onAddProgram,
  onAddAdmission,
}) => {
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Mock data - replace with actual API calls
  const loadPendingItems = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockPendingItems: PendingItem[] = [
      {
        id: "1",
        type: "athlete",
        title: "New Athlete Registration",
        description: "Samuel Johnson - Forward from Paynesville",
        priority: "high",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: "2",
        type: "contact",
        title: "Partnership Inquiry",
        description: "Local Sports Club - Training Collaboration",
        priority: "high",
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      },
      {
        id: "3",
        type: "event",
        title: "Event Registration Full",
        description: "Youth Tournament - Waiting list active",
        priority: "medium",
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      },
      {
        id: "4",
        type: "training",
        title: "Training Session Review",
        description: "Elite Development - Performance Assessment",
        priority: "low",
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      },
    ];

    setPendingItems(mockPendingItems);
  };

  const loadSystemHealth = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    const mockSystemHealth: SystemHealth = {
      database: "healthy",
      storage: "warning",
      email: "healthy",
      backup: "healthy",
      lastUpdated: new Date(),
    };

    setSystemHealth(mockSystemHealth);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadPendingItems(), loadSystemHealth()]);
    setRefreshing(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadPendingItems(), loadSystemHealth()]);
      setLoading(false);
    };

    loadData();
  }, []);

  const getHealthIcon = (status: "healthy" | "warning" | "error") => {
    switch (status) {
      case "healthy":
        return <CheckCircleIcon color="success" />;
      case "warning":
        return <WarningIcon color="warning" />;
      case "error":
        return <ErrorIcon color="error" />;
    }
  };

  const getHealthColor = (status: "healthy" | "warning" | "error") => {
    switch (status) {
      case "healthy":
        return "success";
      case "warning":
        return "warning";
      case "error":
        return "error";
    }
  };

  const getPriorityColor = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return "error" as const;
      case "medium":
        return "warning" as const;
      case "low":
        return "success" as const;
    }
  };

  const getTypeIcon = (type: PendingItem["type"]) => {
    switch (type) {
      case "athlete":
        return <AthleteIcon />;
      case "user":
        return <PersonAddIcon />;
      case "event":
        return <EventIcon />;
      case "contact":
        return <ContactIcon />;
      case "training":
        return <SportsIcon />;
      default:
        return <EventIcon />;
    }
  };

  const quickActionButtons = [
    {
      label: "Add Athlete",
      icon: <AthleteIcon />,
      color: "#000054",
      onClick: onAddAthlete || (() => window.location.href = "/dashboard/admin#athletes"),
    },
    {
      label: "Add Event",
      icon: <EventIcon />,
      color: "#E32845",
      onClick: onAddEvent || (() => window.location.href = "/dashboard/admin#events"),
    },
    {
      label: "Add Blog Post",
      icon: <BlogIcon />,
      color: "#4CAF50",
      onClick: onAddBlog || (() => window.location.href = "/dashboard/admin#blog"),
    },
    {
      label: "Add User",
      icon: <PersonAddIcon />,
      color: "#9C27B0",
      onClick: onAddUser || (() => window.location.href = "/dashboard/admin#users"),
    },
    {
      label: "View Contacts",
      icon: <ContactIcon />,
      color: "#FF9800",
      onClick: () => window.location.href = "/dashboard/admin#contacts",
    },
  ];

  if (loading) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: { xs: 1.5, sm: 2 },
          background: "white",
          borderRadius: 2,
          border: "1px solid rgba(0, 0, 84, 0.1)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 200,
        }}
      >
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: { xs: 1.5, sm: 2 },
        background: "white",
        borderRadius: 2,
        border: "1px solid rgba(0, 0, 84, 0.1)",
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6" sx={{ color: "#000054", fontWeight: "bold" }}>
          Quick Actions
        </Typography>
        <IconButton onClick={handleRefresh} disabled={refreshing} size="small">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Quick Action Buttons */}
      <Grid container spacing={2} mb={3}>
        {quickActionButtons.map((action, index) => (
          <Grid item xs={6} sm={3} key={index}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={action.icon}
              onClick={action.onClick}
              sx={{
                borderColor: action.color,
                color: action.color,
                "&:hover": {
                  backgroundColor: `${action.color}10`,
                  borderColor: action.color,
                },
                py: 1.5,
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              }}
            >
              {isMobile ? action.label.split(" ")[1] : action.label}
            </Button>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Pending Approvals */}
      <Box mb={3}>
        <Typography
          variant="subtitle1"
          sx={{ color: "#000054", fontWeight: "bold", mb: 1 }}
        >
          Pending Approvals
          <Badge
            badgeContent={pendingItems.length}
            color="error"
            sx={{ ml: 1 }}
          >
            <NotificationsIcon />
          </Badge>
        </Typography>

        {pendingItems.length > 0 ? (
          <List dense>
            {pendingItems.slice(0, 3).map((item) => (
              <ListItem key={item.id} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 35 }}>
                  {getTypeIcon(item.type)}
                </ListItemIcon>
                <Box sx={{ flex: 1 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{ fontWeight: 500 }}
                    >
                      {item.title}
                    </Typography>
                    <Chip
                      label={item.priority}
                      size="small"
                      color={getPriorityColor(item.priority)}
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </Box>
                <IconButton size="small" aria-label={`approve-${item.id}`}>
                  <CheckCircleIcon color="success" />
                </IconButton>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No pending approvals
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* System Health */}
      <Box>
        <Typography
          variant="subtitle1"
          sx={{ color: "#000054", fontWeight: "bold", mb: 1 }}
        >
          System Health
        </Typography>

        {systemHealth && (
          <Grid container spacing={1}>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined" sx={{ textAlign: "center", py: 1 }}>
                <CardContent sx={{ py: "8px !important" }}>
                  {getHealthIcon(systemHealth.database)}
                  <Typography variant="caption" display="block">
                    Database
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined" sx={{ textAlign: "center", py: 1 }}>
                <CardContent sx={{ py: "8px !important" }}>
                  {getHealthIcon(systemHealth.storage)}
                  <Typography variant="caption" display="block">
                    Storage
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined" sx={{ textAlign: "center", py: 1 }}>
                <CardContent sx={{ py: "8px !important" }}>
                  {getHealthIcon(systemHealth.email)}
                  <Typography variant="caption" display="block">
                    Email
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined" sx={{ textAlign: "center", py: 1 }}>
                <CardContent sx={{ py: "8px !important" }}>
                  {getHealthIcon(systemHealth.backup)}
                  <Typography variant="caption" display="block">
                    Backup
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: "block" }}
        >
          Last updated: {systemHealth?.lastUpdated.toLocaleTimeString()}
        </Typography>
      </Box>
    </Paper>
  );
};

export default QuickActions;
