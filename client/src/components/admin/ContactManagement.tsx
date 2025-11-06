"use client";
import React, { useState, useEffect } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Paper,
  Divider,
  Alert,
  Snackbar,
} from "@mui/material";
import AthleteService from "@/services/athleteService";
import Grid from "@/components/ui/Grid";
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Reply as ReplyIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  response?: string;
  createdAt: string;
  updatedAt: string;
  athleteId?: string;
  athleteName?: string | null;
}

interface ContactManagementProps {
  openDialog: boolean;
  onCloseDialog: () => void;
}

export default function ContactManagement({
  openDialog,
  onCloseDialog,
}: ContactManagementProps) {
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedContact, setSelectedContact] =
    useState<ContactSubmission | null>(null);
  const [dialogMode, setDialogMode] = useState<"view" | "reply">("view");
  const [dialogOpenLocal, setDialogOpenLocal] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [replyMessage, setReplyMessage] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });

  // Subscribe to Firestore contacts, enquiries, and notifications collections
  useEffect(() => {
    setLoading(true);
    const contactsQ = query(
      collection(db, "contacts"),
      orderBy("createdAt", "desc")
    );
    const enquiriesQ = query(
      collection(db, "enquiries"),
      orderBy("createdAt", "desc")
    );
    // Query notifications without orderBy to avoid index requirements
    const notificationsQ = collection(db, "notifications");

    const unsubContacts = onSnapshot(contactsQ, (snap) => {
      const items: ContactSubmission[] = [];
      snap.forEach((d) => {
        const data: any = d.data();
        items.push({
          id: d.id,
          name: data.name || data.fullName || "",
          email: data.email || "",
          subject: data.subject || data.title || "Contact",
          message: data.message || "",
          category: data.category || "general",
          status: data.status || "new",
          response: data.response || "",
          createdAt: data.createdAt
            ? data.createdAt.toDate
              ? data.createdAt.toDate().toISOString()
              : data.createdAt
            : new Date().toISOString(),
          updatedAt: data.updatedAt
            ? data.updatedAt.toDate
              ? data.updatedAt.toDate().toISOString()
              : data.updatedAt
            : new Date().toISOString(),
        });
      });
      setContacts((prev) => {
        // Preserve enquiries and blog notifications
        const enquiries = prev.filter((p) => p.category === "enquiry");
        const blogNotifs = prev.filter((p) => p.category === "blog_comment" || p.category === "blog_reaction");
        return [...items, ...enquiries, ...blogNotifs];
      });
      setLoading(false);
    });

    const unsubEnquiries = onSnapshot(enquiriesQ, (snap) => {
      const items: ContactSubmission[] = [];
      snap.forEach((d) => {
        const data: any = d.data();
        items.push({
          id: d.id,
          name: data.name || "",
          email: data.email || "",
          // Prefer athleteName (resolved at creation) then fall back to athleteId
          subject: `Enquiry for athlete ${
            data.athleteName || data.athleteId || ""
          }`,
          message: data.message || "",
          category: "enquiry",
          status: data.status || "new",
          response: data.response || "",
          createdAt: data.createdAt
            ? data.createdAt.toDate
              ? data.createdAt.toDate().toISOString()
              : data.createdAt
            : new Date().toISOString(),
          updatedAt: data.updatedAt
            ? data.updatedAt.toDate
              ? data.updatedAt.toDate().toISOString()
              : data.updatedAt
            : data.createdAt
            ? data.createdAt.toDate
              ? data.createdAt.toDate().toISOString()
              : data.createdAt
            : new Date().toISOString(),
          athleteId: data.athleteId || undefined,
          athleteName: data.athleteName || null,
        });
      });

      // Resolve athleteName for older enquiries that only have athleteId
      (async () => {
        const promises = items.map(async (it) => {
          if (it.category === "enquiry" && !it.athleteName && it.athleteId) {
            try {
              const athlete = await AthleteService.getAthleteById(it.athleteId);
              if (athlete?.name) {
                it.athleteName = athlete.name;
                it.subject = `Enquiry for athlete ${athlete.name}`;
              }
            } catch (err) {
              // ignore
            }
          }
          return it;
        });

        const resolved = await Promise.all(promises);
        setContacts((prev) => {
          // Remove previous enquiries and replace with latest, preserve contacts and blog notifications
          const contacts = prev.filter((p) => p.category !== "enquiry" && p.category !== "blog_comment" && p.category !== "blog_reaction");
          const blogNotifs = prev.filter((p) => p.category === "blog_comment" || p.category === "blog_reaction");
          return [...contacts, ...resolved, ...blogNotifs];
        });
      })();
      setLoading(false);
    });

    const unsubNotifications = onSnapshot(
      notificationsQ,
      (snap) => {
        const items: ContactSubmission[] = [];
        snap.forEach((d) => {
          const data: any = d.data();
          // Only include blog-related notifications
          if (data.type === "blog") {
            const isComment = data.title?.includes("Comment");
            // For comments, show the actual comment text; for reactions, show the notification body
            const messageText = isComment 
              ? (data.data?.commentPreview || data.body || "")
              : data.body || "";
            
            items.push({
              id: d.id,
              name: data.data?.userName || "Anonymous",
              email: data.data?.userEmail || "No email",
              subject: data.title || "Blog Notification",
              message: messageText,
              category: isComment ? "blog_comment" : "blog_reaction",
              status: data.read ? "responded" : "new",
              response: "",
              createdAt: data.createdAt
                ? data.createdAt.toDate
                  ? data.createdAt.toDate().toISOString()
                  : data.createdAt
                : new Date().toISOString(),
              updatedAt: data.createdAt
                ? data.createdAt.toDate
                  ? data.createdAt.toDate().toISOString()
                  : data.createdAt
                : new Date().toISOString(),
            });
          }
        });
        
        console.log("Blog notifications fetched:", items.length, items);
        
        setContacts((prev) => {
          // Remove previous blog notifications and add new ones
          const nonBlogNotifs = prev.filter(
            (p) => p.category !== "blog_comment" && p.category !== "blog_reaction"
          );
          const merged = [...nonBlogNotifs, ...items];
          console.log("Total contacts after adding blog notifications:", merged.length);
          return merged;
        });
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
        setLoading(false);
      }
    );

    return () => {
      unsubContacts();
      unsubEnquiries();
      unsubNotifications();
    };
  }, []);

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    contactId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedContactId(contactId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedContactId("");
  };

  const handleViewContact = (contact: ContactSubmission) => {
    setDialogMode("view");
    setSelectedContact(contact);
    setReplyMessage("");
    setDialogOpenLocal(true);
    handleMenuClose();
  };

  const handleReplyContact = (contact: ContactSubmission) => {
    setDialogMode("reply");
    setSelectedContact(contact);
    setReplyMessage("");
    setDialogOpenLocal(true);
    handleMenuClose();
  };

  const handleArchiveContact = (contactId: string) => {
    // update in Firestore if exists in contacts, enquiries, or notifications collection
    (async () => {
      try {
        // Find the contact to determine which collection it belongs to
        const contact = contacts.find((c) => c.id === contactId);
        
        if (!contact) {
          setSnackbar({
            open: true,
            message: "Contact not found",
            severity: "error",
          });
          return;
        }

        // Determine collection and update based on category
        if (contact.category === "blog_comment" || contact.category === "blog_reaction") {
          // For notifications, mark as read
          await updateDoc(doc(db, "notifications", contactId), {
            read: true,
          });
          
          // Update local state
          setContacts((prev) =>
            prev.map((c) =>
              c.id === contactId ? { ...c, status: "responded" } : c
            )
          );
          
          setSnackbar({
            open: true,
            message: "Notification marked as read",
            severity: "success",
          });
        } else if (contact.category === "enquiry") {
          // For enquiries
          await updateDoc(doc(db, "enquiries", contactId), {
            status: "archived",
            updatedAt: new Date().toISOString(),
          });
          
          setSnackbar({
            open: true,
            message: "Enquiry archived successfully",
            severity: "success",
          });
        } else {
          // For regular contacts
          await updateDoc(doc(db, "contacts", contactId), {
            status: "archived",
            updatedAt: new Date().toISOString(),
          });
          
          setSnackbar({
            open: true,
            message: "Contact archived successfully",
            severity: "success",
          });
        }
      } catch (error) {
        console.error("Archive failed", error);
        setSnackbar({
          open: true,
          message: "Failed to archive",
          severity: "error",
        });
      }
    })();
    handleMenuClose();
  };

  const handleDeleteContact = (contactId: string) => {
    (async () => {
      try {
        // Find the contact to determine which collection it belongs to
        const contact = contacts.find((c) => c.id === contactId);
        
        if (!contact) {
          setSnackbar({
            open: true,
            message: "Contact not found",
            severity: "error",
          });
          return;
        }

        // Determine collection based on category
        let collectionName = "contacts";
        let successMessage = "Contact deleted successfully";
        
        if (contact.category === "enquiry") {
          collectionName = "enquiries";
          successMessage = "Enquiry deleted successfully";
        } else if (contact.category === "blog_comment" || contact.category === "blog_reaction") {
          collectionName = "notifications";
          successMessage = "Notification deleted successfully";
        }

        // Delete from the correct collection
        await deleteDoc(doc(db, collectionName, contactId));
        
        // Remove from local state immediately
        setContacts((prev) => prev.filter((c) => c.id !== contactId));
        
        setSnackbar({
          open: true,
          message: successMessage,
          severity: "success",
        });
      } catch (error) {
        console.error("Delete failed", error);
        setSnackbar({
          open: true,
          message: "Failed to delete",
          severity: "error",
        });
      }
    })();
    handleMenuClose();
  };

  const handleSendReply = () => {
    if (selectedContact && replyMessage.trim()) {
      (async () => {
        try {
          // attempt update in contacts
          await updateDoc(doc(db, "contacts", selectedContact.id), {
            status: "responded",
            response: replyMessage,
            updatedAt: new Date().toISOString(),
          });
          setSnackbar({
            open: true,
            message: "Reply sent successfully",
            severity: "success",
          });
        } catch (err) {
          try {
            await updateDoc(doc(db, "enquiries", selectedContact.id), {
              status: "responded",
              response: replyMessage,
              updatedAt: new Date().toISOString(),
            });
            setSnackbar({
              open: true,
              message: "Reply sent to enquiry",
              severity: "success",
            });
          } catch (e) {
            console.error("Reply failed", e);
            setSnackbar({
              open: true,
              message: "Failed to send reply",
              severity: "error",
            });
          }
        }
        onCloseDialog();
      })();
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || contact.category === filterCategory;
    const matchesStatus =
      filterStatus === "all" || contact.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "error";
      case "responded":
        return "success";
      case "archived":
        return "default";
      default:
        return "default";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "partnerships":
        return "primary";
      case "scouting":
        return "warning";
      case "events":
        return "info";
      default:
        return "default";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "partnerships":
        return <BusinessIcon />;
      case "scouting":
        return <EmailIcon />;
      case "events":
        return <PhoneIcon />;
      default:
        return <EmailIcon />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#1a1a1a" }}>
          Contact Management
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="partnerships">Partnerships</MenuItem>
                <MenuItem value="scouting">Scouting</MenuItem>
                <MenuItem value="events">Events</MenuItem>
                <MenuItem value="general">General</MenuItem>
                <MenuItem value="blog_comment">Blog Comments</MenuItem>
                <MenuItem value="blog_reaction">Blog Reactions</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="new">New</MenuItem>
                <MenuItem value="responded">Responded</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Contacts List */}
      <Grid container spacing={2}>
        {filteredContacts.map((contact) => (
          <Grid item xs={12} key={contact.id}>
            <Card sx={{ position: "relative" }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 1,
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        {contact.name}
                      </Typography>
                      <Chip
                        label={contact.category}
                        color={getCategoryColor(contact.category) as any}
                        size="small"
                        icon={getCategoryIcon(contact.category)}
                      />
                      <Chip
                        label={contact.status}
                        color={getStatusColor(contact.status) as any}
                        size="small"
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {contact.email} • {formatDate(contact.createdAt)}
                    </Typography>

                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: "medium", mb: 1 }}
                    >
                      {contact.subject}
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {contact.message.length > 150
                        ? `${contact.message.substring(0, 150)}...`
                        : contact.message}
                    </Typography>

                    {contact.response && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: "medium", mb: 1 }}
                        >
                          Response:
                        </Typography>
                        <Typography variant="body2">
                          {contact.response}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <IconButton
                    onClick={(e) => handleMenuClick(e, contact.id)}
                    size="small"
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredContacts.length === 0 && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No contacts found
          </Typography>
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            const contact = contacts.find((c) => c.id === selectedContactId);
            if (contact) handleViewContact(contact);
          }}
        >
          <ViewIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            const contact = contacts.find((c) => c.id === selectedContactId);
            if (contact) handleReplyContact(contact);
          }}
        >
          <ReplyIcon sx={{ mr: 1 }} />
          Reply
        </MenuItem>
        <MenuItem onClick={() => handleArchiveContact(selectedContactId)}>
          <ArchiveIcon sx={{ mr: 1 }} />
          Archive
        </MenuItem>
        <MenuItem onClick={() => handleDeleteContact(selectedContactId)}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* View/Reply Dialog */}
      <Dialog
        open={Boolean(openDialog || dialogOpenLocal)}
        onClose={() => {
          setDialogOpenLocal(false);
          onCloseDialog();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === "view" ? "Contact Details" : "Reply to Contact"}
        </DialogTitle>
        <DialogContent>
          {selectedContact && (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={selectedContact.name}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={selectedContact.email}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Category"
                    value={selectedContact.category}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Status"
                    value={selectedContact.status}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subject"
                    value={selectedContact.subject}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Message"
                    multiline
                    rows={4}
                    value={selectedContact.message}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>

                {selectedContact.response && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Previous Response"
                      multiline
                      rows={3}
                      value={selectedContact.response}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                )}

                {dialogMode === "reply" && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Your Reply"
                      multiline
                      rows={4}
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply here..."
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDialogOpenLocal(false);
              onCloseDialog();
            }}
          >
            {dialogMode === "view" ? "Close" : "Cancel"}
          </Button>
          {dialogMode === "reply" && (
            <Button
              onClick={handleSendReply}
              variant="contained"
              disabled={!replyMessage.trim()}
              sx={{
                backgroundColor: "#E32845",
                "&:hover": { backgroundColor: "#c41e3a" },
              }}
            >
              Send Reply
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
