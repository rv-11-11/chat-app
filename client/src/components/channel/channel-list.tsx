import { useEffect, useState } from "react";
import { useChannel } from "@/hooks/use-channel";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../theme-provider";
import SectionHeader from "../section-header";
import { ChannelCreateDialog } from "./channel-create-dialog";
import { Plus, Search, Megaphone, MoreVertical, Trash2, Bell } from "lucide-react";
import { formatChatTime } from "@/lib/helper";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useChat } from "@/hooks/use-chat";
import { useSocket } from "@/hooks/use-socket";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const ChannelList = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { 
    fetchUserChannels, 
    channels, 
    isChannelsLoading,
    createChannel,
    unsubscribeFromChannel
  } = useChannel();
  const { deleteChat } = useChat();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserChannels();
  }, [fetchUserChannels]);

  // Listen for channel updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleChatUpdate = () => {
      // Refresh channels to get updated lastMessage
      fetchUserChannels();
    };

    const handleChannelUpdate = () => {
      // Refresh channels to get updated channel info (icon, name, etc)
      fetchUserChannels();
    };

    socket.on("chat:update", handleChatUpdate);
    socket.on("channel:update", handleChannelUpdate);

    return () => {
      socket.off("chat:update", handleChatUpdate);
      socket.off("channel:update", handleChannelUpdate);
    };
  }, [socket, fetchUserChannels]);

  const filteredChannels = channels
    .filter((channel) => 
      (channel.groupName || channel.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA; // Most recent first
    });

  const handleCreateChannel = async (data: {
    name: string;
    description?: string;
    isPublic: boolean;
    icon?: string;
  }) => {
    const newChannel = await createChannel(data);
    if (newChannel) {
      navigate(`/channel/${newChannel._id}`);
    }
    return newChannel;
  };

  return (
    <div className="h-screen overflow-y-auto pb-20 bg-background">
      <div className="p-4">
        <SectionHeader
          title="Channels"
          className="mb-6"
          actions={
            <ChannelCreateDialog onCreateChannel={handleCreateChannel}>
              <Button size="icon" className="rounded-lg">
                <Plus className="h-5 w-5" />
              </Button>
            </ChannelCreateDialog>
          }
        />

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {isChannelsLoading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Loading channels...</p>
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground space-y-2">
            <Megaphone className="h-10 w-10 opacity-20" />
            <p className="text-sm">
              {searchQuery ? "No channels found" : "You haven't joined any channels yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredChannels.map((channel) => (
              <div
                key={channel._id}
                className="relative"
              >
                <button
                  onClick={() => navigate(`/channel/${channel._id}`)}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors
                    ${theme === "dark" ? "hover:bg-slate-800" : "hover:bg-gray-100"}`}
                >
                  {channel.icon ? (
                    <img
                      src={channel.icon}
                      alt={channel.groupName || channel.name || "Channel"}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Megaphone className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">
                      {channel.groupName || channel.name || "Unnamed Channel"}
                    </h3>
                    {channel.isPublic && channel.channelUsername && (
                      <p className="text-xs text-primary/70 truncate">@{channel.channelUsername}</p>
                    )}
                    {/* prefer last non-system message for preview */}
                    {(() => {
                      const last = channel.lastMessage;
                      const isSystem = last && String((last.messageType ?? "")).toLowerCase() === "system";
                      const preview = (!last || isSystem)
                        ? (channel.channelDescription || `${channel.subscriberCount || 0} subscribers`)
                        : (last.image ? "Image" : (last.content || ""));
                      const timeToShow = (!last || isSystem)
                        ? (channel.updatedAt || channel.createdAt)
                        : last.createdAt;
                      return (
                        <>
                          <p className={`text-sm truncate ${theme === "dark" ? "text-slate-400" : "text-gray-500"}`}>
                            {preview}
                          </p>
                          {/* override time display to avoid showing system message timestamp */}
                          <div className="sr-only" data-time={timeToShow} />
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex flex-col items-end justify-center mr-20 min-w-[50px]">
                    {(channel.lastMessage?.createdAt || channel.updatedAt || channel.createdAt) && (
                      <span className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-gray-500"}`}>
                        {formatChatTime(channel.lastMessage?.createdAt || channel.updatedAt || channel.createdAt)}
                      </span>
                    )}
                  </div>
                </button>
                <div className="absolute inset-y-0 right-11 z-50 flex items-center justify-center pointer-events-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/channels/${channel._id}`);
                    }}
                    className="relative p-1.5 rounded-md hover:bg-base-300 transition-colors"
                    title={channel.unreadCount && channel.unreadCount > 0 ? `${channel.unreadCount} new message${channel.unreadCount > 1 ? 's' : ''}` : 'No new messages'}
                  >
                    <Bell className={`h-4 w-4 ${channel.unreadCount && channel.unreadCount > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                    {channel.unreadCount !== undefined && channel.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold px-1 min-w-[16px] h-4 rounded-full flex items-center justify-center">
                        {channel.unreadCount > 99 ? "99+" : channel.unreadCount}
                      </span>
                    )}
                  </button>
                </div>
                <div className="absolute inset-y-0 right-3 z-50 flex items-center pointer-events-auto">
                  <DropdownMenu open={openMenuId === channel._id} onOpenChange={(open) => {
                    if (open) {
                      setOpenMenuId(channel._id);
                    } else {
                      setOpenMenuId(null);
                    }
                  }}>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(channel._id);
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
                            await unsubscribeFromChannel(channel._id);
                            fetchUserChannels();
                          } catch {
                            // ignore
                          }
                          setOpenMenuId(null);
                        }}
                        className="cursor-pointer"
                      >
                        Leave Channel
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={async (e) => {
                          e.stopPropagation();
                          await deleteChat(channel._id);
                          setOpenMenuId(null);
                          fetchUserChannels();
                        }}
                        className="text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Channel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelList;
