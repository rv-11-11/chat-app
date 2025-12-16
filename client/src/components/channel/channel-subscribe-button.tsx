import { memo } from "react";
import { Button } from "../ui/button";
import { Bell, BellOff } from "lucide-react";
import { Spinner } from "../ui/spinner";

interface ChannelSubscribeButtonProps {
  isSubscribed: boolean;
  isLoading?: boolean;
  onSubscribe?: () => void;
  onUnsubscribe?: () => void;
}

export const ChannelSubscribeButton = memo(
  ({
    isSubscribed,
    isLoading = false,
    onSubscribe,
    onUnsubscribe,
  }: ChannelSubscribeButtonProps) => {
    const handleClick = () => {
      if (isSubscribed) {
        onUnsubscribe?.();
      } else {
        onSubscribe?.();
      }
    };

    return (
      <Button
        onClick={handleClick}
        disabled={isLoading}
        variant={isSubscribed ? "destructive" : "default"}
        size="sm"
      >
        {isLoading ? (
          <Spinner className="w-4 h-4" />
        ) : isSubscribed ? (
          <>
            <BellOff size={16} />
            Unsubscribe
          </>
        ) : (
          <>
            <Bell size={16} />
            Subscribe
          </>
        )}
      </Button>
    );
  }
);
ChannelSubscribeButton.displayName = "ChannelSubscribeButton";
