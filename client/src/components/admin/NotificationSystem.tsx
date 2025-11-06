import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  Divider,
  Avatar,
  Tooltip,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Circle as CircleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  Clear as ClearIcon,
  MarkEmailRead as MarkEmailReadIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { NotificationService } from "@/services/notificationService";
import useUserRole from "@/hooks/useUserRole";
import { Notification as NotificationType } from "@/types/notification";

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  priority: "low" | "medium" | "high";
  category: "system" | "user" | "admission" | "program" | "event";
}

interface NotificationSystemProps {
  onNotificationClick?: (notification: Notification) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  onNotificationClick,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const router = useRouter();
  const userRole = useUserRole();

  useEffect(() => {
    // subscribe to notifications from Firestore and update list
    const unsub = NotificationService.subscribeToNotifications(
      userRole.role || "admin",
      (items) => {
        // normalize incoming notifications to local Notification interface
        const normalized = items.map((i: any) => ({
          id: i.id,
          type: (i.type as any) || "info",
          title: i.title || i.body || i.type,
          message: i.body || "",
          timestamp:
            i.createdAt && i.createdAt.toDate
              ? i.createdAt.toDate()
              : i.createdAt || new Date(),
          read: !!i.read,
          priority: (i.priority as any) || "low",
          category: (i.recipientRole as any) || "user",
          actionUrl: i.data?.actionUrl,
          actionLabel: i.data?.actionLabel,
        })) as Notification[];
        setNotifications(normalized);
      }
    );

    return () => unsub();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read in Firestore
    try {
      await NotificationService.markAsRead(notification.id, true);
      
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );

      if (onNotificationClick) {
        onNotificationClick(notification);
      }

      // Navigate to Contact Management for blog notifications
      if (notification.category === "user" || notification.title?.includes("Blog")) {
        handleClose();
        router.push("/dashboard/admin#contacts");
        // Trigger tab change after navigation
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("changeTab", { detail: "contacts" }));
        }, 100);
      } else {
        handleClose();
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      setSnackbar({
        open: true,
        message: "Failed to update notification",
        severity: "error",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setSnackbar({
        open: true,
        message: "All notifications marked as read",
        severity: "success",
      });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      setSnackbar({
        open: true,
        message: "Failed to update notifications",
        severity: "error",
      });
    }
  };

  const deleteNotification = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await NotificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setSnackbar({
        open: true,
        message: "Notification deleted",
        severity: "info",
      });
    } catch (error) {
      console.error("Failed to delete notification:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete notification",
        severity: "error",
      });
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setSnackbar({
      open: true,
      message: "All notifications cleared",
      severity: "info",
    });
    handleClose();
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircleIcon color="success" />;
      case "warning":
        return <WarningIcon color="warning" />;
      case "error":
        return <ErrorIcon color="error" />;
      case "info":
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "#4CAF50";
      case "warning":
        return "#FF9800";
      case "error":
        return "#F44336";
      case "info":
      default:
        return "#2196F3";
    }
  };

  const getPriorityColor = (priority: Notification["priority"]) => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
      default:
        return "default";
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          onClick={handleClick}
          size="large"
          sx={{
            color: "white",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          <Badge badgeContent={unreadCount} color="error">
            {unreadCount > 0 ? (
              <NotificationsActiveIcon />
            ) : (
              <NotificationsIcon />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: { xs: "90vw", sm: 400 },
            maxHeight: 500,
            mt: 1,
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Box sx={{ p: 2, borderBottom: "1px solid rgba(0, 0, 0, 0.12)" }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Notifications
            </Typography>
            <Box>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  onClick={markAllAsRead}
                  startIcon={<MarkEmailReadIcon />}
                  sx={{ mr: 1 }}
                >
                  Mark All Read
                </Button>
              )}
              <IconButton size="small" onClick={clearAllNotifications}>
                <ClearIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <NotificationsIcon
              sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, maxHeight: 350, overflow: "auto" }}>
            {notifications
              .map((notification, index) => [
                <ListItem key={notification.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      backgroundColor: notification.read
                        ? "transparent"
                        : "rgba(0, 0, 84, 0.05)",
                      "&:hover": {
                        backgroundColor: notification.read
                          ? "rgba(0, 0, 0, 0.04)"
                          : "rgba(0, 0, 84, 0.1)",
                      },
                      py: 1.5,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <Box sx={{ flex: 1, py: 1 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Typography
                          variant="subtitle2"
                          component="span"
                          sx={{
                            fontWeight: notification.read ? "normal" : "bold",
                            flex: 1,
                          }}
                        >
                          {notification.title}
                        </Typography>
                        {!notification.read && (
                          <CircleIcon sx={{ fontSize: 8, color: "#E32845" }} />
                        )}
                      </Box>
                      <Typography
                        variant="body2"
                        component="div"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        {notification.message}
                      </Typography>
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        flexWrap="wrap"
                      >
                        <Typography
                          variant="caption"
                          component="span"
                          color="text.secondary"
                        >
                          {formatTimestamp(notification.timestamp)}
                        </Typography>
                        <Chip
                          label={notification.priority}
                          size="small"
                          color={getPriorityColor(notification.priority)}
                          variant="outlined"
                          sx={{ height: 20, fontSize: "0.65rem" }}
                        />
                        {notification.actionLabel && (
                          <Chip
                            label={notification.actionLabel}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: "0.65rem" }}
                          />
                        )}
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => deleteNotification(notification.id, e)}
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemButton>
                </ListItem>,
                ...(index < notifications.length - 1
                  ? [<Divider key={`divider-${notification.id}`} />]
                  : []),
              ])
              .flat()}
          </List>
        )}

        {notifications.length > 0 && [
          <Divider key="settings-divider" />,
          <Box key="settings-box" sx={{ p: 1 }}>
            <Button
              fullWidth
              variant="text"
              startIcon={<SettingsIcon />}
              sx={{ justifyContent: "flex-start" }}
            >
              Notification Settings
            </Button>
          </Box>,
        ]}
      </Menu>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificationSystem;
