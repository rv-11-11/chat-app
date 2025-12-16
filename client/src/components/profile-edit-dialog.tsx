import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import { X, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import AvatarWithBadge from "./avatar-with-badge";
import type { UserType } from "@/types/auth.type";

interface ProfileEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileEditDialog = ({ isOpen, onClose }: ProfileEditDialogProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
  });
  const [previewUrl, setPreviewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      setPreviewUrl(user.avatar || "");
      setUsernameError("");
    }
  }, [user, isOpen]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateUsername = (username: string) => {
    if (!username) return "";
    if (username.length < 3) return "Username must be at least 3 characters";
    if (username.length > 30) return "Username cannot exceed 30 characters";
    if (!/^[a-z0-9_]+$/.test(username)) {
      return "Only lowercase letters, numbers, and underscores allowed";
    }
    return "";
  };

  const handleUsernameChange = (value: string) => {
    const lowercaseValue = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setFormData({ ...formData, username: lowercaseValue });
    setUsernameError(validateUsername(lowercaseValue));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate username before submit
    const usernameValidation = validateUsername(formData.username);
    if (usernameValidation) {
      setUsernameError(usernameValidation);
      return;
    }
    
    setIsLoading(true);

    try {
      const payload: {
        name: string;
        username?: string;
        email: string;
        phone?: string;
        avatar?: string;
      } = {
        name: formData.name,
        email: formData.email,
      };

      if (formData.username.trim()) {
        payload.username = formData.username.trim();
      }

      if (formData.phone.trim()) {
        payload.phone = formData.phone.trim();
      }

      if (previewUrl) {
        payload.avatar = previewUrl;
      }

      const response = await API.put<{ user: UserType }>(
        "/users/profile",
        payload
      );
      const updatedUser = response.data.user;

      if (updatedUser) {
        useAuth.setState({ user: updatedUser });
      }
      toast.success("Profile updated successfully");
      onClose();
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Failed to update profile";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-base-100 rounded-2xl w-full max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between p-4 sm:p-6 border-b border-base-content/10 bg-base-100">
          <h2 className="text-xl sm:text-2xl font-bold">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-base-content/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <AvatarWithBadge
              name={formData.name}
              src={previewUrl}
              isOnline={true}
              className="!w-20 !h-20 sm:!w-24 sm:!h-24"
            />
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-content rounded-lg hover:bg-primary/90 transition">
                <Upload className="w-4 h-4" />
                <span>Change Photo</span>
              </div>
            </label>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input
              type="text"
              placeholder="Enter your name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full"
            />
          </div>

          {/* Username Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <div className="flex items-center">
              <span className="flex items-center justify-center h-10 px-3 bg-base-200 border border-r-0 border-input rounded-l-md text-muted-foreground text-sm">@</span>
              <Input
                type="text"
                placeholder="username"
                value={formData.username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className={`w-full rounded-l-none ${usernameError ? 'border-red-500 focus:ring-red-500' : ''}`}
                maxLength={30}
              />
            </div>
            {usernameError && (
              <p className="text-xs text-red-500">{usernameError}</p>
            )}
            <p className="text-xs text-muted-foreground">Only lowercase letters, numbers, and underscores</p>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={formData.email}
              disabled
              className="w-full bg-base-200 cursor-not-allowed opacity-70"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone Number</label>
            <Input
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditDialog;
