import { memo, useState } from "react";
import { Search, X, MoreVertical } from "lucide-react";
import { useTheme } from "../theme-provider";
import type { UserType } from "@/types/auth.type";
import { MemberActionDialog } from "./member-action-dialog";

interface ViewMembersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  members: UserType[];
  admins?: string[];
  currentUserId?: string;
  isAdmin?: boolean;
  onRemoveMember?: (userId: string) => void;
  onPromoteToAdmin?: (userId: string) => void;
  onDemoteFromAdmin?: (userId: string) => void;
}

export const ViewMembersDialog = memo(
  ({
    isOpen,
    onClose,
    members,
    admins = [],
    currentUserId,
    isAdmin = false,
    onRemoveMember,
    onPromoteToAdmin,
    onDemoteFromAdmin,
  }: ViewMembersDialogProps) => {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);

    const filteredMembers = members.filter((member) =>
      (member.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.username || "").toLowerCase().includes(searchQuery.toLowerCase().replace('@', ''))
    );

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
            z-[110] rounded-xl shadow-lg w-[95vw] sm:w-[400px] max-h-[85vh]
            ${theme === "dark" ? "bg-slate-800" : "bg-white"}
            flex flex-col`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 flex-shrink-0">
            <h3 className="text-base sm:text-lg font-semibold">{members.length} members</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="px-3 sm:px-4 pb-2 sm:pb-3 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search by name or @username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 sm:py-2.5 text-sm rounded-lg ${
                  theme === "dark"
                    ? "bg-slate-700/50 text-white placeholder:text-slate-400"
                    : "bg-gray-100 text-black placeholder:text-gray-500"
                } focus:outline-none focus:ring-2 focus:ring-primary/50`}
              />
            </div>
          </div>

          {/* Members List */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 space-y-1 min-h-0 max-h-[350px] sm:max-h-[400px]">
            {filteredMembers.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                No members found
              </div>
            ) : (
              filteredMembers.map((member) => (
                <div
                  key={member._id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors relative
                    ${
                      theme === "dark"
                        ? "hover:bg-slate-700/50"
                        : "hover:bg-gray-100"
                    }`}
                  onMouseEnter={() => setHoveredMemberId(member._id)}
                  onMouseLeave={() => setHoveredMemberId(null)}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-primary uppercase">
                        {member.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{member.name}</p>
                    {member.username && (
                      <p className="text-xs text-primary truncate">@{member.username}</p>
                    )}
                    <p className="text-xs text-muted-foreground truncate">
                      {member.isAI ? "AI Assistant" : admins.includes(member._id) ? "Group admin" : "Member"}
                    </p>
                  </div>

                  {/* Action Button - Only for admins and not for current user */}
                  {isAdmin &&
                    member._id !== currentUserId &&
                    hoveredMemberId === member._id && (
                      <button
                        onClick={() => setSelectedMemberId(member._id)}
                        className={`p-1.5 rounded transition-colors ${
                          theme === "dark"
                            ? "hover:bg-slate-600"
                            : "hover:bg-gray-200"
                        }`}
                      >
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 flex-shrink-0 border-t border-slate-700">
            <button
              onClick={onClose}
              className={`w-full py-2 sm:py-2.5 px-3 sm:px-4 text-sm rounded-lg font-medium transition-colors ${
                theme === "dark"
                  ? "bg-slate-700 hover:bg-slate-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-black"
              }`}
            >
              Close
            </button>
          </div>
        </div>

        {/* Member Action Dialog */}
        {selectedMemberId && (
          <MemberActionDialog
            member={filteredMembers.find((m) => m._id === selectedMemberId)}
            isOpen={!!selectedMemberId}
            onClose={() => setSelectedMemberId(null)}
            onRemove={() => {
              onRemoveMember?.(selectedMemberId);
              setSelectedMemberId(null);
            }}
            onPromote={() => {
              onPromoteToAdmin?.(selectedMemberId);
              setSelectedMemberId(null);
            }}
            onDemote={() => {
              onDemoteFromAdmin?.(selectedMemberId);
              setSelectedMemberId(null);
            }}
            isAdmin={admins.includes(selectedMemberId)}
          />
        )}
      </>
    );
  }
);

ViewMembersDialog.displayName = "ViewMembersDialog";
