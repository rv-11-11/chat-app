import AvatarWithBadge from "@/components/avatar-with-badge";
import { Badge } from "@/components/ui/badge";
import { PROTECTED_ROUTES } from "@/routes/routes";
import type { ChatType } from "@/types/chat.type";
import { Users, Settings, ArrowLeft, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface GroupHeaderProps {
  group: ChatType;
  onManageClick?: () => void;
  isAdmin?: boolean;
}

const GroupHeader = ({ group, onManageClick, isAdmin = false }: GroupHeaderProps) => {
  const navigate = useNavigate();
  const groupName = group.groupName || group.name || "Group";
  const participantCount = group.participants?.length || 0;
  const tagline = `${participantCount} members`;

  const handleShare = async () => {
  const username = group.groupUsername || group._id;
  const inviteLink = `${window.location.origin}/join/${username}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied to clipboard!");
    } catch {
      toast.error("Failed to copy invite link");
    }
  };

  return (
    <div className="sticky top-0 flex items-center gap-3 border-b border-border bg-gradient-to-r from-primary/10 via-background to-background px-4 py-3 z-50">
      <button
        type="button"
        onClick={() => navigate(PROTECTED_ROUTES.GROUPS)}
        className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
        aria-label="Back to groups"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <AvatarWithBadge
        name={groupName}
        src={group.icon || ""}
        isGroup
        size="w-10 h-10"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h5 className="font-semibold truncate">{groupName}</h5>
          {isAdmin && (
            <Badge variant="secondary" className="text-xs">
              Admin
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {tagline}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleShare}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Share group"
          title="Share invite link"
        >
          <Share2 className="h-5 w-5" />
        </button>
      {onManageClick && (
        <button
          onClick={onManageClick}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-border hover:bg-muted"
        >
          <Settings className="h-4 w-4" />
          {isAdmin ? "Manage" : "Info"}
        </button>
      )}
      </div>
    </div>
  );
};

export default GroupHeader;
