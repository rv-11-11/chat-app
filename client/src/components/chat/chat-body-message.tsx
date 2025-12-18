import { memo, useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";
import type { MessageType, ChatType } from "@/types/chat.type";
import AvatarWithBadge from "../avatar-with-badge";
import { formatChatTime } from "@/lib/helper";
import { Button } from "../ui/button";
import { ReplyIcon, MoreVertical, Download, Share2, Flag, Edit, Pin, Trash2 } from "lucide-react";
import ImageViewerDialog from "./image-viewer-dialog";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Textarea } from "../ui/textarea";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";

interface Props {
  message: MessageType;
  onReply: (message: MessageType) => void;
  chat?: ChatType | null;
  onUpdate?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  forwardMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (messageId: string) => void;
}
const ChatMessageBody = memo(({ message, onReply, chat, onUpdate, onDelete, forwardMode = false, isSelected = false, onToggleSelect }: Props) => {
  const { user } = useAuth();
  const { removeMessage } = useChat();
  const { autoDownloadPhotos, autoDownloadVideos } = useSettings();
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportCategory, setReportCategory] = useState("");
  const [editContent, setEditContent] = useState(message.content || "");
  const [isPinned, setIsPinned] = useState(message.isPinned || false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const userId = user?._id || null;
  const isCurrentUser = message.sender?._id === userId;
  const senderName = isCurrentUser ? "You" : message.sender?.name;

  const replySendername =
    message.replyTo?.sender?._id === userId
      ? "You"
      : message.replyTo?.sender?.name;

  // Check if user is admin (for groups and channels)
  // Also check createdBy as fallback if admins array is empty
  const isAdmin = chat?.admins?.some((admin) => {
    const adminId = typeof admin === 'string' ? admin : admin._id;
    return adminId === userId;
  }) || chat?.createdBy === userId;

  // Show pin only for groups and channels (not direct chats) and only for admins
  // Check both type and isGroup for backward compatibility
  const isDirectChat = chat?.type === "DIRECT" && !chat?.isGroup;
  const canPin = !isDirectChat && isAdmin;

  // Check if message can be edited (within 10 minutes for text messages)
  const canEdit = isCurrentUser && (() => {
    const messageTime = new Date(message.createdAt).getTime();
    const currentTime = new Date().getTime();
    const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds
    const timeDifference = currentTime - messageTime;
    return timeDifference <= tenMinutes;
  })();

  const containerClass = cn(
    "group flex gap-3 py-2 px-4 relative animate-slideInUp",
    isCurrentUser && "flex-row-reverse text-left",
    forwardMode && "cursor-pointer"
  );

  const contentWrapperClass = cn(
  "max-w-[75%] w-full sm:max-w-[70%] flex flex-col relative",
    isCurrentUser && "items-end"
  );

  const messageClass = cn(
    "px-4 py-3 text-sm break-words shadow-md rounded-2xl transition-all duration-200 hover:shadow-lg",
    isCurrentUser
      ? "bg-gradient-to-br from-primary to-primary/80 dark:from-primary dark:to-primary/70 text-primary-foreground rounded-br-none"
      : "bg-gradient-to-br from-card to-muted dark:from-muted dark:to-muted/80 text-foreground rounded-bl-none"
  );

  const replyBoxClass = cn(
    `mb-2 p-3 text-xs rounded-lg border-l-4 shadow-md !text-left transition-all duration-200`,
    isCurrentUser
      ? "bg-primary/15 border-l-primary dark:bg-primary/20"
      : "bg-muted/50 dark:bg-muted/30 border-l-secondary dark:border-l-accent"
  );

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

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}${window.location.pathname}?messageId=${message._id}`;
      const shareText = message.content 
        ? `${message.content}\n\n${shareUrl}`
        : shareUrl;
      
      if (navigator.share) {
        await navigator.share({
          title: `Message from ${senderName}`,
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
      const reason = reportReason.trim() 
        ? `${reportCategory}: ${reportReason}`
        : reportCategory;
      
      await API.post("/admin/report", {
        reportedItemType: "message",
        reportedItemId: message._id,
        reason: reason,
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

  const handleEdit = async () => {
    if (!editContent.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    setIsProcessing(true);
    try {
      await API.put(`/chat/message/${message._id}/edit`, { content: editContent });
      if (onUpdate) {
        onUpdate(message._id, editContent);
      }
      setShowEditDialog(false);
      toast.success("Message updated");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update message");
    } finally {
      setIsProcessing(false);
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

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      // Remove from UI immediately for instant feedback
      if (message.chatId) {
        removeMessage(message.chatId, message._id);
      }
      
      await API.delete(`/chat/message/${message._id}`);
      
      if (onDelete) {
        onDelete(message._id);
      }
      setShowDeleteDialog(false);
      toast.success("Message deleted");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete message");
      // If error, the socket event will restore the UI state
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectToggle = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onToggleSelect?.(message._id);
  };

  return (
    <div className={containerClass} onClick={() => forwardMode && handleSelectToggle() }>
      {forwardMode && (
        <button
          aria-label="Select message to forward"
          onClick={handleSelectToggle}
          className="mt-1"
        >
          <span
            className={cn(
              "h-5 w-5 rounded-sm border flex items-center justify-center",
              isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted"
            )}
          >
            {isSelected ? "✓" : ""}
          </span>
        </button>
      )}
      {!isCurrentUser && (
        <div className="flex-shrink-0 flex items-start">
          <AvatarWithBadge
            name={message.sender?.name || "No name"}
            src={message.sender?.avatar || ""}
          />
        </div>
      )}

      <div className={contentWrapperClass}>
        <div
          className={cn(
            "flex items-center gap-1",
            isCurrentUser && "flex-row-reverse"
          )}
        >
          <div className={messageClass}>
            {/* {Header} */}

            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold">{senderName}</span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {formatChatTime(message?.createdAt)}
              </span>
            </div>

            {/* ReplyToBox */}
            {message.replyTo && (
              <div className={replyBoxClass}>
                <h5 className="font-medium">{replySendername}</h5>
                <p
                  className="font-normal text-muted-foreground
                 max-w-[250px]  truncate
                "
                >
                  {message?.replyTo?.content ||
                    (message?.replyTo?.image ? "📷 Photo" : "")}
                </p>
              </div>
            )}

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
                    <span role="img" aria-hidden="true">
                      📷
                    </span>
                    <span>Load photo</span>
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
                              className="w-full h-auto object-contain block rounded-md max-h-[400px]"
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
                    <span role="img" aria-hidden="true">
                      🎥
                    </span>
                    <span>Load video</span>
                  </Button>
                ) : (
                  <div className="mt-2">
                    {/* Support server-returned video metadata (url) or optimistic/base64 (data) */}
                    {(() => {
                      const v = message.video as unknown as { url?: string; data?: string };
                      const src = v.url ?? v.data;
                      if (!src) return null;
                        return (
                        <video
                          src={src}
                          controls
                          // increase mobile size slightly: wider and taller but not 100%
                          className="rounded-lg block w-full max-w-[92vw] sm:max-w-[640px] object-contain max-h-[50vh] sm:max-h-[60vh]"
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
                options={{ target: "_blank", className: "text-blue-500 underline hover:text-blue-600 break-words" }}
              >
                <span className="leading-relaxed">{message.content}</span>
              </Linkify>
            )}
          </div>

          {/* Action Buttons */}
          <div className={cn(
            "flex items-center gap-1",
            isCurrentUser && "flex-row-reverse"
          )}>
            {/* Reply Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => onReply(message)}
              className="flex transition-opacity rounded-full !size-8 p-1"
            >
              <ReplyIcon
                size={16}
                className={cn(
                  "text-gray-500 dark:text-white !stroke-[1.9]",
                  isCurrentUser && "scale-x-[-1]"
                )}
              />
            </Button>

            {/* Three-dot Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full !size-8 p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical size={16} className="text-gray-500 dark:text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {/* Forward selection */}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect?.(message._id);
                  }}
                  className="cursor-pointer focus:bg-accent"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  <span>Select to forward</span>
                </DropdownMenuItem>

                {/* Download */}
                {(message.image || message.video) && (
                  <DropdownMenuItem 
                    onClick={handleDownload}
                    className="cursor-pointer focus:bg-accent"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    <span>Download</span>
                  </DropdownMenuItem>
                )}

                {/* Edit - only for own messages within 10 minutes */}
                {canEdit && (
                  <DropdownMenuItem 
                    onClick={() => setShowEditDialog(true)}
                    className="cursor-pointer focus:bg-accent"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                )}

                {/* Pin - only for admins in groups/channels */}
                {canPin && (
                  <DropdownMenuItem 
                    onClick={handlePin}
                    disabled={isProcessing}
                    className="cursor-pointer focus:bg-accent disabled:opacity-50"
                  >
                    <Pin className="h-4 w-4 mr-2" />
                    <span>{isPinned ? "Unpin" : "Pin"}</span>
                  </DropdownMenuItem>
                )}

                {/* Share */}
                <DropdownMenuItem 
                  onClick={handleShare}
                  className="cursor-pointer focus:bg-accent"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  <span>Share</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Delete for me */}
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span>Delete for me</span>
                </DropdownMenuItem>

                {/* Report - only for others' messages */}
                {!isCurrentUser && (
                  <DropdownMenuItem
                    onClick={() => setShowReportDialog(true)}
                    className="cursor-pointer text-orange-600 focus:text-orange-600 focus:bg-orange-50 dark:focus:bg-orange-950"
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    <span>Report</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {message.status && (
          <span
            className="block
           text-[10px] text-gray-400 mt-0.5"
          >
            {message.status}
          </span>
        )}
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
                <RadioGroupItem value="Copyright content" id="chat-copyright" />
                <Label htmlFor="chat-copyright" className="cursor-pointer text-sm leading-tight">Copyright content</Label>
              </div>
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="Adult content" id="chat-adult" />
                <Label htmlFor="chat-adult" className="cursor-pointer text-sm leading-tight">Adult content</Label>
              </div>
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="Spam content" id="chat-spam" />
                <Label htmlFor="chat-spam" className="cursor-pointer text-sm leading-tight">Spam content</Label>
              </div>
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="Misleading information" id="chat-misleading" />
                <Label htmlFor="chat-misleading" className="cursor-pointer text-sm leading-tight">Misleading information</Label>
              </div>
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="Harassment" id="chat-harassment" />
                <Label htmlFor="chat-harassment" className="cursor-pointer text-sm leading-tight">Harassment</Label>
              </div>
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="Fake news" id="chat-fakenews" />
                <Label htmlFor="chat-fakenews" className="cursor-pointer text-sm leading-tight">Fake news</Label>
              </div>
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="Scam / Fraud" id="chat-scam" />
                <Label htmlFor="chat-scam" className="cursor-pointer text-sm leading-tight">Scam / Fraud</Label>
              </div>
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="Violence / Hate speech" id="chat-violence" />
                <Label htmlFor="chat-violence" className="cursor-pointer text-sm leading-tight">Violence / Hate speech</Label>
              </div>
            </RadioGroup>
            
            <div>
              <Label htmlFor="chat-additional-details" className="text-xs sm:text-sm text-muted-foreground">
                Additional details (optional)
              </Label>
              <Textarea
                id="chat-additional-details"
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

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
            <DialogDescription>
              Make changes to your message below.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Enter your message..."
              className="min-h-24"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isProcessing}>
              {isProcessing ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the message for you only. Other participants will still be able to see it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isProcessing}>
              {isProcessing ? "Deleting..." : "Delete for me"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

ChatMessageBody.displayName = "ChatMessageBody";

export default ChatMessageBody;
