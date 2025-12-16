import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChat } from "@/hooks/use-chat";
import { useSocket } from "@/hooks/use-socket";
import { useAuth } from "@/hooks/use-auth";
import { API } from "@/lib/axios-client";
import ChatBody from "@/components/chat/chat-body";
import ChatFooter from "@/components/chat/chat-footer";
import GroupHeader from "@/components/group/group-header";
import { GroupManagementPanel } from "@/components/chat/group-management-panel";
import ForwardPicker from "@/components/chat/forward-picker";
import EmptyState from "@/components/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import PinnedMessageBar from "@/components/chat/pinned-message-bar";
import type { MessageType } from "@/types/chat.type";

const SingleGroup = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { fetchSingleChat, singleChat, isSingleChatLoading, forwardMessages, isForwarding } = useChat();
  const { socket } = useSocket();
  const { user } = useAuth();
  const [replyTo, setReplyTo] = useState<MessageType | null>(null);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [showPinnedMessage, setShowPinnedMessage] = useState(true);
  const [isForwardMode, setIsForwardMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
  const [showForwardPicker, setShowForwardPicker] = useState(false);

  const currentUserId = user?._id || null;
  const chat = singleChat?.chat;
  const messages = singleChat?.messages || [];

  // Find the most recent pinned message
  const pinnedMessage = useMemo(() => {
    const pinned = messages.filter((msg) => msg.isPinned);
    return pinned.length > 0 ? pinned[pinned.length - 1] : null;
  }, [messages]);

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

  // Treat user as admin if they are the creator or listed in admins
  const isAdmin = !!chat &&
    (chat.createdBy === currentUserId ||
      (chat.admins || []).some((admin) =>
        (typeof admin === "string" ? admin : admin?._id)?.toString() === currentUserId?.toString()
      ));

  // Fetch group chat
  useEffect(() => {
    if (!groupId) return;
    fetchSingleChat(groupId);
  }, [groupId, fetchSingleChat]);

  // Mark group as read when opened
  useEffect(() => {
    if (!groupId) return;
    
    const markAsRead = async () => {
      try {
        await API.post(`/chat/${groupId}/mark-as-read`);
      } catch (error) {
        // Failed to mark as read, silently ignore
      }
    };

    markAsRead();
  }, [groupId]);

  // Socket: Join chat room
  useEffect(() => {
    if (!groupId || !socket) return;

    socket.emit("chat:join", groupId);

    return () => {
      socket.emit("chat:leave", groupId);
    };
  }, [groupId, socket]);

  useEffect(() => {
    // Reset forward selection when switching groups
    setIsForwardMode(false);
    setSelectedMessageIds(new Set());
    setShowForwardPicker(false);
  }, [groupId]);

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

  if (isSingleChatLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner className="w-11 h-11 !text-primary" />
      </div>
    );
  }

  if (!chat || !chat.isGroup) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Group not found</p>
          <button
            onClick={() => navigate("/groups")}
            className="text-primary hover:underline"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen flex flex-col">
      <GroupHeader
        group={chat}
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
            title="Start the conversation"
            description="No messages yet. Be the first to send a message!"
          />
        ) : (
          <ChatBody
            chatId={groupId!}
            messages={messages}
            onReply={setReplyTo}
            chat={chat}
            forwardMode={isForwardMode}
            selectedMessageIds={selectedMessageIds}
            onToggleSelect={handleToggleSelect}
          />
        )}
      </div>

      <ChatFooter
        replyTo={replyTo}
        chatId={groupId!}
        currentUserId={currentUserId}
        onCancelReply={() => setReplyTo(null)}
      />

      <ForwardPicker
        open={showForwardPicker}
        onOpenChange={(open) => setShowForwardPicker(open)}
        onConfirm={handleConfirmForward}
        isSubmitting={isForwarding}
        fromChatName={chat?.groupName || chat?.name}
      />

      {/* Group Management Panel */}
      <GroupManagementPanel
        group={chat}
        isOpen={isManagementOpen}
        onClose={() => setIsManagementOpen(false)}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default SingleGroup;
