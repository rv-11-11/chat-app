import { memo } from "react";
import { Megaphone, Users, ArrowLeft, Settings, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import type { ChannelType } from "@/hooks/use-channel";

interface ChannelHeaderProps {
  channel: ChannelType;
  isAdmin: boolean;
  onManageClick?: () => void;
}

export const ChannelHeader = memo(
  ({
    channel,
    isAdmin,
    onManageClick,
  }: ChannelHeaderProps) => {
    const navigate = useNavigate();
    const name = channel.groupName || channel.name || "Channel";
    const description = channel.channelDescription;
    const subscriberCount = channel.subscriberCount || 0;
    
  const handleShare = async () => {
    const username = channel.channelUsername || channel._id;
    const inviteLink = `${window.location.origin}/join/${username}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied to clipboard!");
    } catch {
      toast.error("Failed to copy invite link");
    }
  };    return (
      <div className="flex items-center gap-3 p-4 border-b">
        {/* Back Button */}
        <button
          onClick={() => navigate("/channel")}
          className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
          aria-label="Back to channels"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Channel Icon */}
        <div className="flex-shrink-0">
          {channel.icon ? (
            <img
              src={channel.icon}
              alt={name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
              <Megaphone className="size-6 text-primary" />
            </div>
          )}
        </div>

        {/* Channel Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold truncate">{name}</h3>
            {isAdmin && (
              <Badge variant="secondary" className="text-xs">
                Admin
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Users size={14} />
            <span>{subscriberCount} subscriber{subscriberCount !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Share button - for all users in public channels, admins only in private channels */}
        {(channel.isPublic || isAdmin) && (
          <button
            onClick={handleShare}
            className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
            aria-label="Share channel"
            title="Share invite link"
          >
            <Share2 className="h-5 w-5" />
          </button>
        )}
        
        {isAdmin && (
          <button
            onClick={onManageClick}
            className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
            aria-label="Manage channel"
            title="Channel settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        )}
      </div>
    );
  }
);
ChannelHeader.displayName = "ChannelHeader";
