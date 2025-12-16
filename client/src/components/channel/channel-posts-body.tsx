import { useEffect, useRef, useState } from "react";
import type { MessageType } from "@/types/chat.type";
import ChannelPostMessage from "./channel-post-message";
import { useSocket } from "@/hooks/use-socket";
import { useChat } from "@/hooks/use-chat";

interface Props {
  chatId: string;
  messages: MessageType[];
  isAdmin: boolean;
}

const ChannelPostsBody = ({ chatId, messages, isAdmin }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [localMessages, setLocalMessages] = useState(messages);
  const { socket } = useSocket();
  const { addNewMessage, removeMessage } = useChat();

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (!chatId) return;
    if (!socket) return;

    const handleNewMessage = (msg: MessageType) => addNewMessage(chatId, msg);
    const handleDeletedMessage = (data: { chatId: string; messageId: string }) => {
      if (data.chatId === chatId) {
        removeMessage(chatId, data.messageId);
      }
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:deleted", handleDeletedMessage);
    
    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:deleted", handleDeletedMessage);
    };
  }, [socket, chatId, addNewMessage, removeMessage]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [localMessages]);

  if (messages.length === 0) {
    return null;
  }

  // Filter out system messages and sort by pinned first, then by date
  const visibleMessages = localMessages
    .filter((msg) => (msg.messageType || "USER").toString().toUpperCase() !== "SYSTEM")
    .sort((a, b) => {
      // Pinned messages first
      const aPinned = a.isPinned || false;
      const bPinned = b.isPinned || false;
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      // Then by date
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto scroll-smooth"
    >
      <div>
        {visibleMessages.map((message) => (
          <div id={`message-${message._id}`} key={message._id} className="transition-colors duration-500">
            <ChannelPostMessage
              message={message}
              isAdmin={isAdmin}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChannelPostsBody;
