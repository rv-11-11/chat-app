import { getOtherUserAndGroup, formatChatTime } from "@/lib/helper";
import type { ChatType } from "@/types/chat.type";
import AvatarWithBadge from "../avatar-with-badge";
import { useTheme } from "../theme-provider";
import type { ReactNode } from "react";

interface PropsType {
  chat: ChatType;
  currentUserId: string | null;
  onClick?: () => void;
  menu?: ReactNode;
}
const ChatListItem = ({ chat, currentUserId, onClick }: PropsType) => {
  const { lastMessage } = chat;

  const { name, avatar, isOnline, isGroup } = getOtherUserAndGroup(
    chat,
    currentUserId
  );

  const getLastMessageText = () => {
  // If the last message is a system message, ignore it for preview purposes
  const isSystem = (lastMessage && (String((lastMessage.messageType ?? "")).toLowerCase() === "system"));
  if (!lastMessage || isSystem) {
      return isGroup
        ? chat.createdBy === currentUserId
          ? "Group created"
          : "You were added"
        : "Send a message";
    }
  if (lastMessage.image) return "📷 Photo";

  if (isGroup && lastMessage.sender) {
      return `${
        lastMessage.sender._id === currentUserId
          ? "You"
          : lastMessage.sender.name
      }: ${lastMessage.content}`;
    }

    return lastMessage.content;
  };

  const { theme } = useTheme();

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 p-4 pr-20 rounded-xl transition-all duration-200 bg-card hover:bg-card/80 hover:shadow-md border border-border/40 hover:border-border/70 active:scale-95 animate-slideInLeft"
    >
      <AvatarWithBadge
        name={name}
        src={avatar}
        isGroup={isGroup}
        isOnline={isOnline}
        size="w-11 h-11"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate text-foreground">{name}</h3>
        <p className="text-sm truncate text-muted-foreground">
          {getLastMessageText()}
        </p>
      </div>
  <div className="flex flex-col items-end justify-center mr-20 min-w-[50px]">
        {lastMessage?.createdAt && (
          <span className="text-xs text-muted-foreground">
            {formatChatTime(lastMessage.createdAt)}
          </span>
        )}
      </div>
    </button>
  );
};

export default ChatListItem;
