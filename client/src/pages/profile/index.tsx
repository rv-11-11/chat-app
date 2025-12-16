import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import ProfileEditDialog from "@/components/profile-edit-dialog";
import AvatarWithBadge from "@/components/avatar-with-badge";
import { Button } from "@/components/ui/button";
import { Edit, Mail, Phone, Calendar, Shield, X } from "lucide-react";
import { isUserOnline } from "@/lib/helper";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const isOnline = user ? isUserOnline(user._id) : false;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 relative">
          <button
            onClick={() => navigate(-1)}
            className="absolute right-0 top-0 p-2 rounded-lg hover:bg-base-200 transition-colors"
            aria-label="Close profile"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-4xl font-bold mb-2 text-base-content pr-12">My Profile</h1>
          <p className="text-muted-foreground">
            View and manage your profile information
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl p-8 border bg-card border-border">
          {/* Profile Avatar Section */}
          <div className="flex flex-col items-center gap-6 mb-8 pb-8 border-b border-border/60">
            <AvatarWithBadge
              name={user.name || "Unknown"}
              src={user.avatar || ""}
              isOnline={isOnline}
              className="!w-32 !h-32"
            />
            <div className="text-center">
              <h2 className="text-3xl font-bold text-base-content">
                {user.name || "Unknown User"}
              </h2>
              {user.username && (
                <p className="text-lg text-primary/80 mt-1">
                  @{user.username}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                {isOnline ? "🟢 Online" : "⚪ Offline"}
              </p>
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-6 mb-8">
            {/* Email */}
            {user.email && (
              <div className="flex items-center gap-4 p-4 rounded-lg bg-base-200/80">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Email Address
                  </p>
                  <p className="text-lg font-semibold text-base-content">
                    {user.email}
                  </p>
                </div>
              </div>
            )}

            {/* Phone */}
            {user.phone && (
              <div className="flex items-center gap-4 p-4 rounded-lg bg-base-200/80">
                <div className="p-3 rounded-lg bg-success/10">
                  <Phone className="w-6 h-6 text-success" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Phone Number
                  </p>
                  <p className="text-lg font-semibold text-base-content">
                    {user.phone}
                  </p>
                </div>
              </div>
            )}

            {/* User ID */}
            {user._id && (
              <div className="flex items-center gap-4 p-4 rounded-lg bg-base-200/80">
                <div className="p-3 rounded-lg bg-secondary/10">
                  <Shield className="w-6 h-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    User ID
                  </p>
                  <p className="text-sm font-mono text-base-content/80 break-all">
                    {user._id}
                  </p>
                </div>
              </div>
            )}

            {/* Account Created Date */}
            {user.createdAt && (
              <div className="flex items-center gap-4 p-4 rounded-lg bg-base-200/80">
                <div className="p-3 rounded-lg bg-warning/10">
                  <Calendar className="w-6 h-6 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Member Since
                  </p>
                  <p className="text-lg font-semibold text-base-content">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Edit Button */}
          <div className="flex gap-3 pt-4 border-t border-border/60">
            <Button
              className="flex-1 gap-2"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <ProfileEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
      />
    </div>
  );
};

export default Profile;
