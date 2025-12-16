import { useChat } from "@/hooks/use-chat";
import { useSocket } from "@/hooks/use-socket";
import type { MessageType, ChatType } from "@/types/chat.type";
import { useEffect, useRef } from "react";
import ChatBodyMessage from "./chat-body-message";

interface Props {
  chatId: string | null;
  messages: MessageType[];
  onReply: (message: MessageType) => void;
  chat?: ChatType | null;
  // when true, system messages will be omitted from rendering
  hideSystemMessages?: boolean;
  forwardMode?: boolean;
  selectedMessageIds?: Set<string>;
  onToggleSelect?: (messageId: string) => void;
}
const ChatBody = ({ chatId, messages, onReply, chat, hideSystemMessages = false, forwardMode = false, selectedMessageIds, onToggleSelect }: Props) => {
  const { socket } = useSocket();
  const { addNewMessage, removeMessage } = useChat();
  const bottomRef = useRef<HTMLDivElement | null>(null);

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
    if (!messages.length) return;
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="w-full flex flex-col px-4 py-2 overflow-x-hidden">
      {messages.map((message) => {
        // Render system messages unless explicitly hidden
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

        // Filter out messages without valid sender for regular messages
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
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatBody;
