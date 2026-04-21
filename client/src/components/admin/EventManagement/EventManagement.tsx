import React, { useState, useEffect } from "react";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdRefresh,
  MdSearch,
  MdEvent,
  MdPeople,
  MdLocationOn,
  MdClose,
} from "react-icons/md";
import {
  Event,
  CreateEventData,
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/services/eventService";
import { fetchAdminEvents } from "@/services/adminDataService";
import TeamService from "@/services/teamService";
import toast, { Toaster } from "react-hot-toast";
import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { useAppSelector } from "@/store/store";

interface EventManagementProps {
  openDialog?: boolean;
  onCloseDialog?: () => void;
}

const EventManagement: React.FC<EventManagementProps> = ({
  openDialog = false,
  onCloseDialog,
}) => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateEventData>({
    title: "",
    description: "",
    startDate: new Date(),
    endDate: new Date(),
    location: "",
    capacity: 50,
    status: "upcoming",
    category: "tournament",
    price: 0,
    isPublic: true,
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    ongoing: 0,
    completed: 0,
    cancelled: 0,
    totalRegistrations: 0,
    totalCapacity: 0,
  });

  useEffect(() => {
    void loadEvents();

    const intervalId = window.setInterval(() => {
      void loadEvents(false, false, false);
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  // Handle external dialog open request from parent component
  useEffect(() => {
    if (openDialog) {
      handleOpenDialog();
      // Call the parent's onCloseDialog to reset the state in the parent
      if (onCloseDialog) {
        onCloseDialog();
      }
    }
  }, [openDialog, onCloseDialog]);

  useEffect(() => {
    filterEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, searchTerm, statusFilter, categoryFilter]);

  const loadEvents = async (
    showLoader = true,
    showToast = true,
    showRefreshing = !showLoader,
  ) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else if (showRefreshing) {
        setRefreshing(true);
      }

      const { events: eventsData, stats: statsData } = await fetchAdminEvents();

      setEvents(eventsData);
      setStats(statsData);
    } catch (err) {
      if (showToast) {
        toast.error(
          err instanceof Error ? err.message : "Failed to load events",
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadEvents(false, true, true);
    } finally {
      setRefreshing(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.location.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((event) => event.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((event) => event.category === categoryFilter);
    }

    setFilteredEvents(filtered);
  };

  const handleOpenDialog = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        capacity: event.capacity,
        status: event.status,
        category: event.category,
        price: event.price,
        isPublic: event.isPublic,
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: "",
        description: "",
        startDate: new Date(),
        endDate: new Date(),
        location: "",
        capacity: 50,
        status: "upcoming",
        category: "tournament",
        price: 0,
        isPublic: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEvent(null);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.location) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const teamContext = currentUser
        ? await TeamService.ensureTeamContext(currentUser).catch(() => null)
        : null;
      const eventPayload = {
        ...formData,
        teamId: teamContext?.teamId || currentUser?.teamId || null,
      };

      if (editingEvent) {
        await updateEvent(editingEvent.id, eventPayload);
        toast.success("Event updated successfully");
      } else {
        await createEvent(eventPayload);
        toast.success("Event created successfully");
      }

      handleCloseDialog();
      await loadEvents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save event");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      await deleteEvent(id);
      toast.success("Event deleted successfully");
      await loadEvents();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete event",
      );
    } finally {
      setDeleting(null);
    }
  };

  const getStatusColor = (status: Event["status"]) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ongoing":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-slate-100 text-slate-800 border-slate-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getCategoryColor = (category: Event["category"]) => {
    switch (category) {
      case "tournament":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "training_camp":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "community_outreach":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      case "trial":
        return "bg-pink-100 text-pink-800 border-pink-200";
      case "match":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "clinic":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return amount === 0 ? "Free" : `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-56" />
          <div className="flex gap-2">
            <Skeleton className="h-11 w-28 rounded-xl" />
            <Skeleton className="h-11 w-36 rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-9 w-16" />
                </div>
                <Skeleton variant="circular" className="h-12 w-12" />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>

        <TableSkeleton rows={6} columns={7} />
      </div>
    );
  }

  return (
    <div className="w-full mt-10">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#000054]">
            Event Management
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Manage events and registrations
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#000054] text-[#000054] rounded-lg hover:bg-[#000054]/5 transition-colors font-medium disabled:opacity-50 w-full sm:w-auto"
          >
            <MdRefresh
              size={20}
              className={loading || refreshing ? "animate-spin" : ""}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => handleOpenDialog()}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-hover transition-colors font-medium disabled:opacity-50 shadow-sm w-full sm:w-auto"
          >
            <MdAdd size={20} />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">
              Total Events
            </p>
            <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
          </div>
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <MdEvent size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">
              Upcoming Events
            </p>
            <p className="text-3xl font-bold text-slate-800">
              {stats.upcoming}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <MdEvent size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">
              Total Registrations
            </p>
            <p className="text-3xl font-bold text-slate-800">
              {stats.totalRegistrations}
            </p>
          </div>
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <MdPeople size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">
              Total Capacity
            </p>
            <p className="text-3xl font-bold text-slate-800">
              {stats.totalCapacity}
            </p>
          </div>
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
            <MdLocationOn size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MdSearch className="text-slate-400" size={20} />
          </div>
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
          />
        </div>

        <div className="w-full md:w-64 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary appearance-none"
          >
            <option value="all">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="w-full md:w-64 shrink-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary appearance-none"
          >
            <option value="all">All Categories</option>
            <option value="tournament">Tournament</option>
            <option value="training_camp">Training Camp</option>
            <option value="community_outreach">Community Outreach</option>
            <option value="trial">Trial</option>
            <option value="match">Match</option>
            <option value="clinic">Clinic</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-bold text-slate-600">
                <th className="p-4">Event</th>
                <th className="p-4 hidden sm:table-cell">Date & Time</th>
                <th className="p-4 hidden md:table-cell">Location</th>
                <th className="p-4">Status</th>
                <th className="p-4 hidden md:table-cell">Category</th>
                <th className="p-4 hidden sm:table-cell text-right">
                  Capacity
                </th>
                <th className="p-4 hidden lg:table-cell text-right">
                  Registrations
                </th>
                <th className="p-4 hidden sm:table-cell text-right">Price</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">
                          {event.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 max-w-[150px] sm:max-w-[200px] md:max-w-[300px] truncate">
                          {event.description}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell text-sm">
                      <p className="text-slate-800">
                        {formatDate(event.startDate)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        to {formatDate(event.endDate)}
                      </p>
                    </td>
                    <td className="p-4 hidden md:table-cell text-sm text-slate-600">
                      {event.location}
                    </td>
                    <td className="p-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-bold border ${getStatusColor(event.status)}`}
                      >
                        {event.status.charAt(0).toUpperCase() +
                          event.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 hidden md:table-cell text-sm">
                      <span
                        className={`px-2 py-1 text-xs font-bold rounded-md border ${getCategoryColor(event.category)}`}
                      >
                        {event.category
                          .split("_")
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(" ")}
                      </span>
                    </td>
                    <td className="p-4 hidden sm:table-cell text-sm text-slate-600 text-right">
                      {event.capacity}
                    </td>
                    <td className="p-4 hidden lg:table-cell text-sm text-slate-600 text-right">
                      {event.registrations || 0}
                    </td>
                    <td className="p-4 hidden sm:table-cell text-sm font-bold text-slate-800 text-right">
                      {formatCurrency(event.price)}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenDialog(event)}
                          className="p-1.5 text-[#000054] hover:bg-[#000054]/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <MdEdit size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          disabled={deleting === event.id}
                          className="p-1.5 text-[#E32845] hover:bg-[#E32845]/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === event.id ? (
                            <div className="w-5 h-5 rounded-full border-2 border-[#E32845]/30 border-t-[#E32845] animate-spin"></div>
                          ) : (
                            <MdDelete size={20} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    {events.length === 0
                      ? 'No events found. Click "Add Event" to create your first event.'
                      : "No events match your current filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Event Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#000054] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h2 className="font-bold text-lg">
                {editingEvent ? "Edit Event" : "Create New Event"}
              </h2>
              <button
                onClick={handleCloseDialog}
                className="text-white/70 hover:text-white transition-colors"
              >
                <MdClose size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary resize-y"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Start Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate.toISOString().slice(0, 16)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        startDate: new Date(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    End Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate.toISOString().slice(0, 16)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endDate: new Date(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Capacity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as Event["status"],
                      })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary appearance-none"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as Event["category"],
                      })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary appearance-none"
                  >
                    <option value="tournament">Tournament</option>
                    <option value="training_camp">Training Camp</option>
                    <option value="community_outreach">
                      Community Outreach
                    </option>
                    <option value="trial">Trial</option>
                    <option value="match">Match</option>
                    <option value="clinic">Clinic</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Price (USD)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-500 font-medium">$</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-8 p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1 flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer h-[46px] p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-white transition-colors w-full">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) =>
                        setFormData({ ...formData, isPublic: e.target.checked })
                      }
                      className="w-4 h-4 text-[#000054] focus:ring-[#000054] border-slate-300 rounded"
                    />
                    <span className="text-sm font-bold text-slate-700">
                      Public Event
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button
                onClick={handleCloseDialog}
                className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 bg-white font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  !formData.title || !formData.description || !formData.location
                }
                className="px-5 py-2.5 rounded-lg bg-[#E32845] text-white font-bold hover:bg-[#c41e3a] shadow-sm disabled:opacity-50 transition-colors"
              >
                {editingEvent ? "Update Event" : "Create Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManagement;
