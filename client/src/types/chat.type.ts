import type { UserType } from "./auth.type";

export type ChatType = {
  _id: string;
  name?: string;
  lastMessage?: MessageType;
  participants: UserType[];
  isGroup: boolean;
  isAiChat: boolean;
  type?: "DIRECT" | "GROUP" | "CHANNEL";
  createdBy: string;
  groupName?: string;
  groupUsername?: string;
  icon?: string;
  admins?: string[] | UserType[];
  unreadCount?: number;
  allowInviteLinkJoin?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MessageType = {
  _id: string;
  content: string | null;
  image: string | null;
  video?: {
    url?: string;
    name?: string;
    duration?: number;
    size?: number;
  } | null;
  sender: UserType | null;
  replyTo: MessageType | null;
  chatId: string;
  messageType?: "USER" | "SYSTEM";
  viewCount?: number;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
  //only frontend
  status?: string;
  streaming?: boolean;
};

export type CreateChatType = {
  participantId?: string;
  isGroup?: boolean;
  participants?: string[];
  groupName?: string;
  icon?: string;
};

export type CreateMessageType = {
  chatId: string | null;
  content?: string;
  image?: string;
  video?: { data: string; name: string; type: string; size: number };
  replyTo?: MessageType | null;
  nsfwScores?: Array<{ className: string; probability: number }>;
};
