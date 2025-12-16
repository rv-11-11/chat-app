import { useEffect, useState } from "react";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import { Check, X, User, Clock } from "lucide-react";
import AvatarWithBadge from "@/components/avatar-with-badge";

interface ChannelManagementRequestsProps {
  channelId: string;
}

interface JoinRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    avatar?: string;
    email?: string;
  };
  status: string;
  requestedAt: string;
}

const ChannelManagementRequests = ({ channelId }: ChannelManagementRequestsProps) => {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [channelId]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data } = await API.get(`/join-request/channel/${channelId}/requests`);
      setRequests(data.requests || []);
    } catch (error: any) {
      console.error("Failed to fetch join requests:", error);
      toast.error(error?.response?.data?.message || "Failed to fetch join requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      await API.post(`/join-request/${requestId}/${channelId}/accept`);
      toast.success("Join request accepted");
      setRequests(requests.filter((r) => r._id !== requestId));
    } catch (error: any) {
      console.error("Failed to accept request:", error);
      toast.error(error?.response?.data?.message || "Failed to accept request");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      await API.post(`/join-request/${requestId}/${channelId}/reject`);
      toast.success("Join request rejected");
      setRequests(requests.filter((r) => r._id !== requestId));
    } catch (error: any) {
      console.error("Failed to reject request:", error);
      toast.error(error?.response?.data?.message || "Failed to reject request");
    } finally {
      setProcessingRequestId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="h-12 w-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
        <p className="text-muted-foreground">No pending join requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div
          key={request._id}
          className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
        >
          {/* User Avatar */}
          <AvatarWithBadge
            name={request.userId.name}
            src={request.userId.avatar}
            size="w-10 h-10"
          />

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">{request.userId.name}</h4>
            {request.userId.email && (
              <p className="text-xs text-muted-foreground truncate">
                {request.userId.email}
              </p>
            )}
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {new Date(request.requestedAt).toLocaleDateString()} at{" "}
                {new Date(request.requestedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAcceptRequest(request._id)}
              disabled={processingRequestId === request._id}
              className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Accept request"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleRejectRequest(request._id)}
              disabled={processingRequestId === request._id}
              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Reject request"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChannelManagementRequests;
