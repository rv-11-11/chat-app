import { memo, useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  X,
  Megaphone,
} from "lucide-react";
import { useTheme } from "../theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { useChannel } from "@/hooks/use-channel";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import type { ChannelType } from "@/hooks/use-channel";
import type { UserType } from "@/types/auth.type";
import { AddSubscriberDialog } from "./add-subscriber-dialog";
import { ViewSubscribersDialog } from "./view-subscribers-dialog";
import { Edit } from "lucide-react";
import { DeleteChannelDialog } from "./delete-channel-dialog";
import { ChannelEditDialog } from "./channel-edit-dialog";

interface ChannelManagementPanelProps {
  channel: ChannelType;
  isOpen: boolean;
  onClose: () => void;
}

export const ChannelManagementPanel = memo(
  ({ channel, isOpen, onClose }: ChannelManagementPanelProps) => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const { updateChannel } = useChannel();
    const navigate = useNavigate();
    const [showAddSubscriber, setShowAddSubscriber] = useState(false);
    const [showViewSubscribers, setShowViewSubscribers] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    type ChannelAdmin = string | { _id: string };

    const [subscribers, setSubscribers] = useState<UserType[]>([]);
    const [admins, setAdmins] = useState<string[]>(
      (channel.admins || []).map((admin: ChannelAdmin) =>
        typeof admin === "string" ? admin : admin._id
      )
    );

    // Fetch channel subscribers
    useEffect(() => {
      if (isOpen && channel._id) {
        fetchSubscribers();
      }
    }, [isOpen, channel._id]);

    const fetchSubscribers = async () => {
      try {
        const { data } = await API.get(`/channel/${channel._id}/info`);
        // Remove duplicates based on _id
        const uniqueSubscribers: UserType[] = Array.from(
          new Map<string, UserType>(
            (data.channel.participants || []).map((s: UserType) => [s._id, s])
          ).values()
        );
        setSubscribers(uniqueSubscribers);
        setAdmins(
          (data.channel.admins || []).map((admin: ChannelAdmin) =>
            typeof admin === "string" ? admin : admin._id
          )
        );
      } catch (error) {
        const message =
          (error as { response?: { data?: { message?: string } } }).response?.data
            ?.message ?? "Failed to fetch subscribers";
        toast.error(message);
      }
    };

    const handleRemoveSubscriber = async (userId: string) => {
      try {
        await API.post(`/channel/${channel._id}/remove-subscriber`, { userId });
        setSubscribers(subscribers.filter((s) => s._id !== userId));
        toast.success("Subscriber removed");
      } catch (error) {
        const message =
          (error as { response?: { data?: { message?: string } } }).response?.data
            ?.message ?? "Failed to remove subscriber";
        toast.error(message);
      }
    };

    const handlePromoteToAdmin = async (userId: string) => {
      try {
        await API.post(`/channel/${channel._id}/admin/${userId}/add`);
        setAdmins([...admins, userId]);
        toast.success("User promoted to admin");
      } catch (error) {
        const message =
          (error as { response?: { data?: { message?: string } } }).response?.data
            ?.message ?? "Failed to promote user";
        toast.error(message);
      }
    };

    const handleDemoteAdmin = async (userId: string) => {
      try {
        await API.post(`/channel/${channel._id}/admin/${userId}/remove`);
        setAdmins(admins.filter((id) => id !== userId));
        toast.success("Admin rights removed");
      } catch (error) {
        const message =
          (error as { response?: { data?: { message?: string } } }).response?.data
            ?.message ?? "Failed to remove admin rights";
        toast.error(message);
      }
    };

    const handleDeleteChannel = async () => {
      setIsDeleting(true);
      try {
        await API.delete(`/channel/${channel._id}`);
        toast.success("Channel deleted successfully");
        setShowDeleteDialog(false);
        onClose();
        navigate("/channel");
      } catch (error) {
        const message =
          (error as { response?: { data?: { message?: string } } }).response?.data
            ?.message ?? "Failed to delete channel";
        toast.error(message);
      } finally {
        setIsDeleting(false);
      }
    };

    if (!isOpen) return null;

    const menuItems = [
      {
        icon: Edit,
        label: "Edit channel info",
        onClick: () => setIsEditing(true),
      },
      {
        icon: UserPlus,
        label: "Add subscribers",
        onClick: () => setShowAddSubscriber(true),
      },
      {
        icon: Users,
        label: "View subscribers",
        onClick: () => setShowViewSubscribers(true),
      },
      {
        icon: Trash2,
        label: "Delete channel",
        onClick: () => setShowDeleteDialog(true),
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
            <h2 className="text-lg font-semibold">Channel info</h2>
          </div>

          {/* Channel Profile Section */}
          <div className="flex flex-col items-center p-6 border-b">
            {channel.icon ? (
              <img
                src={channel.icon}
                alt={channel.groupName || channel.name}
                className="w-32 h-32 rounded-full object-cover mb-4"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Megaphone className="h-16 w-16 text-primary" />
              </div>
            )}
            <h3 className="text-xl font-semibold text-center mb-1">
              {channel.groupName || channel.name || "Channel"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Channel · {subscribers.length} subscribers
            </p>
            {(channel as ChannelType & { channelDescription?: string }).channelDescription && (
              <p className="text-sm text-center mt-3 px-4 text-muted-foreground">
                {
                  (channel as ChannelType & { channelDescription?: string })
                    .channelDescription
                }
              </p>
            )}
          </div>

          {/* Menu Items */}
          <div className="p-2">
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
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Add Subscriber Dialog */}
        <AddSubscriberDialog
          isOpen={showAddSubscriber}
          onClose={() => setShowAddSubscriber(false)}
          currentSubscribers={subscribers}
          onSubscribersAdded={fetchSubscribers}
          channelId={channel._id}
        />

        {/* View Subscribers Dialog */}
        <ViewSubscribersDialog
          isOpen={showViewSubscribers}
          onClose={() => setShowViewSubscribers(false)}
          subscribers={subscribers}
          admins={admins}
          currentUserId={user?._id}
          isAdmin={admins.includes(user?._id || '')}
          onRemoveSubscriber={handleRemoveSubscriber}
          onPromoteToAdmin={handlePromoteToAdmin}
          onDemoteAdmin={handleDemoteAdmin}
        />

        {/* Delete Channel Dialog */}
        <DeleteChannelDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteChannel}
          channelName={channel.groupName || channel.name || "Channel"}
          isLoading={isDeleting}
        />

        {/* Edit Channel Dialog */}
        <ChannelEditDialog
          channel={channel}
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          onUpdate={(updates) => {
            setIsEditing(false);
            updateChannel(channel._id, updates);
          }}
        />
      </>
    );
  }
);

ChannelManagementPanel.displayName = "ChannelManagementPanel";
