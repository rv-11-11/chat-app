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
      className={`w-full text-left flex items-center gap-3 p-3 pr-20 rounded-lg transition-colors
        ${theme === "dark" ? "bg-slate-800/10 hover:bg-slate-800" : "bg-gray-50 hover:bg-gray-100"}`}
    >
      <AvatarWithBadge
        name={name}
        src={avatar}
        isGroup={isGroup}
        isOnline={isOnline}
        size="w-10 h-10"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">{name}</h3>
        <p className={`text-sm truncate ${theme === "dark" ? "text-slate-400" : "text-gray-500"}`}>
          {getLastMessageText()}
        </p>
      </div>
  <div className="flex flex-col items-end justify-center mr-20 min-w-[50px]">
        {lastMessage?.createdAt && (
          <span className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-gray-500"}`}>
            {formatChatTime(lastMessage.createdAt)}
          </span>
        )}
      </div>
  {/* optional menu will be rendered by parent as a sibling element outside this button */}
    </button>
  );
};

export default ChatListItem;
