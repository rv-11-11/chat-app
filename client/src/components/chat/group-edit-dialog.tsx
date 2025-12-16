import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X as XIcon } from "lucide-react";
import type { ChatType } from "@/types/chat.type";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import AvatarWithBadge from "../avatar-with-badge";

interface GroupEditDialogProps {
  group: ChatType;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<ChatType>) => void;
}

export const GroupEditDialog = ({ group, isOpen, onClose, onUpdate }: GroupEditDialogProps) => {
  const [name, setName] = useState(group.name || group.groupName || "");
  const [iconPreview, setIconPreview] = useState(group.icon || "");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(group.name || group.groupName || "");
      setIconPreview(group.icon || "");
    }
  }, [isOpen, group]);

  const handleIconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setIconPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await API.put(`/chat/${group._id}`, {
        groupName: name,
        icon: iconPreview,
      });
      toast.success("Group updated successfully");
      // Pass the updated chat data back
      onUpdate({
        groupName: name,
        icon: iconPreview,
        name: name,
      });
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to update group");
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogDescription className="sr-only">Edit group settings including name and icon</DialogDescription>
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Edit Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 py-2 sm:py-4">
          <div className="flex flex-col items-center gap-4">
            <AvatarWithBadge
              name={name}
              src={iconPreview}
              isGroup
              size="w-24 h-24"
              className="text-2xl"
            />
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIconChange}
                  disabled={isLoading}
                  className="hidden"
                />
                <div className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md text-sm font-medium transition-colors">
                  <Upload className="h-4 w-4" />
                  Change Photo
                </div>
              </label>
              {iconPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIconPreview("")}
                  disabled={isLoading}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              disabled={isLoading}
            />
          </div>

          {group.groupUsername && (
            <div className="space-y-2">
              <Label>Group Username</Label>
              <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground flex items-center gap-2">
                <span>@{group.groupUsername}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
