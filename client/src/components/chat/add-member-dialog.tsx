import { memo, useState, useEffect } from "react";
import { Search, X, Plus } from "lucide-react";
import { useTheme } from "../theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import type { UserType } from "@/types/auth.type";

interface AddMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentMembers: UserType[];
  onMembersAdded: (memberIds: string[]) => void;
  groupId: string;
}

export const AddMemberDialog = memo(
  ({
    isOpen,
    onClose,
    currentMembers,
    onMembersAdded,
    groupId,
  }: AddMemberDialogProps) => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [allUsers, setAllUsers] = useState<UserType[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    // Reset state when dialog opens
    useEffect(() => {
      if (isOpen) {
        setSearchQuery("");
        setDebouncedSearch("");
        setAllUsers([]);
        setSelectedUsers([]);
      }
    }, [isOpen]);

    // Debounce search input
    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedSearch(searchQuery);
      }, 500);

      return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch users only when searching
    useEffect(() => {
      if (debouncedSearch.trim()) {
        fetchUsers(debouncedSearch);
      } else {
        setAllUsers([]);
      }
    }, [debouncedSearch]);

    const fetchUsers = async (query: string) => {
      setIsLoading(true);
      try {
        const { data } = await API.get("/user/all", {
          params: { search: query }
        });
        setAllUsers(data.users || []);
      } catch (error: any) {
        toast.error("Failed to fetch users");
      } finally {
        setIsLoading(false);
      }
    };

    const currentMemberIds = currentMembers.map((m) => m._id);

    const handleAddMembers = async () => {
      // Find users to add (selected but not currently in group)
      const usersToAdd = selectedUsers.filter(
        (userId) => !currentMemberIds.includes(userId)
      );

      if (usersToAdd.length === 0) {
        toast.error("No new members to add");
        return;
      }

      setIsAdding(true);
      try {
        // Add each new member to the group
        for (const userId of usersToAdd) {
          await API.post(`/chat/${groupId}/add-member`, { userId });
        }
        toast.success(`Added ${usersToAdd.length} member(s) to group`);
        onMembersAdded(usersToAdd);
        setSelectedUsers([]);
        onClose();
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Failed to add members"
        );
      } finally {
        setIsAdding(false);
      }
    };

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
            <h3 className="text-base sm:text-lg font-semibold">Add members</h3>
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
                autoFocus
                className={`w-full pl-10 pr-4 py-2 sm:py-2.5 text-sm rounded-lg ${
                  theme === "dark"
                    ? "bg-slate-700/50 text-white placeholder:text-slate-400"
                    : "bg-gray-100 text-black placeholder:text-gray-500"
                } focus:outline-none focus:ring-2 focus:ring-primary/50`}
              />
            </div>
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 space-y-1 min-h-0 max-h-[350px] sm:max-h-[400px]">
            {!searchQuery.trim() ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
                <Search className="h-12 w-12 opacity-20" />
                <p className="text-sm">Start typing to search users...</p>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">Searching...</p>
              </div>
            ) : allUsers.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground text-sm">No users found</p>
              </div>
            ) : (
              allUsers.filter((u) => u._id !== user?._id).map((userItem) => {
                const isCurrentMember = currentMemberIds.includes(userItem._id);
                const isSelected = selectedUsers.includes(userItem._id) || isCurrentMember;
                
                return (
                  <label
                    key={userItem._id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors
                      ${isCurrentMember ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-slate-700/50'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {userItem.avatar ? (
                        <img
                          src={userItem.avatar}
                          alt={userItem.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-primary uppercase">
                          {userItem.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{userItem.name}</p>
                      {isCurrentMember ? (
                        <p className="text-xs text-muted-foreground">Already in group</p>
                      ) : userItem.username ? (
                        <p className="text-xs text-primary">@{userItem.username}</p>
                      ) : null}
                    </div>

                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isCurrentMember}
                      onChange={(e) => {
                        if (isCurrentMember) return;
                        
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, userItem._id]);
                        } else {
                          setSelectedUsers(
                            selectedUsers.filter((id) => id !== userItem._id)
                          );
                        }
                      }}
                      className="w-5 h-5 rounded cursor-pointer disabled:cursor-not-allowed accent-primary"
                    />
                  </label>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 flex gap-2 sm:gap-3 flex-shrink-0 border-t border-slate-700">
            <button
              onClick={onClose}
              disabled={isAdding}
              className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 text-sm rounded-lg font-medium transition-colors ${
                theme === "dark"
                  ? "bg-slate-700 hover:bg-slate-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-black"
              } disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              onClick={handleAddMembers}
              disabled={isAdding || selectedUsers.filter(id => !currentMemberIds.includes(id)).length === 0}
              className="flex-1 py-2.5 px-4 rounded-lg font-medium bg-primary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>
                {isAdding ? "Adding..." : `Add${selectedUsers.filter(id => !currentMemberIds.includes(id)).length > 0 ? ` (${selectedUsers.filter(id => !currentMemberIds.includes(id)).length})` : ""}`}
              </span>
            </button>
          </div>
        </div>
      </>
    );
  }
);

AddMemberDialog.displayName = "AddMemberDialog";
