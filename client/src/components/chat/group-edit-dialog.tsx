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
  const [description, setDescription] = useState(group.groupDescription || "");
  const [username, setUsername] = useState(group.groupUsername || "");
  const [rules, setRules] = useState(group.groupRules || "");
  const [category, setCategory] = useState(group.groupCategory || "other");
  const [iconPreview, setIconPreview] = useState(group.icon || "");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(group.name || group.groupName || "");
      setDescription(group.groupDescription || "");
      setUsername(group.groupUsername || "");
      setRules(group.groupRules || "");
      setCategory(group.groupCategory || "other");
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
        groupDescription: description,
        groupUsername: username,
        groupRules: rules,
        groupCategory: category,
        icon: iconPreview,
      });
      toast.success("Group updated successfully");
      onUpdate({
        groupName: name,
        groupDescription: description,
        groupUsername: username,
        groupRules: rules,
        groupCategory: category,
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

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              maxLength={500}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Group Username (@)</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="unique-group-name"
              maxLength={30}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value="other">Other</option>
              <option value="study">Study</option>
              <option value="gaming">Gaming</option>
              <option value="work">Work</option>
              <option value="hobbies">Hobbies</option>
              <option value="sports">Sports</option>
              <option value="entertainment">Entertainment</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rules">Group Rules</Label>
            <textarea
              id="rules"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="Set group rules and guidelines..."
              maxLength={1000}
              disabled={isLoading}
              rows={3}
              className="w-full px-3 py-2 border rounded-md text-sm bg-background resize-none"
            />
            <p className="text-xs text-muted-foreground">{rules.length}/1000</p>
          </div>

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
