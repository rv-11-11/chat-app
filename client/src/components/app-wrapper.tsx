import React, { useEffect } from "react";
import BottomNav from "./bottom-nav";
import { useSocket } from "@/hooks/use-socket";
import { useChannel } from "@/hooks/use-channel";
import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import type { ChatType } from "@/types/chat.type";
import type { ChannelType } from "@/hooks/use-channel";

interface Props {
  children: React.ReactNode;
}

const AppWrapper = ({ children }: Props) => {
  const { socket, connectSocket } = useSocket();
  const {
    updateChannelSubscriber,
    updateChannelAdmin,
    updateChannelUnread,
    channels,
  } = useChannel();
  const { updateChatUnread, chats } = useChat();
  const { user } = useAuth();
  const currentUserId = user?._id ?? null;

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      connectSocket();
    }
  }, [user, connectSocket]);

  // Channel socket event listeners + notifications
  useEffect(() => {
    if (!socket) return;

    const handleSubscriberJoined = (data: { channelId: string; userId: string }) => {
      updateChannelSubscriber(data.channelId, "joined");
    };

    const handleSubscriberLeft = (data: { channelId: string; userId: string }) => {
      updateChannelSubscriber(data.channelId, "left");
    };

    const handleAdminAdded = (data: { channelId: string; userId: string }) => {
      updateChannelAdmin(data.channelId, data.userId, "added");
    };

    const handleAdminRemoved = (data: { channelId: string; userId: string }) => {
      updateChannelAdmin(data.channelId, data.userId, "removed");
    };

    // Listen for per-user notification events: message:new { chatId }
    const handleNewMessage = (data: { chatId?: string }) => {
      // Guard: only handle the lightweight notification payloads that include chatId
      if (!data || !data.chatId) {
        return;
      }

      const { chatId } = data;

      // Determine which conversation this is
      const channel: ChannelType | undefined = channels.find(
        (c: ChannelType) => c._id === chatId
      );
      const chat: ChatType | undefined = chats.find(
        (c: ChatType) => c._id === chatId
      );

      // Update unread counts
      if (channel) {
        updateChannelUnread(chatId, (channel.unreadCount || 0) + 1);
      }

      if (chat) {
        updateChatUnread(chatId, (chat.unreadCount || 0) + 1);
      }

      // Push a notification for this activity if notifications are enabled
      const settingsState = useSettings.getState();
      if (!settingsState.notificationsEnabled) {
        return;
      }

      let title = "New message";
      let displayName = "this conversation";

      if (channel) {
        const channelName = channel.groupName || channel.name || "Channel";
        displayName = channelName;
        title = "New channel message";
      } else if (chat) {
        if (chat.isGroup) {
          const groupName = chat.groupName || chat.name || "Group";
          displayName = groupName;
          title = "New group message";
        } else {
          const otherParticipant = chat.participants?.find(
            (p) => p?._id && p._id !== currentUserId
          );
          const dmName = otherParticipant?.name || chat.name || "Chat";
          displayName = dmName;
          title = "New chat message";
        }
      }

      settingsState.addNotification({
        title,
        message: `New activity in ${displayName}`,
        type: "message",
      });
    };

    socket.on("subscriber:joined", handleSubscriberJoined);
    socket.on("subscriber:left", handleSubscriberLeft);
    socket.on("admin:added", handleAdminAdded);
    socket.on("admin:removed", handleAdminRemoved);
    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("subscriber:joined", handleSubscriberJoined);
      socket.off("subscriber:left", handleSubscriberLeft);
      socket.off("admin:added", handleAdminAdded);
      socket.off("admin:removed", handleAdminRemoved);
      socket.off("message:new", handleNewMessage);
    };
  }, [
    socket,
    updateChannelSubscriber,
    updateChannelAdmin,
    updateChannelUnread,
    updateChatUnread,
    channels,
    chats,
    currentUserId,
  ]);

  return (
    <div className="h-full">
      <main className="h-full">{children}</main>
      <BottomNav />
    </div>
  );
};

export default AppWrapper;
