import ChatBody from "@/components/chat/chat-body";
import ChatFooter from "@/components/chat/chat-footer";
import ChatHeader from "@/components/chat/chat-header";
import PinnedMessageBar from "@/components/chat/pinned-message-bar";
import ForwardPicker from "@/components/chat/forward-picker";
import EmptyState from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import useChatId from "@/hooks/use-chat-id";
import { useSocket } from "@/hooks/use-socket";
import { API } from "@/lib/axios-client";
import type { MessageType } from "@/types/chat.type";
import { useEffect, useState, useRef, useMemo } from "react";
import { useWebRTC } from "@/hooks/use-webrtc";

const SingleChat = () => {
  const chatId = useChatId();
  const { fetchSingleChat, isSingleChatLoading, singleChat, forwardMessages, isForwarding } = useChat();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [replyTo, setReplyTo] = useState<MessageType | null>(null);
  const [showPinnedMessage, setShowPinnedMessage] = useState(true);
  const [isForwardMode, setIsForwardMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
  const [showForwardPicker, setShowForwardPicker] = useState(false);

  const currentUserId = user?._id || null;
  const chat = singleChat?.chat;
  const messages = singleChat?.messages || [];

  // Get pinned message (most recent pinned message)
  const pinnedMessage = useMemo(() => {
    return messages
      .filter((msg) => msg.isPinned)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }, [messages]);

  const { isCalling, remoteStream, localStream, stopCall } = useWebRTC(chatId || null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Attach MediaStreams to the video elements
  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream || null;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream || null;
    }
  }, [localStream]);

  useEffect(() => {
    if (!chatId) return;
    fetchSingleChat(chatId);
  }, [fetchSingleChat, chatId]);

  useEffect(() => {
    // Reset forward selection when switching chats
    setIsForwardMode(false);
    setSelectedMessageIds(new Set());
    setShowForwardPicker(false);
  }, [chatId]);

  // Mark chat as read when opened
  useEffect(() => {
    if (!chatId) return;
    
    const markAsRead = async () => {
      try {
        await API.post(`/chat/${chatId}/mark-as-read`);
      } catch {
        // Failed to mark as read, silently ignore
      }
    };

    markAsRead();
  }, [chatId]);

  //Socket Chat room
  useEffect(() => {
    if (!chatId || !socket) return;

    socket.emit("chat:join", chatId);
    return () => {
      socket.emit("chat:leave", chatId);
    };
  }, [chatId, socket]);

  if (isSingleChatLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner className="w-11 h-11 !text-primary" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-lg">Chat not found</p>
      </div>
    );
  }

  const handleToggleSelect = (messageId: string) => {
    setSelectedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      setIsForwardMode(next.size > 0);
      return next;
    });
  };

  const handleCancelForward = () => {
    setIsForwardMode(false);
    setSelectedMessageIds(new Set());
    setShowForwardPicker(false);
  };

  const handleConfirmForward = async (targetIds: string[]) => {
    if (!selectedMessageIds.size || !targetIds.length) return;
    await forwardMessages({
      messageIds: Array.from(selectedMessageIds),
      targetChatIds: targetIds,
    });
    handleCancelForward();
  };

  const handleNavigateToPinnedMessage = (messageId: string) => {
    // Scroll to the pinned message
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      // Highlight the message briefly
      messageElement.classList.add("bg-primary/10");
      setTimeout(() => {
        messageElement.classList.remove("bg-primary/10");
      }, 2000);
    }
  };

  return (
    <div className="relative h-screen flex flex-col">
      <ChatHeader chat={chat} currentUserId={currentUserId} />

      {/* Pinned Message Bar */}
      {pinnedMessage && showPinnedMessage && (
        <PinnedMessageBar
          pinnedMessage={pinnedMessage}
          onClose={() => setShowPinnedMessage(false)}
          onNavigate={handleNavigateToPinnedMessage}
        />
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-background pb-24">
        {isForwardMode && (
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-2 bg-muted/80 backdrop-blur border-b">
            <div className="text-sm font-medium">{selectedMessageIds.size} selected</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancelForward} disabled={isForwarding}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => setShowForwardPicker(true)}
                disabled={!selectedMessageIds.size || isForwarding}
              >
                {isForwarding ? "Forwarding..." : "Forward"}
              </Button>
            </div>
          </div>
        )}

        {messages.length === 0 ? (
          <EmptyState
            title="Start a conversation"
            description="No messages yet. Send the first message"
          />
        ) : (
          <ChatBody
            chatId={chatId}
            messages={messages}
            onReply={setReplyTo}
            chat={chat}
            forwardMode={isForwardMode}
            selectedMessageIds={selectedMessageIds}
            onToggleSelect={handleToggleSelect}
          />
        )}
      </div>

      {/* Video call overlay */}
      {isCalling && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="relative w-full max-w-4xl pointer-events-auto">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-auto rounded-lg bg-black"
            />
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="absolute bottom-4 right-4 w-40 h-28 rounded-md bg-black border"
            />
            <button
              onClick={() => stopCall()}
              className="absolute top-4 right-4 bg-destructive text-white p-2 rounded-md"
            >
              End Call
            </button>
          </div>
        </div>
      )}

      <ChatFooter
        replyTo={replyTo}
        chatId={chatId}
        currentUserId={currentUserId}
        onCancelReply={() => setReplyTo(null)}
      />

      <ForwardPicker
        open={showForwardPicker}
        onOpenChange={(open) => {
          if (!open) {
            setShowForwardPicker(false);
          } else {
            setShowForwardPicker(true);
          }
        }}
        onConfirm={handleConfirmForward}
        isSubmitting={isForwarding}
        fromChatName={chat?.groupName || chat?.name}
      />
    </div>
  );
};

export default SingleChat;
