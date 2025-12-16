import { memo, useState } from "react";
import { Search, MoreVertical } from "lucide-react";
import { useTheme } from "../theme-provider";
import type { UserType } from "@/types/auth.type";
import { MemberActionDialog } from "./member-action-dialog";

interface GroupMembersListProps {
  members: UserType[];
  admins?: string[];
  currentUserId?: string;
  isAdmin?: boolean;
  onRemoveMember?: (userId: string) => void;
  onPromoteToAdmin?: (userId: string) => void;
}

export const GroupMembersList = memo(
  ({
    members,
    admins = [],
    currentUserId,
    isAdmin = false,
    onRemoveMember,
    onPromoteToAdmin,
  }: GroupMembersListProps) => {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);

    const filteredMembers = members.filter((member) =>
      (member.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div
        className={`flex flex-col h-full ${
          theme === "dark" ? "bg-slate-900" : "bg-white"
        }`}
      >
        {/* Header with Search */}
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold mb-3">{members.length} members</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                theme === "dark"
                  ? "bg-slate-800 border-slate-700 text-white"
                  : "bg-gray-100 border-gray-200 text-black"
              }`}
            />
          </div>
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto">
          {filteredMembers.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No members found
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredMembers.map((member) => (
                <div
                  key={member._id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors group relative
                    ${
                      theme === "dark"
                        ? "hover:bg-slate-800"
                        : "hover:bg-gray-100"
                    }`}
                  onMouseEnter={() => setHoveredMemberId(member._id)}
                  onMouseLeave={() => setHoveredMemberId(null)}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-primary">
                        {member.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{member.name}</p>
                    <p
                      className={`text-xs truncate ${
                        theme === "dark"
                          ? "text-slate-400"
                          : "text-gray-500"
                      }`}
                    >
                      {member.isAI ? "AI Assistant" : "Available"}
                    </p>
                  </div>

                  {/* Admin Badge */}
                  {admins.includes(member._id) && (
                    <span className="text-xs font-semibold text-green-500 px-2 py-1 rounded">
                      Group admin
                    </span>
                  )}

                  {/* Action Button */}
                  {isAdmin &&
                    member._id !== currentUserId &&
                    hoveredMemberId === member._id && (
                      <button
                        onClick={() => setSelectedMemberId(member._id)}
                        className={`p-1 rounded transition-colors ${
                          theme === "dark"
                            ? "hover:bg-slate-700"
                            : "hover:bg-gray-200"
                        }`}
                      >
                        <MoreVertical className="h-5 w-5 text-muted-foreground" />
                      </button>
                    )}
                </div>
              ))}
            </div>
          )}
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
          />
        )}
      </div>
    );
  }
);

GroupMembersList.displayName = "GroupMembersList";
