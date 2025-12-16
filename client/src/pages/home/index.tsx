import { useMemo, useEffect, useState } from "react";
import { useChat } from "@/hooks/use-chat";
import { useChannel } from "@/hooks/use-channel";
import { useCommunity } from "@/hooks/use-community";
import type { ChannelType } from "@/hooks/use-channel";
import { useNavigate } from "react-router-dom";
import EmptyState from "@/components/empty-state";
import SectionHeader from "@/components/section-header";
import { useI18n } from "@/hooks/use-i18n";
import { Users, Megaphone, Search, MoreVertical, Trash2, UserPlus, Check, LogOut, CheckCircle2, Bell } from "lucide-react";
import { formatChatTime, getOtherUserAndGroup } from "@/lib/helper";
import { Input } from "@/components/ui/input";
import AvatarWithBadge from "@/components/avatar-with-badge";
import { useAuth } from "@/hooks/use-auth";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Home = () => {
  const { chats, fetchChats, deleteChat } = useChat();
  const { channels, fetchUserChannels } = useChannel();
  const { fetchUserCommunities } = useCommunity();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  // hoveredId was used for hover-only menus; actions are now always visible
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [discoverChannels, setDiscoverChannels] = useState<ChannelType[]>([]);
  const [loadingDiscover, setLoadingDiscover] = useState(false);
  const [showDiscover, setShowDiscover] = useState(false);
  const [subscribingChannels, setSubscribingChannels] = useState<Set<string>>(new Set());
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sponsoredChannels, setSponsoredChannels] = useState<ChannelType[]>([]);
  const [loadingSponsored, setLoadingSponsored] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState<{
    users: any[];
    channels: any[];
    communities: any[];
    groups: any[];
  }>({ users: [], channels: [], communities: [], groups: [] });
  const [isSearching, setIsSearching] = useState(false);
  const currentUserId = user?._id || null;

  // Fetch data on mount
  useEffect(() => {
    fetchChats();
    fetchUserChannels();
    fetchUserCommunities();
    fetchSponsoredChannels();
  }, [fetchChats, fetchUserChannels, fetchUserCommunities]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Global search effect - runs only in Discover tab
  useEffect(() => {
    const performGlobalSearch = async () => {
      const query = debouncedSearchQuery.trim();
      if (!query || !showDiscover) {
        setGlobalSearchResults({ users: [], channels: [], communities: [], groups: [] });
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        // Use unified search API - single request for all types
        const response = await API.get(`/search?q=${encodeURIComponent(query)}&limit=20`);
        const { users = [], channels = [], communities = [], groups = [] } = response.data;

        setGlobalSearchResults({
          users,
          channels,
          communities,
          groups
        });
      } catch (error) {
        console.error('Global search failed:', error);
        setGlobalSearchResults({ users: [], channels: [], communities: [], groups: [] });
      } finally {
        setIsSearching(false);
      }
    };

    performGlobalSearch();
  }, [debouncedSearchQuery, showDiscover]);

  // Fetch discover channels (all channels sorted by posts)
  const fetchDiscoverChannels = async () => {
    if (discoverChannels.length > 0) return; // Already fetched
    
    setLoadingDiscover(true);
    try {
      console.log("Fetching discover channels...");
      const { data } = await API.get("/channel/recommended?limit=50");
      // Filter out private channels (defensive check)
      const publicChannels = (data.channels || []).filter((channel: any) => channel.isPublic !== false);
      setDiscoverChannels(publicChannels);
    } catch (error) {
      console.error("Failed to fetch discover channels:", error);
    } finally {
      setLoadingDiscover(false);
    }
  };

  // Fetch sponsored channels (featured channels from admin)
  const fetchSponsoredChannels = async () => {
    setLoadingSponsored(true);
    try {
      const { data } = await API.get("/admin/channels/featured");
      const channels = (data.channels || []).slice(0, 2); // Take top 2
      setSponsoredChannels(channels);
    } catch (error) {
      console.error("Failed to fetch sponsored channels:", error);
      // Fallback to recommended channels if featured endpoint fails
      try {
        const { data } = await API.get("/channel/recommended?limit=2");
        const publicChannels = (data.channels || []).filter((channel: any) => channel.isPublic !== false);
        setSponsoredChannels(publicChannels);
      } catch (fallbackError) {
        console.error("Fallback fetch also failed:", fallbackError);
      }
    } finally {
      setLoadingSponsored(false);
    }
  };

  // Fetch discover channels on component mount and when tab is switched
  useEffect(() => {
    fetchDiscoverChannels();
  }, []);

  useEffect(() => {
    if (showDiscover && discoverChannels.length === 0) {
      fetchDiscoverChannels();
    }
  }, [showDiscover]);

  // Handle subscribe to channel from discover
  const handleSubscribeToChannel = async (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking subscribe
    
    setSubscribingChannels(prev => new Set(prev).add(channelId));
    try {
      await API.post(`/channel/${channelId}/subscribe`);
      // Update the channel in discover list to add current user to participants
      setDiscoverChannels(prev => prev.map(ch => {
        if (ch._id === channelId) {
          return {
            ...ch,
            participants: [...(ch.participants || []), user as any],
            subscriberCount: (ch.subscriberCount || 0) + 1
          };
        }
        return ch;
      }));
      // Also refresh user's channels list
      await fetchUserChannels();
      toast.success("Subscribed to channel");
    } catch (error: any) {
      console.error("Failed to subscribe:", error);
      toast.error(error?.response?.data?.message || "Failed to subscribe to channel");
    } finally {
      setSubscribingChannels(prev => {
        const next = new Set(prev);
        next.delete(channelId);
        return next;
      });
    }
  };

  // Handle unsubscribe from channel
  const handleUnsubscribeFromChannel = async (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking unsubscribe
    
    setSubscribingChannels(prev => new Set(prev).add(channelId));
    try {
      await API.post(`/channel/${channelId}/unsubscribe`);
      // Update the channel in discover list to remove current user from participants
      setDiscoverChannels(prev => prev.map(ch => {
        if (ch._id === channelId) {
          return {
            ...ch,
            participants: (ch.participants || []).filter((p: any) => {
              const participantId = typeof p === 'string' ? p : p._id;
              return participantId?.toString() !== currentUserId?.toString();
            }),
            subscriberCount: Math.max((ch.subscriberCount || 0) - 1, 0)
          };
        }
        return ch;
      }));
      // Also refresh user's channels list to update UI
      await fetchUserChannels();
      // Show success feedback
      toast.success("Unsubscribed from channel");
    } catch (error: any) {
      console.error("Failed to unsubscribe:", error);
      toast.error(error?.response?.data?.message || "Failed to unsubscribe from channel");
    } finally {
      setSubscribingChannels(prev => {
        const next = new Set(prev);
        next.delete(channelId);
        return next;
      });
    }
  };

  // Check if user is subscribed to a channel
  const isUserSubscribed = (channel: ChannelType): boolean => {
    // Check if the channel exists in the user's subscribed channels list
    return channels.some(ch => ch._id === channel._id);
  };

  // Fetch discover channels on component mount and when tab is switched
  const homeItems = useMemo(() => {
    const q = searchQuery.trim();

    if (!q) {
      // Show user's chats and subscribed channels when not searching
      const items = [
        ...(chats || []).map((c) => ({ kind: 'chat' as const, item: c })),
        ...(channels || []).map((c) => ({ kind: 'channel' as const, item: c })),
      ];

      return items.sort((a, b) => {
        const aTime = a.item.lastMessage?.createdAt ? new Date(a.item.lastMessage.createdAt).getTime() : 0;
        const bTime = b.item.lastMessage?.createdAt ? new Date(b.item.lastMessage.createdAt).getTime() : 0;
        return bTime - aTime;
      });
    }

    // Search only in user's chats and subscribed channels
    const searchTerm = q.startsWith('@') ? q.slice(1) : q;
    
    const matchedChats = (chats || []).filter((chat) => {
      if (chat.type === 'GROUP') {
        const name = (chat.groupName || '').toLowerCase();
        return name.includes(searchTerm.toLowerCase());
      } else {
        const name = (chat.name || chat.participants?.[0]?.name || '').toLowerCase();
        return name.includes(searchTerm.toLowerCase());
      }
    }).map((c) => ({ kind: 'chat' as const, item: c }));

    const matchedChannels = (channels || []).filter((ch) => {
      const name = (ch.groupName || ch.name || '').toLowerCase();
      const username = (ch.channelUsername || '').toLowerCase();
      return name.includes(searchTerm.toLowerCase()) || username.includes(searchTerm.toLowerCase());
    }).map((c) => ({ kind: 'channel' as const, item: c }));

    // Combine and sort
    const merged = [...matchedChats, ...matchedChannels];
    return merged.sort((a, b) => {
      const aTime = a.item.lastMessage?.createdAt ? new Date(a.item.lastMessage.createdAt).getTime() : 0;
      const bTime = b.item.lastMessage?.createdAt ? new Date(b.item.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [chats, channels, searchQuery]);

  // Search-aware combined view: when searchQuery is empty show user's chats+channels sorted; when searching, show global search results
  const combinedItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    if (!q) {
      // Show user's chats and subscribed channels when not searching
      const items = [
        ...(chats || []).map((c) => ({ kind: 'chat' as const, item: c })),
        ...(channels || []).map((c) => ({ kind: 'channel' as const, item: c })),
      ];

      return items.sort((a, b) => {
        const aTime = a.item.lastMessage?.createdAt ? new Date(a.item.lastMessage.createdAt).getTime() : 0;
        const bTime = b.item.lastMessage?.createdAt ? new Date(b.item.lastMessage.createdAt).getTime() : 0;
        return bTime - aTime;
      });
    }

    // Use global search results when searching
    const matchedUsers = globalSearchResults.users.map((u: any) => ({ kind: 'user' as const, item: u }));
    const matchedChannels = globalSearchResults.channels.map((c: any) => ({ kind: 'channel' as const, item: c }));
    const matchedCommunities = globalSearchResults.communities.map((c: any) => ({ kind: 'community' as const, item: c }));
    const matchedGroups = globalSearchResults.groups.map((c: any) => ({ kind: 'chat' as const, item: c }));

    // Also include user's private chats that match
    const matchedPrivateChats = (chats || []).filter((chat) => {
      if (chat.type === 'GROUP') return false; // Groups are already in global search
      const name = (chat.name || chat.participants?.[0]?.name || '').toLowerCase();
      const username = (chat.participants?.[0]?.username || '').toLowerCase();
      const cleanQuery = q.startsWith('@') ? q.slice(1) : q;
      return name.includes(cleanQuery) || username.includes(cleanQuery);
    }).map((c) => ({ kind: 'chat' as const, item: c }));

    // Combine all search results - users first, then channels, communities, groups, private chats
    const merged = [...matchedUsers, ...matchedChannels, ...matchedCommunities, ...matchedGroups, ...matchedPrivateChats];
    return merged.sort((a, b) => {
      const aTime = a.item.lastMessage?.createdAt ? new Date(a.item.lastMessage.createdAt).getTime() : 0;
      const bTime = b.item.lastMessage?.createdAt ? new Date(b.item.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [chats, channels, searchQuery, globalSearchResults]);

  const totalItems = showDiscover ? combinedItems.length : homeItems.length;

  return (
    <div className="h-screen overflow-y-auto pb-20 bg-background">
      <div className="p-4">
        <SectionHeader
          title={t("home.title", "Home")}
          className="mb-6"
        />

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
          <Input
            placeholder={t("home.search.placeholder", "Search communities, channels, and groups...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sponsored Channels */}
        {(loadingSponsored || sponsoredChannels.length > 0) && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                Featured Channels
              </h3>
            </div>
            {loadingSponsored ? (
              <div className="grid grid-cols-1 gap-2">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 animate-pulse">
                    <div className="w-12 h-12 rounded-lg bg-primary/20"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-primary/20 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-primary/20 rounded w-1/2"></div>
                    </div>
                    <div className="w-16 h-8 bg-primary/20 rounded-full"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {sponsoredChannels.map((channel) => {
                const isSubscribed = isUserSubscribed(channel);
                const isSubscribing = subscribingChannels.has(channel._id);
                
                return (
                  <div
                    key={channel._id}
                    onClick={() => navigate(`/channel/${channel._id}`)}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 hover:border-primary/40 cursor-pointer transition-all"
                  >
                    {channel.icon ? (
                      <img
                        src={channel.icon}
                        alt={channel.groupName || channel.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Megaphone className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-semibold text-sm truncate">
                          {channel.groupName || channel.name}
                        </p>
                        {/* {channel.isVerified && ( */}
                          <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        {/* )} */}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {channel.subscriberCount || 0} subscribers
                      </p>
                    </div>
                    <button
                      onClick={(e) => isSubscribed 
                        ? handleUnsubscribeFromChannel(channel._id, e)
                        : handleSubscribeToChannel(channel._id, e)
                      }
                      disabled={isSubscribing}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        isSubscribed
                          ? "bg-muted text-muted-foreground hover:bg-muted/80"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      } disabled:opacity-50`}
                    >
                      {isSubscribing ? "..." : isSubscribed ? "Joined" : "Join"}
                    </button>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}

        {/* Tab Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowDiscover(false)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              !showDiscover
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t("home.tabs.home", "Home")}
          </button>
          <button
            onClick={() => setShowDiscover(true)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              showDiscover
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t("home.tabs.discover", "Discover")}
          </button>
        </div>

        {/* Home Tab Content */}
        {!showDiscover && (
          <>
            {isSearching ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : totalItems === 0 ? (
              searchQuery.trim() ? (
                <div className="text-center py-12">
                  <Search className="h-16 w-16 mx-auto mb-4 opacity-30 text-muted-foreground" />
                  <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                  <p className="text-sm text-muted-foreground mt-2">Try searching with different keywords</p>
                </div>
              ) : (
                <EmptyState />
              )
            ) : (
              <div className="space-y-2">
                {homeItems.map((entry) => {
              if (entry.kind === 'channel') {
                const channel = entry.item as ChannelType;
                return (
                  <div
                    key={channel._id}
                    
                    className="relative group"
                  >
                    <div className="relative">
                      <button
                        onClick={() => navigate(`/channel/${channel._id}`)}
                        className="w-full text-left flex items-center gap-3 p-3 pr-20 rounded-lg transition-colors bg-white dark:bg-slate-900 hover:bg-base-200"
                      >
                                {channel.icon ? (
                                  <img
                                    src={channel.icon}
                                    alt={channel.groupName || channel.name}
                                    // use 4:3 aspect on small screens and square on sm+
                                    className="w-10 h-auto aspect-[4/3] sm:aspect-square rounded-lg object-cover flex-shrink-0"
                                  />
                                ) : (
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 relative">
                            <Megaphone className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">
                            {channel.groupName || channel.name || "Channel"}
                          </h3>
                          {channel.isPublic && channel.channelUsername && (
                            <p className="text-xs text-primary/70 truncate">@{channel.channelUsername}</p>
                          )}
                          <p className="text-sm truncate text-muted-foreground">
                            {((channel.lastMessage && (channel.lastMessage.messageType || "").toString().toLowerCase() === "system")
                              ? `${channel.subscriberCount || 0} ${t(
                                  "home.channels.subscribersSuffix",
                                  "subscribers"
                                )}`
                              : channel.lastMessage?.content || `${channel.subscriberCount || 0} ${t(
                                  "home.channels.subscribersSuffix",
                                  "subscribers"
                                )}`)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end min-w-[50px] mr-6">
                          {channel.lastMessage?.createdAt && (
                            <span className="text-xs text-muted-foreground">
                              {formatChatTime(channel.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                      </button>
                      <div className="absolute inset-y-0 right-11 z-50 flex items-center pointer-events-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/channel/${channel._id}`);
                          }}
                          className="relative p-1.5 rounded-md hover:bg-base-300 transition-colors"
                          title={channel.unreadCount && channel.unreadCount > 0 ? `${channel.unreadCount} new message${channel.unreadCount > 1 ? 's' : ''}` : 'No new messages'}
                        >
                          <Bell className={`h-4 w-4 ${channel.unreadCount && channel.unreadCount > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                          {channel.unreadCount !== undefined && channel.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold px-1 min-w-[16px] h-4 rounded-full flex items-center justify-center">
                              {channel.unreadCount > 100 ? "99+" : channel.unreadCount}
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
                                setOpenMenuId(null);
                                await handleUnsubscribeFromChannel(channel._id, e);
                              }}
                              className="text-destructive focus:text-destructive cursor-pointer"
                            >
                              <LogOut className="h-4 w-4 mr-2" />
                              Leave Channel
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              } else if (entry.kind === 'chat') {
                const chat = entry.item;
                const isGroup = chat.isGroup;
                const chatName =
                  chat.name ||
                  chat.groupName ||
                  chat.participants?.[0]?.name ||
                  "Chat";

                const { name, avatar, isOnline } = getOtherUserAndGroup(chat, currentUserId);

                return (
                  <div
                    key={chat._id}
                    
                    className="relative group"
                  >
                    <div className="relative">
                      <button
                        onClick={() =>
                          navigate(
                            isGroup ? `/groups/${chat._id}` : `/chat/${chat._id}`
                          )
                        }
                        className="w-full text-left flex items-center gap-3 p-3 pr-12 rounded-lg transition-colors bg-white dark:bg-slate-900 hover:bg-base-200"
                      >
                        {isGroup ? (
                          avatar ? (
                            <img
                              src={avatar}
                              alt={name}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                              <Users className="h-5 w-5 text-blue-500" />
                            </div>
                          )
                        ) : (
                          <AvatarWithBadge
                            name={name}
                            src={avatar}
                            isOnline={isOnline}
                            size="w-10 h-10"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{chatName}</h3>
                          <p className="text-sm truncate text-muted-foreground">
                            {chat.lastMessage?.content ||
                              t("home.chats.noMessages", "No messages yet")}
                          </p>
                        </div>
                        <div className="flex flex-col items-end min-w-[50px] mr-6">
                          {chat.lastMessage?.createdAt && (
                            <span className="text-xs text-muted-foreground">
                              {formatChatTime(chat.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                      </button>
                      <div className="absolute inset-y-0 right-11 z-50 flex items-center pointer-events-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(isGroup ? `/groups/${chat._id}` : `/chat/${chat._id}`);
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
                                await deleteChat(chat._id);
                                setOpenMenuId(null);
                                fetchChats();
                              }}
                              className="text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete {isGroup ? "Group" : "Chat"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
              </div>
            )}
          </>
        )}

        {/* Discover Tab Content */}
        {showDiscover && (
          <div>
          {isSearching ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : searchQuery.trim() ? (
            // Show search results AND recommended channels if there's a search query
            <div className="space-y-6">
              {/* Search Results Section */}
              <div>
                {totalItems === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-16 w-16 mx-auto mb-4 opacity-30 text-muted-foreground" />
                    <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                    <p className="text-sm text-muted-foreground mt-2">Try searching with different keywords</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-3">Search Results</h3>
                    <div className="space-y-2">
                      {combinedItems.map((entry) => {
                  if (entry.kind === 'user') {
                    const user = entry.item as {
                      _id: string;
                      name?: string;
                      username?: string;
                      avatar?: string;
                      email?: string;
                    };
                    return (
                      <div key={user._id} className="relative group">
                        <div
                          onClick={async () => {
                            try {
                              // Create or get existing chat with this user
                              const response = await API.post('/chat/create', { participantId: user._id });
                              const chatId = response.data._id || response.data.chat?._id;
                              if (chatId) {
                                navigate(`/chat/${chatId}`);
                              }
                            } catch (error) {
                              console.error('Failed to start chat:', error);
                              toast.error('Failed to start chat');
                            }
                          }}
                          className="w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors bg-white dark:bg-slate-900 hover:bg-base-200 cursor-pointer"
                        >
                          <AvatarWithBadge
                            name={user.name || "User"}
                            src={user.avatar}
                            isOnline={false}
                            size="w-10 h-10"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{user.name || "User"}</h3>
                            {user.username && (
                              <p className="text-xs text-primary/70 truncate">@{user.username}</p>
                            )}
                          </div>
                          <button
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>Message</span>
                          </button>
                        </div>
                      </div>
                    );
                  } else if (entry.kind === 'channel') {
                    const channel = entry.item as ChannelType;
                    const isSubscribed = isUserSubscribed(channel);
                    const isSubscribing = subscribingChannels.has(channel._id);
                    
                    return (
                      <div key={channel._id} className="relative group">
                        <div
                          onClick={() => navigate(`/channel/${channel._id}`)}
                          className="w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors bg-white dark:bg-slate-900 hover:bg-base-200 cursor-pointer"
                        >
                          {channel.icon ? (
                            <img
                              src={channel.icon}
                              alt={channel.groupName || channel.name}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Megaphone className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">
                              {channel.groupName || channel.name || "Channel"}
                            </h3>
                            {channel.channelUsername && (
                              <p className="text-xs text-primary/70 truncate">@{channel.channelUsername}</p>
                            )}
                            <p className="text-sm truncate text-muted-foreground">
                              {channel.subscriberCount || 0} {t("home.channels.subscribersSuffix", "subscribers")}
                              {(channel as any).messageCount > 0 && ` • ${(channel as any).messageCount} posts`}
                            </p>
                          </div>
                          {isSubscribed ? (
                            <button
                              onClick={(e) => handleUnsubscribeFromChannel(channel._id, e)}
                              disabled={isSubscribing}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>{isSubscribing ? "Unsubscribing..." : "Unsubscribe"}</span>
                            </button>
                          ) : (
                            <button
                              onClick={(e) => handleSubscribeToChannel(channel._id, e)}
                              disabled={isSubscribing}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              <span>{isSubscribing ? "Subscribing..." : "Subscribe"}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  } else if (entry.kind === 'community') {
                    const community = entry.item as {
                      _id: string;
                      name?: string;
                      username?: string;
                      description?: string;
                      icon?: string;
                      members?: any[];
                      memberCount?: number;
                    };
                    return (
                      <div key={community._id} className="relative group">
                        <div className="relative">
                          <button
                            onClick={() => navigate(`/community/${community._id}`)}
                            className="w-full text-left flex items-center gap-3 p-3 pr-12 rounded-lg transition-colors bg-white dark:bg-slate-900 hover:bg-base-200"
                          >
                            {community.icon ? (
                              <img
                                src={community.icon}
                                alt={community.name}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 relative">
                                <Users className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">{community.name || "Community"}</h3>
                              {community.username && (
                                <p className="text-xs text-primary/70 truncate">@{community.username}</p>
                              )}
                              <p className="text-sm truncate text-muted-foreground">
                                {community.description || t("home.communities.noDescription", "No description")}
                              </p>
                            </div>
                            <div className="flex flex-col items-end min-w-[48px]">
                              <span className="text-xs text-muted-foreground">
                                {community.memberCount || community.members?.length || 0} members
                              </span>
                            </div>
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
                    </div>
                    </>
                )}
              </div>

              {/* Recommended Channels Section */}
              {discoverChannels.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-3">Recommended Channels</h3>
                  <div className="space-y-2">
                    {discoverChannels.slice(0, 5).map((channel) => {
                      const isSubscribed = isUserSubscribed(channel);
                      const isSubscribing = subscribingChannels.has(channel._id);
                      
                      return (
                        <div key={channel._id} className="relative group">
                          <div
                            onClick={() => navigate(`/channel/${channel._id}`)}
                            className="w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors bg-white dark:bg-slate-900 hover:bg-base-200 cursor-pointer"
                          >
                            {channel.icon ? (
                              <img
                                src={channel.icon}
                                alt={channel.groupName || channel.name}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Megaphone className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">
                                {channel.groupName || channel.name || "Channel"}
                              </h3>
                              {channel.channelUsername && (
                                <p className="text-xs text-primary/70 truncate">@{channel.channelUsername}</p>
                              )}
                              <p className="text-sm truncate text-muted-foreground">
                                {channel.subscriberCount || 0} {t("home.channels.subscribersSuffix", "subscribers")}
                                {(channel as any).messageCount > 0 && ` • ${(channel as any).messageCount} posts`}
                              </p>
                            </div>
                            {isSubscribed ? (
                              <button
                                onClick={(e) => handleUnsubscribeFromChannel(channel._id, e)}
                                disabled={isSubscribing}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>{isSubscribing ? "Unsubscribing..." : "Unsubscribe"}</span>
                              </button>
                            ) : (
                              <button
                                onClick={(e) => handleSubscribeToChannel(channel._id, e)}
                                disabled={isSubscribing}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                              >
                                <UserPlus className="h-3.5 w-3.5" />
                                <span>{isSubscribing ? "Subscribing..." : "Subscribe"}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Show all discover channels if no search query
            loadingDiscover ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : discoverChannels.length === 0 ? (
              <div className="text-center py-12">
                <Megaphone className="h-16 w-16 mx-auto mb-4 opacity-30 text-muted-foreground" />
                <p className="text-muted-foreground">No channels to discover yet</p>
              </div>
            ) : (
              <div className="space-y-2">
              {discoverChannels.map((channel) => {
                const isSubscribed = isUserSubscribed(channel);
                const isSubscribing = subscribingChannels.has(channel._id);
                
                return (
                  <div key={channel._id} className="relative group">
                    <div
                      onClick={() => navigate(`/channel/${channel._id}`)}
                      className="w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors bg-white dark:bg-slate-900 hover:bg-base-200 cursor-pointer"
                    >
                      {channel.icon ? (
                        <img
                          src={channel.icon}
                          alt={channel.groupName || channel.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Megaphone className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">
                          {channel.groupName || channel.name || "Channel"}
                        </h3>
                        {channel.channelUsername && (
                          <p className="text-xs text-primary/70 truncate">@{channel.channelUsername}</p>
                        )}
                        <p className="text-sm truncate text-muted-foreground">
                          {channel.subscriberCount || 0} {t("home.channels.subscribersSuffix", "subscribers")}
                          {(channel as any).messageCount > 0 && ` • ${(channel as any).messageCount} posts`}
                        </p>
                      </div>
                      {isSubscribed ? (
                        <button
                          onClick={(e) => handleUnsubscribeFromChannel(channel._id, e)}
                          disabled={isSubscribing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>{isSubscribing ? "Unsubscribing..." : "Unsubscribe"}</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleSubscribeToChannel(channel._id, e)}
                          disabled={isSubscribing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>{isSubscribing ? "Subscribing..." : "Subscribe"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            )
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default Home;
