import { memo } from "react";
import { Crown, UserMinus, X } from "lucide-react";
import { useTheme } from "../theme-provider";
import type { UserType } from "@/types/auth.type";

interface MemberActionDialogProps {
  member?: UserType;
  isOpen: boolean;
  onClose: () => void;
  onRemove: () => void;
  onPromote: () => void;
  isAdmin?: boolean;
}

export const MemberActionDialog = memo(
  ({
    member,
    isOpen,
    onClose,
    onRemove,
    onPromote,
    isAdmin = false,
  }: MemberActionDialogProps) => {
    const { theme } = useTheme();

    if (!isOpen || !member) return null;

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 z-[120]"
          onClick={onClose}
        />

        {/* Dialog */}
        <div
          className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
            z-[120] rounded-lg shadow-lg w-80
            ${theme === "dark" ? "bg-slate-800" : "bg-white"}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Member options</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Member Info */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-primary">
                    {member.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold">{member.name}</p>
                <p className="text-xs text-muted-foreground">
                  {member.isAI ? "AI Assistant" : "Group member"}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2 space-y-1">
            {!isAdmin && (
              <button
                onClick={onPromote}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-colors text-left
                  ${
                    theme === "dark"
                      ? "hover:bg-slate-700"
                      : "hover:bg-gray-100"
                  }`}
              >
                <Crown className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <span className="text-sm">Promote to admin</span>
              </button>
            )}

            <button
              onClick={onRemove}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg
                transition-colors text-left text-destructive
                hover:bg-destructive/10`}
            >
              <UserMinus className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">Remove from group</span>
            </button>
          </div>
        </div>
      </>
    );
  }
);

MemberActionDialog.displayName = "MemberActionDialog";
