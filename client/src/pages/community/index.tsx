import { useState, useEffect, useCallback, useRef } from "react";
import { useCommunity } from "@/hooks/use-community";
import { useAuth } from "@/hooks/use-auth";

type MemberRef = string | { _id: string };
import { useNavigate } from "react-router-dom";
import { CommunityCreateDialog } from "@/components/community/community-create-dialog";
import EmptyState from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import SectionHeader from "@/components/section-header";
import { Search, Plus, MoreVertical, LogOut } from "lucide-react";
import { PaginationLoader } from "@/components/ui/pagination-loader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Community = () => {
  const {
    communities,
    publicCommunities,
    fetchUserCommunities,
    fetchPublicCommunities,
    isCommunitiesLoading,
    createCommunity,
    isCreatingCommunity,
    joinCommunity,
    leaveCommunity,
  } = useCommunity();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showPublic, setShowPublic] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchUserCommunities();
  }, [fetchUserCommunities]);

  useEffect(() => {
    if (showPublic) {
      setCurrentPage(1);
      fetchPublicCommunities(1, ITEMS_PER_PAGE);
    }
  }, [showPublic, fetchPublicCommunities]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !showPublic || !publicCommunities) return;
    const totalPages = Math.max(1, Math.ceil((publicCommunities.total || 0) / ITEMS_PER_PAGE));
    if (currentPage >= totalPages) return;
    setIsLoadingMore(true);
    try {
      await fetchPublicCommunities(currentPage + 1, ITEMS_PER_PAGE);
      setCurrentPage(currentPage + 1);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, showPublic, publicCommunities, currentPage, fetchPublicCommunities]);

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

  // When in Discover (showPublic), ensure we only display communities marked public
  const displayCommunities =
    showPublic
      ? (publicCommunities?.communities || []).filter((c) => c.isPublic === true)
      : communities || [];
  const filteredCommunities = displayCommunities
    .filter((community) => {
      const query = searchQuery.toLowerCase();
      const cleanQuery = query.startsWith('@') ? query.slice(1) : query;
      const name = community.name.toLowerCase();
      const username = (community.username || "").toLowerCase();
      return name.includes(cleanQuery) || username.includes(cleanQuery);
    })
    .sort((a, b) => {
      const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA; // Most recent first
    });

  const handleJoinCommunity = async (communityId: string) => {
    if (!communityId) return;
    setJoiningId(communityId);
    try {
      await joinCommunity(communityId);
      // Refresh lists so "My Communities" and Discover stay in sync
      await fetchUserCommunities();
      if (showPublic) {
        await fetchPublicCommunities();
      }
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div ref={scrollContainerRef} className="h-screen overflow-y-auto pb-20 bg-background">
      <div className="p-3 sm:p-4">
        {/* Header */}
        <SectionHeader
          title="Communities"
          titleClassName="text-xl sm:text-2xl"
          className="mb-4 sm:mb-6"
          actions={
            <CommunityCreateDialog
              onCreateCommunity={createCommunity}
              isLoading={isCreatingCommunity}
            >
              <button
                className="bg-primary text-primary-foreground p-2 rounded-lg hover:opacity-90 transition-opacity"
                title="Create Community"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </CommunityCreateDialog>
          }
        />

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowPublic(false)}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors ${
              !showPublic
                ? "bg-primary text-primary-foreground"
                : "bg-base-200 text-base-content/70"
            }`}
          >
            My Communities
          </button>
          <button
            onClick={() => setShowPublic(true)}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors ${
              showPublic
                ? "bg-primary text-primary-foreground"
                : "bg-base-200 text-base-content/70"
            }`}
          >
            Discover
          </button>
        </div>

        {/* Communities List */}
        {isCommunitiesLoading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Loading communities...</p>
          </div>
        ) : filteredCommunities.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="space-y-2">
              {showPublic
                ? filteredCommunities.map((community) => {
                  const communityId = community._id;
                  type MemberRef = string | { _id: string };
                  const members: MemberRef[] =
                    (community as { members?: MemberRef[] }).members || [];
                  const currentUserId = user?._id;
                  const isMember = currentUserId
                    ? members.some((m) =>
                        (typeof m === "string" ? m : m._id) === currentUserId
                      )
                    : false;
                  const isJoining = joiningId === communityId;

                  return (
                    <div
                      key={communityId}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-colors hover:bg-base-200"
                    >
                      <button
                        type="button"
                        onClick={() => navigate(`/community/${communityId}`)}
                        className="flex items-center gap-2 sm:gap-3 flex-1 text-left min-w-0"
                      >
                        {community.icon ? (
                          <img
                            src={community.icon}
                            alt={community.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-base sm:text-lg font-bold text-purple-500">
                              {community.name.charAt(0).toUpperCase() || "?"}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm sm:text-base truncate">{community.name}</h3>
                          <p className="text-xs sm:text-sm truncate text-muted-foreground">
                            {community.description ||
                              `${((community as { members?: MemberRef[] })
                                .members?.length || 0) ?? 0} members`}
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isMember) {
                            navigate(`/community/${communityId}`);
                          } else {
                            void handleJoinCommunity(communityId);
                          }
                        }}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg border border-primary text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        disabled={isJoining}
                      >
                        {isMember
                          ? "Open"
                          : isJoining
                            ? "Joining..."
                            : "Join"}
                      </button>
                    </div>
                  );
                })
                : filteredCommunities.map((community) => (
                  <div
                    key={community._id}
                    className="relative"
                  >
                    <button
                      onClick={() => navigate(`/community/${community._id}`)}
                      className="w-full text-left flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-colors hover:bg-base-200"
                    >
                      {community.icon ? (
                        <img
                          src={community.icon}
                          alt={community.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-base sm:text-lg font-bold text-purple-500">
                            {community.name.charAt(0).toUpperCase() || "?"}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm sm:text-base truncate">{community.name}</h3>
                        <p className="text-xs sm:text-sm truncate text-muted-foreground">
                          {community.description ||
                            `${(
                              (community as { members?: MemberRef[] }).members
                                ?.length || 0
                            ) ?? 0} members`}
                        </p>
                      </div>
                    </button>
                    <DropdownMenu open={openMenuId === community._id} onOpenChange={(open) => {
                      if (open) {
                        setOpenMenuId(community._id);
                      } else {
                        setOpenMenuId(null);
                      }
                    }}>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(community._id);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-base-300 transition-colors z-10"
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="z-50">
                        <DropdownMenuItem
                          onClick={async (e) => {
                            e.stopPropagation();
                            await leaveCommunity(community._id);
                            setOpenMenuId(null);
                          }}
                          className="cursor-pointer"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Leave Community
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
            </div>
            {showPublic && publicCommunities && (
              <PaginationLoader
                currentPage={currentPage}
                totalPages={Math.max(1, Math.ceil((publicCommunities.total || 0) / ITEMS_PER_PAGE))}
                onLoadMore={handleLoadMore}
                isLoading={isLoadingMore}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Community;
