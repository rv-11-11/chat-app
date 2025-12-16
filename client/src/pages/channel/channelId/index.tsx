import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChannel } from "@/hooks/use-channel";
import { useSocket } from "@/hooks/use-socket";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import { API } from "@/lib/axios-client";
import ChannelPostsBody from "@/components/channel/channel-posts-body";
import ChatFooter from "@/components/chat/chat-footer";
import PinnedMessageBar from "@/components/chat/pinned-message-bar";
import { ChannelHeader } from "@/components/channel/channel-header";
import { ChannelManagementPanel } from "@/components/channel/channel-management-panel";
import EmptyState from "@/components/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

const SingleChannel = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const { currentChannel, fetchChannelInfo, isFetchingSubscribers, subscribeToChannel } = useChannel();
  const { fetchSingleChat, singleChat, isSingleChatLoading } = useChat();
  const { socket } = useSocket();
  const { user } = useAuth();
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showPinnedMessage, setShowPinnedMessage] = useState(true);

  const currentUserId = user?._id || null;
  const messages = singleChat?.messages || [];

  // Get pinned message (most recent pinned message)
  const pinnedMessage = useMemo(() => {
    return messages
      .filter((msg) => msg.isPinned)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }, [messages]);

  // Fetch channel info
  useEffect(() => {
    if (!channelId) return;
    fetchChannelInfo(channelId);
  }, [channelId, fetchChannelInfo]);

  // Fetch channel messages (channels are stored as chats)
  useEffect(() => {
    if (!channelId) return;
    fetchSingleChat(channelId);
  }, [channelId, fetchSingleChat]);

  // Mark channel as read when opened
  useEffect(() => {
    if (!channelId) return;
    
    const markAsRead = async () => {
      try {
        await API.post(`/channel/${channelId}/mark-as-read`);
      } catch {
        // Failed to mark as read, silently ignore
      }
    };

    markAsRead();
  }, [channelId]);

  // Socket: Join channel room
  useEffect(() => {
    if (!channelId || !socket) return;

    socket.emit("channel:subscribe", channelId, (err?: string) => {
      if (err) {
        // Failed to join channel
      }
    });

    // Also join chat room for messages
    socket.emit("chat:join", channelId);

    return () => {
      socket.emit("channel:unsubscribe", channelId);
      socket.emit("chat:leave", channelId);
    };
  }, [channelId, socket]);

  if (isFetchingSubscribers || isSingleChatLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner className="w-11 h-11 !text-primary" />
      </div>
    );
  }

  if (!currentChannel) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Channel not found</p>
          <button
            onClick={() => navigate("/channel")}
            className="text-primary hover:underline"
          >
            Back to Channels
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = currentChannel.admins.some((admin: string | { _id: string }) => 
    (typeof admin === 'string' ? admin : admin._id)?.toString() === currentUserId?.toString()
  );

  const isSubscribed = currentChannel.participants.some((participant: string | { _id: string }) => 
    (typeof participant === 'string' ? participant : participant._id)?.toString() === currentUserId?.toString()
  );

  const handleSubscribe = async () => {
    if (!channelId) return;
    
    setIsSubscribing(true);
    try {
      await subscribeToChannel(channelId);
      toast.success("Successfully subscribed to channel");
      // Refresh channel info to update subscriber status
      await fetchChannelInfo(channelId);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to subscribe");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleNavigateToPinnedMessage = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      messageElement.classList.add("bg-primary/10");
      setTimeout(() => {
        messageElement.classList.remove("bg-primary/10");
      }, 2000);
    }
  };

  return (
    <div className="relative h-screen flex flex-col">
      <ChannelHeader 
        channel={currentChannel}
        isAdmin={isAdmin}
        onManageClick={() => setIsManagementOpen(true)}
      />

      {/* Pinned Message Bar */}
      {pinnedMessage && showPinnedMessage && (
        <PinnedMessageBar
          pinnedMessage={pinnedMessage}
          onClose={() => setShowPinnedMessage(false)}
          onNavigate={handleNavigateToPinnedMessage}
        />
      )}

      <div className="flex-1 overflow-y-auto bg-background pb-24">
        {messages.length === 0 ? (
          <EmptyState
            title="No broadcasts yet"
            description={isAdmin ? "Send your first broadcast to subscribers" : "No broadcasts in this channel yet"}
          />
        ) : (
          <ChannelPostsBody 
            chatId={channelId!} 
            messages={messages}
            isAdmin={isAdmin}
          />
        )}
      </div>

      {isAdmin && (
        <ChatFooter
          replyTo={null}
          chatId={channelId!}
          currentUserId={currentUserId}
          onCancelReply={() => {}}
        />
      )}

      {!isAdmin && isSubscribed && (
        <div className="p-4 border-t bg-muted/50 text-center text-sm text-muted-foreground">
          Only admins can post in this channel
        </div>
      )}

      {!isSubscribed && (
        <div className="sticky bottom-0 inset-x-0 z-40 bg-card border-t border-border py-3 mb-16 flex items-center justify-center gap-4 px-4">
          <p className="text-sm text-muted-foreground">
            Subscribe to get updates from this channel
          </p>
          <button
            onClick={handleSubscribe}
            disabled={isSubscribing}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
          >
            {isSubscribing ? (
              <>
                <Spinner className="w-4 h-4" />
                <span>Subscribing...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Subscribe</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Channel Management Panel */}
      <ChannelManagementPanel
        channel={currentChannel}
        isOpen={isManagementOpen}
        onClose={() => setIsManagementOpen(false)}
      />
    </div>
  );
};

export default SingleChannel;
