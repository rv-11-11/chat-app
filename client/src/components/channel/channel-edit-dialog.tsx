import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X as XIcon, Megaphone } from "lucide-react";
import type { ChannelType } from "@/hooks/use-channel";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";

interface ChannelEditDialogProps {
  channel: ChannelType;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<ChannelType>) => void;
}

export const ChannelEditDialog = ({ channel, isOpen, onClose, onUpdate }: ChannelEditDialogProps) => {
  const [name, setName] = useState(channel.groupName || channel.name || "");
  const [description, setDescription] = useState(
    (channel as ChannelType & { channelDescription?: string }).channelDescription || ""
  );
  const [iconPreview, setIconPreview] = useState(channel.icon || "");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(channel.groupName || channel.name || "");
      setDescription(
        (channel as ChannelType & { channelDescription?: string }).channelDescription || ""
      );
      setIconPreview(channel.icon || "");
    }
  }, [isOpen, channel]);

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
      await API.put(`/channel/${channel._id}`, {
        name,
        description,
        icon: iconPreview,
      });
      toast.success("Channel updated successfully");
      
      const updates: Partial<ChannelType> = {
        groupName: name,
        name,
        channelDescription: description,
        icon: iconPreview,
      };
      
      onUpdate(updates);
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to update channel");
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogDescription className="sr-only">Edit channel settings including name, description, and icon</DialogDescription>
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Edit Channel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 py-2 sm:py-4">
          <div className="flex flex-col items-center gap-4">
            {iconPreview ? (
              <img
                src={iconPreview}
                alt={name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Megaphone className="h-12 w-12 text-primary" />
              </div>
            )}
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
            <Label htmlFor="name">Channel Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter channel name"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter channel description (optional)"
              disabled={isLoading}
              rows={3}
            />
          </div>

          {(channel as ChannelType & { channelUsername?: string }).channelUsername && (
            <div className="space-y-2">
              <Label>Channel Username</Label>
              <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground flex items-center gap-2">
                <span>@{(channel as ChannelType & { channelUsername?: string }).channelUsername}</span>
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
