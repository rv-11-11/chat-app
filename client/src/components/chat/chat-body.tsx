import { useChat } from "@/hooks/use-chat";
import { useSocket } from "@/hooks/use-socket";
import type { MessageType, ChatType } from "@/types/chat.type";
import type { UserType } from "@/types/auth.type";
import { useEffect, useRef, useState } from "react";
import ChatBodyMessage from "./chat-body-message";
import TypingIndicator from "./typing-indicator";

interface Props {
  chatId: string | null;
  messages: MessageType[];
  onReply: (message: MessageType) => void;
  chat?: ChatType | null;
  hideSystemMessages?: boolean;
  forwardMode?: boolean;
  selectedMessageIds?: Set<string>;
  onToggleSelect?: (messageId: string) => void;
}
const ChatBody = ({ chatId, messages, onReply, chat, hideSystemMessages = false, forwardMode = false, selectedMessageIds, onToggleSelect }: Props) => {
  const { socket } = useSocket();
  const { addNewMessage, removeMessage } = useChat();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [typingUsers, setTypingUsers] = useState<UserType[]>([]);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    if (!chatId) return;
    if (!socket) return;

    const handleNewMessage = (msg: MessageType) => addNewMessage(chatId, msg);
    const handleDeletedMessage = (data: { chatId: string; messageId: string }) => {
      if (data.chatId === chatId) {
        removeMessage(chatId, data.messageId);
      }
    };

    const handleUserTyping = (data: { user: UserType; chatId: string }) => {
      if (data.chatId !== chatId) return;

      setTypingUsers((prev) => {
        const filtered = prev.filter((u) => u._id !== data.user._id);
        return [...filtered, data.user];
      });

      if (typingTimeoutRef.current[data.user._id]) {
        clearTimeout(typingTimeoutRef.current[data.user._id]);
      }

      typingTimeoutRef.current[data.user._id] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u._id !== data.user._id));
        delete typingTimeoutRef.current[data.user._id];
      }, 3000);
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:deleted", handleDeletedMessage);
    socket.on("user:typing", handleUserTyping);
    
    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:deleted", handleDeletedMessage);
      socket.off("user:typing", handleUserTyping);
    };
  }, [socket, chatId, addNewMessage, removeMessage]);

  useEffect(() => {
    if (!messages.length) return;
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="w-full flex flex-col px-4 py-2 overflow-x-hidden">
      {messages.map((message) => {
        if (!hideSystemMessages && message.messageType === "SYSTEM") {
          return (
            <div
              key={message._id}
              className="flex justify-center my-2"
            >
              <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                {message.content}
              </div>
            </div>
          );
        }

        if (!message.sender || !message.sender._id) {
          return null;
        }

        return (
          <div id={`message-${message._id}`} key={message._id} className="transition-colors duration-500">
            <ChatBodyMessage
              message={message}
              onReply={onReply}
              chat={chat}
              forwardMode={forwardMode}
              isSelected={selectedMessageIds?.has(message._id)}
              onToggleSelect={onToggleSelect}
            />
          </div>
        );
      })}
      <TypingIndicator typingUsers={typingUsers} />
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatBody;
