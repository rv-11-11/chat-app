import { useEffect, useState } from "react";
import { useChat } from "@/hooks/use-chat";
import ChatListItem from "./chat-list-item";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import ChatListHeader from "./chat-list-header";
import { useSocket } from "@/hooks/use-socket";
import type { ChatType } from "@/types/chat.type";
import type { MessageType } from "@/types/chat.type";
import { MoreVertical, Trash2, Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ChatList = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const {
    fetchChats,
    chats,
    isChatsLoading,
    addNewChat,
    updateChatLastMessage,
    deleteChat,
  } = useChat();
  const { user } = useAuth();
  const currentUserId = user?._id || null;

  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Filter only direct chats (exclude groups and channels)
  const directChats = chats?.filter((chat) => !chat.isGroup && chat.type !== "CHANNEL") || [];

  const filteredChats = directChats
    .filter(
      (chat) =>
        chat.participants?.some(
          (p) =>
            p._id !== currentUserId &&
            (p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             p.username?.toLowerCase().includes(searchQuery.toLowerCase()))
        )
    )
    .sort((a, b) => {
      const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA; // Most recent first
    });

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (!socket) return;

    const handleNewChat = (newChat: ChatType) => {
      addNewChat(newChat);
    };

    socket.on("chat:new", handleNewChat);

    return () => {
      socket.off("chat:new", handleNewChat);
    };
  }, [addNewChat, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleChatUpdate = (data: {
      chatId: string;
      lastMessage: MessageType;
    }) => {
      updateChatLastMessage(data.chatId, data.lastMessage);
    };

    socket.on("chat:update", handleChatUpdate);

    return () => {
      socket.off("chat:update", handleChatUpdate);
    };
  }, [socket, updateChatLastMessage]);

  const onRoute = (id: string) => {
    navigate(`/chat/${id}`);
  };

  return (
    <div className="h-screen overflow-y-auto pb-20 bg-background">
      <div className="p-4">
        <ChatListHeader onSearch={setSearchQuery} />

        {isChatsLoading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Loading chats...</p>
          </div>
        ) : filteredChats?.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
            {searchQuery ? "No chat found" : "No chats created"}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredChats?.map((chat) => (
              <div
                key={chat._id}
                className="relative"
              >
                <div className="relative">
                  <ChatListItem
                    chat={chat}
                    currentUserId={currentUserId}
                    onClick={() => onRoute(chat._id)}
                  />
                  <div className="absolute inset-y-0 right-11 z-10 flex items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRoute(chat._id);
                      }}
                      className="relative p-1.5 rounded-md hover:bg-base-300 transition-colors"
                      title={chat.unreadCount && chat.unreadCount > 0 ? `${chat.unreadCount} new message${chat.unreadCount > 1 ? 's' : ''}` : 'No new messages'}
                    >
                      <Bell className={`h-4 w-4 ${chat.unreadCount && chat.unreadCount > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                      {chat.unreadCount !== undefined && chat.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold px-1 min-w-[16px] h-4 rounded-full flex items-center justify-center">
                          {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="absolute inset-y-0 right-3 z-10 flex items-center">
                    <DropdownMenu open={openMenuId === chat._id} onOpenChange={(open) => {
                      if (open) {
                        setOpenMenuId(chat._id);
                      } else {
                        setOpenMenuId(null);
                      }
                    }}>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(chat._id);
                          }}
                          className="p-1.5 rounded-md hover:bg-base-300 transition-colors"
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="z-50">
                        <DropdownMenuItem
                          onClick={async (e) => {
                            e.stopPropagation();
                            await deleteChat(chat._id);
                            setOpenMenuId(null);
                            fetchChats();
                          }}
                          className="text-destructive focus:text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Chat
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
