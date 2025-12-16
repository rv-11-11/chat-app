import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { API } from "@/lib/axios-client";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { AlertCircle, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const AcceptInvitePage = () => {
  const [searchParams] = useSearchParams();
  const { username: urlUsername } = useParams<{ username?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Support both old format (?type=X&username=Y) and new format (/join/:username)
  const queryType = searchParams.get("type");
  const id = searchParams.get("id") || searchParams.get("username") || urlUsername;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [type, setType] = useState<string | null>(queryType);
  const [resolvedId, setResolvedId] = useState<string>(id || "");
  const [inviteInfo, setInviteInfo] = useState<any | null>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const allowFlag = inviteInfo?.allowInviteLinkJoin ?? true;
  const inviteLinkEnabled = allowFlag;
  const inviteDisabledReason = (() => {
    if (inviteInfo?.allowInviteLinkJoin === false) {
      return "Invite links are disabled for this group; ask an admin to add you.";
    }
    return null;
  })();

  useEffect(() => {
    const validate = async () => {
      if (!id) {
        setIsValid(false);
        setIsLoading(false);
        return;
      }

      try {
        // If type is not provided, fetch it from backend
        let resolvedType = type;
        let resolvedId = id;
        
        if (!resolvedType) {
          try {
            const { data } = await API.get(`/invite/resolve/${id}`);
            resolvedType = data.type;
            resolvedId = data.id;
          } catch {
            setIsValid(false);
            setIsLoading(false);
            return;
          }
        }

        if (resolvedType === "group") {
          const { data } = await API.get(`/chat/${resolvedId}/invite-info`);
          setInviteInfo(data.info);
        } else if (resolvedType === "channel") {
          const { data } = await API.get(`/channel/${resolvedId}/invite-info`);
          setInviteInfo(data.info);
          
          // Check if user is already a member
          if (user) {
            try {
              const { data: channelData } = await API.get(`/channel/${resolvedId}/info`);
              const isAlreadyMember = channelData.channel?.participants?.some(
                (p: any) => {
                  const participantId = typeof p === 'object' && p._id ? p._id : p;
                  return participantId?.toString() === user._id?.toString();
                }
              );
              
              if (isAlreadyMember) {
                // User is already a member, redirect to channel
                toast.info("You're already a member of this channel");
                navigate(`/channel/${resolvedId}`, { replace: true });
                return;
              }
            } catch {
              // If error checking membership, continue to show invite
            }
          }
          
          // Fetch recent posts for channels
          try {
            const postsResponse = await API.get(`/channel/${resolvedId}/messages-preview?limit=8`);
            const messages = postsResponse.data.messages || [];
            const recentMessages = messages
              .filter((msg: any) => msg.messageType !== "SYSTEM" && (msg.content || msg.image))
              .slice(0, 4);
            setRecentPosts(recentMessages);
          } catch {
            setRecentPosts([]);
          }
        } else if (resolvedType === "community") {
          const { data } = await API.get(`/community/${resolvedId}/invite-info`);
          setInviteInfo(data.info);
          
          // Check if user is already a member of community
          if (user) {
            try {
              const { data: communityData } = await API.get(`/community/${resolvedId}/info`);
              const isAlreadyMember = communityData.community?.members?.some(
                (m: any) => {
                  const memberId = typeof m === 'object' && m._id ? m._id : m;
                  return memberId?.toString() === user._id?.toString();
                }
              );
              
              if (isAlreadyMember) {
                // User is already a member, redirect to community
                toast.info("You're already a member of this community");
                navigate(`/community/${resolvedId}`, { replace: true });
                return;
              }
            } catch {
              // If error checking membership, continue to show invite
            }
          }
        } else {
          setIsValid(false);
          setIsLoading(false);
          return;
        }
        
        // Update type and resolved ID after resolution
        setType(resolvedType);
        setResolvedId(resolvedId);
        setIsValid(true);
      } catch {
        setIsValid(false);
      } finally {
        setIsLoading(false);
      }
    };

    validate();
  }, [type, id]);

  // Auto-join when user becomes authenticated
  useEffect(() => {
    if (!user || !isValid || isJoining || !type || !resolvedId) return;

    const autoJoin = async () => {
      setIsJoining(true);
      try {
        const allowFlag = inviteInfo?.allowInviteLinkJoin ?? true;

        if (!allowFlag) {
          toast.error("Invite link joining is disabled for this group");
          return;
        }

        if (type === "group") {
          await API.post(`/chat/${resolvedId}/join-by-invite`);
          toast.success("Joined group");
          // Use the _id from inviteInfo which contains the actual ObjectId
          const groupId = inviteInfo?._id || resolvedId;
          navigate(`/groups/${groupId}`);
        } else if (type === "channel") {
          await API.post(`/channel/${resolvedId}/join-by-invite`);
          toast.success("Joined channel");
          const channelId = inviteInfo?._id || resolvedId;
          navigate(`/channel/${channelId}`);
        } else if (type === "community") {
          await API.post(`/community/${resolvedId}/join-by-invite`);
          toast.success("Joined community");
          const communityId = inviteInfo?._id || resolvedId;
          navigate(`/community/${communityId}`);
        }
      } catch (err: unknown) {
        const e = err as { response?: { status?: number; data?: { message?: string } } };
        if (e?.response?.status !== 401) {
          toast.error(e?.response?.data?.message || "Failed to join");
        }
        setIsJoining(false);
      }
    };

    autoJoin();
  }, [user, isValid, type, id, inviteInfo]);

  if (isLoading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner className="w-12 h-12 !text-primary" />
      </div>
    );

  if (!isValid) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">Invalid or expired invite</h2>
        <p className="text-muted-foreground">This invite link is not valid.</p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 rounded-lg bg-primary text-white"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-white/5 bg-white/5 backdrop-blur-md shadow-2xl p-6 sm:p-10 text-white">
        <div className="flex flex-col items-center gap-4 mb-6">
          {inviteInfo?.icon ? (
            <img
              src={inviteInfo.icon}
              alt="group icon"
              className="w-24 h-24 rounded-2xl border border-white/20 object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-3xl font-semibold">
              👥
            </div>
          )}
          <div className="text-center space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Incoming invite</p>
            <h3 className="text-2xl font-semibold text-white">
              {inviteInfo?.groupName || inviteInfo?.name || "Invite"}
            </h3>
            {inviteInfo?.channelDescription && type === "channel" && (
              <p className="text-sm text-white/70 max-w-md mx-auto line-clamp-2">
                {inviteInfo.channelDescription}
              </p>
            )}
            <div className="flex items-center justify-center gap-2 text-white/70">
              <Users className="h-4 w-4" />
              <span className="text-sm">
                {inviteInfo
                  ? `${inviteInfo.participantsCount ?? inviteInfo.membersCount ?? inviteInfo.subscriberCount ?? 0} ${type === "channel" ? "subscribers" : "member(s)"}`
                  : "Invite details"}
              </span>
            </div>
            <p className="text-xs text-white/60">
              {type === "group" ? "Group" : type === "channel" ? "Channel" : "Community"}
            </p>
          </div>
        </div>

        {/* Recent Activity for Channels - Prominent Display */}
        {type === "channel" && (
          <div className="mb-6 rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-5 shadow-lg">
            <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <span>📱</span>
              Recent Posts Preview ({recentPosts.length} {recentPosts.length === 1 ? 'post' : 'posts'})
            </h4>
            {recentPosts.length > 0 ? (
              <div className="space-y-3 max-h-[320px] overflow-y-auto">
                {recentPosts.map((post, index) => (
                  <div key={post._id || index} className="p-3 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm hover:bg-white/15 transition-colors">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-white">
                          {post.sender?.name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white">
                          {post.sender?.name || 'Channel Admin'}
                        </p>
                        <p className="text-[10px] text-white/60">
                          {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                    {post.image && (
                      <div className="mb-2 rounded-lg overflow-hidden">
                        <img 
                          src={post.image} 
                          alt="Post preview" 
                          className="w-full h-28 object-cover"
                        />
                      </div>
                    )}
                    {post.content && (
                      <p className="text-sm text-white/90 line-clamp-3 leading-relaxed">{post.content}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center bg-white/5 rounded-xl border border-white/10">
                <p className="text-sm text-white/70 font-medium">No posts yet. Be the first to join and see content!</p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          {user ? (
            <button
              onClick={async () => {
                if (!inviteLinkEnabled) {
                  toast.error("Invite link joining is disabled for this group");
                  return;
                }
                setIsJoining(true);
                try {
                  if (type === "group") {
                    await API.post(`/chat/${resolvedId}/join-by-invite`);
                    toast.success("Joined group");
                    navigate(`/groups/${resolvedId}`);
                  } else if (type === "channel") {
                    await API.post(`/channel/${resolvedId}/join-by-invite`);
                    toast.success("Joined channel");
                    navigate(`/channel/${resolvedId}`);
                  } else if (type === "community") {
                    await API.post(`/community/${resolvedId}/join-by-invite`);
                    toast.success("Joined community");
                    navigate(`/community/${resolvedId}`);
                  }
                } catch (err: unknown) {
                  const e = err as { response?: { status?: number; data?: { message?: string } } };
                  toast.error(e?.response?.data?.message || "Failed to join");
                  setIsJoining(false);
                }
              }}
              className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 py-3 text-center font-semibold shadow-lg shadow-purple-500/30 transition hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!inviteLinkEnabled || isJoining}
            >
              {isJoining ? <Spinner className="w-5 h-5 mx-auto" /> : `Join ${type || ""}`}
            </button>
          ) : (
            <button
              onClick={() => {
                const currentPath = window.location.pathname + window.location.search;
                navigate(`/sign-in?redirect=${encodeURIComponent(currentPath)}`);
              }}
              className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 py-3 text-center font-semibold shadow-lg shadow-purple-500/30 transition hover:scale-[1.01]"
            >
              Sign in to join
            </button>
          )}

          <button
            onClick={() => navigate("/")}
            className="w-full rounded-2xl border border-white/30 py-3 text-center font-semibold text-white/80 transition hover:border-white/60"
          >
            Cancel
          </button>

          {!user && (
            <p className="text-center text-xs text-white/60">
              Don't have an account?{" "}
              <button
                onClick={() => {
                  const currentPath = window.location.pathname + window.location.search;
                  navigate(`/sign-up?redirect=${encodeURIComponent(currentPath)}`);
                }}
                className="underline hover:text-white/80"
              >
                Sign up
              </button>
            </p>
          )}

          {inviteDisabledReason && (
            <div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-50">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-200" />
              <span className="text-left leading-tight">{inviteDisabledReason}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitePage;
