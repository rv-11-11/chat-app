import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Upload, X as XIcon, Users } from "lucide-react";
import type { CommunityType } from "@/hooks/use-community";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";

interface CommunityEditDialogProps {
  community: CommunityType;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const CommunityEditDialog = ({ community, isOpen, onClose, onUpdate }: CommunityEditDialogProps) => {
  const [name, setName] = useState(community.name || "");
  const [description, setDescription] = useState(community.description || "");
  const [isPublic, setIsPublic] = useState(community.isPublic || false);
  const [iconPreview, setIconPreview] = useState(community.icon || "");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(community.name || "");
      setDescription(community.description || "");
      setIsPublic(community.isPublic || false);
      setIconPreview(community.icon || "");
    }
  }, [isOpen, community]);

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
      await API.put(`/community/${community._id}`, {
        name,
        description,
        isPublic,
        icon: iconPreview,
      });
      toast.success("Community updated successfully");
      onUpdate();
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to update community");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogDescription className="sr-only">Edit community settings including name, description, icon, and privacy</DialogDescription>
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Edit Community Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 py-2 sm:py-4">
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
              {iconPreview ? (
                <img src={iconPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <Users className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              )}
            </div>
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
                  Change Icon
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

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Community Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter community name"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your community"
                disabled={isLoading}
                className="resize-none h-20 sm:h-24 text-sm"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <Label>Public Community</Label>
                <div className="text-sm text-muted-foreground">
                  Anyone can see and join this community
                </div>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={setIsPublic}
                disabled={isLoading}
              />
            </div>

            {community.username && (
              <div className="space-y-2">
                <Label>Community Username</Label>
                <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground flex items-center gap-2">
                  <span>@{community.username}</span>
                </div>
              </div>
            )}
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
