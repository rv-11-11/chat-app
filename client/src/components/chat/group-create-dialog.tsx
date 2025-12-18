import { memo, useEffect, useState, type ReactNode } from "react";
import type React from "react";
import { useChat } from "@/hooks/use-chat";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Search, UsersIcon, Upload, X as XIcon } from "lucide-react";
import { Input } from "../ui/input";
import { Spinner } from "../ui/spinner";
import { Label } from "../ui/label";
import type { UserType } from "../../types/auth.type";
import AvatarWithBadge from "../avatar-with-badge";
import { Checkbox } from "../ui/checkbox";
import { useNavigate } from "react-router-dom";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";

interface GroupCreateDialogProps {
  children: ReactNode;
  onGroupCreated?: (groupId?: string) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const GroupCreateDialog = memo(({ children, onGroupCreated, isOpen: controlledIsOpen, onOpenChange }: GroupCreateDialogProps) => {
  const navigate = useNavigate();
  const { createChat, isCreatingChat } = useChat();

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupUsername, setGroupUsername] = useState("");
  const [groupRules, setGroupRules] = useState("");
  const [groupCategory, setGroupCategory] = useState("other");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [icon, setIcon] = useState<string | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setDebouncedSearch("");
      setUsers([]);
      setSelectedUsers([]);
      setGroupName("");
      setIcon(null);
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
      setUsers([]);
    }
  }, [debouncedSearch]);

  const fetchUsers = async (query: string) => {
    setIsUsersLoading(true);
    try {
      const { data } = await API.get("/user/all", {
        params: { search: query }
      });
      setUsers(data.users || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch users");
    } finally {
      setIsUsersLoading(false);
    }
  };

  const toggleUserSelection = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id]
    );
  };

  const resetState = () => {
    setGroupName("");
    setGroupDescription("");
    setGroupUsername("");
    setGroupRules("");
    setGroupCategory("other");
    setIsPublic(false);
    setSelectedUsers([]);
    setSearchQuery("");
    setIcon(null);
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIcon(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeIcon = () => {
    setIcon(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (controlledIsOpen !== undefined) {
      onOpenChange?.(open);
    } else {
      setInternalIsOpen(open);
    }
    if (!open) {
      resetState();
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers?.length === 0) return;
    
    try {
      const response = await createChat({
        isGroup: true,
        participants: selectedUsers,
        groupName: groupName,
        groupDescription: groupDescription || undefined,
        groupUsername: groupUsername || undefined,
        groupRules: groupRules || undefined,
        groupCategory: groupCategory || "other",
        isPublic,
        icon: icon || undefined,
      });
      
      handleOpenChange(false);
      resetState();
      
      if (response?._id) {
        if (onGroupCreated) {
          onGroupCreated(response._id);
        } else {
          navigate(`/groups/${response._id}`);
        }
      }
    } catch (error) {
      // Error handled by createGroupChat
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[95vw] sm:w-80 z-[999] rounded-xl max-h-[85vh] overflow-y-auto">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Create Group</h3>
            <p className="text-sm text-muted-foreground">
              Create a group and add members to get started
            </p>
          </div>

          {/* Group Icon */}
          <div className="space-y-2">
            <Label>Group Icon</Label>
            <div className="flex items-center gap-3">
              {icon ? (
                <img
                  src={icon}
                  alt="Group icon preview"
                  className="h-10 w-10 rounded-full object-cover border"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                  <UsersIcon className="h-5 w-5" />
                </div>
              )}

              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIconChange}
                  disabled={isCreatingChat}
                  className="hidden"
                />
                <div className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-accent/10">
                  <Upload className="h-4 w-4" />
                  <span>{icon ? "Change icon" : "Upload icon"}</span>
                </div>
              </label>
              {icon && (
                <button
                  type="button"
                  onClick={removeIcon}
                  className="px-3 py-2 rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition text-sm"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Group Name Input */}
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name *</Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              maxLength={50}
              disabled={isCreatingChat}
            />
          </div>

          {/* Group Description */}
          <div className="space-y-2">
            <Label htmlFor="group-description">Description</Label>
            <Input
              id="group-description"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="What's this group about?"
              maxLength={500}
              disabled={isCreatingChat}
            />
          </div>

          {/* Group Username */}
          <div className="space-y-2">
            <Label htmlFor="group-username">Group Username (@)</Label>
            <Input
              id="group-username"
              value={groupUsername}
              onChange={(e) => setGroupUsername(e.target.value.toLowerCase())}
              placeholder="unique-group-name"
              maxLength={30}
              disabled={isCreatingChat}
            />
          </div>

          {/* Group Category */}
          <div className="space-y-2">
            <Label htmlFor="group-category">Category</Label>
            <select
              id="group-category"
              value={groupCategory}
              onChange={(e) => setGroupCategory(e.target.value)}
              disabled={isCreatingChat}
              className="w-full px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value="other">Other</option>
              <option value="study">Study</option>
              <option value="gaming">Gaming</option>
              <option value="work">Work</option>
              <option value="hobbies">Hobbies</option>
              <option value="sports">Sports</option>
              <option value="entertainment">Entertainment</option>
            </select>
          </div>

          {/* Public/Private Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is-public"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              disabled={isCreatingChat}
              className="w-4 h-4 rounded"
            />
            <Label htmlFor="is-public" className="cursor-pointer">
              Make group public (discoverable)
            </Label>
          </div>

          {/* Group Rules */}
          <div className="space-y-2">
            <Label htmlFor="group-rules">Group Rules</Label>
            <textarea
              id="group-rules"
              value={groupRules}
              onChange={(e) => setGroupRules(e.target.value)}
              placeholder="Set group rules and guidelines..."
              maxLength={1000}
              disabled={isCreatingChat}
              rows={3}
              className="w-full px-3 py-2 border rounded-md text-sm bg-background resize-none"
            />
            <p className="text-xs text-muted-foreground">{groupRules.length}/1000</p>
          </div>

          {/* User Search */}
          <div className="space-y-2">
            <Label htmlFor="search-users">
              Add Members ({selectedUsers.length} selected)
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="search-users"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or @username..."
                className="pl-10"
                disabled={isCreatingChat}
              />
            </div>

            {/* Users List */}
            <div className="border rounded-lg h-[200px] overflow-y-auto p-2 space-y-1">
              {!searchQuery.trim() ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                  <Search className="h-12 w-12 opacity-20" />
                  <p className="text-sm">Start typing to search users...</p>
                </div>
              ) : searchQuery.trim().length < 2 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                  <Search className="h-12 w-12 opacity-20" />
                  <p className="text-sm">Type at least 2 characters to search</p>
                </div>
              ) : isUsersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner className="w-6 h-6" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No users found
                </div>
              ) : (
                users.map((user) => (
                  <GroupUserItem
                    key={user._id}
                    user={user}
                    isSelected={selectedUsers.includes(user._id)}
                    onToggle={toggleUserSelection}
                  />
                ))
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isCreatingChat}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={
                isCreatingChat ||
                !groupName.trim() ||
                selectedUsers.length === 0
              }
            >
              {isCreatingChat && <Spinner className="w-4 h-4 mr-2" />}
              Create Group
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

GroupCreateDialog.displayName = "GroupCreateDialog";

const GroupUserItem = memo(
  ({
    user,
    isSelected,
    onToggle,
  }: {
    user: UserType;
    isSelected: boolean;
    onToggle: (id: string) => void;
  }) => (
    <label
      role="button"
      className="w-full flex items-center gap-3 p-2
      rounded-md hover:bg-accent
       transition-colors text-left cursor-pointer
      "
    >
      <AvatarWithBadge name={user.name || user.username || "User"} src={user.avatar ?? ""} />
      <div className="flex-1 min-w-0">
        <h5 className="text-sm font-medium truncate">{user.name || "Unknown User"}</h5>
        {user.username && (
          <p className="text-xs text-primary truncate">@{user.username}</p>
        )}
      </div>
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggle(user._id)}
      />
    </label>
  )
);

GroupUserItem.displayName = "GroupUserItem";

// New Dialog-based component for community pages
interface GroupCreateDialogCommunityProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated?: (groupId?: string) => void;
}

export const GroupCreateDialogCommunity = memo(
  ({ isOpen, onClose, onGroupCreated }: GroupCreateDialogCommunityProps) => {
    const navigate = useNavigate();
    const { createChat, isCreatingChat } = useChat();

    const [groupName, setGroupName] = useState("");
    const [groupDescription, setGroupDescription] = useState("");
    const [groupUsername, setGroupUsername] = useState("");
    const [groupRules, setGroupRules] = useState("");
    const [groupCategory, setGroupCategory] = useState("other");
    const [isPublic, setIsPublic] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [icon, setIcon] = useState<string | null>(null);
    const [users, setUsers] = useState<UserType[]>([]);
    const [isUsersLoading, setIsUsersLoading] = useState(false);

    // Reset state when dialog opens
    useEffect(() => {
      if (isOpen) {
        setSearchQuery("");
        setDebouncedSearch("");
        setUsers([]);
        setSelectedUsers([]);
        setGroupName("");
        setIcon(null);
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
        setUsers([]);
      }
    }, [debouncedSearch]);

    const fetchUsers = async (query: string) => {
      setIsUsersLoading(true);
      try {
        const { data } = await API.get("/user/all", {
          params: { search: query }
        });
        setUsers(data.users || []);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Failed to fetch users");
      } finally {
        setIsUsersLoading(false);
      }
    };

    const toggleUserSelection = (id: string) => {
      setSelectedUsers((prev) =>
        prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id]
      );
    };

    const resetState = () => {
      setGroupName("");
      setGroupDescription("");
      setGroupUsername("");
      setGroupRules("");
      setGroupCategory("other");
      setIsPublic(false);
      setSelectedUsers([]);
      setSearchQuery("");
      setIcon(null);
    };

    const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setIcon(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };

    const removeIcon = () => {
      setIcon(null);
    };

    const handleClose = () => {
      onClose();
      resetState();
    };

    const handleCreateGroup = async () => {
      if (!groupName.trim() || selectedUsers?.length === 0) return;
      
      try {
        const response = await createChat({
          isGroup: true,
          participants: selectedUsers,
          groupName: groupName,
          groupDescription: groupDescription || undefined,
          groupUsername: groupUsername || undefined,
          groupRules: groupRules || undefined,
          groupCategory: groupCategory || "other",
          isPublic,
          icon: icon || undefined,
        });
        
        handleClose();
        resetState();
        
        if (response?._id) {
          if (onGroupCreated) {
            onGroupCreated(response._id);
          } else {
            navigate(`/groups/${response._id}`);
          }
        }
      } catch (error) {
        // Error handled by createChat
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogDescription className="sr-only">Create a new group by selecting members and adding a group name</DialogDescription>
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              Create New Group
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            {/* Group Icon */}
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                {icon ? (
                  <img src={icon} alt="Group icon" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl sm:text-2xl">👥</span>
                )}
              </div>
              <div className="flex gap-2 w-full">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIconChange}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm">
                    <Upload className="w-4 h-4" />
                    <span>Add Photo</span>
                  </div>
                </label>
                {icon && (
                  <button
                    type="button"
                    onClick={removeIcon}
                    className="px-3 py-2 rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition text-sm"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Group Name Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Group Name *</label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                maxLength={50}
              />
            </div>

            {/* Group Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="What's this group about?"
                maxLength={500}
              />
            </div>

            {/* Group Username */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Group Username (@)</label>
              <Input
                value={groupUsername}
                onChange={(e) => setGroupUsername(e.target.value.toLowerCase())}
                placeholder="unique-group-name"
                maxLength={30}
              />
            </div>

            {/* Group Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select
                value={groupCategory}
                onChange={(e) => setGroupCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm bg-background"
              >
                <option value="other">Other</option>
                <option value="study">Study</option>
                <option value="gaming">Gaming</option>
                <option value="work">Work</option>
                <option value="hobbies">Hobbies</option>
                <option value="sports">Sports</option>
                <option value="entertainment">Entertainment</option>
              </select>
            </div>

            {/* Public/Private Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is-public-community"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="is-public-community" className="text-sm font-medium cursor-pointer">
                Make group public (discoverable)
              </label>
            </div>

            {/* Group Rules */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Group Rules</label>
              <textarea
                value={groupRules}
                onChange={(e) => setGroupRules(e.target.value)}
                placeholder="Set group rules and guidelines..."
                maxLength={1000}
                rows={2}
                className="w-full px-3 py-2 border rounded-md text-sm bg-background resize-none"
              />
              <p className="text-xs text-muted-foreground">{groupRules.length}/1000</p>
            </div>

            {/* User Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Add Members ({selectedUsers.length} selected)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or @username..."
                  className="pl-10"
                />
              </div>

              {/* Users List */}
              <div className="border rounded-lg h-[250px] sm:h-[300px] overflow-y-auto p-2 space-y-1">
                {!searchQuery.trim() ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                    <Search className="h-12 w-12 opacity-20" />
                    <p className="text-sm">Start typing to search users...</p>
                  </div>
                ) : searchQuery.trim().length < 2 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                    <Search className="h-12 w-12 opacity-20" />
                    <p className="text-sm">Type at least 2 characters to search</p>
                  </div>
                ) : isUsersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner className="w-6 h-6" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No users found
                  </div>
                ) : (
                  users.map((user) => (
                    <GroupUserItem
                      key={user._id}
                      user={user}
                      isSelected={selectedUsers.includes(user._id)}
                      onToggle={toggleUserSelection}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Create Button */}
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isCreatingChat}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateGroup}
                disabled={
                  isCreatingChat ||
                  !groupName.trim() ||
                  selectedUsers.length === 0
                }
              >
                {isCreatingChat && <Spinner className="w-4 h-4 mr-2" />}
                Create Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

GroupCreateDialogCommunity.displayName = "GroupCreateDialogCommunity";