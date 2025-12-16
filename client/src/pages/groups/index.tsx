import { useMemo, useEffect, useState } from "react";
import { useChat } from "@/hooks/use-chat";
import EmptyState from "@/components/empty-state";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search, MoreVertical, Trash2, LogOut, Bell } from "lucide-react";
import { formatChatTime } from "@/lib/helper";
import { Input } from "@/components/ui/input";
import { API } from "@/lib/axios-client";
import { useAuth } from "@/hooks/use-auth";
import { GroupCreateDialog } from "@/components/chat/group-create-dialog";
import SectionHeader from "@/components/section-header";
import GroupInviteDialog from "@/components/group/group-invite-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Groups = () => {
  const { chats, fetchChats, isChatsLoading, deleteChat } = useChat();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteGroupId, setInviteGroupId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Handle create group parameter from URL
  useEffect(() => {
    const newGroup = searchParams.get("new");
    if (newGroup === "group") {
      setIsCreateDialogOpen(true);
      // Remove new param from URL
      searchParams.delete("new");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  // Handle invite parameter from URL
  useEffect(() => {
    const inviteId = searchParams.get("invite");
    if (inviteId) {
      setInviteGroupId(inviteId);
    }
  }, [searchParams]);

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
  };

  const handleCloseInvite = () => {
    setInviteGroupId(null);
    // Also clear the invite param from the URL if present
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("invite");
    setSearchParams(nextParams);
  };

  const { user } = useAuth();

  const handleGroupCreated = (groupId?: string) => {
    fetchChats();
    handleCloseCreateDialog();
    if (groupId) {
      navigate(`/groups/${groupId}`);
    }
  };

  // Filter only group chats (exclude channels)
  const groupChats = useMemo(() => {
    return chats?.filter((chat) => chat.isGroup && chat.type !== "CHANNEL") || [];
  }, [chats]);

  // Filter groups by search query (name or username)
  const filteredGroups = useMemo(() => {
    const filtered = searchQuery.trim() 
      ? groupChats.filter((chat) => {
          const query = searchQuery.toLowerCase();
          const name = (chat.name || chat.groupName || "").toLowerCase();
          const username = (chat.groupUsername || "").toLowerCase();
          return name.includes(query) || username.includes(query);
        })
      : groupChats;
    
    // Sort by last message time
    return filtered.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA; // Most recent first
    });
  }, [groupChats, searchQuery]);

  return (
    <div className="h-screen overflow-y-auto pb-20 bg-background">
      <div className="p-4">
        {/* Header */}
        <SectionHeader
          title="Groups"
          className="mb-6"
          actions={
            <GroupCreateDialog
              onGroupCreated={handleGroupCreated}
              isOpen={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <button
                className="bg-primary text-primary-foreground p-2 rounded-lg hover:opacity-90 transition-opacity"
                title="Create Group"
              >
                <Plus className="h-5 w-5" />
              </button>
            </GroupCreateDialog>
          }
        />

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {isChatsLoading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Loading groups...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {filteredGroups.map((chat) => (
              <div
                key={chat._id}
                className="relative"
              >
                <div className="relative">
                        <button
                          onClick={() => navigate(`/groups/${chat._id}`)}
                          className="w-full text-left flex items-center gap-3 p-3 pr-12 rounded-lg transition-colors bg-white dark:bg-slate-900 hover:bg-base-200"
                        >
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    {chat.icon ? (
                      <img
                        src={chat.icon}
                        alt="Group"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-xs font-bold text-blue-500">👥</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">
                      {chat.name || chat.groupName || "Group"}
                    </h3>
                    <p className="text-sm truncate text-muted-foreground">
                      {chat.lastMessage?.content ||
                        `${chat.participants?.length || 0} members`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end min-w-[60px] mr-6">
                    {chat.lastMessage?.createdAt && (
                      <span className="text-xs text-muted-foreground">
                        {formatChatTime(chat.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                </button>
                <div className="absolute inset-y-0 right-11 z-50 flex items-center justify-center pointer-events-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/groups/${chat._id}`);
                    }}
                    className="relative p-1.5 rounded-md hover:bg-base-300 transition-colors"
                    title={chat.unreadCount && chat.unreadCount > 0 ? `${chat.unreadCount} new message${chat.unreadCount > 1 ? 's' : ''}` : 'No new messages'}
                  >
                    <Bell className={`h-4 w-4 ${chat.unreadCount && chat.unreadCount > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                    {chat.unreadCount !== undefined && chat.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold px-1 min-w-[16px] h-4 rounded-full flex items-center justify-center">
                        {chat.unreadCount > 100 ? "99+" : chat.unreadCount}
                      </span>
                    )}
                  </button>
                </div>
                <div className="absolute inset-y-0 right-3 z-50 flex items-center pointer-events-auto">
                  <DropdownMenu open={openMenuId === chat._id} onOpenChange={(open) => {
                    if (open) {
                      setOpenMenuId(chat._id);
                    } else {
                      setOpenMenuId(null);
                    }
                  }}>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(chat._id);
                        }}
                        className="p-1.5 rounded-md hover:bg-base-300 transition-colors"
                      >
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-50">
                      <DropdownMenuItem
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await API.post(`/chat/${chat._id}/remove-member`, { userId: user?._id });
                            fetchChats();
                          } catch {
                            // ignore
                          }
                          setOpenMenuId(null);
                        }}
                        className="cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Leave Group
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={async (e) => {
                          e.stopPropagation();
                          await deleteChat(chat._id);
                          setOpenMenuId(null);
                          fetchChats();
                        }}
                        className="text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Group
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Dialog */}
      {inviteGroupId && (
        <GroupInviteDialog groupId={inviteGroupId} onClose={handleCloseInvite} />
      )}
    </div>
  );
};

export default Groups;
