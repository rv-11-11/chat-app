import { z } from "zod";
import type { MessageType } from "@/types/chat.type";
import { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Paperclip, Send, X, Loader2 } from "lucide-react";
import { Form, FormField, FormItem } from "../ui/form";
import { Input } from "../ui/input";
import ChatReplyBar from "./chat-reply-bar";
import { useChat } from "@/hooks/use-chat";
import { useNSFWDetection } from "@/hooks/use-nsfw-detection";
import { useSocket } from "@/hooks/use-socket";

interface Props {
  chatId: string | null;
  currentUserId: string | null;
  replyTo: MessageType | null;
  onCancelReply: () => void;
}
const ChatFooter = ({
  chatId,
  currentUserId,
  replyTo,
  onCancelReply,
}: Props) => {
  const messageSchema = z.object({
    message: z.string().optional(),
  });

  const { sendMessage, isSendingMsg } = useChat();
  const { isChecking: isCheckingNSFW, checkImage, lastPredictions } = useNSFWDetection();
  const { socket } = useSocket();

  const [image, setImage] = useState<string | null>(null);
  const [video, setVideo] = useState<{
    data: string; 
    name: string;
    type: string;
    size: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      message: "",
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      // Validate image size (10MB max)
      const maxImageSize = 10 * 1024 * 1024;
      if (file.size > maxImageSize) {
        toast.error("Image size must be less than 10MB");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // Check NSFW content before setting the image
      toast.info("Checking image safety...");
      const isSafe = await checkImage(file);
      
      if (!isSafe) {
        // Image blocked - reset input
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // Image is safe, proceed to load it
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        toast.success("Image is safe to send");
      };
      reader.readAsDataURL(file);
      // clear any existing video
      setVideo(null);
    } else if (file.type.startsWith("video/")) {
      // Validate video size (100MB max)
      const maxVideoSize = 100 * 1024 * 1024;
      if (file.size > maxVideoSize) {
        toast.error("Video size must be less than 100MB");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setVideo({ data: base64, name: file.name, type: file.type, size: file.size });
      };
      reader.readAsDataURL(file);
      // clear any existing image
      setImage(null);
    } else {
      toast.error("Please select an image or video file");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
  if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveVideo = () => {
    setVideo(null);
  if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTyping = (value: string) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (socket && chatId && value.trim()) {
      socket.emit("user:typing", { chatId, userId: currentUserId });
    }

    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const onSubmit = (values: { message?: string }) => {
    if (isSendingMsg || isCheckingNSFW) return;
    if (!values.message?.trim() && !image && !video) {
      toast.error("Please enter a message or select an image/video");
      return;
    }
    // Normalize to match CreateMessageType (no nulls)
    const payload = {
      chatId,
      content: values.message,
      image: image ?? undefined,
      video: video ?? undefined,
      replyTo,
      nsfwScores: image && lastPredictions ? lastPredictions : undefined,
    } as const;
    //Send Message
    sendMessage(payload);

    onCancelReply();
    handleRemoveImage();
  handleRemoveVideo();
    form.reset();
  };
  return (
    <>
      <div
        className="sticky bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border/40 py-4 mb-16 shadow-lg"
      >
        {/* NSFW Checking Indicator */}
        {isCheckingNSFW && (
          <div className="px-4 mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking image safety...</span>
          </div>
        )}

          {image && !isSendingMsg && !isCheckingNSFW && (
          <div className="px-4 mb-2">
            <div className="relative">
              <img
                src={image}
                className="object-contain h-16 bg-muted rounded-lg max-w-full sm:max-w-[360px] block"
                style={{ maxWidth: '80vw' }}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-px right-1
                 bg-black/50 text-white rounded-full
                 cursor-pointer
                "
                onClick={handleRemoveImage}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        {video && !isSendingMsg && !isCheckingNSFW && (
          <div className="px-4 mb-2">
            <div className="relative">
              <video
                src={video.data}
                className="object-contain h-24 bg-black rounded-lg max-w-full sm:max-w-[360px] block"
                style={{ maxWidth: '80vw' }}
                controls
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-px right-1
                 bg-black/50 text-white rounded-full
                 cursor-pointer
                "
                onClick={handleRemoveVideo}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="px-4 flex items-end gap-2"
          >
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={isSendingMsg || isCheckingNSFW}
                className="rounded-full"
                onClick={() => fileInputRef.current?.click()}
              >
                {isCheckingNSFW ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
              </Button>
              <input
                type="file"
                className="hidden"
                accept="image/*,video/*"
                disabled={isSendingMsg || isCheckingNSFW}
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>
            <FormField
              control={form.control}
              name="message"
              disabled={isSendingMsg || isCheckingNSFW}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <Input
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleTyping(e.target.value);
                    }}
                    autoComplete="off"
                    placeholder="Type new message..."
                    className="min-h-[44px] bg-input border-border/50 rounded-xl focus:border-primary/60 transition-all duration-200"
                  />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              size="icon"
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200"
              disabled={isSendingMsg || isCheckingNSFW}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Form>
      </div>

      {replyTo && !isSendingMsg && !isCheckingNSFW && (
        <ChatReplyBar
          replyTo={replyTo}
          currentUserId={currentUserId}
          onCancel={onCancelReply}
        />
      )}
    </>
  );
};

export default ChatFooter;
