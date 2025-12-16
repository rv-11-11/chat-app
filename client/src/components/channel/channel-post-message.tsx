import { memo, useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";
import type { MessageType } from "@/types/chat.type";
import AvatarWithBadge from "../avatar-with-badge";
import { formatChatTime } from "@/lib/helper";
import { Button } from "../ui/button";
import { 
  MoreVertical, 
  Download, 
  Pin, 
  Share2, 
  Flag,
  Eye,
  Trash2
} from "lucide-react";
import ImageViewerDialog from "../chat/image-viewer-dialog";
import Linkify from "linkify-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";

interface Props {
  message: MessageType;
  isAdmin: boolean;
}

const ChannelPostMessage = memo(({ message, isAdmin }: Props) => {
  const { user } = useAuth();
  const { removeMessage } = useChat();
  const { autoDownloadPhotos, autoDownloadVideos } = useSettings();
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportCategory, setReportCategory] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewCount, setViewCount] = useState(message.viewCount || 0);
  const [isPinned, setIsPinned] = useState(message.isPinned || false);

  const userId = user?._id || null;
  const isCurrentUser = message.sender?._id === userId;
  const senderName = message.sender?.name;

  useEffect(() => {
    if (autoDownloadPhotos) {
      setIsImageLoaded(true);
    } else {
      setIsImageLoaded(false);
    }
  }, [autoDownloadPhotos]);

  useEffect(() => {
    if (autoDownloadVideos) {
      setIsVideoLoaded(true);
    } else {
      setIsVideoLoaded(false);
    }
  }, [autoDownloadVideos]);

  // Increment view count when message is visible (only once per user)
  useEffect(() => {
    const incrementView = async () => {
      try {
        // Skip if this is a temporary message (UUID format instead of MongoDB ObjectId)
        if (message._id.includes('-')) {
          return;
        }

        // Check if user has already viewed this message
        const viewedMessages = JSON.parse(localStorage.getItem('viewedMessages') || '[]');
        const viewKey = `${userId}_${message._id}`;
        
        if (viewedMessages.includes(viewKey)) {
          // Already viewed, just get current count
          return;
        }

        // Increment view and mark as viewed
        const { data } = await API.post(`/chat/message/${message._id}/view`);
        setViewCount(data.viewCount);
        
        // Store in localStorage
        viewedMessages.push(viewKey);
        localStorage.setItem('viewedMessages', JSON.stringify(viewedMessages));
      } catch (error) {
        // Silently fail
      }
    };

    const timer = setTimeout(incrementView, 2000);
    return () => clearTimeout(timer);
  }, [message._id, userId]);

  const handleDownload = async () => {
    try {
      let url: string | undefined;
      let filename = '';

      if (message.image) {
        url = message.image;
        filename = `image-${Date.now()}.jpg`;
      } else if (message.video) {
        const v = message.video as unknown as { url?: string; data?: string };
        url = v.url ?? v.data;
        filename = `video-${Date.now()}.mp4`;
      }

      if (!url) {
        toast.error("No media to download");
        return;
      }

      // Fetch the file and create a blob
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success("Downloaded successfully");
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download");
    }
  };

  const handlePin = async () => {
    setIsProcessing(true);
    try {
      await API.put(`/chat/message/${message._id}/pin`);
      setIsPinned(!isPinned);
      toast.success(isPinned ? "Message unpinned" : "Message pinned");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to pin message");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}${window.location.pathname}?messageId=${message._id}`;
      const shareText = message.content 
        ? `${message.content}\n\n${shareUrl}`
        : shareUrl;
      
      if (navigator.share) {
        await navigator.share({
          title: `Post from ${senderName}`,
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard");
      }
    } catch (error) {
      // User cancelled share or error occurred
    }
  };

  const handleReport = async () => {
    if (!reportCategory) {
      toast.error("Please select a category");
      return;
    }

    setIsProcessing(true);
    try {
      await API.post("/admin/report", {
        targetType: "MESSAGE",
        targetId: message._id,
        reason: reportCategory,
        description: reportReason,
      });
      setShowReportDialog(false);
      setReportCategory("");
      setReportReason("");
      toast.success("Report submitted");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to submit report");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      // Remove from UI immediately for instant feedback
      if (message.chatId) {
        removeMessage(message.chatId, message._id);
      }
      
      await API.delete(`/chat/message/${message._id}`);
      toast.success("Message deleted");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete message");
      // If error, the socket event will restore the UI state
    } finally {
      setIsProcessing(false);
    }
  };

  const containerClass = cn(
    "group flex gap-3 py-2 px-4"
  );

  const contentWrapperClass = "max-w-[75%] w-full sm:max-w-[70%] flex flex-col relative";

  const messageClass = cn(
    "px-4 py-2.5 text-sm break-words shadow-sm rounded-bl-xl rounded-r-xl",
    "bg-[#F5F5F5] dark:bg-accent"
  );

  return (
    <div className={containerClass}>
      <div className="flex-shrink-0 flex items-start">
        <AvatarWithBadge
          name={senderName || "User"}
          src={message.sender?.avatar || ""}
        />
      </div>

      <div className={contentWrapperClass}>
        <div className="flex items-center gap-1">
          <div className={messageClass}>
            {/* Header with name, time, view count, and menu */}
            <div className="flex items-center justify-between gap-2 mb-1 w-full">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold">{"User"}</span>
              </div>
              
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  {formatChatTime(message?.createdAt)}
                </span>
                
                {/* View Count */}
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  <span>{viewCount}</span>
                </div>

                {isPinned && (
                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                    📌 Pinned
                  </span>
                )}

                {/* 3-dot Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 p-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {/* Download - show if there's media */}
                  {(message.image || message.video) && (
                    <DropdownMenuItem 
                      onClick={handleDownload}
                      className="cursor-pointer focus:bg-accent"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      <span>Download</span>
                    </DropdownMenuItem>
                  )}

                  {/* Share - always show */}
                  <DropdownMenuItem 
                    onClick={handleShare}
                    className="cursor-pointer focus:bg-accent"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    <span>Share</span>
                  </DropdownMenuItem>

                  {/* Admin actions */}
                  {(isAdmin || !isCurrentUser) && <DropdownMenuSeparator />}
                  
                  {/* Pin - only for admins */}
                  {isAdmin && (
                    <DropdownMenuItem 
                      onClick={handlePin} 
                      disabled={isProcessing}
                      className="cursor-pointer focus:bg-accent disabled:opacity-50"
                    >
                      <Pin className="h-4 w-4 mr-2" />
                      <span>{isPinned ? "Unpin" : "Pin"}</span>
                    </DropdownMenuItem>
                  )}

                  {/* Report - for non-admins always, for admins only on others' posts */}
                  {(!isAdmin || !isCurrentUser) && (
                    <DropdownMenuItem
                      onClick={() => setShowReportDialog(true)}
                      className="cursor-pointer text-orange-600 focus:text-orange-600 focus:bg-orange-50 dark:focus:bg-orange-950"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      <span>Report</span>
                    </DropdownMenuItem>
                  )}

                  {/* Delete - for message owner OR channel admin */}
                  {(isCurrentUser || isAdmin) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleDelete}
                        disabled={isProcessing}
                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            </div>

            {/* Message Content */}
            {message?.image && (
              <div className="mt-2">
                {!autoDownloadPhotos && !isImageLoaded ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-xs flex items-center gap-2 hover:bg-accent/50 transition-colors"
                    onClick={() => setIsImageLoaded(true)}
                  >
                    📷 Load photo
                  </Button>
                ) : (
                  <div className="mt-1">
                    <div
                      role="button"
                      onClick={() => setShowImageViewer(true)}
                      className="rounded-lg overflow-hidden cursor-pointer block"
                    >
                      <img
                        src={message.image}
                        alt=""
                        draggable={false}
                        className="w-full h-auto object-contain block rounded-md max-h-[300px]"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {message?.video && (
              <div className="mt-2">
                {!autoDownloadVideos && !isVideoLoaded ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-xs flex items-center gap-2 hover:bg-accent/50 transition-colors"
                    onClick={() => setIsVideoLoaded(true)}
                  >
                    🎥 Load video
                  </Button>
                ) : (
                  <div className="mt-2">
                    {(() => {
                      const v = message.video as unknown as { url?: string; data?: string };
                      const src = v.url ?? v.data;
                      if (!src) return null;
                      return (
                        <video
                          src={src}
                          controls
                          className="rounded-lg block w-full max-w-[92vw] sm:max-w-[640px] object-contain max-h-[40vh] sm:max-h-[50vh]"
                          style={{ height: "auto" }}
                        />
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {message.content && (
              <Linkify
                tagName="p"
                options={{ 
                  target: "_blank", 
                  className: "text-blue-500 underline hover:text-blue-600 break-words" 
                }}
              >
                <span className="leading-relaxed">{message.content}</span>
              </Linkify>
            )}
          </div>
        </div>
      </div>

      {/* Image Viewer Dialog */}
      {showImageViewer && message?.image && (
        <ImageViewerDialog 
          imageUrl={message.image} 
          onClose={() => setShowImageViewer(false)} 
        />
      )}

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Report Message</DialogTitle>
            <DialogDescription className="text-sm">
              Please select a category that best describes your concern.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 sm:py-4 space-y-3 sm:space-y-4">
            <RadioGroup value={reportCategory} onValueChange={setReportCategory} className="space-y-2">
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="Copyright content" id="copyright" />
                <Label htmlFor="copyright" className="cursor-pointer text-sm leading-tight">Copyright content</Label>
              </div>
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="Adult content" id="adult" />
                <Label htmlFor="adult" className="cursor-pointer text-sm leading-tight">Adult content</Label>
              </div>
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="Spam content" id="spam" />
                <Label htmlFor="spam" className="cursor-pointer text-sm leading-tight">Spam content</Label>
              </div>
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="Misleading information" id="misleading" />
                <Label htmlFor="misleading" className="cursor-pointer text-sm leading-tight">Misleading information</Label>
              </div>
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="Harassment" id="harassment" />
                <Label htmlFor="harassment" className="cursor-pointer text-sm leading-tight">Harassment</Label>
              </div>
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="Fake news" id="fakenews" />
                <Label htmlFor="fakenews" className="cursor-pointer text-sm leading-tight">Fake news</Label>
              </div>
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="Scam / Fraud" id="scam" />
                <Label htmlFor="scam" className="cursor-pointer text-sm leading-tight">Scam / Fraud</Label>
              </div>
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="Violence / Hate speech" id="violence" />
                <Label htmlFor="violence" className="cursor-pointer text-sm leading-tight">Violence / Hate speech</Label>
              </div>
            </RadioGroup>
            
            <div>
              <Label htmlFor="additional-details" className="text-xs sm:text-sm text-muted-foreground">
                Additional details (optional)
              </Label>
              <Textarea
                id="additional-details"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Provide additional context..."
                className="min-h-16 sm:min-h-20 mt-2 text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowReportDialog(false);
                setReportCategory("");
                setReportReason("");
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleReport} 
              disabled={isProcessing || !reportCategory}
              className="w-full sm:w-auto"
            >
              {isProcessing ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

ChannelPostMessage.displayName = "ChannelPostMessage";

export default ChannelPostMessage;
