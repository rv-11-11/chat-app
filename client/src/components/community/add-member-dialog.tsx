import { memo, useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import type { UserType } from "@/types/auth.type";

interface AddCommunityMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentMembers: UserType[];
  onMembersAdded: (memberIds: string[]) => void;
  communityId: string;
}

export const AddCommunityMemberDialog = memo(
  ({
    isOpen,
    onClose,
    currentMembers,
    onMembersAdded,
    communityId,
  }: AddCommunityMemberDialogProps) => {
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
      } catch {
        toast.error("Failed to fetch users");
      } finally {
        setIsLoading(false);
      }
    };

    const currentMemberIds = currentMembers.map((m) => m._id);

    const handleAddMembers = async () => {
      const usersToAdd = selectedUsers.filter(
        (userId) => !currentMemberIds.includes(userId)
      );

      if (usersToAdd.length === 0) {
        toast.error("No new members to add");
        return;
      }

      setIsAdding(true);
      try {
        for (const userId of usersToAdd) {
          await API.post(`/community/${communityId}/member/${userId}/add`);
        }
        toast.success(`Added ${usersToAdd.length} member(s) to community`);
        onMembersAdded(usersToAdd);
        setSelectedUsers([]);
        onClose();
      } catch {
        toast.error("Failed to add members");
      } finally {
        setIsAdding(false);
      }
    };

    if (!isOpen) return null;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogDescription className="sr-only">Search and select users to add as members to the community</DialogDescription>
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Add members to community</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by name or @username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="pl-10"
              />
            </div>

            <div className="border rounded-lg h-[250px] sm:h-[300px] overflow-y-auto p-1 sm:p-2 space-y-1">
              {!searchQuery.trim() ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                  <Search className="h-12 w-12 opacity-20" />
                  <p className="text-sm">Start typing to search users...</p>
                </div>
              ) : searchQuery.trim().length < 2 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                  <Search className="h-12 w-12 opacity-20" />
                  <p className="text-sm">Type at least 2 characters to search</p>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Spinner className="w-6 h-6" />
                </div>
              ) : allUsers.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground text-sm">No users found</p>
                </div>
              ) : (
                allUsers.filter((u) => u._id !== user?._id).map((userItem) => {
                  const isCurrentMember = currentMemberIds.includes(userItem._id);
                  const isSelected = selectedUsers.includes(userItem._id) || isCurrentMember;
                  const displayName = userItem.name || "Unknown User";

                  return (
                    <div
                      key={userItem._id}
                      className={`
                        flex items-center gap-3 p-2 rounded-md transition-colors
                        ${isCurrentMember ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-accent'}
                      `}
                      onClick={() => {
                        if (isCurrentMember) return;
                        if (selectedUsers.includes(userItem._id)) {
                          setSelectedUsers(selectedUsers.filter((id) => id !== userItem._id));
                        } else {
                          setSelectedUsers([...selectedUsers, userItem._id]);
                        }
                      }}
                    >
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {userItem.avatar ? (
                          <img src={userItem.avatar} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs sm:text-sm font-bold text-primary uppercase">{displayName.charAt(0)}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{displayName}</p>
                        {isCurrentMember ? (
                          <p className="text-xs text-muted-foreground">Already in community</p>
                        ) : userItem.username ? (
                          <p className="text-xs text-primary">@{userItem.username}</p>
                        ) : null}
                      </div>

                      <Checkbox 
                        checked={isSelected}
                        disabled={isCurrentMember}
                        onCheckedChange={() => {
                          if (isCurrentMember) return;
                          if (selectedUsers.includes(userItem._id)) {
                            setSelectedUsers(selectedUsers.filter((id) => id !== userItem._id));
                          } else {
                            setSelectedUsers([...selectedUsers, userItem._id]);
                          }
                        }}
                      />
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose} disabled={isAdding}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddMembers} 
                disabled={isAdding || selectedUsers.filter(id => !currentMemberIds.includes(id)).length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isAdding ? "Adding..." : `Add${selectedUsers.filter(id => !currentMemberIds.includes(id)).length > 0 ? ` (${selectedUsers.filter(id => !currentMemberIds.includes(id)).length})` : ""}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

AddCommunityMemberDialog.displayName = "AddCommunityMemberDialog";
