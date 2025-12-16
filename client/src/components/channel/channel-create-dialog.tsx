import { memo, useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Megaphone, Upload } from "lucide-react";

// Generate random 12-character username
const generateRandomUsername = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789_';
  let username = '';
  for (let i = 0; i < 12; i++) {
    username += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return username;
};
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Spinner } from "../ui/spinner";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

interface ChannelCreateDialogProps {
  onCreateChannel: (data: {
    name: string;
    description?: string;
    isPublic: boolean;
    icon?: string;
    username?: string;
  }) => Promise<unknown>;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const ChannelCreateDialog = memo(
  ({ onCreateChannel, isLoading = false, children }: ChannelCreateDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [channelName, setChannelName] = useState("");
    const [channelUsername, setChannelUsername] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [iconPreview, setIconPreview] = useState("");

    // Auto-generate username when channel privacy changes
    useEffect(() => {
      if (!isPublic) {
        // Private channel: auto-generate random username
        setChannelUsername(generateRandomUsername());
      } else {
        // Public channel: clear username to let user set it
        setChannelUsername("");
      }
    }, [isPublic]);

    const resetState = () => {
      setChannelName("");
      setChannelUsername("");
      setDescription("");
      setIsPublic(true);
      setIconPreview("");
    };

    const handleIconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    };

    const handleCreateChannel = async () => {
      if (!channelName.trim()) return;
      try {
        await onCreateChannel({
          name: channelName,
          description: description || undefined,
          isPublic,
          icon: iconPreview || undefined,
          username: channelUsername || undefined,
        });
        setIsOpen(false);
        resetState();
      } catch (error) {
        // Error handled by createChannel
      }
    };

    const handleOpenChange = (open: boolean) => {
      setIsOpen(open);
      if (!open) resetState();
    };

    return (
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          {children ? (
            <div onClick={() => setIsOpen(true)}>{children}</div>
          ) : (
            <Button
              onClick={() => setIsOpen(true)}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Create Channel"
            >
              <Megaphone className="!h-5 !w-5 !stroke-1" />
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[95vw] sm:w-80 z-[999] rounded-xl max-h-[85vh] overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Create Channel</h3>
              <p className="text-sm text-muted-foreground">
                Start a broadcast channel for your followers
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel-name">Channel Name</Label>
              <InputGroup>
                <InputGroupInput
                  id="channel-name"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="Enter channel name"
                  disabled={isLoading}
                />
                <InputGroupAddon>
                  <Megaphone size={16} />
                </InputGroupAddon>
              </InputGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel-username">Username {!isPublic && "(Auto-Generated)"}</Label>
              <InputGroup>
                <InputGroupAddon>@</InputGroupAddon>
                <InputGroupInput
                  id="channel-username"
                  value={channelUsername}
                  onChange={(e) => isPublic && setChannelUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="unique_channel_name"
                  disabled={isLoading || !isPublic}
                  maxLength={30}
                />
              </InputGroup>
              <p className="text-xs text-muted-foreground">
                {isPublic ? (
                  <>{channelUsername.length}/30 • Only lowercase letters, numbers, and underscores</>
                ) : (
                  <>Auto-generated for privacy • {channelUsername}</>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel-description">Description</Label>
              <Textarea
                id="channel-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional: Describe your channel"
                disabled={isLoading}
                className="resize-none h-24"
              />
            </div>

            {/* Channel Icon */}
            <div className="space-y-2">
              <Label>Channel Icon</Label>
              <div className="flex items-center gap-3">
                {iconPreview ? (
                  <img
                    src={iconPreview}
                    alt="Channel icon preview"
                    className="h-10 w-10 rounded-full object-cover border"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                    <Megaphone className="h-5 w-5" />
                  </div>
                )}

                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIconChange}
                    disabled={isLoading}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-accent/10">
                    <Upload className="h-4 w-4" />
                    <span>{iconPreview ? "Change icon" : "Upload icon"}</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="is-public"
                checked={isPublic}
                onCheckedChange={(checked) => setIsPublic(checked === true)}
                disabled={isLoading}
              />
              <Label htmlFor="is-public" className="cursor-pointer">
                Make channel public
              </Label>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateChannel}
                disabled={isLoading || !channelName.trim()}
              >
                {isLoading && <Spinner className="w-4 h-4" />}
                Create Channel
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);
ChannelCreateDialog.displayName = "ChannelCreateDialog";

// New Dialog-based component for community pages
interface ChannelCreateDialogCommunityProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChannel: (data: {
    name: string;
    description?: string;
    isPublic: boolean;
    icon?: string;
    username?: string;
  }) => Promise<unknown>;
}

export const ChannelCreateDialogCommunity = memo(
  ({ isOpen, onClose, onCreateChannel }: ChannelCreateDialogCommunityProps) => {
    const [channelName, setChannelName] = useState("");
    const [channelUsername, setChannelUsername] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [iconPreview, setIconPreview] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Auto-generate username when channel privacy changes
    useEffect(() => {
      if (!isPublic) {
        // Private channel: auto-generate random username
        setChannelUsername(generateRandomUsername());
      } else {
        // Public channel: clear username to let user set it
        setChannelUsername("");
      }
    }, [isPublic]);

    const resetState = () => {
      setChannelName("");
      setChannelUsername(generateRandomUsername()); // Start with random username
      setDescription("");
      setIsPublic(true);
      setIconPreview("");
    };

    const handleIconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    };

    const handleCreateChannel = async () => {
      if (!channelName.trim()) return;
      setIsLoading(true);
      try {
        await onCreateChannel({
          name: channelName,
          description: description || undefined,
          isPublic,
          icon: iconPreview || undefined,
          username: channelUsername || undefined,
        });
        onClose();
        resetState();
      } catch (error) {
        // Error handled by onCreateChannel
      } finally {
        setIsLoading(false);
      }
    };

    const handleClose = () => {
      onClose();
      resetState();
    };

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogDescription className="sr-only">Create a new channel for broadcasting to followers</DialogDescription>
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <Megaphone className="h-4 w-4 sm:h-5 sm:w-5" />
              Create Channel
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            <div className="space-y-2">
              <Label htmlFor="channel-name">Channel Name</Label>
              <Input
                id="channel-name"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="Enter channel name"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel-username">Username {!isPublic && "(Auto-Generated)"}</Label>
              <div className="flex gap-2">
                <span className="flex items-center px-3 py-2 rounded-md border bg-muted">@</span>
                <Input
                  id="channel-username"
                  value={channelUsername}
                  onChange={(e) => isPublic && setChannelUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="unique_channel_name"
                  disabled={isLoading || !isPublic}
                  maxLength={30}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {isPublic ? (
                  <>{channelUsername.length}/30 • Only lowercase letters, numbers, and underscores</>
                ) : (
                  <>Auto-generated for privacy • {channelUsername}</>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel-description">Description</Label>
              <Textarea
                id="channel-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional: Describe your channel"
                disabled={isLoading}
                className="resize-none h-24"
              />
            </div>

            {/* Channel Icon */}
            <div className="space-y-2">
              <Label>Channel Icon</Label>
              <div className="flex items-center gap-3">
                {iconPreview ? (
                  <img
                    src={iconPreview}
                    alt="Channel icon preview"
                    className="h-10 w-10 rounded-full object-cover border"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                    <Megaphone className="h-5 w-5" />
                  </div>
                )}

                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIconChange}
                    disabled={isLoading}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-accent/10">
                    <Upload className="h-4 w-4" />
                    <span>{iconPreview ? "Change icon" : "Upload icon"}</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="is-public"
                checked={isPublic}
                onCheckedChange={(checked) => setIsPublic(checked === true)}
                disabled={isLoading}
              />
              <Label htmlFor="is-public" className="cursor-pointer">
                Make channel public
              </Label>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateChannel}
                disabled={isLoading || !channelName.trim()}
              >
                {isLoading && <Spinner className="w-4 h-4 mr-2" />}
                Create Channel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);
ChannelCreateDialogCommunity.displayName = "ChannelCreateDialogCommunity";