import { memo, useEffect, useState } from "react";
import { useChat } from "@/hooks/use-chat";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Plus, Search } from "lucide-react";
import { InputGroupInput } from "../ui/input-group";
import { Spinner } from "../ui/spinner";
import type { UserType } from "../../types/auth.type";
import AvatarWithBadge from "../avatar-with-badge";
import { useNavigate } from "react-router-dom";
import { API } from "@/lib/axios-client";

export const NewChatPopover = memo(() => {
  const navigate = useNavigate();
  const { createChat } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search users as user types
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data } = await API.get("/user/all", {
          params: { search: searchQuery },
        });
        setSearchResults(data.users || []);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const resetState = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    resetState();
  };

  const handleCreateChat = async (userId: string) => {
    setLoadingUserId(userId);
    try {
      const response = await createChat({
        isGroup: false,
        participantId: userId,
      });
      setIsOpen(false);
      resetState();
      navigate(`/chat/${response?._id}`);
    } finally {
      setLoadingUserId(null);
      setIsOpen(false);
      resetState();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary text-primary-foreground p-2 rounded-lg hover:opacity-90 transition-opacity"
          title="Create Chat"
        >
          <Plus className="h-5 w-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[95vw] sm:w-80 z-[999] p-0 rounded-xl min-h-[300px] sm:min-h-[400px] max-h-[85vh] flex flex-col"
      >
        <div className="border-b p-2 sm:p-3 flex flex-col gap-2">
          <h3 className="text-base sm:text-lg font-semibold">New Chat</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <InputGroupInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or @username..."
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 justify-center overflow-y-auto px-1 py-1 space-y-1">
          {searchQuery.trim().length < 2 ? (
            <div className="text-center text-muted-foreground py-8">
              Type at least 2 characters to search
            </div>
          ) : isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="w-6 h-6" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No users found
            </div>
          ) : (
            searchResults.map((user) => (
              <ChatUserItem
                key={user._id}
                user={user}
                isLoading={loadingUserId === user._id}
                disabled={loadingUserId !== null}
                onClick={handleCreateChat}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});
NewChatPopover.displayName = "NewChatPopover";

const UserAvatar = memo(({ user }: { user: UserType }) => (
  <>
    <AvatarWithBadge name={user.name || user.username || "User"} src={user.avatar ?? ""} />
    <div className="flex-1 min-w-0">
      <h5 className="text-[13.5px] font-medium truncate">{user.name || "Unknown User"}</h5>
      {user.username && (
        <p className="text-xs text-primary truncate">@{user.username}</p>
      )}
    </div>
  </>
));

UserAvatar.displayName = "UserAvatar";

const ChatUserItem = memo(
  ({
    user,
    isLoading,
    disabled,
    onClick,
  }: {
    user: UserType;
    disabled: boolean;
    isLoading: boolean;
    onClick: (id: string) => void;
  }) => (
    <button
      className="relative w-full flex items-center gap-2 p-2 rounded-sm hover:bg-accent transition-colors text-left disabled:opacity-50"
      disabled={isLoading || disabled}
      onClick={() => onClick(user._id)}
    >
      <UserAvatar user={user} />
      {isLoading && <Spinner className="absolute right-2 w-4 h-4 ml-auto" />}
    </button>
  )
);

ChatUserItem.displayName = "ChatUserItem";
