"use client";
import React, { useState } from "react";
import {
  MdDelete,
  MdEdit,
  MdAssignment,
  MdFileDownload,
  MdGroup,
  MdClose,
} from "react-icons/md";
import { BulkActionType, UserRole } from "@/types/athlete";

interface BulkActionsDialogProps {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  onAction: (
    actionType: BulkActionType,
    data?: Record<string, string | number>,
  ) => void;
  userRole: UserRole;
}

export default function BulkActionsDialog({
  open,
  onClose,
  selectedCount,
  onAction,
  userRole,
}: BulkActionsDialogProps) {
  const [selectedAction, setSelectedAction] = useState<BulkActionType | "">("");
  const [actionData, setActionData] = useState<Record<string, string | number>>(
    {},
  );

  const handleActionSelect = (action: BulkActionType) => {
    setSelectedAction(action);
    setActionData({});
  };

  const handleExecute = () => {
    if (!selectedAction) return;

    onAction(selectedAction, actionData);
    setSelectedAction("");
    setActionData({});
  };

  const renderActionForm = () => {
    switch (selectedAction) {
      case "updateStatus":
        return (
          <div className="mt-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              New Status
            </label>
            <select
              value={actionData.status || ""}
              onChange={(e) => setActionData({ status: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary appearance-none"
            >
              <option value="" disabled>
                Select Status
              </option>
              <option value="active">Active</option>
              <option value="scouted">Scouted</option>
              <option value="signed">Signed</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        );

      case "updateLevel":
        return (
          <div className="mt-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              New Level
            </label>
            <select
              value={actionData.level || ""}
              onChange={(e) => setActionData({ level: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary appearance-none"
            >
              <option value="" disabled>
                Select Level
              </option>
              <option value="grassroots">Grassroots</option>
              <option value="semi-pro">Semi-Pro</option>
              <option value="professional">Professional</option>
            </select>
          </div>
        );

      case "assignProgram":
        return (
          <div className="mt-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Training Program
            </label>
            <input
              type="text"
              value={
                typeof actionData.program === "string" ? actionData.program : ""
              }
              onChange={(e) => setActionData({ program: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
              placeholder="Enter training program name"
            />
          </div>
        );

      case "delete":
        return (
          <div className="mt-4 p-4 bg-orange-50 border left-4 border-orange-200 text-orange-800 rounded-lg text-sm">
            This action will permanently delete <strong>{selectedCount}</strong>{" "}
            athletes. This cannot be undone.
          </div>
        );

      case "export":
        return (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm">
            This will export <strong>{selectedCount}</strong> selected athletes
            to a CSV file.
          </div>
        );

      default:
        return null;
    }
  };

  const getActionTitle = () => {
    switch (selectedAction) {
      case "updateStatus":
        return "Update Status";
      case "updateLevel":
        return "Update Level";
      case "assignProgram":
        return "Assign Training Program";
      case "delete":
        return "Delete Athletes";
      case "export":
        return "Export Athletes";
      default:
        return "Select Action";
    }
  };

  const canExecute = () => {
    switch (selectedAction) {
      case "updateStatus":
        return !!actionData.status;
      case "updateLevel":
        return !!actionData.level;
      case "assignProgram":
        const program = actionData.program;
        return typeof program === "string" && program.trim() !== "";
      case "delete":
      case "export":
        return true;
      default:
        return false;
    }
  };

  const availableActions = [
    {
      type: "updateStatus" as BulkActionType,
      label: "Update Status",
      description: "Change scouting status for selected athletes",
      icon: <MdEdit size={20} />,
      permission: userRole.permissions.canEdit,
    },
    {
      type: "updateLevel" as BulkActionType,
      label: "Update Level",
      description: "Change competition level for selected athletes",
      icon: <MdEdit size={20} />,
      permission: userRole.permissions.canEdit,
    },
    {
      type: "assignProgram" as BulkActionType,
      label: "Assign Training Program",
      description: "Assign a training program to selected athletes",
      icon: <MdAssignment size={20} />,
      permission: userRole.permissions.canEdit,
    },
    {
      type: "export" as BulkActionType,
      label: "Export to CSV",
      description: "Export selected athletes data to CSV file",
      icon: <MdFileDownload size={20} />,
      permission: userRole.permissions.canExport,
    },
    {
      type: "delete" as BulkActionType,
      label: "Delete Athletes",
      description: "Permanently delete selected athletes",
      icon: <MdDelete size={20} />,
      permission: userRole.permissions.canDelete,
      dangerous: true,
    },
  ].filter((action) => action.permission);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm animate-in fade-in">
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#03045e] text-white px-6 py-4 flex items-center gap-2">
          <MdGroup size={24} />
          <h2 className="font-bold text-lg grow">
            Bulk Actions ({selectedCount} selected)
          </h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <MdClose size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {!selectedAction ? (
            <div>
              <p className="text-slate-600 mb-4">
                Choose an action to perform on <strong>{selectedCount}</strong>{" "}
                selected athletes:
              </p>

              <div className="space-y-2">
                {availableActions.map((action) => (
                  <button
                    key={action.type}
                    onClick={() => handleActionSelect(action.type)}
                    className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-colors ${
                      action.dangerous
                        ? "border-red-200 hover:bg-red-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`mt-0.5 ${action.dangerous ? "text-red-500" : "text-[#03045e]"}`}
                    >
                      {action.icon}
                    </div>
                    <div>
                      <h4
                        className={`font-bold ${action.dangerous ? "text-red-600" : "text-slate-800"}`}
                      >
                        {action.label}
                      </h4>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {action.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-4 duration-200">
              <h3 className="text-xl font-bold text-[#03045e] mb-2">
                {getActionTitle()}
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                This action will be applied to <strong>{selectedCount}</strong>{" "}
                selected athletes.
              </p>

              {renderActionForm()}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          {selectedAction ? (
            <>
              <button
                onClick={() => setSelectedAction("")}
                className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 bg-white font-medium hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleExecute}
                disabled={!canExecute()}
                className={`px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm disabled:opacity-50 ${
                  selectedAction === "delete"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-primary text-navy hover:bg-accent"
                }`}
              >
                Execute Action
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 bg-white font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
