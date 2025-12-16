import { memo } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useTheme } from "../theme-provider";

interface DeleteChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  contactName: string;
  isLoading: boolean;
}

export const DeleteChatDialog = memo(
  ({ isOpen, onClose, onConfirm, contactName, isLoading }: DeleteChatDialogProps) => {
    const { theme } = useTheme();

    if (!isOpen) return null;

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 z-[110]"
          onClick={onClose}
        />

        {/* Dialog */}
        <div
          className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
            z-[110] rounded-lg shadow-lg w-96
            ${theme === "dark" ? "bg-slate-800" : "bg-white"}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Delete chat</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-muted rounded transition-colors"
              disabled={isLoading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h4 className="font-semibold">Are you sure?</h4>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div
              className={`p-3 rounded-lg ${
                theme === "dark"
                  ? "bg-slate-700/50"
                  : "bg-gray-100"
              }`}
            >
              <p className="text-sm">
                You are about to permanently delete your chat with <strong>{contactName}</strong> and all
                messages will be lost.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t flex gap-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                theme === "dark"
                  ? "bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
                  : "bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 py-2 px-4 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </>
    );
  }
);

DeleteChatDialog.displayName = "DeleteChatDialog";
