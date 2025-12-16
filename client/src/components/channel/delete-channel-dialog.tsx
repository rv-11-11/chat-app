import { X, AlertTriangle } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

interface DeleteChannelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  channelName: string;
  isLoading?: boolean;
}

export const DeleteChannelDialog = ({
  isOpen,
  onClose,
  onConfirm,
  channelName,
  isLoading = false,
}: DeleteChannelDialogProps) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[110]" onClick={onClose} />

      <div
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] rounded-xl shadow-lg max-w-md w-full mx-4
          ${theme === "dark" ? "bg-slate-800" : "bg-white"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-destructive">Delete Channel</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-2">Are you absolutely sure?</h4>
              <p className="text-sm text-muted-foreground mb-2">
                This will permanently delete the channel{" "}
                <span className="font-semibold text-foreground">
                  "{channelName}"
                </span>{" "}
                and remove all subscribers.
              </p>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex gap-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              theme === "dark"
                ? "bg-slate-700 hover:bg-slate-600"
                : "bg-gray-200 hover:bg-gray-300"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2 px-4 rounded-lg font-medium bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Deleting..." : "Delete Channel"}
          </button>
        </div>
      </div>
    </>
  );
};
