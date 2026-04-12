"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  doc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import AthleteService from "@/services/athleteService";
import toast, { Toaster } from "react-hot-toast";
import {
  MdSearch,
  MdMoreVert,
  MdReply,
  MdArchive,
  MdDelete,
  MdVisibility,
  MdEmail,
  MdPhone,
  MdBusiness,
  MdClose,
} from "react-icons/md";
import { Skeleton } from "@/components/ui/Skeleton";

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
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Subscribe to Firestore collections
  useEffect(() => {
    setLoading(true);
    const contactsQ = query(
      collection(db, "contacts"),
      orderBy("createdAt", "desc"),
    );
    const enquiriesQ = query(
      collection(db, "enquiries"),
      orderBy("createdAt", "desc"),
    );
    const notificationsQ = collection(db, "notifications");

    const unsubContacts = onSnapshot(contactsQ, (snap) => {
      const items: ContactSubmission[] = [];
      snap.forEach((d) => {
        const data = d.data() as Record<string, unknown>;
        items.push({
          id: d.id,
          name: String(data.name || data.fullName || ""),
          email: String(data.email || ""),
          subject: String(data.subject || data.title || "Contact"),
          message: String(data.message || ""),
          category: String(data.category || "general"),
          status: String(data.status || "new"),
          response: String(data.response || ""),
          createdAt: (data.createdAt as { toDate?: () => Date })?.toDate
            ? (data.createdAt as { toDate: () => Date }).toDate().toISOString()
            : String(data.createdAt || new Date().toISOString()),
          updatedAt: (data.updatedAt as { toDate?: () => Date })?.toDate
            ? (data.updatedAt as { toDate: () => Date }).toDate().toISOString()
            : String(data.updatedAt || new Date().toISOString()),
        });
      });
      setContacts((prev) => {
        const enquiries = prev.filter((p) => p.category === "enquiry");
        const blogNotifs = prev.filter(
          (p) =>
            p.category === "blog_comment" || p.category === "blog_reaction",
        );
        return [...items, ...enquiries, ...blogNotifs];
      });
      setLoading(false);
    });

    const unsubEnquiries = onSnapshot(enquiriesQ, (snap) => {
      const items: ContactSubmission[] = [];
      snap.forEach((d) => {
        const data = d.data() as Record<string, unknown>;
        items.push({
          id: d.id,
          name: String(data.name || ""),
          email: String(data.email || ""),
          subject: `Enquiry for athlete ${String(data.athleteName || data.athleteId || "")}`,
          message: String(data.message || ""),
          category: "enquiry",
          status: String(data.status || "new"),
          response: String(data.response || ""),
          createdAt: (data.createdAt as { toDate?: () => Date })?.toDate
            ? (data.createdAt as { toDate: () => Date }).toDate().toISOString()
            : String(data.createdAt || new Date().toISOString()),
          updatedAt: (data.updatedAt as { toDate?: () => Date })?.toDate
            ? (data.updatedAt as { toDate: () => Date }).toDate().toISOString()
            : String(data.updatedAt || new Date().toISOString()),
          athleteId: data.athleteId ? String(data.athleteId) : undefined,
          athleteName: data.athleteName ? String(data.athleteName) : null,
        });
      });

      (async () => {
        const promises = items.map(async (it) => {
          if (it.category === "enquiry" && !it.athleteName && it.athleteId) {
            try {
              const athlete = await AthleteService.getAthleteById(it.athleteId);
              if (athlete?.name) {
                it.athleteName = athlete.name;
                it.subject = `Enquiry for athlete ${athlete.name}`;
              }
            } catch {}
          }
          return it;
        });

        const resolved = await Promise.all(promises);
        setContacts((prev) => {
          const contacts = prev.filter(
            (p) =>
              p.category !== "enquiry" &&
              p.category !== "blog_comment" &&
              p.category !== "blog_reaction",
          );
          const blogNotifs = prev.filter(
            (p) =>
              p.category === "blog_comment" || p.category === "blog_reaction",
          );
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
          const data = d.data() as Record<string, unknown>;
          if (data.type === "blog") {
            const title = String(data.title || "");
            const isComment = title.includes("Comment");
            const dataObj = data.data as Record<string, unknown> | undefined;
            const messageText = isComment
              ? String(dataObj?.commentPreview || data.body || "")
              : String(data.body || "");

            items.push({
              id: d.id,
              name: String(dataObj?.userName || "Anonymous"),
              email: String(dataObj?.userEmail || "No email"),
              subject: title || "Blog Notification",
              message: messageText,
              category: isComment ? "blog_comment" : "blog_reaction",
              status: data.read ? "responded" : "new",
              response: "",
              createdAt: (data.createdAt as { toDate?: () => Date })?.toDate
                ? (data.createdAt as { toDate: () => Date }).toDate().toISOString()
                : String(data.createdAt || new Date().toISOString()),
              updatedAt: (data.createdAt as { toDate?: () => Date })?.toDate
                ? (data.createdAt as { toDate: () => Date }).toDate().toISOString()
                : String(data.createdAt || new Date().toISOString()),
            });
          }
        });

        setContacts((prev) => {
          const nonBlogNotifs = prev.filter(
            (p) =>
              p.category !== "blog_comment" && p.category !== "blog_reaction",
          );
          return [...nonBlogNotifs, ...items];
        });
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );

    return () => {
      unsubContacts();
      unsubEnquiries();
      unsubNotifications();
    };
  }, []);

  const handleMenuClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    contactId: string,
  ) => {
    event.stopPropagation();
    setActiveMenuId(activeMenuId === contactId ? null : contactId);
  };

  const handleMenuClose = () => {
    setActiveMenuId(null);
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
    (async () => {
      try {
        const contact = contacts.find((c) => c.id === contactId);
        if (!contact) {
          toast.error("Contact not found");
          return;
        }

        if (
          contact.category === "blog_comment" ||
          contact.category === "blog_reaction"
        ) {
          await updateDoc(doc(db, "notifications", contactId), { read: true });
          setContacts((prev) =>
            prev.map((c) =>
              c.id === contactId ? { ...c, status: "responded" } : c,
            ),
          );
          toast.success("Notification marked as read");
        } else if (contact.category === "enquiry") {
          await updateDoc(doc(db, "enquiries", contactId), {
            status: "archived",
            updatedAt: new Date().toISOString(),
          });
          toast.success("Enquiry archived successfully");
        } else {
          await updateDoc(doc(db, "contacts", contactId), {
            status: "archived",
            updatedAt: new Date().toISOString(),
          });
          toast.success("Contact archived successfully");
        }
      } catch {
        toast.error("Failed to archive");
      }
    })();
    handleMenuClose();
  };

  const handleDeleteContact = (contactId: string) => {
    (async () => {
      try {
        const contact = contacts.find((c) => c.id === contactId);
        if (!contact) {
          toast.error("Contact not found");
          return;
        }

        let collectionName = "contacts";
        let successMessage = "Contact deleted successfully";

        if (contact.category === "enquiry") {
          collectionName = "enquiries";
          successMessage = "Enquiry deleted successfully";
        } else if (
          contact.category === "blog_comment" ||
          contact.category === "blog_reaction"
        ) {
          collectionName = "notifications";
          successMessage = "Notification deleted successfully";
        }

        await deleteDoc(doc(db, collectionName, contactId));
        setContacts((prev) => prev.filter((c) => c.id !== contactId));
        toast.success(successMessage);
      } catch {
        toast.error("Failed to delete");
      }
    })();
    handleMenuClose();
  };

  const handleSendReply = () => {
    if (selectedContact && replyMessage.trim()) {
      (async () => {
        try {
          await updateDoc(doc(db, "contacts", selectedContact.id), {
            status: "responded",
            response: replyMessage,
            updatedAt: new Date().toISOString(),
          });
          toast.success("Reply sent successfully");
        } catch {
          try {
            await updateDoc(doc(db, "enquiries", selectedContact.id), {
              status: "responded",
              response: replyMessage,
              updatedAt: new Date().toISOString(),
            });
            toast.success("Reply sent to enquiry");
          } catch {
            toast.error("Failed to send reply");
          }
        }
        setDialogOpenLocal(false);
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
        return "bg-red-100 text-red-800 border-red-200";
      case "responded":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "archived":
        return "bg-slate-100 text-slate-800 border-slate-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "partnerships":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "scouting":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "events":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "partnerships":
        return <MdBusiness />;
      case "scouting":
        return <MdEmail />;
      case "events":
        return <MdPhone />;
      default:
        return <MdEmail />;
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
    <div className="w-full">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-[#1a1a1a]">
          Contact Management
        </h1>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MdSearch className="text-slate-400" size={20} />
          </div>
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
          />
        </div>

        <div className="w-full md:w-64 shrink-0">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary appearance-none"
          >
            <option value="all">All Categories</option>
            <option value="partnerships">Partnerships</option>
            <option value="scouting">Scouting</option>
            <option value="events">Events</option>
            <option value="general">General</option>
            <option value="blog_comment">Blog Comments</option>
            <option value="blog_reaction">Blog Reactions</option>
          </select>
        </div>

        <div className="w-full md:w-64 shrink-0">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary appearance-none"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="responded">Responded</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Contacts List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-64 mb-1" />
                  <Skeleton className="h-4 w-full max-w-md" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
          <MdEmail size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-xl font-bold text-slate-500">No contacts found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative group hover:border-[#ADF802] transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-12">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-slate-800">
                      {contact.name}
                    </h3>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border ${getCategoryColor(contact.category)}`}
                    >
                      {getCategoryIcon(contact.category)}
                      {contact.category.replace("_", " ")}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border ${getStatusColor(contact.status)}`}
                    >
                      {contact.status}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-500 mb-2">
                    {contact.email} &bull; {formatDate(contact.createdAt)}
                  </p>

                  <h4 className="text-base font-bold text-slate-800 mb-2">
                    {contact.subject}
                  </h4>

                  <p className="text-sm text-slate-600 mb-3 whitespace-pre-wrap">
                    {contact.message.length > 250
                      ? `${contact.message.substring(0, 250)}...`
                      : contact.message}
                  </p>

                  {contact.response && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Response:
                      </p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">
                        {contact.response}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions Menu */}
                <div
                  className="absolute top-5 right-5"
                  ref={activeMenuId === contact.id ? menuRef : null}
                >
                  <button
                    onClick={(e) => handleMenuClick(e, contact.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <MdMoreVert size={24} />
                  </button>

                  {activeMenuId === contact.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-10 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        onClick={() => handleViewContact(contact)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                      >
                        <MdVisibility size={18} className="text-slate-400" />{" "}
                        View Details
                      </button>
                      <button
                        onClick={() => handleReplyContact(contact)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                      >
                        <MdReply size={18} className="text-slate-400" /> Reply
                      </button>
                      <button
                        onClick={() => handleArchiveContact(contact.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                      >
                        <MdArchive size={18} className="text-slate-400" />{" "}
                        Archive
                      </button>
                      <div className="h-px bg-slate-100 my-1"></div>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
                      >
                        <MdDelete size={18} className="text-red-500" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View/Reply Dialog */}
      {(openDialog || dialogOpenLocal) && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#1a1a1a] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h2 className="font-bold text-lg">
                {dialogMode === "view" ? "Contact Details" : "Reply to Contact"}
              </h2>
              <button
                onClick={() => {
                  setDialogOpenLocal(false);
                  onCloseDialog();
                }}
                className="text-white/70 hover:text-white transition-colors"
              >
                <MdClose size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto w-full flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Name
                  </label>
                  <input
                    type="text"
                    value={selectedContact.name}
                    readOnly
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Email
                  </label>
                  <input
                    type="text"
                    value={selectedContact.email}
                    readOnly
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Category
                  </label>
                  <input
                    type="text"
                    value={selectedContact.category}
                    readOnly
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Status
                  </label>
                  <input
                    type="text"
                    value={selectedContact.status}
                    readOnly
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={selectedContact.subject}
                    readOnly
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    value={selectedContact.message}
                    readOnly
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none resize-none"
                  />
                </div>

                {selectedContact.response && (
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Previous Response
                    </label>
                    <textarea
                      rows={3}
                      value={selectedContact.response}
                      readOnly
                      className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none resize-none"
                    />
                  </div>
                )}

                {dialogMode === "reply" && (
                  <div className="md:col-span-2 space-y-1 mt-2 border-t border-slate-200 pt-4">
                    <label className="text-sm font-bold text-slate-800">
                      Your Reply
                    </label>
                    <textarea
                      rows={5}
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply here..."
                      className="w-full p-3 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary resize-y"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => {
                  setDialogOpenLocal(false);
                  onCloseDialog();
                }}
                className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 bg-white font-medium hover:bg-slate-50 transition-colors"
              >
                {dialogMode === "view" ? "Close" : "Cancel"}
              </button>

              {dialogMode === "reply" && (
                <button
                  onClick={handleSendReply}
                  disabled={!replyMessage.trim()}
                  className="px-6 py-2.5 rounded-lg bg-[#E32845] text-white font-bold hover:bg-[#c41e3a] transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2"
                >
                  <MdReply size={20} />
                  Send Reply
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
