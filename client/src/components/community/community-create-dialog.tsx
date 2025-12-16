import { memo, useState } from "react";
import type React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Users, Upload, X as XIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Spinner } from "../ui/spinner";
import { Label } from "../ui/label";

interface CommunityCreateDialogProps {
  onCreateCommunity: (data: {
    name: string;
    description?: string;
    isPublic: boolean;
    icon?: string;
  }) => Promise<unknown>;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const CommunityCreateDialog = memo(
  ({ onCreateCommunity, isLoading = false, children }: CommunityCreateDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [communityName, setCommunityName] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [iconPreview, setIconPreview] = useState("");

    const resetState = () => {
      setCommunityName("");
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

    const handleCreateCommunity = async () => {
      if (!communityName.trim()) return;
      try {
        await onCreateCommunity({
          name: communityName,
          description: description || undefined,
          isPublic,
          icon: iconPreview || undefined,
        });
        setIsOpen(false);
        resetState();
      } catch (error) {
        // Error handled by createCommunity
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
              title="Create Community"
            >
              <Users className="!h-5 !w-5 !stroke-1" />
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[95vw] sm:w-80 z-[999] rounded-xl max-h-[85vh] overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Create Community</h3>
              <p className="text-sm text-muted-foreground">
                Create a community to organize your groups and channels
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="community-name">Community Name</Label>
              <InputGroup>
                <InputGroupInput
                  id="community-name"
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  placeholder="Enter community name"
                  disabled={isLoading}
                />
                <InputGroupAddon>
                  <Users size={16} />
                </InputGroupAddon>
              </InputGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="community-description">Description</Label>
              <Textarea
                id="community-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional: Describe your community"
                disabled={isLoading}
                className="resize-none h-24"
              />
            </div>

            {/* Community Icon */}
            <div className="space-y-2">
              <Label>Community Icon</Label>
              <div className="flex items-center gap-3">
                {iconPreview ? (
                  <img
                    src={iconPreview}
                    alt="Community icon preview"
                    className="h-10 w-10 rounded-full object-cover border"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                    <Users className="h-5 w-5" />
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

                {iconPreview && (
                  <button
                    type="button"
                    onClick={() => setIconPreview("")}
                    className="p-2 rounded-lg hover:bg-muted"
                    aria-label="Remove icon"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                )}
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
                Make community public
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
                onClick={handleCreateCommunity}
                disabled={isLoading || !communityName.trim()}
              >
                {isLoading && <Spinner className="w-4 h-4" />}
                Create Community
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);
CommunityCreateDialog.displayName = "CommunityCreateDialog";
