/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import type { UserType } from "@/types/auth.type";
import type {
  ChatType,
  CreateChatType,
  CreateMessageType,
  MessageType,
} from "@/types/chat.type";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import { useAuth } from "./use-auth";
import { generateUUID } from "@/lib/helper";

interface ChatState {
  chats: ChatType[];
  users: UserType[];
  singleChat: {
    chat: ChatType;
    messages: MessageType[];
  } | null;

  currentAIStreamId: string | null;

  isChatsLoading: boolean;
  isUsersLoading: boolean;
  isCreatingChat: boolean;
  isSingleChatLoading: boolean;
  isSendingMsg: boolean;
  isForwarding: boolean;

  fetchAllUsers: () => void;
  fetchChats: () => void;
  createChat: (payload: CreateChatType) => Promise<ChatType | null>;
  fetchSingleChat: (chatId: string) => void;
  sendMessage: (payload: CreateMessageType) => void;
  forwardMessages: (payload: { messageIds: string[]; targetChatIds: string[] }) => Promise<void>;
  deleteChat: (chatId: string) => Promise<boolean>;

  addNewChat: (newChat: ChatType) => void;
  updateChatLastMessage: (chatId: string, lastMessage: MessageType) => void;
  addNewMessage: (chatId: string, message: MessageType) => void;
  removeMessage: (chatId: string, messageId: string) => void;
  updateChatUnread: (chatId: string, unreadCount: number) => void;
  updateSingleChat: (chatUpdates: Partial<ChatType>) => void;
}

export const useChat = create<ChatState>()((set, get) => ({
  chats: [],
  users: [],
  singleChat: null,

  isChatsLoading: false,
  isUsersLoading: false,
  isCreatingChat: false,
  isSingleChatLoading: false,
  isSendingMsg: false,
  isForwarding: false,

  currentAIStreamId: null,

  fetchAllUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const { data } = await API.get("/user/all");
      set({ users: data.users });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  fetchChats: async () => {
    set({ isChatsLoading: true });
    try {
      const { data } = await API.get("/chat/all");
      set({ chats: data.chats });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch chats");
    } finally {
      set({ isChatsLoading: false });
    }
  },

  createChat: async (payload: CreateChatType) => {
    set({ isCreatingChat: true });
    try {
      const response = await API.post("/chat/create", {
        ...payload,
      });
      get().addNewChat(response.data.chat);
      toast.success("Chat created successfully");
      return response.data.chat;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch chats");
      return null;
    } finally {
      set({ isCreatingChat: false });
    }
  },

  fetchSingleChat: async (chatId: string) => {
    set({ isSingleChatLoading: true });
    try {
      const { data } = await API.get(`/chat/${chatId}`);
      set({ singleChat: data });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch chats");
    } finally {
      set({ isSingleChatLoading: false });
    }
  },

  sendMessage: async (payload: CreateMessageType) => {
    set({ isSendingMsg: true });
    const { chatId, replyTo, content, image, video, nsfwScores } = payload;
    const { user } = useAuth.getState();

    if (!chatId || !user?._id) return;

    const tempUserId = generateUUID();

    const tempMessage = {
      _id: tempUserId,
      chatId,
      content: content || "",
  image: image || null,
  video: video || null,
      sender: user,
      replyTo: replyTo || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "sending...",
    };

    // if (isAI) {
    //  // AI Feature Source code link =>
    // }

    set((state) => {
      if (state.singleChat?.chat?._id !== chatId) return state;
      return {
        singleChat: {
          ...state.singleChat,
          messages: [...state.singleChat.messages, tempMessage],
        },
      };
    });

    try {
  // Debug: log outgoing payload
  console.debug("[use-chat] Sending message payload:", { chatId, content, image, video: video ? { name: video.name, size: video.size, type: video.type } : undefined, replyToId: replyTo?._id });

      const { data } = await API.post("/chat/message/send", {
        chatId,
        content,
        image,
        video,
        replyToId: replyTo?._id,
        nsfwScores,
      });
      const { userMessage } = data;

  // Debug: log server response message id and video info
  console.debug("[use-chat] Server replied with message:", { id: userMessage?._id, video: userMessage?.video });
      //replace the temp user message
      set((state) => {
        if (!state.singleChat) return state;
        return {
          singleChat: {
            ...state.singleChat,
            messages: state.singleChat.messages.map((msg) =>
              msg._id === tempUserId ? userMessage : msg
            ),
          },
        };
      });
    } catch (error: any) {
      // Check if image was blocked for NSFW content
      if (error?.response?.data?.blocked) {
        toast.error(error?.response?.data?.message || '⚠️ Image blocked for inappropriate content');
      } else {
        toast.error(error?.response?.data?.message || "Failed to send message");
      }
      
      // Remove temp message on error
      set((state) => {
        if (!state.singleChat) return state;
        return {
          singleChat: {
            ...state.singleChat,
            messages: state.singleChat.messages.filter((msg) => msg._id !== tempUserId),
          },
        };
      });
    } finally {
      set({ isSendingMsg: false });
    }
  },

  forwardMessages: async ({ messageIds, targetChatIds }) => {
    set({ isForwarding: true });
    const { user } = useAuth.getState();
    if (!user?._id) {
      set({ isForwarding: false });
      return;
    }

    try {
      const responses = await Promise.all(
        targetChatIds.flatMap((targetChatId) =>
          messageIds.map((id) =>
            API.post(`/chat/message/${id}/forward`, { targetChatId })
          )
        )
      );

      // Optimistically update if the target chat is currently open
      const current = get().singleChat;
      responses.forEach(({ data }) => {
        const forwardedMessage = data.userMessage as MessageType;

        const targetId = forwardedMessage.chatId || targetChatIds[0];

        if (current && current.chat && current.chat._id === targetId) {
          set({
            singleChat: {
              chat: current.chat,
              messages: [...current.messages, forwardedMessage],
            },
          });
        }

        get().updateChatLastMessage(targetId, forwardedMessage);
      });

      toast.success("Message forwarded");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to forward message");
    } finally {
      set({ isForwarding: false });
    }
  },

  addNewChat: (newChat: ChatType) => {
    set((state) => {
      const existingChatIndex = state.chats.findIndex(
        (c) => c._id === newChat._id
      );
      if (existingChatIndex !== -1) {
        //move the chat to the top
        return {
          chats: [newChat, ...state.chats.filter((c) => c._id !== newChat._id)],
        };
      } else {
        return {
          chats: [newChat, ...state.chats],
        };
      }
    });
  },

  updateChatLastMessage: (chatId, lastMessage) => {
    set((state) => {
      const chat = state.chats.find((c) => c._id === chatId);
      if (!chat) return state;
      return {
        chats: [
          { ...chat, lastMessage },
          ...state.chats.filter((c) => c._id !== chatId),
        ],
      };
    });
  },

  addNewMessage: (chatId, message) => {
    const chat = get().singleChat;
    if (chat?.chat._id === chatId) {
      // Check if message already exists to prevent duplicates
      const messageExists = chat.messages.some((msg) => msg._id === message._id);
      if (!messageExists) {
        set({
          singleChat: {
            chat: chat.chat,
            messages: [...chat.messages, message],
          },
        });
      }
    }
  },

  removeMessage: (chatId, messageId) => {
    const chat = get().singleChat;
    if (chat?.chat._id === chatId) {
      set({
        singleChat: {
          chat: chat.chat,
          messages: chat.messages.filter((msg) => msg._id !== messageId),
        },
      });
    }
  },

  updateChatUnread: (chatId: string, unreadCount: number) => {
    set((state) => {
      return {
        chats: state.chats.map((c) =>
          c._id === chatId
            ? { ...c, unreadCount }
            : c
        ),
      };
    });
  },

  updateSingleChat: (chatUpdates: Partial<ChatType>) => {
    set((state) => {
      if (!state.singleChat) return state;
      return {
        singleChat: {
          ...state.singleChat,
          chat: { ...state.singleChat.chat, ...chatUpdates },
        },
      };
    });
  },

  deleteChat: async (chatId: string) => {
    try {
      const chatToDelete = get().chats.find((c) => c._id === chatId);
      const isGroup = chatToDelete?.isGroup;
      
      await API.delete(`/chat/${chatId}`);
      set((state) => ({
        chats: state.chats.filter((c) => c._id !== chatId),
        singleChat: state.singleChat?.chat._id === chatId ? null : state.singleChat,
      }));
      
      toast.success(isGroup ? "Group deleted successfully" : "Chat deleted successfully");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete");
      return false;
    }
  },
}));
