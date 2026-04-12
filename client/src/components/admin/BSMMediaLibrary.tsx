import React, { useState, useEffect, useRef } from "react";
import {
  MdCloudUpload,
  MdDelete,
  MdSearch,
  MdViewModule,
  MdViewList,
  MdImage,
  MdVideoFile,
  MdMoreVert,
  MdPhotoLibrary,
  MdContentCopy,
} from "react-icons/md";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/services/firebase";
import {
  MediaAsset,
  MediaFilters,
  BulkUploadProgress,
  BSM_MEDIA_FOLDERS,
  BSM_MEDIA_TAGS,
} from "@/types/media";
import {
  bulkUploadMedia,
  getMediaAssets,
  deleteMediaAsset,
  generateOptimizedUrl,
} from "@/services/cloudinaryService";
import {
  getUserMediaPermissions,
  canUserPerformAction,
} from "@/services/bsmMediaService";
import toast, { Toaster } from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";

interface BSMMediaLibraryProps {
  onSelectMedia?: (media: MediaAsset) => void;
  selectionMode?: boolean;
  allowedTypes?: Array<"image" | "video">;
  category?: "athlete" | "event" | "blog" | "general";
}

const BSMMediaLibrary: React.FC<BSMMediaLibraryProps> = ({
  onSelectMedia,
  selectionMode = false,
  allowedTypes = ["image", "video"],
  category,
}) => {
  const [user] = useAuthState(auth);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] =
    useState<BulkUploadProgress | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<MediaAsset | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters] = useState<MediaFilters>({
    search: "",
    category: category || "",
    resourceType: "",
    folder: "",
    tags: [],
  });
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // TODO: Get real role from context
  const userRole = "admin";
  const permissions = getUserMediaPermissions(userRole);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadMediaAssets = async (showLoader = true, showToast = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const { assets } = await getMediaAssets(filters, 1, 50);
      setMediaAssets(assets);
    } catch (error) {
      console.error("Error loading media assets:", error);
      if (showToast) {
        toast.error("Failed to load media assets");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMediaAssets();

    const intervalId = window.setInterval(() => {
      void loadMediaAssets(false, false);
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !user || !permissions.canUpload) return;

    const fileArray = Array.from(files);

    // Validate files
    for (const file of fileArray) {
      if (file.size > permissions.maxFileSize) {
        toast.error(`File ${file.name} exceeds size limit`);
        return;
      }
    }

    try {
      setUploading(true);

      const folder = category
        ? `${BSM_MEDIA_FOLDERS.ATHLETES}`
        : BSM_MEDIA_FOLDERS.GENERAL;

      await bulkUploadMedia(
        fileArray,
        {
          folder,
          category: category || "general",
          tags: [BSM_MEDIA_TAGS.FEATURED],
        },
        (progress) => setUploadProgress(progress),
      );

      toast.success("Files uploaded successfully");
      loadMediaAssets();
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDeleteMedia = async () => {
    if (
      !mediaToDelete ||
      !canUserPerformAction(userRole, "delete", mediaToDelete)
    )
      return;

    try {
      await deleteMediaAsset(
        mediaToDelete.publicId,
        mediaToDelete.resourceType,
      );

      toast.success("Media deleted successfully");
      setDeleteConfirmOpen(false);
      setMediaToDelete(null);
      loadMediaAssets();
    } catch (error) {
      console.error("Error deleting media:", error);
      toast.error("Failed to delete media");
    }
  };

  const handleCopyUrl = (asset: MediaAsset) => {
    const optimizedUrl = generateOptimizedUrl(asset.publicId, {
      quality: "auto",
      format: "auto",
    });
    navigator.clipboard.writeText(optimizedUrl);
    toast.success("URL copied to clipboard");
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

  const filteredAssets = mediaAssets.filter((asset) => {
    const matchesSearch =
      asset.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.originalFilename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.caption &&
        asset.caption.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType =
      allowedTypes.length === 0 ||
      allowedTypes.includes(asset.resourceType as "image" | "video");

    return matchesSearch && matchesType;
  });

  const assetsByType = {
    all: filteredAssets,
    image: filteredAssets.filter((a) => a.resourceType === "image"),
    video: filteredAssets.filter((a) => a.resourceType === "video"),
  };

  const currentAssets = Object.values(assetsByType)[currentTab] || [];

  const renderTabs = () => {
    const tabs = [
      { id: 0, label: "All Files", count: assetsByType.all.length, icon: null },
      {
        id: 1,
        label: "Images",
        count: assetsByType.image.length,
        icon: <MdImage size={18} />,
      },
      {
        id: 2,
        label: "Videos",
        count: assetsByType.video.length,
        icon: <MdVideoFile size={18} />,
      },
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

  const renderMainMenu = (asset: MediaAsset) => (
    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-10 animate-in fade-in zoom-in-95 duration-100">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleCopyUrl(asset);
          handleMenuClose();
        }}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
      >
        <MdContentCopy size={18} className="text-slate-400" /> Copy URL
      </button>

      {permissions.canDelete && (
        <>
          <div className="h-px bg-slate-100 my-1"></div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMediaToDelete(asset);
              setDeleteConfirmOpen(true);
              handleMenuClose();
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
          >
            <MdDelete size={18} className="text-red-500" /> Delete
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="w-full relative">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="font-bold text-2xl md:text-3xl text-[#000054] flex items-center gap-2">
          <MdPhotoLibrary size={32} />
          BSM Media Library
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {permissions.canUpload && (
            <label className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#000054] text-white rounded-lg hover:bg-[#1a1a6e] transition-colors font-bold shadow-sm cursor-pointer disabled:opacity-50 flex-grow sm:flex-grow-0">
              <MdCloudUpload size={20} />
              <span>Upload</span>
              <input
                accept="image/*,video/*"
                className="hidden"
                type="file"
                multiple
                disabled={uploading}
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </label>
          )}

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

      {/* Upload Progress */}
      {uploading && uploadProgress && (
        <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
            <span>
              Uploading {uploadProgress.current}... ({uploadProgress.completed}/
              {uploadProgress.total})
            </span>
            <span>
              {Math.round(
                (uploadProgress.completed / uploadProgress.total) * 100,
              )}
              %
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-[#000054] h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(uploadProgress.completed / uploadProgress.total) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 items-center rounded-xl border border-slate-200 shadow-sm mb-6 flex">
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
      </div>

      {renderTabs()}

      {/* Content Area */}
      {loading ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
              : "flex flex-col gap-3"
          }
        >
          {Array.from({ length: viewMode === "grid" ? 8 : 5 }).map(
            (_, index) =>
              viewMode === "grid" ? (
                <div
                  key={index}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  <Skeleton className="h-48 w-full rounded-none" />
                  <div className="space-y-3 p-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  key={index}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <Skeleton className="h-16 w-16 rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              ),
          )}
        </div>
      ) : currentAssets.length === 0 ? (
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
          {currentAssets.map((asset) =>
            viewMode === "grid" ? (
              // Grid View Card
              <div
                key={asset.id}
                className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-[#000054] transition-all group ${selectionMode ? "cursor-pointer" : ""}`}
                onClick={() =>
                  selectionMode && onSelectMedia && onSelectMedia(asset)
                }
              >
                <div className="h-48 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                  {asset.resourceType === "image" ? (
                    <img
                      src={generateOptimizedUrl(asset.publicId, {
                        width: 400,
                        height: 300,
                        crop: "fill",
                        quality: "auto",
                        format: "auto",
                      })}
                      alt={asset.altText || asset.originalFilename}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                      <MdVideoFile size={32} className="text-purple-500" />
                    </div>
                  )}
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
                      {asset.originalFilename}
                    </p>
                  </div>

                  <p className="text-xs text-slate-500 font-medium mb-2">
                    {Math.round(asset.bytes / 1024)} KB &bull;{" "}
                    {new Date(asset.uploadedAt).toLocaleDateString()}
                  </p>

                  {asset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {asset.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded border border-slate-200"
                        >
                          {tag}
                        </span>
                      ))}
                      {asset.tags.length > 2 && (
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded border border-slate-200">
                          +{asset.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-2">
                    <span className="text-xs text-slate-400 uppercase font-bold">
                      {asset.category}
                    </span>
                    <div
                      className="relative"
                      ref={activeMenuId === asset.id ? menuRef : null}
                    >
                      <button
                        onClick={(e) => handleMenuClick(e, asset.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        <MdMoreVert size={20} />
                      </button>
                      {activeMenuId === asset.id && renderMainMenu(asset)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // List View Card
              <div
                key={asset.id}
                className={`bg-white rounded-xl border border-slate-200 shadow-sm p-3 hover:border-[#000054] transition-all flex items-center gap-4 group ${selectionMode ? "cursor-pointer" : ""}`}
                onClick={() =>
                  selectionMode && onSelectMedia && onSelectMedia(asset)
                }
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center">
                  {asset.resourceType === "image" ? (
                    <img
                      src={generateOptimizedUrl(asset.publicId, {
                        width: 100,
                        height: 100,
                        crop: "fill",
                        quality: "auto",
                        format: "auto",
                      })}
                      alt={asset.originalFilename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <MdVideoFile size={28} className="text-purple-500" />
                  )}
                </div>

                <div className="flex-grow min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">
                    {asset.originalFilename}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1">
                    <span>{Math.round(asset.bytes / 1024)} KB</span>
                    <span>
                      {new Date(asset.uploadedAt).toLocaleDateString()}
                    </span>
                    <span className="hidden md:inline bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-bold text-slate-600">
                      {asset.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 px-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyUrl(asset);
                    }}
                    className="p-2 text-slate-400 hover:text-[#000054] hover:bg-slate-100 rounded-lg transition-colors hidden sm:block"
                    title="Copy URL"
                  >
                    <MdContentCopy size={20} />
                  </button>
                  {permissions.canDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMediaToDelete(asset);
                        setDeleteConfirmOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <MdDelete size={20} />
                    </button>
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmOpen && mediaToDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setDeleteConfirmOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
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
                  &quot;{mediaToDelete.originalFilename}&quot;
                </strong>
                ?
              </p>
              <p className="text-xs text-red-500 font-medium mt-2">
                This action cannot be undone.
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BSMMediaLibrary;
