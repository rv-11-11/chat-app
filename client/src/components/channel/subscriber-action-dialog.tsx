import { Crown, UserMinus, ShieldOff } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

interface SubscriberActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onPromote: () => void;
  onDemote: () => void;
  onRemove: () => void;
}

export const SubscriberActionDialog = ({
  isOpen,
  onClose,
  isAdmin,
  onPromote,
  onDemote,
  onRemove,
}: SubscriberActionDialogProps) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[120]" onClick={onClose} />

      <div
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[120] rounded-lg shadow-lg min-w-[200px]
          ${theme === "dark" ? "bg-slate-800" : "bg-white"}`}
      >
        <div className="p-2">
          {!isAdmin && (
            <button
              onClick={onPromote}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                theme === "dark" ? "hover:bg-slate-700" : "hover:bg-gray-100"
              }`}
            >
              <Crown className="h-5 w-5 text-yellow-500" />
              <span className="text-sm">Promote to admin</span>
            </button>
          )}
          {isAdmin && (
            <button
              onClick={onDemote}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                theme === "dark" ? "hover:bg-slate-700" : "hover:bg-gray-100"
              }`}
            >
              <ShieldOff className="h-5 w-5 text-orange-500" />
              <span className="text-sm">Remove admin rights</span>
            </button>
          )}
          <button
            onClick={onRemove}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left hover:bg-destructive/10 text-destructive"
          >
            <UserMinus className="h-5 w-5" />
            <span className="text-sm">Remove subscriber</span>
          </button>
        </div>
      </div>
    </>
  );
};
