import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import { Megaphone, Check, AlertCircle, Users, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useTheme } from "@/components/theme-provider";

interface ChannelInviteInfo {
  _id: string;
  groupName: string;
  channelDescription?: string;
  subscriberCount: number;
  participants: any[];
  icon?: string;
  createdAt?: string;
  recentPosts?: any[];
}

interface ChannelInviteDialogProps {
  channelId: string;
  onClose: () => void;
}

const ChannelInviteDialog = ({ channelId, onClose }: ChannelInviteDialogProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [channelInfo, setChannelInfo] = useState<ChannelInviteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  useEffect(() => {
    if (!channelId) return;
    fetchChannelInfo();
  }, [channelId]);

  const fetchChannelInfo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await API.get(`/channel/${channelId}/info`);
      setChannelInfo(data.channel);
      
      // Check if user is already subscribed
      const isSubscribed = data.channel.participants?.some(
        (p: any) => {
          const participantId = typeof p === 'object' && p._id ? p._id : p;
          return participantId?.toString() === user?._id?.toString();
        }
      );
      setAlreadySubscribed(isSubscribed);
      
      // If user is already subscribed, redirect directly to channel
      if (isSubscribed && user) {
        navigate(`/channel/${channelId}`);
        onClose();
        return;
      }

      // Fetch recent posts preview (even if user is not subscribed)
      try {
        const postsResponse = await API.get(`/channel/${channelId}/messages-preview?limit=8`);
        const messages = postsResponse.data.messages || [];
        // Filter out system messages and get up to 4 posts
        const recentMessages = messages
          .filter((msg: any) => msg.messageType !== "SYSTEM" && (msg.content || msg.image))
          .slice(0, 4);
        setRecentPosts(recentMessages);
        console.log('Recent posts loaded:', recentMessages.length);
      } catch (error) {
        // Failed to load posts, continue without them
        console.log('Failed to load recent posts:', error);
        setRecentPosts([]);
      }
    } catch (error: any) {
      setError(error?.response?.data?.message || "Failed to load channel information");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!channelId) return;

    if (!user) {
      localStorage.setItem(
        "pendingInvite",
        JSON.stringify({ type: "channel", id: channelId })
      );
      navigate("/", { replace: true });
      return;
    }

    setIsSubscribing(true);
    try {
      // Use join-by-invite endpoint which works for both public and private channels
      await API.post(`/channel/${channelId}/join-by-invite`);
      toast.success("Successfully joined the channel!");
      navigate(`/channel/${channelId}`);
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to join channel");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleOpenChannel = () => {
    navigate(`/channel/${channelId}`);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div
          className={`rounded-xl shadow-lg w-full max-w-md
            ${theme === "dark" ? "bg-slate-800" : "bg-white"}
            flex flex-col`}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Spinner className="w-11 h-11 !text-primary" />
            </div>
          ) : error || !channelInfo ? (
            <div className="p-6 text-center">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Invalid Invite</h2>
              <p className="text-muted-foreground mb-4">
                {error || "This channel doesn't exist or the invite link is invalid"}
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-6 text-center border-b">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {channelInfo.icon ? (
                    <img src={channelInfo.icon} alt={channelInfo.groupName} className="w-full h-full object-cover" />
                  ) : (
                    <Megaphone className="h-10 w-10 text-primary" />
                  )}
                </div>
                <h2 className="text-xl font-bold mb-2">{channelInfo.groupName}</h2>
                {channelInfo.channelDescription && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {channelInfo.channelDescription}
                  </p>
                )}
                <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
                  <Users className="h-4 w-4" />
                  <span>{channelInfo.subscriberCount || 0} subscribers</span>
                </div>
              </div>

              {/* Recent Posts Preview - Prominent Display */}
              <div className="px-6 py-5 border-b bg-muted/30">
                <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                  <span className="text-primary">📱</span>
                  Recent Posts Preview
                </h3>
                {recentPosts.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {recentPosts.map((post, index) => (
                      <div key={post._id || index} className="p-3 rounded-lg bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-primary">
                              {post.sender?.name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground/80">
                              {post.sender?.name || 'Channel Admin'}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recently'}
                            </p>
                          </div>
                        </div>
                        {post.image && (
                          <div className="mb-2 rounded-md overflow-hidden">
                            <img 
                              src={post.image} 
                              alt="Post preview" 
                              className="w-full h-32 object-cover"
                            />
                          </div>
                        )}
                        {post.content && (
                          <p className="text-sm text-foreground line-clamp-3 leading-relaxed">{post.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground font-medium">No posts yet. Be the first to subscribe and see content!</p>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                {alreadySubscribed ? (
                  <>
                    <div className="flex items-center justify-center gap-2 text-green-500 mb-4">
                      <Check className="h-5 w-5" />
                      <span className="font-medium">You're already subscribed</span>
                    </div>
                    <button
                      onClick={handleOpenChannel}
                      className="w-full py-3 px-4 rounded-lg font-medium bg-primary text-white hover:opacity-90 transition-all"
                    >
                      Open Channel
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-center text-muted-foreground text-sm mb-4">
                      Subscribe to this channel to receive updates and broadcasts.
                    </p>
                    <button
                      onClick={handleSubscribe}
                      disabled={isSubscribing}
                      className="w-full py-3 px-4 rounded-lg font-medium bg-primary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isSubscribing ? "Subscribing..." : "Subscribe"}
                    </button>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t">
                <button
                  onClick={onClose}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    theme === "dark"
                      ? "bg-slate-700 hover:bg-slate-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-black"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ChannelInviteDialog;
