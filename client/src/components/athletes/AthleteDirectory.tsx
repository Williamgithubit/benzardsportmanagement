"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  MdSearch,
  MdFilterList,
  MdAdd,
  MdClear,
  MdFileDownload,
  MdFileUpload,
  MdViewModule,
  MdViewList,
  MdRefresh,
} from "react-icons/md";
import {
  Athlete,
  AthleteFilters,
  UserRole,
  LIBERIA_COUNTIES,
  SPORTS,
  FOOTBALL_POSITIONS,
  BulkActionType,
} from "@/types/athlete";
import AthleteCard from "./AthleteCard";
import AthleteProfile from "./AthleteProfile";
import AthleteForm from "./AthleteForm";
import BulkActionsDialog from "./BulkActionsDialog";
import AthleteService from "@/services/athleteService";
import toast, { Toaster } from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchAdminAthletes } from "@/services/adminDataService";

interface AthleteDirectoryProps {
  userRole: UserRole;
  openDialog?: boolean;
  onCloseDialog?: () => void;
}

export default function AthleteDirectory({
  userRole,
  openDialog = false,
  onCloseDialog,
}: AthleteDirectoryProps) {
  // State management
  const [allAthletes, setAllAthletes] = useState<Athlete[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Dialog states
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(openDialog);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [athleteToDelete, setAthleteToDelete] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");

  // Filters and pagination
  const [filters, setFilters] = useState<AthleteFilters>({
    search: "",
    sport: "football", // Default to football as requested
    level: "all",
    county: "all",
    scoutingStatus: "all",
    position: "all",
    ageRange: {},
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0,
  });

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  // Load athletes
  const loadAthletes = useCallback(
    async (
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

        const fetchedAthletes = await fetchAdminAthletes();
        setAllAthletes(fetchedAthletes);
      } catch (error) {
        console.error("Error loading athletes:", error);
        if (showToast) {
          toast.error("Failed to load athletes");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  // Effects
  useEffect(() => {
    void loadAthletes();

    const intervalId = window.setInterval(() => {
      void loadAthletes(false, false, false);
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadAthletes]);

  useEffect(() => {
    let filteredAthletes = [...allAthletes];

    if (filters.sport && filters.sport !== "all") {
      filteredAthletes = filteredAthletes.filter(
        (athlete) => athlete.sport === filters.sport,
      );
    }

    if (filters.level && filters.level !== "all") {
      filteredAthletes = filteredAthletes.filter(
        (athlete) => athlete.level === filters.level,
      );
    }

    if (filters.county && filters.county !== "all") {
      filteredAthletes = filteredAthletes.filter(
        (athlete) => athlete.county === filters.county,
      );
    }

    if (filters.scoutingStatus && filters.scoutingStatus !== "all") {
      filteredAthletes = filteredAthletes.filter(
        (athlete) =>
          (athlete.scoutingStatus || athlete.status) === filters.scoutingStatus,
      );
    }

    if (filters.position && filters.position !== "all") {
      filteredAthletes = filteredAthletes.filter(
        (athlete) => athlete.position === filters.position,
      );
    }

    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filteredAthletes = filteredAthletes.filter(
        (athlete) =>
          athlete.name.toLowerCase().includes(searchTerm) ||
          athlete.position?.toLowerCase().includes(searchTerm) ||
          athlete.location?.toLowerCase().includes(searchTerm) ||
          athlete.bio?.toLowerCase().includes(searchTerm),
      );
    }

    const total = filteredAthletes.length;
    const totalPages = total > 0 ? Math.ceil(total / pagination.pageSize) : 0;
    const safePage = totalPages > 0 ? Math.min(pagination.page, totalPages) : 1;
    const startIndex = (safePage - 1) * pagination.pageSize;

    setAthletes(
      filteredAthletes.slice(startIndex, startIndex + pagination.pageSize),
    );
    setPagination((prev) => {
      if (
        prev.page === safePage &&
        prev.total === total &&
        prev.totalPages === totalPages
      ) {
        return prev;
      }

      return {
        ...prev,
        page: safePage,
        total,
        totalPages,
      };
    });
  }, [allAthletes, filters, pagination.page, pagination.pageSize]);

  useEffect(() => {
    setFormDialogOpen(openDialog);
  }, [openDialog]);

  // Event handlers
  const handleFilterChange = (
    key: keyof AthleteFilters,
    value: AthleteFilters[keyof AthleteFilters],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    void loadAthletes(false);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      sport: "football",
      level: "all",
      county: "all",
      scoutingStatus: "all",
      position: "all",
      ageRange: {},
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleAthleteSelect = (athleteId: string, selected: boolean) => {
    setSelectedAthletes((prev) =>
      selected ? [...prev, athleteId] : prev.filter((id) => id !== athleteId),
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedAthletes(athletes.map((a) => a.id));
    } else {
      setSelectedAthletes([]);
    }
  };

  const handleViewAthlete = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setProfileDialogOpen(true);
  };

  const handleEditAthlete = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setFormMode("edit");
    setFormDialogOpen(true);
  };

  const handleDeleteAthlete = (athleteId: string) => {
    if (!userRole.permissions.canDelete) return;
    setAthleteToDelete(athleteId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteAthlete = async () => {
    if (!athleteToDelete) return;
    try {
      await AthleteService.deleteAthlete(athleteToDelete);
      toast.success("Athlete deleted successfully");
      void loadAthletes(false);
    } catch {
      toast.error("Failed to delete athlete");
    } finally {
      setDeleteConfirmOpen(false);
      setAthleteToDelete(null);
    }
  };

  const handleAddAthlete = () => {
    setSelectedAthlete(null);
    setFormMode("add");
    setFormDialogOpen(true);
  };

  const handleFormSubmit = async (payload: {
    data: Partial<Athlete>;
    photos?: File[];
    videos?: File[];
  }) => {
    try {
      if (formMode === "add") {
        const id = await AthleteService.createAthlete(
          payload.data as Omit<Athlete, "id" | "createdAt" | "updatedAt">,
        );

        if (payload.photos && payload.photos.length > 0) {
          await Promise.all(
            payload.photos.map((file) =>
              AthleteService.uploadAthleteMedia(id, file, "photo"),
            ),
          );
        }
        if (payload.videos && payload.videos.length > 0) {
          await Promise.all(
            payload.videos.map((file) =>
              AthleteService.uploadAthleteMedia(id, file, "video"),
            ),
          );
        }

        toast.success("Athlete added successfully");
      } else if (selectedAthlete) {
        await AthleteService.updateAthlete(selectedAthlete.id, payload.data);

        if (payload.photos && payload.photos.length > 0) {
          await Promise.all(
            payload.photos.map((file) =>
              AthleteService.uploadAthleteMedia(
                selectedAthlete.id,
                file,
                "photo",
              ),
            ),
          );
        }
        if (payload.videos && payload.videos.length > 0) {
          await Promise.all(
            payload.videos.map((file) =>
              AthleteService.uploadAthleteMedia(
                selectedAthlete.id,
                file,
                "video",
              ),
            ),
          );
        }

        toast.success("Athlete updated successfully");
      }

      setFormDialogOpen(false);
      if (onCloseDialog) onCloseDialog();
      void loadAthletes(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error(`Failed to ${formMode} athlete`);
    }
  };

  const handleExport = async () => {
    try {
      const csvContent = await AthleteService.exportAthletesToCSV(filters);
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `athletes_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Athletes exported successfully");
    } catch {
      toast.error("Failed to export athletes");
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    try {
      setImporting(true);
      const csvContent = await importFile.text();
      const result = await AthleteService.importAthletesFromCSV(
        csvContent,
        "current-user-id",
      );

      toast.success(
        `Import completed: ${result.success} athletes imported${
          result.errors.length > 0 ? `, ${result.errors.length} errors` : ""
        }`,
      );

      setImportDialogOpen(false);
      setImportFile(null);
    } catch {
      toast.error("Failed to import athletes");
    } finally {
      setImporting(false);
    }
  };

  const handleBulkAction = async (
    actionType: BulkActionType,
    data?: Record<string, unknown>,
  ) => {
    try {
      await AthleteService.bulkUpdateAthletes({
        type: actionType,
        athleteIds: selectedAthletes,
        data,
      });

      toast.success("Bulk action completed successfully");

      setSelectedAthletes([]);
      setBulkDialogOpen(false);
      void loadAthletes(false);
    } catch {
      toast.error("Failed to perform bulk action");
    }
  };

  const getFilteredPositions = () => {
    switch (filters.sport) {
      case "football":
        return FOOTBALL_POSITIONS;
      default:
        return [];
    }
  };

  return (
    <div className="w-full mt-10">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#000054] mb-1">
            Athlete Directory
          </h2>
          <p className="text-slate-500 text-sm">
            Manage and discover talented athletes across Liberia
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors ${
                viewMode === "grid"
                  ? "bg-[#000054]/10 text-[#000054]"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
              title="Grid View"
            >
              <MdViewModule size={22} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${
                viewMode === "list"
                  ? "bg-[#000054]/10 text-[#000054]"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
              title="List View"
            >
              <MdViewList size={22} />
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-slate-500 hover:text-[#03045e] hover:bg-slate-100 rounded-lg border border-slate-200 bg-white transition-all shadow-sm"
            title="Refresh"
          >
            <MdRefresh size={22} className={refreshing ? "animate-spin" : ""} />
          </button>

          {userRole.permissions.canExport && (
            <button
              onClick={handleExport}
              className="p-2 text-slate-500 hover:text-[#03045e] hover:bg-slate-100 rounded-lg border border-slate-200 bg-white transition-all shadow-sm"
              title="Export to CSV"
            >
              <MdFileDownload size={22} />
            </button>
          )}

          {userRole.permissions.canImport && (
            <button
              onClick={() => setImportDialogOpen(true)}
              className="p-2 text-slate-500 hover:text-[#03045e] hover:bg-slate-100 rounded-lg border border-slate-200 bg-white transition-all shadow-sm"
              title="Import from CSV"
            >
              <MdFileUpload size={22} />
            </button>
          )}

          {userRole.permissions.canCreate && (
            <button
              onClick={handleAddAthlete}
              className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-secondary text-[#fff] font-bold rounded-lg hover:bg-secondary-hover transition-colors shadow-sm"
            >
              <MdAdd size={20} />
              Add Athlete
            </button>
          )}
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-[#03045e]">Search & Filters</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearFilters}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 transition-colors"
            >
              <MdClear size={16} /> Clear All
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm font-medium text-white bg-[#03045e] hover:bg-[#000054] px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
            >
              <MdFilterList size={16} />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
          <div className="relative flex-grow w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MdSearch className="text-slate-400" size={20} />
            </div>
            <input
              type="text"
              placeholder="Search athletes by name, position, location..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
            <span className="text-sm font-semibold text-slate-600">
              {pagination.total} athletes found
            </span>
            {selectedAthletes.length > 0 && (
              <>
                <div className="w-px h-5 bg-slate-300"></div>
                <span className="bg-[#E32845]/20 text-[#03045e] text-xs font-bold px-2 py-1 rounded">
                  {selectedAthletes.length} selected
                </span>
                <button
                  onClick={() => setBulkDialogOpen(true)}
                  disabled={!userRole.permissions.canEdit}
                  className="text-xs font-bold text-white bg-navy hover:bg-blue-800 px-3 py-1 rounded disabled:opacity-50 transition-colors"
                >
                  Bulk Actions
                </button>
              </>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">
                Sport
              </label>
              <select
                value={filters.sport}
                onChange={(e) => handleFilterChange("sport", e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="all">All Sports</option>
                {SPORTS.map((sport) => (
                  <option key={sport} value={sport}>
                    {sport.charAt(0).toUpperCase() + sport.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">
                Level
              </label>
              <select
                value={filters.level}
                onChange={(e) => handleFilterChange("level", e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="all">All Levels</option>
                <option value="grassroots">Grassroots</option>
                <option value="semi-pro">Semi-Pro</option>
                <option value="professional">Professional</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">
                County
              </label>
              <select
                value={filters.county}
                onChange={(e) => handleFilterChange("county", e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="all">All Counties</option>
                {LIBERIA_COUNTIES.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">
                Status
              </label>
              <select
                value={filters.scoutingStatus}
                onChange={(e) =>
                  handleFilterChange("scoutingStatus", e.target.value)
                }
                className="w-full p-2 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="scouted">Scouted</option>
                <option value="signed">Signed</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {getFilteredPositions().length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Position
                </label>
                <select
                  value={filters.position}
                  onChange={(e) =>
                    handleFilterChange("position", e.target.value)
                  }
                  className="w-full p-2 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="all">All Positions</option>
                  {getFilteredPositions().map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1 flex items-end">
              <label className="flex items-center gap-2 cursor-pointer h-[38px] px-2 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-200 w-full">
                <input
                  type="checkbox"
                  checked={
                    selectedAthletes.length === athletes.length &&
                    athletes.length > 0
                  }
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-primary focus:ring-primary border-slate-300 rounded"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Select All
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Grid Content */}
      {loading ? (
        <div
          className={`grid gap-6 ${
            viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1"
          }`}
        >
          {Array.from({ length: viewMode === "grid" ? 8 : 4 }).map(
            (_, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <Skeleton variant="circular" className="h-16 w-16 shrink-0" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              </div>
            ),
          )}
        </div>
      ) : athletes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdSearch size={32} />
          </div>
          <h3 className="text-lg font-bold text-navy mb-2">
            No athletes found
          </h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Try adjusting your search criteria or add new athletes to get
            started.
          </p>
          {userRole.permissions.canCreate && (
            <button
              onClick={handleAddAthlete}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#E32845] text-[#03045e] font-bold rounded-lg hover:bg-[#9de002] transition-colors shadow-sm"
            >
              <MdAdd size={20} />
              Add First Athlete
            </button>
          )}
        </div>
      ) : (
        <>
          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 justify-items-center sm:justify-items-stretch"
                : "grid-cols-1"
            }`}
          >
            {athletes.map((athlete) => (
              <div
                key={athlete.id}
                className={
                  viewMode === "list"
                    ? "w-full max-w-4xl mx-auto flex justify-center"
                    : "flex justify-center"
                }
              >
                <AthleteCard
                  athlete={athlete}
                  userRole={userRole}
                  onView={handleViewAthlete}
                  onEdit={handleEditAthlete}
                  onDelete={handleDeleteAthlete}
                  onSelect={handleAthleteSelect}
                  selected={selectedAthletes.includes(athlete.id)}
                  showSelection={selectedAthletes.length > 0 || showFilters}
                />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-10">
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                <button
                  onClick={() =>
                    handlePageChange(Math.max(1, pagination.page - 1))
                  }
                  disabled={pagination.page === 1}
                  className="p-1 px-3 text-sm font-medium rounded hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                >
                  Prev
                </button>

                {Array.from(
                  { length: pagination.totalPages },
                  (_, i) => i + 1,
                ).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => handlePageChange(pg)}
                    className={`w-8 h-8 flex items-center justify-center rounded text-sm font-bold transition-colors ${
                      pagination.page === pg
                        ? "bg-[#E32845] text-[#03045e]"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  onClick={() =>
                    handlePageChange(
                      Math.min(pagination.totalPages, pagination.page + 1),
                    )
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="p-1 px-3 text-sm font-medium rounded hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Floating Action Button for Mobile */}
      {userRole.permissions.canCreate && (
        <button
          onClick={handleAddAthlete}
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-[#E32845] text-[#03045e] rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40"
        >
          <MdAdd size={28} />
        </button>
      )}

      {/* Dialogs */}
      <AthleteProfile
        athlete={selectedAthlete}
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        onEdit={handleEditAthlete}
        userRole={userRole}
      />

      <AthleteForm
        athlete={formMode === "edit" ? selectedAthlete : null}
        open={formDialogOpen}
        onClose={() => {
          setFormDialogOpen(false);
          if (onCloseDialog) onCloseDialog();
        }}
        onSubmit={handleFormSubmit}
        mode={formMode}
        userRole={userRole}
      />

      <BulkActionsDialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        selectedCount={selectedAthletes.length}
        onAction={handleBulkAction}
        userRole={userRole}
      />

      {/* Import Dialog */}
      {importDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm animate-in fade-in">
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#03045e] text-white px-6 py-4 flex items-center justify-between">
              <h2 className="font-bold text-lg">Import from CSV</h2>
              <button
                onClick={() => setImportDialogOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <MdClear size={24} />
              </button>
            </div>
            <div className="p-6">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#E32845] file:text-[#03045e] hover:file:bg-[#9de002] transition-colors mb-4"
              />
              <p className="text-sm text-slate-500 mb-2">
                Upload a CSV file containing athlete data. Ensure columns match
                the expected format (name, sport, position, level...).
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setImportDialogOpen(false)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importFile || importing}
                className="px-4 py-2 font-bold bg-[#E32845] text-[#03045e] rounded-md hover:bg-[#9de002] disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {importing && (
                  <div className="w-4 h-4 rounded-full border-2 border-[#03045e]/30 border-t-[#03045e] animate-spin"></div>
                )}
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm animate-in fade-in">
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5">
              <h2 className="font-bold text-xl text-slate-800 mb-2">
                Confirm Delete
              </h2>
              <p className="text-slate-600 font-medium">
                Are you sure you want to delete{" "}
                <span className="font-bold text-red-600">
                  {athleteToDelete
                    ? athletes.find((a) => a.id === athleteToDelete)?.name ||
                      "this athlete"
                    : "this athlete"}
                </span>
                ?
                <br />
                <span className="text-sm text-slate-500 mt-1 block">
                  This action cannot be undone.
                </span>
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAthlete}
                className="px-4 py-2 font-bold bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}