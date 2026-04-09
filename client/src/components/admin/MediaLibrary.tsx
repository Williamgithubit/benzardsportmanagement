import React, { useState, useEffect, useRef } from "react";
import {
  MdCloudUpload,
  MdDelete,
  MdEdit,
  MdDownload,
  MdSearch,
  MdFilterList,
  MdViewModule,
  MdViewList,
  MdFolder,
  MdImage,
  MdVideoFile,
  MdAudioFile,
  MdPictureAsPdf,
  MdDescription,
  MdMoreVert,
  MdPhotoLibrary,
  MdInfo,
  MdContentCopy,
  MdClose,
} from "react-icons/md";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/services/firebase";
import {
  MediaFile,
  UploadMediaData,
  UpdateMediaData,
  MediaFilters,
  uploadMediaFile,
  getMediaFiles,
  updateMediaFile,
  deleteMediaFile,
  getMediaFolders,
  getMediaTags,
  getStorageStats,
  formatFileSize,
  isSupportedFileType,
  getMaxFileSize,
} from "@/services/mediaService";
import toast, { Toaster } from "react-hot-toast";

interface MediaLibraryProps {
  openDialog?: boolean;
  onCloseDialog?: () => void;
  onSelectMedia?: (media: MediaFile) => void;
  selectionMode?: boolean;
  allowedTypes?: string[];
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({
  openDialog,
  onCloseDialog,
  onSelectMedia,
  selectionMode = false,
  allowedTypes = [],
}) => {
  const [user] = useAuthState(auth);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingMedia, setEditingMedia] = useState<MediaFile | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<MediaFile | null>(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<MediaFilters>({});
  const [folders, setFolders] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [storageStats, setStorageStats] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // Form state
  const [uploadData, setUploadData] = useState<Partial<UploadMediaData>>({
    folder: "general",
    alt: "",
    caption: "",
    tags: [],
  });

  const [editData, setEditData] = useState<Partial<UpdateMediaData>>({
    alt: "",
    caption: "",
    tags: [],
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    loadMediaFiles();
    loadFolders();
    loadTags();
    loadStorageStats();
  }, [filters]);

  const loadMediaFiles = async () => {
    try {
      setLoading(true);
      const files = await getMediaFiles(filters);
      setMediaFiles(files);
    } catch (error) {
      console.error("Error loading media files:", error);
      toast.error("Failed to load media files");
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const fetchedFolders = await getMediaFolders();
      setFolders(fetchedFolders);
    } catch (error) {
      console.error("Error loading folders:", error);
    }
  };

  const loadTags = async () => {
    try {
      const fetchedTags = await getMediaTags();
      setTags(fetchedTags);
    } catch (error) {
      console.error("Error loading tags:", error);
    }
  };

  const loadStorageStats = async () => {
    try {
      const stats = await getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error("Error loading storage stats:", error);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !user) return;

    const file = files[0];
    if (!isSupportedFileType(file)) {
      toast.error("File type not supported");
      return;
    }

    const maxSize = getMaxFileSize(file.type);
    if (file.size > maxSize) {
      toast.error(`File size exceeds ${formatFileSize(maxSize)} limit`);
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const uploadMediaData: UploadMediaData = {
        file,
        folder: uploadData.folder || "general",
        alt: uploadData.alt || "",
        caption: uploadData.caption || "",
        tags: uploadData.tags || [],
      };

      await uploadMediaFile(
        uploadMediaData,
        user.uid,
        user.displayName || user.email || "Unknown",
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success("File uploaded successfully");

      // Reset form
      setUploadData({
        folder: "general",
        alt: "",
        caption: "",
        tags: [],
      });

      // Reload data
      loadMediaFiles();
      loadFolders();
      loadTags();
      loadStorageStats();
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUpdateMedia = async () => {
    if (!editingMedia) return;

    try {
      const updateMediaData: UpdateMediaData = {
        id: editingMedia.id,
        alt: editData.alt,
        caption: editData.caption,
        tags: editData.tags,
      };

      await updateMediaFile(updateMediaData);

      toast.success("Media updated successfully");
      setEditingMedia(null);
      loadMediaFiles();
      loadTags();
    } catch (error) {
      console.error("Error updating media:", error);
      toast.error("Failed to update media");
    }
  };

  const handleDeleteMedia = async () => {
    if (!mediaToDelete) return;

    try {
      await deleteMediaFile(mediaToDelete);

      toast.success("Media deleted successfully");
      setDeleteConfirmOpen(false);
      setMediaToDelete(null);
      loadMediaFiles();
      loadStorageStats();
    } catch (error) {
      console.error("Error deleting media:", error);
      toast.error("Failed to delete media");
    }
  };

  const handleMediaSelect = (media: MediaFile) => {
    if (selectionMode && onSelectMedia) {
      onSelectMedia(media);
      if (onCloseDialog) onCloseDialog();
    } else {
      setSelectedMedia(media);
      setInfoDialogOpen(true);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const getFileIcon = (type: string, size: number = 24) => {
    switch (type) {
      case "image":
        return <MdImage size={size} className="text-blue-500" />;
      case "video":
        return <MdVideoFile size={size} className="text-purple-500" />;
      case "audio":
        return <MdAudioFile size={size} className="text-amber-500" />;
      case "pdf":
        return <MdPictureAsPdf size={size} className="text-red-500" />;
      case "document":
        return <MdDescription size={size} className="text-indigo-500" />;
      default:
        return <MdDescription size={size} className="text-slate-500" />;
    }
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    mediaId: string,
  ) => {
    event.stopPropagation();
    setActiveMenuId(activeMenuId === mediaId ? null : mediaId);
  };

  const handleMenuClose = () => {
    setActiveMenuId(null);
  };

  const filteredMediaFiles = mediaFiles.filter((media) => {
    const matchesSearch =
      media.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      media.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (media.alt &&
        media.alt.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (media.caption &&
        media.caption.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType =
      allowedTypes.length === 0 || allowedTypes.includes(media.type);

    return matchesSearch && matchesType;
  });

  const filesByType = {
    all: filteredMediaFiles,
    image: filteredMediaFiles.filter((f) => f.type === "image"),
    video: filteredMediaFiles.filter((f) => f.type === "video"),
    audio: filteredMediaFiles.filter((f) => f.type === "audio"),
    document: filteredMediaFiles.filter((f) =>
      ["pdf", "document", "spreadsheet"].includes(f.type),
    ),
    other: filteredMediaFiles.filter((f) => f.type === "other"),
  };

  const currentFiles = Object.values(filesByType)[currentTab] || [];

  const renderTabs = () => {
    const tabs = [
      { id: 0, label: "All Files", count: filesByType.all.length, icon: null },
      {
        id: 1,
        label: "Images",
        count: filesByType.image.length,
        icon: <MdImage size={18} />,
      },
      {
        id: 2,
        label: "Videos",
        count: filesByType.video.length,
        icon: <MdVideoFile size={18} />,
      },
      {
        id: 3,
        label: "Audio",
        count: filesByType.audio.length,
        icon: <MdAudioFile size={18} />,
      },
      {
        id: 4,
        label: "Documents",
        count: filesByType.document.length,
        icon: <MdDescription size={18} />,
      },
      { id: 5, label: "Other", count: filesByType.other.length, icon: null },
    ];

    return (
      <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-200 mb-6 bg-white rounded-t-xl px-2 pt-2 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
              currentTab === tab.id
                ? "border-[#000054] text-[#000054]"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            {tab.icon}
            {tab.label}
            <span
              className={`inline-flex items-center justify-center px-2 py-0.5 ml-1 text-xs font-bold rounded-full ${
                currentTab === tab.id
                  ? "bg-[#000054] text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>
    );
  };

  const renderMainMenu = (media: MediaFile) => (
    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-10 animate-in fade-in zoom-in-95 duration-100">
      <button
        onClick={() => {
          handleCopyUrl(media.url);
          handleMenuClose();
        }}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
      >
        <MdContentCopy size={18} className="text-slate-400" /> Copy URL
      </button>
      <button
        onClick={() => {
          setEditingMedia(media);
          setEditData({
            alt: media.alt,
            caption: media.caption,
            tags: media.tags,
          });
          handleMenuClose();
        }}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
      >
        <MdEdit size={18} className="text-slate-400" /> Edit
      </button>
      <button
        onClick={() => {
          const link = document.createElement("a");
          link.href = media.url;
          link.download = media.originalName;
          link.click();
          handleMenuClose();
        }}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
      >
        <MdDownload size={18} className="text-slate-400" /> Download
      </button>
      <div className="h-px bg-slate-100 my-1"></div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setMediaToDelete(media);
          setDeleteConfirmOpen(true);
          handleMenuClose();
        }}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
      >
        <MdDelete size={18} className="text-red-500" /> Delete
      </button>
    </div>
  );

  const libraryContent = (
    <div className="w-full bg-slate-50 min-h-screen">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-extrabold text-[#000054] flex items-center gap-2">
          <MdPhotoLibrary size={32} />
          Media Library
        </h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#E32845] text-white rounded-lg hover:bg-[#c41e3a] transition-colors font-bold shadow-sm cursor-pointer disabled:opacity-50 flex-grow sm:flex-grow-0">
            <MdCloudUpload size={20} />
            <span>Upload</span>
            <input
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
              className="hidden"
              type="file"
              disabled={uploading}
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </label>

          <div className="flex bg-white rounded-lg border border-slate-200 overflow-hidden shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors ${viewMode === "grid" ? "bg-slate-100 text-[#000054]" : "text-slate-500 hover:text-slate-700"}`}
            >
              <MdViewModule size={24} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${viewMode === "list" ? "bg-slate-100 text-[#000054]" : "text-slate-500 hover:text-slate-700"}`}
            >
              <MdViewList size={24} />
            </button>
          </div>
        </div>
      </div>

      {uploading && (
        <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-[#ADF802] h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MdSearch className="text-slate-400" size={20} />
          </div>
          <input
            type="text"
            placeholder="Search media files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
          />
        </div>

        <div className="w-full md:w-64 shrink-0">
          <select
            value={filters.folder || "all"}
            onChange={(e) =>
              setFilters({
                ...filters,
                folder: e.target.value === "all" ? undefined : e.target.value,
              })
            }
            className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary appearance-none font-medium"
          >
            <option value="all">All Folders</option>
            {folders.map((folder) => (
              <option key={folder} value={folder}>
                {folder}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-auto shrink-0 text-right md:text-left text-sm text-slate-500 font-medium whitespace-nowrap">
          {currentFiles.length} files
          {storageStats &&
            ` &bullet; ${formatFileSize((storageStats as Record<string, unknown>).totalSize as number)} used`}
        </div>
      </div>

      {renderTabs()}

      {/* Content Area */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary animate-spin"></div>
        </div>
      ) : currentFiles.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
          <MdPhotoLibrary size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-600 mb-2">
            No media files found
          </h3>
          <p className="text-slate-500">Upload some files to get started.</p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              : "flex flex-col gap-3"
          }
        >
          {currentFiles.map((media) =>
            viewMode === "grid" ? (
              // Grid View Card
              <div
                key={media.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-[#ADF802] transition-all cursor-pointer group"
                onClick={() => handleMediaSelect(media)}
              >
                <div className="h-48 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                  {media.type === "image" ? (
                    <img
                      src={media.url}
                      alt={media.alt || media.originalName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                      {getFileIcon(media.type, 32)}
                    </div>
                  )}
                  {/* Select overlay purely for visual feedback in selection mode */}
                  {selectionMode && (
                    <div className="absolute inset-0 bg-[#000054]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-4 py-2 bg-white text-[#000054] font-bold rounded-lg shadow-lg">
                        Select Media
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-slate-800 text-sm truncate pr-2">
                      {media.originalName}
                    </p>
                    <div
                      className="relative"
                      ref={activeMenuId === media.id ? menuRef : null}
                    >
                      <button
                        onClick={(e) => handleMenuClick(e, media.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        <MdMoreVert size={20} />
                      </button>
                      {activeMenuId === media.id && renderMainMenu(media)}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 font-medium mb-2">
                    {formatFileSize(media.size)} &bull;{" "}
                    {media.uploadedAt?.toDate?.()?.toLocaleDateString()}
                  </p>

                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                      {media.uploadedByName.charAt(0)}
                    </div>
                    <span className="text-xs text-slate-600 truncate">
                      {media.uploadedByName}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              // List View Card
              <div
                key={media.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 hover:border-primary/30 transition-all cursor-pointer flex items-center gap-4 group"
                onClick={() => handleMediaSelect(media)}
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center">
                  {media.type === "image" ? (
                    <img
                      src={media.url}
                      alt={media.originalName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getFileIcon(media.type, 28)
                  )}
                </div>

                <div className="flex-grow min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">
                    {media.originalName}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1">
                    <span>{formatFileSize(media.size)}</span>
                    <span>
                      {media.uploadedAt?.toDate?.()?.toLocaleDateString()}
                    </span>
                    <span className="hidden sm:inline">
                      By {media.uploadedByName}
                    </span>
                    <span className="hidden md:inline bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {media.folder}
                    </span>
                  </div>
                </div>

                <div
                  className="flex items-center gap-1 shrink-0 px-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setEditingMedia(media)}
                    className="p-2 text-slate-400 hover:text-[#000054] hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <MdEdit size={20} />
                  </button>
                  <button
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = media.url;
                      link.download = media.originalName;
                      link.click();
                    }}
                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-slate-100 rounded-lg transition-colors hidden sm:block"
                    title="Download"
                  >
                    <MdDownload size={20} />
                  </button>
                  <button
                    onClick={() => {
                      setMediaToDelete(media);
                      setDeleteConfirmOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <MdDelete size={20} />
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {/* Edit Media Dialog */}
      {editingMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-[#1a1a1a] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h2 className="font-bold text-lg">Edit Media Details</h2>
              <button
                onClick={() => setEditingMedia(null)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <MdClose size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Alt Text
                </label>
                <input
                  type="text"
                  value={editData.alt || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, alt: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Caption
                </label>
                <textarea
                  rows={2}
                  value={editData.caption || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, caption: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary resize-y"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={editData.tags?.join(", ") || ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      tags: e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter((tag) => tag),
                    })
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setEditingMedia(null)}
                className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 bg-white font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateMedia}
                className="px-6 py-2.5 rounded-lg bg-[#E32845] text-white font-bold hover:bg-[#c41e3a] transition-colors shadow-sm"
              >
                Update Media
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Dialog */}
      {infoDialogOpen && selectedMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setInfoDialogOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full md:w-1/2 bg-slate-100 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-slate-200 shrink-0 relative">
              <button
                onClick={() => setInfoDialogOpen(false)}
                className="absolute top-4 right-4 md:hidden text-slate-500 hover:bg-slate-200 transition-colors rounded-full p-1 bg-white shadow-sm z-10"
              >
                <MdClose size={24} />
              </button>
              {selectedMedia.type === "image" ? (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.originalName}
                  className="max-w-full max-h-[40vh] md:max-h-[70vh] object-contain drop-shadow-md rounded"
                />
              ) : (
                getFileIcon(selectedMedia.type, 96)
              )}
            </div>

            <div className="w-full md:w-1/2 flex flex-col h-full">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0 bg-white">
                <h3 className="font-bold text-lg text-slate-800 truncate pr-4">
                  {selectedMedia.originalName}
                </h3>
                <button
                  onClick={() => setInfoDialogOpen(false)}
                  className="hidden md:block text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <MdClose size={24} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-grow bg-white space-y-4">
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500">
                      File Type
                    </span>
                    <span className="text-sm font-bold text-slate-800 uppercase px-2 py-0.5 bg-white border border-slate-200 rounded">
                      {selectedMedia.type}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500">
                      File Size
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {formatFileSize(selectedMedia.size)}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500">
                      Folder
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {selectedMedia.folder}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500">
                      Uploaded By
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {selectedMedia.uploadedByName}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500">
                      Upload Date
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {selectedMedia.uploadedAt?.toDate?.()?.toLocaleString()}
                    </span>
                  </div>
                </div>

                {(selectedMedia.alt || selectedMedia.caption) && (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    {selectedMedia.alt && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                          Alt Text
                        </p>
                        <p className="text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-200">
                          {selectedMedia.alt}
                        </p>
                      </div>
                    )}
                    {selectedMedia.caption && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                          Caption
                        </p>
                        <p className="text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-200 italic">
                          {selectedMedia.caption}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedMedia.tags.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMedia.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-[#ADF802]/20 text-[#000054] text-xs font-bold rounded-md border border-[#ADF802]/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                    File URL
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={selectedMedia.url}
                      className="w-full text-xs p-2 rounded bg-slate-50 border border-slate-200 text-slate-500 focus:outline-none"
                    />
                    <button
                      onClick={() => handleCopyUrl(selectedMedia.url)}
                      className="p-2 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
                      title="Copy URL"
                    >
                      <MdContentCopy size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {selectionMode && (
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
                  <button
                    onClick={() => {
                      if (onSelectMedia) onSelectMedia(selectedMedia);
                      setInfoDialogOpen(false);
                      if (onCloseDialog) onCloseDialog();
                    }}
                    className="w-full px-6 py-3 rounded-xl bg-[#000054] text-white font-bold hover:bg-[#1a1a6e] transition-colors shadow-sm"
                  >
                    Select This Media
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmOpen && mediaToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdDelete size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Delete Media
              </h2>
              <p className="text-sm text-slate-600 mb-1">
                Are you sure you want to delete{" "}
                <strong className="text-slate-800 break-all">
                  &quot;{mediaToDelete.originalName}&quot;
                </strong>
                ?
              </p>
              <p className="text-xs text-red-500 font-medium mt-2">
                This action cannot be undone and will permanently remove the
                file from storage.
              </p>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex gap-3 border-t border-slate-200">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMedia}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
              >
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // If used as a standalone page vs a dialog component
  if (typeof openDialog === "boolean") {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-white sm:bg-navy/80 sm:backdrop-blur-sm sm:p-4 animate-in fade-in ${openDialog ? "block" : "hidden"}`}
      >
        <div className="bg-slate-50 w-full sm:rounded-2xl sm:shadow-2xl h-full sm:h-[90vh] sm:max-w-7xl overflow-hidden flex flex-col relative flex-grow">
          <div className="bg-[#000054] text-white px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 z-10 w-full">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <MdPhotoLibrary size={24} />
              {selectionMode ? "Select Media" : "Media Library"}
            </h2>
            <button
              onClick={() => {
                if (onCloseDialog) onCloseDialog();
              }}
              className="text-white/70 hover:text-white transition-colors"
            >
              <MdClose size={24} />
            </button>
          </div>
          <div className="overflow-y-auto flex-grow p-4 sm:p-6 pb-20 sm:pb-6 relative z-0">
            {libraryContent}
          </div>
        </div>
      </div>
    );
  }

  // Standalone page
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{libraryContent}</div>
  );
};

export default MediaLibrary;
