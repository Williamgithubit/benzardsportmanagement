import React, { useState } from "react";
import { MdClose, MdCloudUpload } from "react-icons/md";
import { MediaAsset, MediaPickerOptions, MediaUploadOptions } from "@/types/media";
import BSMMediaLibrary from "./BSMMediaLibrary";
import { uploadMediaToBSM } from "@/services/cloudinaryService";

interface MediaPickerProps extends MediaPickerOptions {
  open: boolean;
  onClose: () => void;
  title?: string;
}

const MediaPicker: React.FC<MediaPickerProps> = ({
  open,
  onClose,
  title = "Select Media",
  allowMultiple = false,
  allowedTypes = ["image", "video"],
  maxFileSize = 10 * 1024 * 1024,
  category = "blog",
  folder,
  onSelect,
  onCancel,
}) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedAssets, setSelectedAssets] = useState<MediaAsset[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleClose = () => {
    setSelectedAssets([]);
    if (onCancel) onCancel();
    onClose();
  };

  const handleSelect = () => {
    if (selectedAssets.length > 0) {
      onSelect(selectedAssets);
      setSelectedAssets([]);
      onClose();
    }
  };

  const handleMediaSelect = (asset: MediaAsset) => {
    if (allowMultiple) {
      setSelectedAssets((prev) => {
        const found = prev.find((p) => p.id === asset.id);
        if (found) return prev.filter((p) => p.id !== asset.id);
        return [...prev, asset];
      });
    } else {
      onSelect([asset]);
      onClose();
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    try {
      setUploading(true);
      const uploaded: MediaAsset[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > maxFileSize) {
          console.warn(`File ${file.name} exceeds size limit`);
          continue;
        }

        const isValid = allowedTypes.some((t) =>
          t === "image"
            ? file.type.startsWith("image/")
            : file.type.startsWith("video/"),
        );
        if (!isValid) {
          console.warn(`File ${file.name} is not an allowed type`);
          continue;
        }

        const options: MediaUploadOptions = {
          folder: folder || (category === "blog" ? "bsm/blog" : "bsm/general"),
          category: (category as "athlete" | "event" | "blog" | "general") || "general",
          tags: [],
        };

        try {
          const asset = await uploadMediaToBSM(file, options);
          uploaded.push(asset);
        } catch (err) {
          console.error("Upload error", err);
        }
      }

      if (uploaded.length) {
        if (allowMultiple) setSelectedAssets((p) => [...p, ...uploaded]);
        else {
          onSelect(uploaded);
          onClose();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="bg-[#000054] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="font-bold text-lg">{title}</h2>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex flex-col flex-grow overflow-hidden relative bg-slate-50">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-white shrink-0">
            <button
              onClick={() => setCurrentTab(0)}
              className={`flex-1 py-4 font-bold text-sm text-center border-b-2 transition-colors ${currentTab === 0 ? "border-[#000054] text-[#000054]" : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"}`}
            >
              Media Library
            </button>
            <button
              onClick={() => setCurrentTab(1)}
              disabled={uploading}
              className={`flex-1 py-4 font-bold text-sm text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${currentTab === 1 ? "border-[#000054] text-[#000054]" : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"} disabled:opacity-50`}
            >
              <MdCloudUpload size={20} />
              Upload New
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-grow overflow-y-auto">
            {currentTab === 0 && (
              <div className="h-full">
                <BSMMediaLibrary
                  onSelectMedia={handleMediaSelect}
                  selectionMode
                  allowedTypes={allowedTypes}
                  category={category}
                />
              </div>
            )}

            {currentTab === 1 && (
              <div className="p-8 h-full flex flex-col items-center justify-center">
                <input
                  accept={
                    allowedTypes.includes("image") &&
                    allowedTypes.includes("video")
                      ? "image/*,video/*"
                      : allowedTypes.includes("image")
                        ? "image/*"
                        : "video/*"
                  }
                  style={{ display: "none" }}
                  id="media-picker-upload"
                  type="file"
                  multiple={allowMultiple}
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <label
                  htmlFor="media-picker-upload"
                  className="w-full max-w-2xl"
                >
                  <div className="border-4 border-dashed border-slate-300 rounded-3xl p-12 text-center cursor-pointer hover:border-[#ADF802] hover:bg-[#ADF802]/5 transition-all group">
                    <MdCloudUpload
                      className="mx-auto text-slate-400 group-hover:text-[#ADF802] transition-colors mb-4"
                      size={80}
                    />
                    <h3 className="text-2xl font-bold text-slate-700 mb-2">
                      {uploading ? "Uploading..." : "Click to upload files"}
                    </h3>
                    <p className="text-slate-500 mb-6">
                      Drag and drop files here or click to browse
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 text-sm font-medium text-slate-500">
                      <span className="bg-white px-3 py-1 rounded-full border border-slate-200">
                        Max file size: {Math.round(maxFileSize / (1024 * 1024))}
                        MB
                      </span>
                      <span className="bg-white px-3 py-1 rounded-full border border-slate-200">
                        Allowed types: {allowedTypes.join(", ")}
                      </span>
                    </div>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Footer (Multiple Selection) */}
        {allowMultiple && selectedAssets.length > 0 && (
          <div className="bg-white px-6 py-4 border-t border-slate-200 flex justify-between items-center shrink-0">
            <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              {selectedAssets.length} file
              {selectedAssets.length !== 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSelect}
                className="px-6 py-2.5 rounded-lg bg-[#000054] text-white font-bold hover:bg-[#1a1a6e] transition-colors shadow-sm"
              >
                Select ({selectedAssets.length})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaPicker;
