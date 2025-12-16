import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCommunity } from "@/hooks/use-community";
import { useChannel } from "@/hooks/use-channel";
import { useAuth } from "@/hooks/use-auth";
import EmptyState from "@/components/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Users, Megaphone, ArrowLeft, Plus, UserPlus, FolderPlus, Settings, Trash2, Share2, Bell } from "lucide-react";
import { toast } from "sonner";
import { GroupCreateDialogCommunity } from "@/components/chat/group-create-dialog";
import { ChannelCreateDialogCommunity } from "@/components/channel/channel-create-dialog";
import { CommunityEditDialog } from "@/components/community/community-edit-dialog";
import { AddGroupDialog } from "@/components/community/add-group-dialog";
import { AddCommunityMemberDialog } from "@/components/community/add-member-dialog";
import type { UserType } from "@/types/auth.type";

type CommunityAdminRef = { _id: string } | string;

const SingleCommunity = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentCommunity, getCommunityService, addChatToCommunity } =
    useCommunity();
  const { createChannel } = useChannel();

  useEffect(() => {
    if (!communityId) return;
    getCommunityService(communityId);
  }, [communityId, getCommunityService]);

  const isAdmin = currentCommunity?.admins?.some((admin: CommunityAdminRef) => {
    const adminId = typeof admin === "string" ? admin : admin?._id;
    return adminId?.toString() === user?._id?.toString();
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [showCreateChannelDialog, setShowCreateChannelDialog] = useState(false);
  const { deleteCommunity } = useCommunity();
  const [isDeleting, setIsDeleting] = useState(false);
  const handleShareCommunity = async () => {
    if (!communityId || !currentCommunity) return;
    if (currentCommunity.isPublic === false) {
      toast.error("Only public communities can be shared");
      return;
    }

    if (currentCommunity.allowInviteLinkJoin === false) {
      toast.error("Invite links are disabled for this community");
      return;
    }

    const username = currentCommunity.username || communityId;
    const inviteLink = `${window.location.origin}/join/${username}`;

    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied to clipboard");
    } catch (error) {
      toast.error("Unable to copy invite link");
    }
  };

  const handleCreateChannel = async (data: {
    name: string;
    description?: string;
    isPublic: boolean;
  }) => {
    if (!communityId) return null;

    const channel = await createChannel(data);
    if (channel) {
      // Add the channel to the community
      await addChatToCommunity(communityId, channel._id, "CHANNEL");
    }
    return channel;
  };

  const handleGroupCreated = async (groupId?: string) => {
    if (!communityId || !groupId) return;

    // Add the group to the community
    await addChatToCommunity(communityId, groupId, "GROUP");
  };

  const handleAddExistingGroup = async (groupId: string) => {
    if (!communityId) return;
    await addChatToCommunity(communityId, groupId, "GROUP");
  };

  if (!currentCommunity) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner className="w-11 h-11 !text-primary" />
      </div>
    );
  }

  type ChatRef = string | { _id: string };

  const groupChats: ChatRef[] = (currentCommunity.groups || []) as ChatRef[];
  const channelChats: ChatRef[] =
    (currentCommunity.channels || []) as ChatRef[];

  const getChatId = (ref: ChatRef): string =>
    typeof ref === "string" ? ref : ref._id;

  return (
    <div className="h-screen overflow-y-auto pb-20 bg-background">
      <div className="p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <button
            onClick={() => navigate("/community")}
            className="p-2 hover:bg-base-200 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-base-content break-words">
              {currentCommunity.name}
            </h1>
            {currentCommunity.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {currentCommunity.description}
              </p>
            )}
          </div>
        </div>

        {/* Admin Actions - Mobile Scrollable */}
        {isAdmin && (
          <div className="mb-4 -mx-4 px-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-2 flex-shrink-0"
                onClick={() => setShowCreateGroupDialog(true)}
                title="Create New Group"
              >
                <Users className="h-4 w-4" />
                <Plus className="h-3 w-3 -ml-1" />
                <span className="hidden sm:inline">New Group</span>
              </Button>

              <Button 
                size="sm" 
                variant="outline" 
                className="gap-2 flex-shrink-0"
                onClick={() => setIsAddingGroup(true)}
                title="Add Existing Group"
              >
                <FolderPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Group</span>
              </Button>

              <Button 
                size="sm" 
                variant="outline" 
                className="gap-2 flex-shrink-0"
                onClick={() => setShowCreateChannelDialog(true)}
                title="Create Channel"
              >
                <Megaphone className="h-4 w-4" />
                <Plus className="h-3 w-3 -ml-1" />
                <span className="hidden sm:inline">Channel</span>
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                className="gap-2 flex-shrink-0"
                onClick={handleShareCommunity}
                title="Share community invite"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>

              <Button 
                size="sm" 
                variant="outline" 
                className="gap-2 flex-shrink-0"
                onClick={() => setShowAddMemberDialog(true)}
                title="Add Members"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Members</span>
              </Button>
              
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-2 flex-shrink-0"
                onClick={() => setIsEditing(true)}
                title="Settings"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="gap-2 flex-shrink-0"
                onClick={async () => {
                  if (!communityId) return;
                  const confirm = window.confirm("Delete this community? This action cannot be undone.");
                  if (!confirm) return;
                  setIsDeleting(true);
                  const ok = await deleteCommunity(communityId);
                  setIsDeleting(false);
                  if (ok) navigate('/community');
                }}
                title="Delete Community"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
            
            {/* Edit Community Dialog */}
            <CommunityEditDialog
              community={currentCommunity}
              isOpen={isEditing}
              onClose={() => setIsEditing(false)}
              onUpdate={() => {
                if (communityId) getCommunityService(communityId);
              }}
            />

            {/* Create Group Dialog */}
            <GroupCreateDialogCommunity
              isOpen={showCreateGroupDialog}
              onClose={() => setShowCreateGroupDialog(false)}
              onGroupCreated={handleGroupCreated}
            />

            {/* Create Channel Dialog */}
            <ChannelCreateDialogCommunity
              isOpen={showCreateChannelDialog}
              onClose={() => setShowCreateChannelDialog(false)}
              onCreateChannel={handleCreateChannel}
            />

            {/* Add Existing Group Dialog */}
            <AddGroupDialog
              isOpen={isAddingGroup}
              onClose={() => setIsAddingGroup(false)}
              onAddGroup={handleAddExistingGroup}
              existingGroupIds={groupChats.map(g => getChatId(g))}
            />
            
            {/* Add Community Member Dialog */}
            <AddCommunityMemberDialog
              isOpen={showAddMemberDialog}
              onClose={() => setShowAddMemberDialog(false)}
              currentMembers={(currentCommunity.members || []) as unknown as UserType[]}
              onMembersAdded={() => {
                setShowAddMemberDialog(false);
              }}
              communityId={communityId || ""}
            />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          <div className="p-3 sm:p-4 rounded-lg bg-base-200">
            <div className="text-xl sm:text-2xl font-bold">
              {currentCommunity.members?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Members</div>
          </div>
          <div className="p-3 sm:p-4 rounded-lg bg-base-200">
            <div className="text-xl sm:text-2xl font-bold">{groupChats.length}</div>
            <div className="text-xs text-muted-foreground">Groups</div>
          </div>
          <div className="p-3 sm:p-4 rounded-lg bg-base-200">
            <div className="text-xl sm:text-2xl font-bold">{channelChats.length}</div>
            <div className="text-xs text-muted-foreground">Channels</div>
          </div>
        </div>

        {/* Groups Section */}
        <section className="mb-6">
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            Groups
          </h2>
          {groupChats.length > 0 && (
            <div className="space-y-2">
              {groupChats.map((groupRef) => {
                const id = getChatId(groupRef);
                if (!id) return null;

                // Get group name from populated data
                const groupName = typeof groupRef === "string" 
                  ? `Group ${id.slice(-6)}`
                  : (groupRef as any).groupName || `Group ${id.slice(-6)}`;
                const memberCount = typeof groupRef === "string"
                  ? 0
                  : (groupRef as any).participants?.length || 0;
                const groupIcon = typeof groupRef === "string"
                  ? null
                  : (groupRef as any).icon || null;

                return (
                  <button
                    key={id}
                    onClick={() => navigate(`/groups/${id}`)}
                    className="w-full text-left flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-colors hover:bg-base-200"
                  >
                    {groupIcon ? (
                      <img
                        src={groupIcon}
                        alt={groupName}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm sm:text-base truncate">
                        {groupName}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{memberCount} members</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Channels Section */}
        <section className="mb-6">
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 mb-3">
            <Megaphone className="h-4 w-4 sm:h-5 sm:w-5" />
            Channels
          </h2>
          {channelChats.length > 0 && (
            <div className="space-y-2">
              {channelChats.map((channelRef) => {
                const id = getChatId(channelRef);
                if (!id) return null;

                // Get channel name from populated data
                const channelName = typeof channelRef === "string"
                  ? `Channel ${id.slice(-6)}`
                  : (channelRef as any).groupName || `Channel ${id.slice(-6)}`;
                const subscriberCount = typeof channelRef === "string"
                  ? 0
                  : (channelRef as any).participants?.length || 0;
                const channelIcon = typeof channelRef === "string"
                  ? null
                  : (channelRef as any).icon || null;

                return (
                  <button
                    key={id}
                    onClick={() => navigate(`/channel/${id}`)}
                    className="w-full text-left flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-colors hover:bg-base-200"
                  >
                    {channelIcon ? (
                      <img
                        src={channelIcon}
                        alt={channelName}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Megaphone className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm sm:text-base truncate">
                        {channelName}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{subscriberCount} subscribers</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="relative p-1 rounded-md hover:bg-base-300 transition-colors"
                        title="No new messages"
                      >
                        <Bell className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {groupChats.length === 0 && channelChats.length === 0 && (
          <EmptyState
            title="No content yet"
            description="This community doesn't have any groups or channels yet"
          />
        )}
      </div>
    </div>
  );
};

export default SingleCommunity;
