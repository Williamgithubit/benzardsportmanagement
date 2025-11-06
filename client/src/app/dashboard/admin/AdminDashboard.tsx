"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { performLogout } from "@/store/Auth/logoutAction";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { selectAuthState } from "@/store/Auth/authSlice";
import Image from "next/image";
import { CiMenuFries } from "react-icons/ci";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Divider,
  IconButton,
  Typography,
  Button,
  AppBar,
  Toolbar,
  CssBaseline,
  Snackbar,
  Alert,
  Collapse,
} from "@mui/material";
import {
  InsertChart as InsertChartIcon,
  Settings as SettingsIcon,
  ExitToApp as ExitToAppIcon,
  Event as EventIcon,
  Article as ArticleIcon,
  Menu as MenuIcon,
  MenuOpen as MenuOpenIcon,
  People as PeopleIcon,
  SportsFootball as SportsIcon,
  Add as AddIcon,
  ContactMail as ContactIcon,
  FitnessCenter as AthleteIcon,
  Create as BlogIcon,
  PhotoLibrary as MediaIcon,
  ExpandLess,
  ExpandMore,
  ContentPaste as ContentIcon,
  Analytics as AnalyticsIcon,
} from "@mui/icons-material";

// Import Admin Components
import UserManagement from "@/components/admin/UserManagement";
import AthleteManagement from "@/components/admin/AthleteManagement";
import EventManagement from "@/components/admin/EventManagement/EventManagement";
import Settings from "@/components/admin/Settings/Settings";
import Dashboard from "@/components/admin/Dashboard";
import Reports from "@/components/admin/Reports";
import ContactManagement from "@/components/admin/ContactManagement";
import GlobalSearch from "@/components/admin/GlobalSearch";
import BlogManagement from "@/components/admin/BlogManagement";
import MediaLibrary from "@/components/admin/MediaLibrary";
import NotificationSystem from "@/components/admin/NotificationSystem";

const drawerWidth = 240;

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: <InsertChartIcon /> },
  { id: "athletes", label: "Athlete Management", icon: <AthleteIcon /> },
  { id: "events", label: "Event Management", icon: <EventIcon /> },
  {
    id: "content",
    label: "Content Management",
    icon: <ContentIcon />,
    isDropdown: true,
    children: [
      { id: "blog", label: "Blog/News", icon: <BlogIcon /> },
      { id: "media", label: "Media Library", icon: <MediaIcon /> },
    ],
  },
  { id: "users", label: "User Management", icon: <PeopleIcon /> },
  { id: "contacts", label: "Contact Management", icon: <ContactIcon /> },
  { id: "reports", label: "Reports & Analytics", icon: <AnalyticsIcon /> },
  { id: "settings", label: "Settings", icon: <SettingsIcon /> },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contentDropdownOpen, setContentDropdownOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });
  // Add dialog state for each tab that needs it
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [athleteDialogOpen, setAthleteDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [blogDialogOpen, setBlogDialogOpen] = useState(false);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector(selectAuthState);

  // Listen for custom event to change tab (from notifications)
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      if (event.detail) {
        setTab(event.detail);
      }
    };
    
    window.addEventListener("changeTab", handleTabChange as EventListener);
    
    return () => {
      window.removeEventListener("changeTab", handleTabChange as EventListener);
    };
  }, []);

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "linear-gradient(135deg, #000054 0%, #1a1a6e 100%)",
        overflowY: "auto",
        width: { xs: "100%", sm: drawerWidth },
      }}
    >
      {/* Logo */}
      <Toolbar
        sx={{
          justifyContent: "center",
          py: { xs: 2, sm: 3 },
          mt: { xs: 2, sm: 3 },
          minHeight: { xs: "60px", sm: "70px" },
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Box
          component="button"
          onClick={() => router.push("/")}
          sx={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "&:hover": {
              opacity: 0.8,
            },
            transition: "opacity 0.2s ease",
          }}
        >
          <Image
            src="/assets/Benzard_Logo.png"
            alt="BSM Sports Management Logo"
            width={isMobile ? 70 : 85}
            height={isMobile ? 28 : 34}
            style={{
              objectFit: "contain",
            }}
          />
        </Box>
      </Toolbar>
      {/* Divider */}
      <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.2)" }} />
      {/* Navigation */}
      <List>
        {tabs.map((tabItem) => {
          const { id, label, icon, isDropdown, children } = tabItem;

          if (isDropdown && children) {
            return (
              <React.Fragment key={id}>
                <ListItem disablePadding>
                  <ListItemButton
                    selected={children.some((child) => child.id === tab)}
                    onClick={() => setContentDropdownOpen(!contentDropdownOpen)}
                    sx={{
                      color: "rgba(255, 255, 255, 0.8)",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        color: "white",
                      },
                      "&.Mui-selected": {
                        backgroundColor: "rgba(227, 40, 69, 0.2)",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "rgba(227, 40, 69, 0.3)",
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {React.cloneElement(icon, {
                        sx: {
                          color: children.some((child) => child.id === tab)
                            ? "#E32845"
                            : "rgba(255, 255, 255, 0.8)",
                        },
                      })}
                    </ListItemIcon>
                    <ListItemText
                      primary={label}
                      sx={{
                        "& .MuiListItemText-primary": {
                          color: "inherit",
                        },
                      }}
                    />
                    {contentDropdownOpen ? (
                      <ExpandLess sx={{ color: "rgba(255, 255, 255, 0.8)" }} />
                    ) : (
                      <ExpandMore sx={{ color: "rgba(255, 255, 255, 0.8)" }} />
                    )}
                  </ListItemButton>
                </ListItem>
                <Collapse in={contentDropdownOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {children.map((child) => (
                      <ListItem key={child.id} disablePadding>
                        <ListItemButton
                          selected={tab === child.id}
                          onClick={() => setTab(child.id)}
                          sx={{
                            pl: 4,
                            color: "rgba(255, 255, 255, 0.7)",
                            "&:hover": {
                              backgroundColor: "rgba(255, 255, 255, 0.1)",
                              color: "white",
                            },
                            "&.Mui-selected": {
                              backgroundColor: "rgba(227, 40, 69, 0.2)",
                              color: "white",
                              "&:hover": {
                                backgroundColor: "rgba(227, 40, 69, 0.3)",
                              },
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            {React.cloneElement(child.icon, {
                              sx: {
                                color:
                                  tab === child.id
                                    ? "#E32845"
                                    : "rgba(255, 255, 255, 0.7)",
                              },
                            })}
                          </ListItemIcon>
                          <ListItemText
                            primary={child.label}
                            sx={{
                              "& .MuiListItemText-primary": {
                                color: "inherit",
                                fontSize: "0.875rem",
                              },
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }

          return (
            <ListItem key={id} disablePadding>
              <ListItemButton
                selected={tab === id}
                onClick={() => setTab(id)}
                sx={{
                  color: "rgba(255, 255, 255, 0.8)",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    color: "white",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "rgba(227, 40, 69, 0.2)",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "rgba(227, 40, 69, 0.3)",
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {React.cloneElement(icon, {
                    sx: {
                      color:
                        tab === id ? "#E32845" : "rgba(255, 255, 255, 0.8)",
                    },
                  })}
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  sx={{
                    "& .MuiListItemText-primary": {
                      color: "inherit",
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      {/* Logout Button */}
      <Box sx={{ mt: "auto", p: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ExitToAppIcon />}
          fullWidth
          sx={{
            color: "white",
            borderColor: "rgba(255, 255, 255, 0.3)",
            "&:hover": {
              borderColor: "white",
              backgroundColor: "#E32845",
            },
          }}
          onClick={async () => {
            try {
              await dispatch(performLogout());
              setSnackbar({
                open: true,
                message: "Logged out successfully",
                severity: "success",
              });
              router.push("/login");
              router.refresh();
            } catch (error) {
              console.error("Logout failed:", error);
              setSnackbar({
                open: true,
                message: "Logout failed",
                severity: "error",
              });
              // Still redirect to login even if logout fails
              router.push("/login");
              router.refresh();
            }
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        flexDirection: { xs: "column", md: "row" },
      }}
    >
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          boxShadow: "none",
          borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
          background: "linear-gradient(135deg, #000054 0%, #1a1a6e 100%)",
          color: "white",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: "none" } }}
            >
              {/* Mobile Icons */}
              <CiMenuFries />
            </IconButton>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                flexGrow: 1,
                fontSize: { xs: "1rem", sm: "1.25rem" },
              }}
            >
              {(() => {
                // First check if it's a direct tab
                const directTab = tabs.find((t) => t.id === tab);
                if (directTab) return directTab.label;

                // Then check if it's a child tab
                for (const tabItem of tabs) {
                  if (tabItem.children) {
                    const childTab = tabItem.children.find(
                      (child) => child.id === tab
                    );
                    if (childTab) return childTab.label;
                  }
                }

                return "Dashboard";
              })()}
            </Typography>
          </Box>

          {/* Header Actions */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, sm: 2 },
            }}
          >
            {/* Global Search */}
            <Box sx={{ display: { xs: "none", md: "block" }, minWidth: 250 }}>
              <GlobalSearch />
            </Box>

            {/* Notifications */}
            <NotificationSystem />

            {/* User Name */}
            {user && (
              <Typography
                variant="body2"
                sx={{
                  color: "white",
                  fontWeight: 500,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  display: { xs: "none", sm: "block" },
                  opacity: 0.9,
                }}
              >
                {user.displayName || user.email?.split("@")[0] || "User"}
              </Typography>
            )}

            {/* Add Button */}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                // Open the appropriate dialog based on the active tab
                switch (tab) {
                  case "users":
                    setUserDialogOpen(true);
                    break;
                  case "athletes":
                    setAthleteDialogOpen(true);
                    break;
                  case "events":
                    setEventDialogOpen(true);
                    break;
                  case "contacts":
                    setContactDialogOpen(true);
                    break;
                  case "blog":
                    setBlogDialogOpen(true);
                    break;
                  case "media":
                    setMediaDialogOpen(true);
                    break;
                  default:
                    // Check if it's a child tab
                    let tabLabel = "item";
                    const directTab = tabs.find((t) => t.id === tab);
                    if (directTab) {
                      tabLabel = directTab.label;
                    } else {
                      for (const tabItem of tabs) {
                        if (tabItem.children) {
                          const childTab = tabItem.children.find(
                            (child) => child.id === tab
                          );
                          if (childTab) {
                            tabLabel = childTab.label;
                            break;
                          }
                        }
                      }
                    }
                    setSnackbar({
                      open: true,
                      message: `Add new ${tabLabel} functionality coming soon!`,
                      severity: "info",
                    });
                }
              }}
              sx={{
                backgroundColor: "#E32845",
                "&:hover": {
                  backgroundColor: "#c41e3a",
                },
              }}
            >
              {isMobile ? "Add" : "Add New"}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { xs: "100%", md: drawerWidth },
          flexShrink: { md: 0 },
          zIndex: (theme) => theme.zIndex.drawer,
        }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: { xs: "80%", sm: drawerWidth },
              border: "none",
              boxShadow: "2px 0 8px rgba(0,0,0,0.05)",
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              border: "none",
              boxShadow: "2px 0 8px rgba(0,0,0,0.05)",
              overflowX: "hidden",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: "56px", sm: "64px" },
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          minHeight: { xs: "calc(100vh - 56px)", sm: "calc(100vh - 64px)" },
          overflowX: "hidden",
        }}
      >
        {tab === "dashboard" && <Dashboard />}
        {tab === "athletes" && (
          <AthleteManagement
            openDialog={athleteDialogOpen}
            onCloseDialog={() => setAthleteDialogOpen(false)}
          />
        )}
        {tab === "events" && (
          <EventManagement
            openDialog={eventDialogOpen}
            onCloseDialog={() => setEventDialogOpen(false)}
          />
        )}
        {tab === "blog" && (
          <BlogManagement
            openDialog={blogDialogOpen}
            onCloseDialog={() => setBlogDialogOpen(false)}
          />
        )}
        {tab === "media" && (
          <MediaLibrary
            openDialog={mediaDialogOpen}
            onCloseDialog={() => setMediaDialogOpen(false)}
          />
        )}
        {tab === "users" && (
          <UserManagement
            openDialog={userDialogOpen}
            onCloseDialog={() => setUserDialogOpen(false)}
          />
        )}
        {tab === "contacts" && (
          <ContactManagement
            openDialog={contactDialogOpen}
            onCloseDialog={() => setContactDialogOpen(false)}
          />
        )}
        {tab === "reports" && <Reports />}
        {tab === "settings" && <Settings />}

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}
