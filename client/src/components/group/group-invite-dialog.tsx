import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import { Users, Check, AlertCircle, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

type ParticipantRef = { _id: string } | string;

interface GroupInviteInfo {
  _id: string;
  groupName: string;
  participants: ParticipantRef[];
  admins: ParticipantRef[];
  isPublic?: boolean;
}

interface GroupInviteDialogProps {
  groupId: string;
  onClose: () => void;
}

const GroupInviteDialog = ({ groupId, onClose }: GroupInviteDialogProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groupInfo, setGroupInfo] = useState<GroupInviteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    fetchGroupInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const fetchGroupInfo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await API.get(`/chat/${groupId}`);
      const chat = data.chat as GroupInviteInfo;
      setGroupInfo(chat);

      // Check if user is already a member
      const isMember = chat.participants?.some((p: ParticipantRef) => {
        const participantId = typeof p === "string" ? p : p._id;
        return participantId === user?._id;
      });
      setAlreadyMember(isMember);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Failed to load group information");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!groupId) return;

    if (!user) {
      // store pending invite and redirect to sign-in
      localStorage.setItem(
        "pendingInvite",
        JSON.stringify({ type: "group", id: groupId })
      );
      navigate("/", { replace: true });
      return;
    }

    setIsJoining(true);
    try {
      await API.post(`/chat/${groupId}/add-member`, { userId: user._id });
      toast.success("Successfully joined the group!");
      navigate(`/chat/${groupId}`);
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to join group");
    } finally {
      setIsJoining(false);
    }
  };

  const handleOpenGroup = () => {
    navigate(`/chat/${groupId}`);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div className="relative rounded-xl shadow-lg w-full max-w-md bg-base-100 flex flex-col">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-base-200 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Spinner className="w-11 h-11 !text-primary" />
            </div>
          ) : error || !groupInfo ? (
            <div className="p-6 text-center">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Invalid Invite</h2>
              <p className="text-muted-foreground mb-4">
                {error || "This group doesn't exist or the invite link is invalid"}
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-6 text-center border-b border-base-300">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{groupInfo.groupName}</h2>
                <p className="text-muted-foreground">
                  Group · {groupInfo.participants.length} members
                </p>
              </div>

              {/* Content */}
              <div className="p-6">
                {alreadyMember ? (
                  <>
                    <div className="flex items-center justify-center gap-2 text-green-500 mb-4">
                      <Check className="h-5 w-5" />
                      <span className="font-medium">You're already a member</span>
                    </div>
                    <button
                      onClick={handleOpenGroup}
                      className="w-full py-3 px-4 rounded-lg font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all"
                    >
                      Open Group
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-center text-muted-foreground mb-6">
                      You've been invited to join this group. Click the button below to join.
                    </p>
                    <button
                      onClick={handleJoinGroup}
                      disabled={isJoining}
                      className="w-full py-3 px-4 rounded-lg font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isJoining ? "Joining..." : "Join Group"}
                    </button>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-base-300">
                <button
                  onClick={onClose}
                  className="w-full py-2 px-4 rounded-lg font-medium transition-colors bg-base-200 hover:bg-base-300 text-base-content"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default GroupInviteDialog;
