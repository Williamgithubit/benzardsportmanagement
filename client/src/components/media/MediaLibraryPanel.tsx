"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MdCloudUpload, MdDelete, MdImage, MdMovie } from "react-icons/md";
import { deleteTeamMediaAsset, uploadTeamMediaAsset } from "@/store/mediaSlice";
import { useAppDispatch } from "@/store/store";
import type { TeamMediaRecord } from "@/types/media-dashboard";
import type { MatchRecord, PlayerRecord } from "@/types/sports";

interface MediaLibraryPanelProps {
  teamId: string;
  currentUserId?: string | null;
  media: TeamMediaRecord[];
  players: PlayerRecord[];
  matches: MatchRecord[];
}

export default function MediaLibraryPanel({
  teamId,
  currentUserId,
  media,
  players,
  matches,
}: MediaLibraryPanelProps) {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadForm, setUploadForm] = useState({
    title: "",
    tags: "",
    playerId: "",
    matchId: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const filteredMedia = useMemo(
    () =>
      media.filter((item) => {
        const haystack = [
          item.title || "",
          item.tags.join(" "),
          item.url,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(searchTerm.toLowerCase());
      }),
    [media, searchTerm],
  );

  const handleUpload = async () => {
    if (!selectedFiles?.length) {
      toast.error("Choose at least one file to upload.");
      return;
    }

    try {
      const tags = uploadForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      await Promise.all(
        Array.from(selectedFiles).map((file) =>
          dispatch(
            uploadTeamMediaAsset({
              teamId,
              file,
              uploadedBy: currentUserId || "unknown-user",
              title: uploadForm.title || file.name,
              tags,
              playerId: uploadForm.playerId || null,
              matchId: uploadForm.matchId || null,
            }),
          ).unwrap(),
        ),
      );

      toast.success("Media uploaded successfully.");
      setSelectedFiles(null);
      setUploadForm({
        title: "",
        tags: "",
        playerId: "",
        matchId: "",
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to upload media.",
      );
    }
  };

  const handleDelete = async (item: TeamMediaRecord) => {
    try {
      await dispatch(deleteTeamMediaAsset(item)).unwrap();
      toast.success("Media deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete media.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] p-6">
        <div className="flex items-center gap-2">
          <MdCloudUpload className="text-sky-600" size={22} />
          <h2 className="text-2xl font-semibold text-secondary">Media Library</h2>
        </div>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          Upload and manage team images or videos, then tag them by match or player for quick retrieval later.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="rounded-[24px] border border-white/70 bg-white/80 p-4 xl:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Title
            </span>
            <input
              type="text"
              value={uploadForm.title}
              onChange={(event) =>
                setUploadForm((current) => ({ ...current, title: event.target.value }))
              }
              className="mt-3 w-full bg-transparent text-sm text-slate-800 outline-none"
              placeholder="Post-match gallery"
            />
          </label>

          <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Tags
            </span>
            <input
              type="text"
              value={uploadForm.tags}
              onChange={(event) =>
                setUploadForm((current) => ({ ...current, tags: event.target.value }))
              }
              className="mt-3 w-full bg-transparent text-sm text-slate-800 outline-none"
              placeholder="match, team, training"
            />
          </label>

          <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Player
            </span>
            <select
              value={uploadForm.playerId}
              onChange={(event) =>
                setUploadForm((current) => ({ ...current, playerId: event.target.value }))
              }
              className="mt-3 w-full bg-transparent text-sm text-slate-800 outline-none"
            >
              <option value="">None</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.fullName}
                </option>
              ))}
            </select>
          </label>

          <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Match
            </span>
            <select
              value={uploadForm.matchId}
              onChange={(event) =>
                setUploadForm((current) => ({ ...current, matchId: event.target.value }))
              }
              className="mt-3 w-full bg-transparent text-sm text-slate-800 outline-none"
            >
              <option value="">None</option>
              {matches.map((match) => (
                <option key={match.id} value={match.id}>
                  {match.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300">
            <MdCloudUpload size={18} />
            Choose Files
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(event) => setSelectedFiles(event.target.files)}
            />
          </label>

          {selectedFiles?.length ? (
            <p className="text-sm text-slate-500">
              {selectedFiles.length} file{selectedFiles.length === 1 ? "" : "s"} selected
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void handleUpload()}
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            <MdCloudUpload size={18} />
            Upload
          </button>
        </div>
      </section>

      <section className="glass-panel rounded-[32px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-secondary">Uploaded Assets</h3>
            <p className="mt-1 text-sm text-slate-500">
              Search and manage uploaded media without leaving the dashboard.
            </p>
          </div>

          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none"
            placeholder="Search media"
          />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredMedia.length > 0 ? (
            filteredMedia.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-[28px] border border-slate-200 bg-white/80 shadow-sm"
              >
                <div className="flex h-56 items-center justify-center bg-slate-100">
                  {item.type === "video" ? (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <video src={item.url} controls className="h-full w-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt={item.title || "Media asset"} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {item.title || "Untitled media"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.type === "video" ? <MdMovie className="inline" size={14} /> : <MdImage className="inline" size={14} />}{" "}
                        {item.type}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDelete(item)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:border-rose-300"
                    >
                      <MdDelete size={18} />
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags.length > 0 ? (
                      item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-700"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Untagged
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
              No media assets match the current search.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
