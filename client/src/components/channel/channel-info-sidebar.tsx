import { memo } from "react";
import { Badge } from "../ui/badge";
import { Megaphone, Users, Lock, Globe } from "lucide-react";
import AvatarWithBadge from "../avatar-with-badge";
import type { UserType } from "@/types/auth.type";

interface ChannelInfoSidebarProps {
  name: string;
  description?: string;
  subscriberCount: number;
  isPublic: boolean;
  admins: UserType[];
  subscribers: UserType[];
}

export const ChannelInfoSidebar = memo(
  ({
    name,
    description,
    subscriberCount,
    isPublic,
    admins,
    subscribers,
  }: ChannelInfoSidebarProps) => {
    return (
      <div className="w-80 border-l bg-background flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Channel Info</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-6 p-4">
          {/* Channel Details */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Megaphone className="size-5 text-primary" />
              <h3 className="font-semibold">{name}</h3>
            </div>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              {isPublic ? (
                <>
                  <Globe size={16} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Public</span>
                </>
              ) : (
                <>
                  <Lock size={16} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Private</span>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-accent rounded-lg p-3">
              <div className="text-2xl font-bold text-primary">
                {subscriberCount}
              </div>
              <div className="text-xs text-muted-foreground">Subscribers</div>
            </div>
            <div className="bg-accent rounded-lg p-3">
              <div className="text-2xl font-bold text-primary">
                {admins.length}
              </div>
              <div className="text-xs text-muted-foreground">Admin{admins.length !== 1 ? "s" : ""}</div>
            </div>
          </div>

          {/* Admins */}
          {admins.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Badge>Admin</Badge>
                <span>({admins.length})</span>
              </h4>
              <div className="space-y-2">
                {admins.map((admin) => (
                  <div
                    key={admin._id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent"
                  >
                    <AvatarWithBadge
                      name={admin.name}
                      src={admin.avatar ?? ""}
                      size="sm"
                    />
                    <span className="text-sm font-medium">{admin.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Subscribers */}
          {subscribers.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Users size={16} />
                <span>Recent Subscribers</span>
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {subscribers.slice(0, 10).map((subscriber) => (
                  <div
                    key={subscriber._id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent"
                  >
                    <AvatarWithBadge
                      name={subscriber.name}
                      src={subscriber.avatar ?? ""}
                      size="sm"
                    />
                    <span className="text-sm">{subscriber.name}</span>
                  </div>
                ))}
              </div>
              {subscribers.length > 10 && (
                <p className="text-xs text-muted-foreground mt-2">
                  +{subscribers.length - 10} more subscribers
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);
ChannelInfoSidebar.displayName = "ChannelInfoSidebar";
