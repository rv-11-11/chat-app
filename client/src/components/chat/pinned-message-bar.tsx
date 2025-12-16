import { X, Pin } from "lucide-react";
import { Button } from "../ui/button";
import type { MessageType } from "@/types/chat.type";

interface Props {
  pinnedMessage: MessageType;
  onClose: () => void;
  onNavigate: (messageId: string) => void;
}

const PinnedMessageBar = ({ pinnedMessage, onClose, onNavigate }: Props) => {
  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const getMessagePreview = () => {
    if (pinnedMessage.content) {
      return truncateText(pinnedMessage.content);
    }
    if (pinnedMessage.image) {
      return "📷 Photo";
    }
    if (pinnedMessage.video) {
      return "🎥 Video";
    }
    return "Message";
  };

  return (
    <div className="bg-primary/10 dark:bg-primary/20 border-b border-primary/20">
      <div className="flex items-center gap-2 px-4 py-2">
        <Pin className="h-4 w-4 text-primary flex-shrink-0" />
        
        <button
          onClick={() => onNavigate(pinnedMessage._id)}
          className="flex-1 text-left min-w-0"
        >
          <div className="text-xs font-semibold text-primary mb-0.5">
            Pinned Message
          </div>
          <div className="text-sm text-foreground truncate">
            <span className="font-medium">{pinnedMessage.sender?.name || "Unknown"}: </span>
            {getMessagePreview()}
          </div>
        </button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PinnedMessageBar;
