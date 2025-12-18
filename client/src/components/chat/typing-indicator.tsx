import AvatarWithBadge from "../avatar-with-badge";
import type { UserType } from "@/types/auth.type";

interface Props {
  typingUsers: UserType[];
}

const TypingIndicator = ({ typingUsers }: Props) => {
  if (!typingUsers || typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`;
    } else {
      return `${typingUsers.length} people are typing...`;
    }
  };

  return (
    <div className="px-4 py-3 flex items-center gap-3 bg-muted/50 rounded-lg mx-2 mb-2 animate-fadeIn">
      <div className="flex gap-1">
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce"></span>
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce animation-delay-100"></span>
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce animation-delay-200"></span>
      </div>
      <span className="text-sm text-muted-foreground">{getTypingText()}</span>
    </div>
  );
};

export default TypingIndicator;
