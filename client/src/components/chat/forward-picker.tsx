import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useChat } from "@/hooks/use-chat";
import { useChannel } from "@/hooks/use-channel";
import { useAuth } from "@/hooks/use-auth";
import { Megaphone, Users } from "lucide-react";

export type ForwardTargetType = "CHAT" | "GROUP" | "CHANNEL";

interface ForwardPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (targetIds: string[]) => void;
  isSubmitting?: boolean;
  fromChatName?: string;
}

const ForwardPicker = ({ open, onOpenChange, onConfirm, isSubmitting, fromChatName }: ForwardPickerProps) => {
  const { chats } = useChat();
  const { channels } = useChannel();
  const { user } = useAuth();
  const userId = user?._id || "";
  const [query, setQuery] = useState("");
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) {
      setSelectedTargets(new Set());
    }
  }, [open]);

  const normalizedQuery = query.trim().toLowerCase();

  const chatTargets = useMemo(() => {
    return (chats || [])
      .filter((c) => c.type !== "CHANNEL")
      .map((chat) => {
        const type: ForwardTargetType = chat.isGroup ? "GROUP" : "CHAT";

        const otherParticipant = chat.participants?.find(
          (p) => p && (p as any)._id !== userId
        );
        const fallbackParticipant = chat.participants?.[0];

        const resolvedName = chat.groupName
          || chat.name
          || otherParticipant?.name
          || otherParticipant?.username
          || fallbackParticipant?.name
          || fallbackParticipant?.username
          || "Chat";

        const avatar = chat.icon
          || (otherParticipant as any)?.avatar
          || fallbackParticipant?.avatar
          || "";

        const subtitle = chat.isGroup ? "Group" : (otherParticipant?.username ? `@${otherParticipant.username}` : "Chat");

        return { id: chat._id, name: resolvedName, subtitle, type, avatar };
      })
      .filter((item) =>
        normalizedQuery
          ? item.name.toLowerCase().includes(normalizedQuery)
          : true
      );
  }, [chats, normalizedQuery, userId]);

  const channelTargets = useMemo(() => {
    return (channels || [])
      .filter((channel) => {
        const isAdmin = (channel.admins || []).some((a) => (typeof a === "string" ? a : a._id) === userId);
        return isAdmin; // Only admins can post to channels
      })
      .map((channel) => ({
        id: channel._id,
        name: channel.groupName || channel.name || "Channel",
        subtitle: channel.channelUsername ? `@${channel.channelUsername}` : "Channel",
        type: "CHANNEL" as ForwardTargetType,
        avatar: channel.icon || "",
      }))
      .filter((item) =>
        normalizedQuery
          ? item.name.toLowerCase().includes(normalizedQuery)
          : true
      );
  }, [channels, normalizedQuery, userId]);

  const targetLookup = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    [...chatTargets, ...channelTargets].forEach((t) => map.set(t.id, t));
    return map;
  }, [chatTargets, channelTargets]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Forward to
            {fromChatName && (
              <span className="block text-xs font-normal text-muted-foreground mt-1">
                From {fromChatName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="border rounded-md px-3 py-2 bg-muted/50 focus-within:ring-2 focus-within:ring-primary">
            <div className="flex items-center gap-2 flex-wrap">
              {Array.from(selectedTargets).map((id) => {
                const target = targetLookup.get(id);
                const label = target?.name || "Chat";
                return (
                  <span
                    key={id}
                    className="flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium"
                  >
                    {label}
                    <button
                      type="button"
                      aria-label={`Remove ${label}`}
                      className="text-amber-700/70 hover:text-amber-900"
                      onClick={() => {
                        setSelectedTargets((prev) => {
                          const next = new Set(prev);
                          next.delete(id);
                          return next;
                        });
                      }}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
              <input
                className="flex-1 min-w-[140px] bg-transparent outline-none text-sm py-1"
                placeholder={selectedTargets.size ? "" : "Search chats, groups, channels"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="h-[360px] pr-2 overflow-y-auto">
            <div className="space-y-3">
              <Section title="Chats & Groups" icon={<Users className="h-4 w-4" />}> 
                {chatTargets.length === 0 ? (
                  <EmptyLine label="No chats found" />
                ) : (
                  chatTargets.map((target) => (
                    <TargetRow
                      key={target.id}
                      {...target}
                      selected={selectedTargets.has(target.id)}
                      onToggle={() => {
                        setSelectedTargets((prev) => {
                          const next = new Set(prev);
                          if (next.has(target.id)) {
                            next.delete(target.id);
                          } else {
                            next.add(target.id);
                          }
                          return next;
                        });
                      }}
                      disabled={isSubmitting}
                    />
                  ))
                )}
              </Section>

              <Section title="Channels" icon={<Megaphone className="h-4 w-4" />}>
                {channelTargets.length === 0 ? (
                  <EmptyLine label="No channels you can post to" />
                ) : (
                  channelTargets.map((target) => (
                    <TargetRow
                      key={target.id}
                      {...target}
                      selected={selectedTargets.has(target.id)}
                      onToggle={() => {
                        setSelectedTargets((prev) => {
                          const next = new Set(prev);
                          if (next.has(target.id)) {
                            next.delete(target.id);
                          } else {
                            next.add(target.id);
                          }
                          return next;
                        });
                      }}
                      disabled={isSubmitting}
                    />
                  ))
                )}
              </Section>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              {selectedTargets.size} selected
            </p>
            <div className="flex gap-2">
              <button
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSelectedTargets(new Set());
                  onOpenChange(false);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="text-sm font-semibold text-primary disabled:opacity-50"
                onClick={() => onConfirm(Array.from(selectedTargets))}
                disabled={isSubmitting || selectedTargets.size === 0}
              >
                {isSubmitting ? "Forwarding..." : "Forward"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
      {icon}
      <span>{title}</span>
    </div>
    <div className="space-y-1">{children}</div>
  </div>
);

const TargetRow = ({
  name,
  subtitle,
  avatar,
  type,
  selected,
  onToggle,
  disabled,
}: {
  name: string;
  subtitle: string;
  avatar?: string;
  type: ForwardTargetType;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onToggle}
    disabled={disabled}
    className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent transition-colors text-left disabled:opacity-50"
  >
    <Avatar className="h-9 w-9">
      {avatar ? <AvatarImage src={avatar} alt={name} /> : <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>}
    </Avatar>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className="font-medium truncate">{name}</p>
        <span className="text-[10px] uppercase text-muted-foreground">{type}</span>
      </div>
      <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
    </div>
    <span
      className={`h-4 w-4 rounded-sm border flex items-center justify-center text-[10px] ${selected ? "bg-primary border-primary text-primary-foreground" : "border-muted"}`}
    >
      {selected ? "✓" : ""}
    </span>
  </button>
);

const EmptyLine = ({ label }: { label: string }) => (
  <div className="text-xs text-muted-foreground px-2 py-2 rounded-md bg-muted/40">{label}</div>
);

export default ForwardPicker;
