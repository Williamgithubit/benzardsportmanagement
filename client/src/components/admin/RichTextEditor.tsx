"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  MdClose,
  MdEdit,
  MdFormatAlignCenter,
  MdFormatAlignLeft,
  MdFormatAlignRight,
  MdFormatBold,
  MdFormatItalic,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdFormatUnderlined,
  MdImage,
  MdLink,
  MdRedo,
  MdUndo,
  MdVisibility,
} from "react-icons/md";
import MediaLibrary from "./MediaLibrary";
import { MediaFile } from "@/services/mediaService";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  showPreview?: boolean;
  allowMedia?: boolean;
}

interface LinkDialogData {
  text: string;
  url: string;
  openInNewTab: boolean;
}

type ToolbarItem =
  | "divider"
  | {
      icon: ReactNode;
      tooltip: string;
      command?: string;
      value?: string;
      action?: () => void;
    };

const normalizeUrl = (url: string) => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url) || url.startsWith("/")) {
    return url;
  }

  return `https://${url}`;
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start writing...",
  minHeight = 300,
  maxHeight = 600,
  showPreview = true,
  allowMedia = true,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRangeRef = useRef<Range | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [linkData, setLinkData] = useState<LinkDialogData>({
    text: "",
    url: "",
    openInNewTab: true,
  });

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const captureSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      selectionRangeRef.current = null;
      return;
    }

    selectionRangeRef.current = selection.getRangeAt(0).cloneRange();
  }, []);

  const restoreSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection) return;

    selection.removeAllRanges();

    if (selectionRangeRef.current) {
      selection.addRange(selectionRangeRef.current);
    }
  }, []);

  const updateContent = useCallback(() => {
    onChange(editorRef.current?.innerHTML || "");
  }, [onChange]);

  const runCommand = useCallback(
    (command: string, commandValue?: string) => {
      editorRef.current?.focus();
      restoreSelection();
      document.execCommand(command, false, commandValue);
      captureSelection();
      updateContent();
    },
    [captureSelection, restoreSelection, updateContent]
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      const text = event.clipboardData.getData("text/plain");
      editorRef.current?.focus();
      restoreSelection();
      document.execCommand("insertText", false, text);
      captureSelection();
      updateContent();
    },
    [captureSelection, restoreSelection, updateContent]
  );

  const openLinkDialog = useCallback(() => {
    captureSelection();
    const selection = window.getSelection();
    const selectedText = selection?.toString() || "";

    setLinkData({
      text: selectedText,
      url: "",
      openInNewTab: true,
    });
    setLinkDialogOpen(true);
  }, [captureSelection]);

  const confirmLink = useCallback(() => {
    if (!linkData.url) return;

    const href = normalizeUrl(linkData.url.trim());
    const linkHtml = `<a href="${href}" ${
      linkData.openInNewTab ? 'target="_blank" rel="noopener noreferrer"' : ""
    }>${linkData.text || href}</a>`;

    editorRef.current?.focus();
    restoreSelection();
    document.execCommand("insertHTML", false, linkHtml);
    captureSelection();
    updateContent();

    setLinkDialogOpen(false);
    setLinkData({ text: "", url: "", openInNewTab: true });
  }, [captureSelection, linkData, restoreSelection, updateContent]);

  const insertMedia = useCallback(
    (media: MediaFile) => {
      const mediaHtml =
        media.type === "image"
          ? `<img src="${media.url}" alt="${media.alt || media.originalName}" />`
          : media.type === "video"
            ? `<video controls><source src="${media.url}" type="video/mp4" />Your browser does not support the video tag.</video>`
            : media.type === "audio"
              ? `<audio controls><source src="${media.url}" type="audio/mpeg" />Your browser does not support the audio element.</audio>`
              : `<a href="${media.url}" target="_blank" rel="noopener noreferrer">${media.originalName}</a>`;

      editorRef.current?.focus();
      restoreSelection();
      document.execCommand("insertHTML", false, mediaHtml);
      captureSelection();
      updateContent();
      setMediaLibraryOpen(false);
    },
    [captureSelection, restoreSelection, updateContent]
  );

  const toolbarItems: ToolbarItem[] = [
    {
      icon: <MdFormatBold size={18} />,
      tooltip: "Bold",
      command: "bold",
    },
    {
      icon: <MdFormatItalic size={18} />,
      tooltip: "Italic",
      command: "italic",
    },
    {
      icon: <MdFormatUnderlined size={18} />,
      tooltip: "Underline",
      command: "underline",
    },
    "divider",
    {
      icon: <MdFormatListBulleted size={18} />,
      tooltip: "Bullet List",
      command: "insertUnorderedList",
    },
    {
      icon: <MdFormatListNumbered size={18} />,
      tooltip: "Numbered List",
      command: "insertOrderedList",
    },
    {
      icon: <MdFormatQuote size={18} />,
      tooltip: "Quote",
      command: "formatBlock",
      value: "blockquote",
    },
    "divider",
    {
      icon: <MdFormatAlignLeft size={18} />,
      tooltip: "Align Left",
      command: "justifyLeft",
    },
    {
      icon: <MdFormatAlignCenter size={18} />,
      tooltip: "Align Center",
      command: "justifyCenter",
    },
    {
      icon: <MdFormatAlignRight size={18} />,
      tooltip: "Align Right",
      command: "justifyRight",
    },
    "divider",
    {
      icon: <MdLink size={18} />,
      tooltip: "Insert Link",
      action: openLinkDialog,
    },
  ];

  if (allowMedia) {
    toolbarItems.push({
      icon: <MdImage size={18} />,
      tooltip: "Insert Media",
      action: () => {
        captureSelection();
        setMediaLibraryOpen(true);
      },
    });
  }

  toolbarItems.push(
    "divider",
    {
      icon: <MdUndo size={18} />,
      tooltip: "Undo",
      command: "undo",
    },
    {
      icon: <MdRedo size={18} />,
      tooltip: "Redo",
      command: "redo",
    }
  );

  if (showPreview) {
    toolbarItems.push(
      "divider",
      {
        icon: isPreviewMode ? <MdEdit size={18} /> : <MdVisibility size={18} />,
        tooltip: isPreviewMode ? "Edit Mode" : "Preview Mode",
        action: () => setIsPreviewMode((current) => !current),
      }
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.28)]">
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/80 px-3 py-3">
          {toolbarItems.map((item, index) => {
            if (item === "divider") {
              return (
                <div
                  key={`divider-${index}`}
                  className="mx-1 hidden h-7 w-px bg-slate-200 sm:block"
                />
              );
            }

            return (
              <button
                key={`tool-${index}`}
                type="button"
                title={item.tooltip}
                onClick={() => {
                  if (item.action) {
                    item.action();
                    return;
                  }

                  if (item.command) {
                    runCommand(item.command, item.value);
                  }
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-600 transition hover:bg-white hover:text-secondary"
              >
                {item.icon}
              </button>
            );
          })}
        </div>

        <div className="relative bg-white">
          {!isPreviewMode ? (
            <>
              {!value ? (
                <div className="pointer-events-none absolute left-5 top-5 text-sm italic text-slate-400">
                  {placeholder}
                </div>
              ) : null}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={updateContent}
                onPaste={handlePaste}
                onMouseUp={captureSelection}
                onKeyUp={captureSelection}
                className="rich-text-content min-h-[300px] w-full overflow-y-auto px-5 py-5 outline-none"
                style={{ minHeight, maxHeight }}
              />
            </>
          ) : (
            <div
              className="rich-text-content min-h-[300px] overflow-y-auto bg-slate-50/70 px-5 py-5"
              style={{ minHeight, maxHeight }}
            >
              {value ? (
                <div dangerouslySetInnerHTML={{ __html: value }} />
              ) : (
                <p className="text-sm italic text-slate-400">Nothing to preview yet.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {linkDialogOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-[32px] bg-white">
            <div className="flex items-start justify-between border-b border-slate-200/70 px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-secondary">Insert Link</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add a destination for the selected text or create a new link.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLinkDialogOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close link dialog"
              >
                <MdClose size={18} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <label className="block text-sm font-medium text-slate-700">
                Link Text
                <input
                  type="text"
                  value={linkData.text}
                  onChange={(event) =>
                    setLinkData((current) => ({
                      ...current,
                      text: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary/20 focus:ring-2 focus:ring-secondary/10"
                  placeholder="Read more"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                URL
                <input
                  type="url"
                  value={linkData.url}
                  onChange={(event) =>
                    setLinkData((current) => ({
                      ...current,
                      url: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary/20 focus:ring-2 focus:ring-secondary/10"
                  placeholder="https://example.com"
                />
              </label>

              <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                <span className="font-medium">Open in new tab</span>
                <input
                  type="checkbox"
                  checked={linkData.openInNewTab}
                  onChange={(event) =>
                    setLinkData((current) => ({
                      ...current,
                      openInNewTab: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-secondary focus:ring-secondary"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200/70 px-6 py-4">
              <button
                type="button"
                onClick={() => setLinkDialogOpen(false)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLink}
                disabled={!linkData.url.trim()}
                className="rounded-2xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {allowMedia && mediaLibraryOpen ? (
        <MediaLibrary
          openDialog={mediaLibraryOpen}
          onCloseDialog={() => setMediaLibraryOpen(false)}
          selectionMode
          onSelectMedia={insertMedia}
          allowedTypes={["image", "video", "audio", "pdf", "document"]}
        />
      ) : null}
    </div>
  );
};

export default RichTextEditor;
