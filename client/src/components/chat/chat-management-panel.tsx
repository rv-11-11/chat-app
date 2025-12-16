import { memo, useState } from "react";
import useWebRTC from "@/hooks/use-webrtc";
import { Image, Ban, Flag, Trash2, X } from "lucide-react";
import { useTheme } from "../theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import { useNavigate } from "react-router-dom";
import { PROTECTED_ROUTES } from "@/routes/routes";
import type { ChatType } from "@/types/chat.type";
import { getChatRecipient } from "@/lib/helper";
import AvatarWithBadge from "../avatar-with-badge";
import { DeleteChatDialog } from "./delete-chat-dialog";

interface ChatManagementPanelProps {
  chat: ChatType;
  isOpen: boolean;
  onClose: () => void;
}

export const ChatManagementPanel = memo(
  ({ chat, isOpen, onClose }: ChatManagementPanelProps) => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const { deleteChat } = useChat();
    const navigate = useNavigate();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { name, subheading, avatar, isOnline } = getChatRecipient(
      chat,
      user?._id || null
    );
  const { startCall, stopCall, isCalling } = useWebRTC(chat._id);

    if (!isOpen) return null;

    const handleDeleteChat = async () => {
      setIsDeleting(true);
      try {
        const success = await deleteChat(chat._id);
        setIsDeleting(false);
        
        if (success) {
          setShowDeleteDialog(false);
          onClose();
          navigate(PROTECTED_ROUTES.CHAT);
        }
      } catch (error) {
        setIsDeleting(false);
      }
    };

    const menuItems = [
      {
        icon: Image,
        label: "Media, links and docs",
        count: 182,
        onClick: () => {
          // TODO: Implement media gallery
        },
      },
      {
        icon: Ban,
        label: "Block",
        onClick: () => {
          // TODO: Implement block user
        },
        danger: true,
      },
      {
        icon: Flag,
        label: "Report contact",
        onClick: () => {
          // TODO: Implement report
        },
        danger: true,
      },
      {
        icon: Trash2,
        label: "Delete chat",
        onClick: () => {
          setShowDeleteDialog(true);
        },
        danger: true,
      },
    ];

    return (
      <>
        {/* Full Screen Panel */}
        <div
          className={`fixed inset-0 z-[100] 
            animate-in slide-in-from-right duration-300
            ${theme === "dark" ? "bg-slate-900" : "bg-white"}`}
        >
          {/* Header */}
          <div className="flex items-center gap-4 p-4 border-b">
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Close panel"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold">Contact info</h2>
          </div>

          {/* Content */}
          <>
            {/* Contact Profile Section */}
            <div className="flex flex-col items-center p-6 border-b">
              <AvatarWithBadge
                name={name}
                src={avatar}
                isOnline={isOnline}
                size="w-32 h-32"
                className="mb-4"
              />
              <h3 className="text-xl font-semibold text-center mb-1">
                {name}
              </h3>
              <p className="text-sm text-muted-foreground">{subheading}</p>
            </div>

            {/* About Section */}
            <div className="px-4 py-3 border-b">
              <p className="text-xs text-muted-foreground mb-1">About</p>
              <p className="text-sm">Hey there! I am using WhatsApp.</p>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              {/* Video Call Controls */}
              <div className="px-4 py-3">
                {!isCalling ? (
                  <button
                    onClick={() => startCall()}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
                  >
                    Start Video
                  </button>
                ) : (
                  <button
                    onClick={() => stopCall()}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90"
                  >
                    End Call
                  </button>
                )}
              </div>
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-colors text-left
                      ${
                        item.danger
                          ? "hover:bg-destructive/10 text-destructive"
                          : theme === "dark"
                            ? "hover:bg-slate-800"
                            : "hover:bg-gray-100"
                      }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm flex-1">{item.label}</span>
                    {item.count !== undefined && (
                      <span className="text-sm text-muted-foreground">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        </div>

        {/* Delete Chat Dialog */}
        <DeleteChatDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteChat}
          contactName={name}
          isLoading={isDeleting}
        />
      </>
    );
  }
);

ChatManagementPanel.displayName = "ChatManagementPanel";
