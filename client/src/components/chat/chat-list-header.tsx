import { Search } from "lucide-react";
import { NewChatPopover } from "./newchat-popover";
import SectionHeader from "../section-header";
import { Input } from "../ui/input";

const ChatListHeader = ({ onSearch }: { onSearch: (val: string) => void }) => {
  return (
    <>
      <SectionHeader title="Chats" className="mb-6" actions={<NewChatPopover />} />
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search chats..."
          onChange={(e) => onSearch(e.target.value)}
          className="pl-10"
        />
      </div>
    </>
  );
};

export default ChatListHeader;
