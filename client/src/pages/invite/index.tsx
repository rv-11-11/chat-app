import { useAuth } from "@/hooks/use-auth";
import SectionHeader from "@/components/section-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Share2 } from "lucide-react";

const InvitePage = () => {
  const { user } = useAuth();
  const userId = user?._id ?? "";

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const inviteLink = origin
    ? `${origin}/sign-up${userId ? `?ref=${userId}` : ""}`
    : `https://your-app.com/sign-up${userId ? `?ref=${userId}` : ""}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      alert("Invite link copied to clipboard");
    } catch (error) {
      alert("Unable to copy link");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on the chat app",
          text: "Join me on this chat app",
          url: inviteLink,
        });
      } catch (error) {
        // Share cancelled or failed
      }
    } else {
      void handleCopy();
    }
  };

  return (
    <div className="h-screen overflow-y-auto pb-20 bg-background">
      <div className="p-4">
        <SectionHeader title="Invite friends" className="mb-6" />

        <div className="max-w-xl mx-auto space-y-6">
          <p className="text-sm text-muted-foreground">
            Share your personal invite link with friends so they can join the app.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Invite link
            </label>
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly className="flex-1" />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={handleCopy}
                title="Copy link"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                onClick={handleShare}
                title="Share link"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-base-300 bg-base-100 p-4 text-xs text-muted-foreground">
            {userId
              ? "This link is tied to your account so you can track who joined from your invite."
              : "Sign in to generate a personal invite link tied to your account."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitePage;
