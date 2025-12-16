import { useState, useEffect, useCallback, useRef } from "react";
import { useChannel } from "@/hooks/use-channel";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChannelCreateDialog } from "@/components/channel/channel-create-dialog";
import EmptyState from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import SectionHeader from "@/components/section-header";
import { Search, Plus, MoreVertical, Trash2, Megaphone, Link, UserPlus, Check } from "lucide-react";
import { toast } from "sonner";
import { formatChatTime } from "@/lib/helper";
import ChannelInviteDialog from "@/components/channel/channel-invite-dialog";
import { PaginationLoader } from "@/components/ui/pagination-loader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Channel = () => {
  const {
    channels,
    publicChannels,
    fetchUserChannels,
    fetchPublicChannels,
    isChannelsLoading,
    subscribeToChannel,
    unsubscribeFromChannel,
    createChannel,
    isCreatingChannel,
  } = useChannel();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showPublic, setShowPublic] = useState(false);
  const [inviteChannelId, setInviteChannelId] = useState<string | null>(null);
  // hoveredId not needed; always show actions
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [subscribingChannels, setSubscribingChannels] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchUserChannels();
  }, [fetchUserChannels]);

  // Check if user is subscribed to a channel
  const isUserSubscribed = (channel: any): boolean => {
    // Check if the channel exists in the user's subscribed channels list
    return channels.some(ch => ch._id === channel._id);
  };

  // Handle subscribe from discover
  const handleSubscribeClick = async (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSubscribingChannels(prev => new Set(prev).add(channelId));
    try {
      await subscribeToChannel(channelId);
      fetchUserChannels();
      fetchPublicChannels(currentPage, ITEMS_PER_PAGE, debouncedSearch);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to subscribe");
    } finally {
      setSubscribingChannels(prev => {
        const next = new Set(prev);
        next.delete(channelId);
        return next;
      });
    }
  };

  // Handle unsubscribe from discover
  const handleUnsubscribeClick = async (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSubscribingChannels(prev => new Set(prev).add(channelId));
    try {
      await unsubscribeFromChannel(channelId);
      fetchUserChannels();
      fetchPublicChannels(currentPage, ITEMS_PER_PAGE, debouncedSearch);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to unsubscribe");
    } finally {
      setSubscribingChannels(prev => {
        const next = new Set(prev);
        next.delete(channelId);
        return next;
      });
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch public channels when showPublic or search changes
  useEffect(() => {
    if (showPublic) {
      setCurrentPage(1);
      fetchPublicChannels(1, ITEMS_PER_PAGE, debouncedSearch);
    }
  }, [showPublic, debouncedSearch, fetchPublicChannels]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !showPublic || !publicChannels?.pagination) return;
    if (currentPage >= publicChannels.pagination.pages) return;

    setIsLoadingMore(true);
    try {
      await fetchPublicChannels(currentPage + 1, ITEMS_PER_PAGE, debouncedSearch);
      setCurrentPage(currentPage + 1);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, showPublic, publicChannels, currentPage, debouncedSearch, fetchPublicChannels]);

  // Infinite scroll handler
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !showPublic) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Trigger load when user is 200px from bottom
      if (scrollHeight - scrollTop - clientHeight < 200) {
        handleLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [showPublic, handleLoadMore]);

  // Handle invite parameter from URL
  useEffect(() => {
    const inviteId = searchParams.get("invite");
    if (inviteId) {
      setInviteChannelId(inviteId);
    }
  }, [searchParams]);

  const handleCloseInvite = () => {
    setInviteChannelId(null);
    // Remove invite param from URL
    searchParams.delete("invite");
    setSearchParams(searchParams);
  };

  // For My Channels, filter client-side; for Discover, use API search results directly
  // The backend already filters for public channels, so no need to check isPublic again
  const displayChannels = showPublic
    ? (publicChannels?.channels || [])
    : channels || [];
  const filteredChannels = showPublic
    ? displayChannels // Discover uses API search, no client-side filtering needed
    : displayChannels.filter((channel) => {
        const search = searchQuery.toLowerCase();
        const cleanSearch = search.startsWith('@') ? search.slice(1) : search;
        const name = (channel.groupName || channel.name || "").toLowerCase();
        const username = (channel.channelUsername || "").toLowerCase();
        
        return name.includes(cleanSearch) || username.includes(cleanSearch);
      }).sort((a, b) => {
        // Sort My Channels by most recent activity
        const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.updatedAt || a.createdAt).getTime();
        const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.updatedAt || b.createdAt).getTime();
        return bTime - aTime;
      });

  return (
    <div ref={scrollContainerRef} className="h-screen overflow-y-auto pb-20 bg-background">
      <div className="p-4">
        {/* Header */}
        <SectionHeader
          title="Channels"
          className="mb-6"
          actions={
            <ChannelCreateDialog
              onCreateChannel={createChannel}
              isLoading={isCreatingChannel}
            >
              <button
                className="bg-primary text-primary-foreground p-2 rounded-lg hover:opacity-90 transition-opacity"
                title="Create Channel"
              >
                <Plus className="h-5 w-5" />
              </button>
            </ChannelCreateDialog>
          }
        />

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name or @username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowPublic(false)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              !showPublic
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            My Channels
          </button>
          <button
            onClick={() => setShowPublic(true)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              showPublic
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Discover
          </button>
        </div>

        {/* Channels List */}
        {isChannelsLoading && filteredChannels.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Loading channels...</p>
          </div>
        ) : filteredChannels.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="space-y-2">
              {filteredChannels.map((channel) => (
                <div
                  key={channel._id}
                  className="relative group"
                >
                  <div
                    className="flex items-center gap-3 p-3 pr-12 rounded-lg transition-colors cursor-pointer hover:bg-base-200 bg-card"
                    onClick={() => navigate(`/channel/${channel._id}`)}
                  >
                    <div className="w-12 h-12 rounded-lg flex-shrink-0 relative overflow-hidden">
                      {channel.icon ? (
                        <img
                          src={channel.icon}
                          alt={channel.groupName || channel.name || "Channel"}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center rounded-lg">
                          <Megaphone className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      {!showPublic && channel.unreadCount && channel.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1 bg-primary text-primary-foreground">
                          {channel.unreadCount > 100 ? "99+" : channel.unreadCount}
                        </span>
                      )}
                    </div>
                    <div
                      className="flex-1 min-w-0"
                    >
                      <h3 className="font-semibold truncate text-base leading-tight">
                        {channel.groupName || channel.name || "Channel"}
                      </h3>
                      {!(!showPublic && !channel.isPublic) && channel.channelUsername ? (
                        <p className={`text-xs truncate mt-0.5 ${showPublic ? "text-muted-foreground" : "text-primary/70"}`}>@{channel.channelUsername}</p>
                      ) : null}
                      {(() => {
                        // For Discover tab, always show subscription status
                        if (showPublic) {
                          return (
                            <p className="text-sm truncate text-muted-foreground">
                              {channel.channelDescription || `${channel.subscriberCount || 0} subscribers`}
                            </p>
                          );
                        }

                        // For My Channels, show last message or subscription info
                        const last = channel.lastMessage;
                        const isSystem = last && String((last.messageType ?? "")).toLowerCase() === "system";
                        if (!last || isSystem) {
                          return (
                            <p className="text-sm truncate flex items-center gap-1 text-muted-foreground">
                              {channel.channelDescription || `${channel.subscriberCount || 0} subscribers`}
                            </p>
                          );
                        }

                        return (
                          <p className="text-sm truncate flex items-center gap-1 text-muted-foreground">
                            {last.image ? (
                              <>
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <span>Image</span>
                              </>
                            ) : (
                              <span>{last.content}</span>
                            )}
                          </p>
                        );
                      })()}
                    </div>
                    {showPublic && (() => {
                      const isSubscribed = isUserSubscribed(channel);
                      const isSubscribing = subscribingChannels.has(channel._id);
                      
                      return isSubscribed ? (
                        <button
                          onClick={(e) => handleUnsubscribeClick(channel._id, e)}
                          disabled={isSubscribing}
                          className="text-xs font-medium px-3 py-1.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 flex-shrink-0"
                        >
                          <Check className="h-3 w-3" />
                          {isSubscribing ? "Unsubscribing..." : "Unsubscribe"}
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleSubscribeClick(channel._id, e)}
                          disabled={isSubscribing}
                          className="text-xs font-medium px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 flex-shrink-0"
                        >
                          <UserPlus className="h-3 w-3" />
                          {isSubscribing ? "Subscribing..." : "Subscribe"}
                        </button>
                      );
                    })()}
                  </div>
                  
                  {/* Show time for My Channels */}
                  {!showPublic && (
                    <span className="absolute right-12 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {channel.lastMessage?.createdAt && String((channel.lastMessage.messageType ?? "")).toLowerCase() !== "system"
                        ? formatChatTime(channel.lastMessage.createdAt)
                        : channel.updatedAt 
                        ? formatChatTime(channel.updatedAt)
                        : formatChatTime(channel.createdAt)
                      }
                    </span>
                  )}
                  {/* Show dropdown menu only for My Channels */}
                  {!showPublic && (
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-base-300 transition-colors z-10"
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="z-50">
                        {channel.isPublic && channel.channelUsername && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(`@${channel.channelUsername}`);
                              toast.success("Username copied to clipboard");
                              setOpenMenuId(null);
                            }}
                            className="cursor-pointer"
                          >
                            <Link className="h-4 w-4 mr-2" />
                            Copy Username
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await unsubscribeFromChannel(channel._id);
                              setOpenMenuId(null);
                              fetchUserChannels();
                            } catch (error) {
                              toast.error("Failed to leave channel");
                            }
                          }}
                          className="text-destructive focus:text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Leave Channel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
            {showPublic && publicChannels?.pagination && (
              <PaginationLoader
                currentPage={currentPage}
                totalPages={publicChannels.pagination.pages}
                onLoadMore={handleLoadMore}
                isLoading={isLoadingMore}
              />
            )}
          </>
        )}
      </div>

      {/* Invite Dialog */}
      {inviteChannelId && (
        <ChannelInviteDialog
          channelId={inviteChannelId}
          onClose={handleCloseInvite}
        />
      )}
    </div>
  );
};

export default Channel;
