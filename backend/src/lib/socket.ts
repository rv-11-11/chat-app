import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { Server, type Socket } from "socket.io";
import { Env } from "../config/env.config";
import { validateChatParticipant } from "../services/chat.service";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

let io: Server | null = null;

const onlineUsers = new Map<string, string>();

export const initializeSocket = (httpServer: HTTPServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: Env.FRONTEND_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/socket.io/",
    transports: ["polling", "websocket"],
    allowEIO3: true,
  });

  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie;

      if (!rawCookie) {
        return next(new Error("Unauthorized"));
      }

      // Parse cookies from the raw header, e.g. "accessToken=...; other=value"
      const cookies = Object.fromEntries(
        rawCookie.split(";").map((pair) => {
          const [name, ...rest] = pair.split("=");
          return [name.trim(), rest.join("=").trim()];
        })
      );

      const token = cookies["accessToken"];
      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decodedToken = jwt.verify(token, Env.JWT_SECRET) as {
        userId: string;
      };

      if (!decodedToken?.userId) {
        return next(new Error("Unauthorized"));
      }

      socket.userId = decodedToken.userId;
      return next();
    } catch (error) {
      return next(new Error("Internal server error"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const newSocketId = socket.id;
    if (!socket.userId) {
      socket.disconnect(true);
      return;
    }

    //register socket for the user
    onlineUsers.set(userId, newSocketId);

    //BroadCast online users to all socket
    io?.emit("online:users", Array.from(onlineUsers.keys()));

    //create personnal room for user
    socket.join(`user:${userId}`);

    socket.on(
      "chat:join",
      async (chatId: string, callback?: (err?: string) => void) => {
        try {
          await validateChatParticipant(chatId, userId);
          socket.join(`chat:${chatId}`);
          console.log(`User ${userId} join room chat:${chatId}`);

          callback?.();
        } catch (error) {
          callback?.("Error joining chat");
        }
      }
    );

    // WebRTC signaling events for video/audio calls
    // Clients should join the chat room first via `chat:join` and then
    // exchange offers/answers/ICE candidates using the events below.
    socket.on("webrtc:join", (chatId: string, callback?: (err?: string) => void) => {
      try {
        if (!chatId) return callback?.("Invalid chatId");
        socket.join(`webrtc:${chatId}`);
        console.log(`User ${userId} joined webrtc room: webrtc:${chatId}`);
        callback?.();
      } catch (err) {
        callback?.("Error joining webrtc room");
      }
    });

    socket.on(
      "webrtc:offer",
      (payload: { chatId: string; offer: any; toSocketId?: string }) => {
        try {
          const { chatId, offer, toSocketId } = payload || ({} as any);
          if (!chatId || !offer) return;

          // If a target socket id is provided, send directly to that peer.
          if (toSocketId) {
            io?.to(toSocketId).emit("webrtc:offer", { from: socket.id, offer });
            return;
          }

          // Otherwise broadcast to all other peers in the webrtc room for this chat
          io?.to(`webrtc:${chatId}`).except(socket.id).emit("webrtc:offer", {
            from: socket.id,
            offer,
          });
        } catch (err) {
          console.error("webrtc:offer error", err);
        }
      }
    );

    socket.on(
      "webrtc:answer",
      (payload: { chatId: string; answer: any; toSocketId?: string }) => {
        try {
          const { chatId, answer, toSocketId } = payload || ({} as any);
          if (!chatId || !answer) return;

          if (toSocketId) {
            io?.to(toSocketId).emit("webrtc:answer", { from: socket.id, answer });
            return;
          }

          io?.to(`webrtc:${chatId}`).except(socket.id).emit("webrtc:answer", {
            from: socket.id,
            answer,
          });
        } catch (err) {
          console.error("webrtc:answer error", err);
        }
      }
    );

    socket.on(
      "webrtc:ice",
      (payload: { chatId: string; candidate: any; toSocketId?: string }) => {
        try {
          const { chatId, candidate, toSocketId } = payload || ({} as any);
          if (!chatId || !candidate) return;

          if (toSocketId) {
            io?.to(toSocketId).emit("webrtc:ice", { from: socket.id, candidate });
            return;
          }

          io?.to(`webrtc:${chatId}`).except(socket.id).emit("webrtc:ice", {
            from: socket.id,
            candidate,
          });
        } catch (err) {
          console.error("webrtc:ice error", err);
        }
      }
    );

    socket.on("chat:leave", (chatId: string) => {
      if (chatId) {
        socket.leave(`chat:${chatId}`);
        console.log(`User ${userId} left room chat:${chatId}`);
      }
    });

    // Channel subscription events
    socket.on(
      "channel:subscribe",
      async (channelId: string, callback?: (err?: string) => void) => {
        try {
          socket.join(`channel:${channelId}`);
          console.log(`User ${userId} subscribed to channel:${channelId}`);
          callback?.();
        } catch (error) {
          callback?.("Error subscribing to channel");
        }
      }
    );

    socket.on("channel:unsubscribe", (channelId: string) => {
      if (channelId) {
        socket.leave(`channel:${channelId}`);
        console.log(`User ${userId} unsubscribed from channel:${channelId}`);
      }
    });

    socket.on("disconnect", () => {
      if (onlineUsers.get(userId) === newSocketId) {
        if (userId) onlineUsers.delete(userId);

        io?.emit("online:users", Array.from(onlineUsers.keys()));

        console.log("socket disconnected", {
          userId,
          newSocketId,
        });
      }
    });
  });
};

function getIO() {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

export const emitNewChatToParticpants = (
  participantIds: string[] = [],
  chat: any
) => {
  const io = getIO();
  for (const participantId of participantIds) {
    io.to(`user:${participantId}`).emit("chat:new", chat);
  }
};

export const emitNewMessageToChatRoom = (
  senderId: string, // user that triggered the system/message event
  chatId: string,
  message: any,
  options?: { includeSender?: boolean }
) => {
  const io = getIO();
  const senderSocketId = onlineUsers.get(senderId?.toString());

  console.log(senderId, "senderId");
  console.log(senderSocketId, "sender socketid exist");
  console.log("All online users:", Object.fromEntries(onlineUsers));

  const room = io.to(`chat:${chatId}`);
  const shouldIncludeSender = options?.includeSender;

  if (senderSocketId && !shouldIncludeSender) {
    room.except(senderSocketId).emit("message:new", message);
    return;
  }

  room.emit("message:new", message);

  // Also emit to all participants' personal rooms so their list updates
  // This will be handled by emitLastMessageToParticipants
};

export const emitLastMessageToParticipants = (
  participantIds: string[],
  chatId: string,
  lastMessage: any,
  excludeUserId?: string
) => {
  const io = getIO();
  const payload = { chatId, lastMessage };

  for (const participantId of participantIds) {
    // Skip the sender if excludeUserId is provided
    if (excludeUserId && participantId === excludeUserId.toString()) {
      continue;
    }
    
    io.to(`user:${participantId}`).emit("chat:update", payload);
    // Also emit message:new event so the list can update unread count
    io.to(`user:${participantId}`).emit("message:new", { chatId });
  }
};

export const emitChannelSubscriberUpdate = (
  channelId: string,
  event: "subscriber:joined" | "subscriber:left",
  userId: string
) => {
  const io = getIO();
  io.to(`channel:${channelId}`).emit(event, { userId, channelId });
};

export const emitChannelAdminUpdate = (
  channelId: string,
  event: "admin:added" | "admin:removed",
  userId: string
) => {
  const io = getIO();
  io.to(`channel:${channelId}`).emit(event, { userId, channelId });
};
