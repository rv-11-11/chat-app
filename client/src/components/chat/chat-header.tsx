import { getChatRecipient } from "@/lib/helper";
import { PROTECTED_ROUTES } from "@/routes/routes";
import type { ChatType } from "@/types/chat.type";
import { ArrowLeft, Info } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AvatarWithBadge from "../avatar-with-badge";
import { Badge } from "../ui/badge";
import { ChatManagementPanel } from "./chat-management-panel";

interface Props {
  chat: ChatType;
  currentUserId: string | null;
}
const ChatHeader = ({ chat, currentUserId }: Props) => {
  const navigate = useNavigate();
  const [showManagementPanel, setShowManagementPanel] = useState(false);
  const { name, subheading, avatar, isOnline } = getChatRecipient(
    chat,
    currentUserId
  );

  return (
    <>
      <div className="sticky top-0 z-50 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => navigate(PROTECTED_ROUTES.CHAT)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Back to chats"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <AvatarWithBadge name={name} src={avatar} isOnline={isOnline} size="w-12 h-12" />

        <div className="flex-1 min-w-0">
          <h5 className="text-base font-semibold truncate">{name}</h5>
          <p className="text-sm text-muted-foreground truncate">{subheading}</p>
        </div>

        <Badge variant="outline" className="text-xs uppercase tracking-wide flex-shrink-0">
          Chat
        </Badge>

        <button
          type="button"
          onClick={() => setShowManagementPanel(true)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Contact info"
        >
          <Info className="h-5 w-5" />
        </button>
      </div>

      <ChatManagementPanel
        chat={chat}
        isOpen={showManagementPanel}
        onClose={() => setShowManagementPanel(false)}
      />
    </>
  );
};

export default ChatHeader;
