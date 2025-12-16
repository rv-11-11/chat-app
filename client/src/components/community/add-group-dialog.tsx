import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import AvatarWithBadge from "../avatar-with-badge";

interface AddGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGroup: (groupId: string) => Promise<void>;
  existingGroupIds: string[];
}

export const AddGroupDialog = ({ 
  isOpen, 
  onClose, 
  onAddGroup, 
  existingGroupIds 
}: AddGroupDialogProps) => {
  const { chats, fetchChats, isChatsLoading } = useChat();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchChats();
      setSelectedGroupId(null);
      setSearchQuery("");
    }
  }, [isOpen, fetchChats]);

  // Filter for groups only, exclude groups already in community, and match search
  const availableGroups = chats.filter(chat => 
    chat.isGroup && 
    !existingGroupIds.includes(chat._id) &&
    (chat.groupName || chat.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedGroupId) return;
    
    setIsSubmitting(true);
    try {
      await onAddGroup(selectedGroupId);
      onClose();
    } catch (error) {
      // Error already handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogDescription className="sr-only">Select an existing group to add to the community</DialogDescription>
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Add Existing Group</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your groups..."
              className="pl-10"
            />
          </div>

          <div className="border rounded-lg h-[250px] sm:h-[300px] overflow-y-auto p-1 sm:p-2 space-y-1">
            {isChatsLoading ? (
              <div className="flex items-center justify-center h-full">
                <Spinner className="w-6 h-6" />
              </div>
            ) : availableGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
                <Users className="h-8 w-8 opacity-50" />
                <p className="text-sm">No available groups found</p>
              </div>
            ) : (
              availableGroups.map((group) => (
                <div
                  key={group._id}
                  onClick={() => setSelectedGroupId(group._id)}
                  className={`
                    flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors
                    ${selectedGroupId === group._id ? "bg-primary/10" : "hover:bg-accent"}
                  `}
                >
                  <AvatarWithBadge 
                    name={group.groupName || group.name || "Group"} 
                    src={group.icon || ""} 
                    isGroup
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">
                      {group.groupName || group.name || "Unnamed Group"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {group.participants.length} members
                    </p>
                  </div>
                  <Checkbox 
                    checked={selectedGroupId === group._id}
                    onCheckedChange={() => setSelectedGroupId(group._id)}
                  />
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedGroupId || isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Group"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
