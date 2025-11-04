const Message = require("../models/Message");

class ChatSocket {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // Store connected users with their socket info
    this.userRooms = new Map(); // Track which rooms users are in
    this.typingUsers = new Map(); // Track who is typing
    this.userSessions = new Map(); // Track user sessions for reconnection
  }

  // Helper to get user's role-specific info
  getUserInfo(socket) {
    const baseInfo = {
      userId: socket.userId,
      userName: socket.userName,
      socketId: socket.id,
      role: socket.userRole,
    };

    if (socket.userRole === "tutor") {
      return {
        ...baseInfo,
        isTutor: true,
        status: "online",
        lastSeen: new Date(),
      };
    }

    return {
      ...baseInfo,
      isLearner: true,
      status: "online",
      lastSeen: new Date(),
    };
  }

  // Utility function to verify if user belongs to room
  async verifyRoomAccess(userId, roomId) {
    // Room ID format: chat_${smallerId}_${largerId}
    const [_, id1, id2] = roomId.split("_");
    if (!id1 || !id2) return false;

    // User must be one of the participants
    return userId === id1 || userId === id2;
  }

  initializeChatNamespace() {
    // Create a dedicated chat namespace
    const chatNamespace = this.io.of("/chat");

    // Track chat rooms and their participants
    this.chatRooms = new Map();

    chatNamespace.on("connection", (socket) => {
      console.log(`Chat user connected: ${socket.id}`);

      // Handle user authentication
      socket.on("authenticate", async (data) => {
        const { userId, userName, userRole } = data;

        if (!userId || !userName || !userRole) {
          socket.emit("error", { message: "Invalid authentication data" });
          return;
        }

        socket.userId = userId;
        socket.userName = userName;
        socket.userRole = userRole;
        socket.socketId = socket.id;

        // Get role-specific user info
        const userInfo = this.getUserInfo(socket);

        // Store user info
        this.connectedUsers.set(userId, userInfo);

        // Store session for reconnection
        this.userSessions.set(userId, {
          lastSocketId: socket.id,
          lastActive: new Date(),
          role: userRole,
        });

        console.log(
          `User authenticated: ${userName} (${userId}) as ${userRole}`
        );

        // If user is reconnecting, restore their chat rooms
        const existingRooms = Array.from(socket.rooms.values()).filter(
          (room) => room !== socket.id
        );

        if (existingRooms.length > 0) {
          for (const roomId of existingRooms) {
            // Verify access before restoring
            const hasAccess = await this.verifyRoomAccess(userId, roomId);
            if (hasAccess) {
              socket.join(roomId);
              this.userRooms.set(userId, roomId);

              // Load recent messages
              const messages = await Message.find({
                roomId: roomId,
                $or: [{ senderId: userId }, { receiverId: userId }],
              })
                .sort({ timestamp: -1 })
                .limit(50);

              socket.emit("chat_history", messages.reverse());
            }
          }
        }

        // Emit authenticated event with user info
        socket.emit("authenticated", {
          success: true,
          user: userInfo,
        });

        // Notify other users about online status
        if (userRole === "tutor") {
          this.io.of("/chat").emit("tutor_status_changed", {
            tutorId: userId,
            status: "online",
          });
        }
      });

      // Handle joining chat room
      socket.on("join_chat_room", async (data) => {
        const { roomId, tutorId } = data;

        if (!socket.userId) {
          socket.emit("error", { message: "User not authenticated" });
          return;
        }

        // Verify user has access to this room
        const hasAccess = await this.verifyRoomAccess(socket.userId, roomId);
        if (!hasAccess) {
          socket.emit("error", { message: "Access denied to chat room" });
          return;
        }

        try {
          // Leave previous room if any
          const previousRoom = this.userRooms.get(socket.userId);
          if (previousRoom) {
            socket.leave(previousRoom);
          }

          // Join socket room
          socket.join(roomId);
          this.userRooms.set(socket.userId, roomId);

          // Update chat rooms tracking
          if (!this.chatRooms.has(roomId)) {
            this.chatRooms.set(roomId, {
              participants: [socket.userId, tutorId],
              createdAt: new Date(),
            });
          }

          // Load chat history with proper filtering and error handling
          const messages = await Message.find({
            roomId: roomId,
            $or: [
              { senderId: socket.userId, isDeleted: false },
              { receiverId: socket.userId, isDeleted: false },
            ],
          })
            .select("-__v") // Exclude version key
            .sort({ timestamp: 1 })
            .limit(50)
            .lean() // Convert to plain objects for better performance
            .exec();

          socket.emit("chat_history", messages);

          // Notify other user in room
          socket.to(roomId).emit("user_joined", {
            userId: socket.userId,
            userName: socket.userName,
          });

          console.log(`User ${socket.userName} joined room ${roomId}`);
        } catch (error) {
          console.error("Error joining chat room:", error);
          socket.emit("error", { message: "Failed to join chat room" });
        }
      });

      // Handle sending messages
      socket.on("send_message", async (data) => {
        const { message, receiverId, roomId } = data;

        if (!socket.userId) {
          socket.emit("error", { message: "User not authenticated" });
          return;
        }

        // Verify user has access to this room
        const hasAccess = await this.verifyRoomAccess(socket.userId, roomId);
        if (!hasAccess) {
          socket.emit("error", { message: "Access denied to chat room" });
          return;
        }

        try {
          // Verify receiverId is part of the room
          const receiverHasAccess = await this.verifyRoomAccess(
            receiverId,
            roomId
          );
          if (!receiverHasAccess) {
            socket.emit("error", { message: "Invalid receiver" });
            return;
          }

          // Get receiver's session info
          const receiverSession = this.userSessions.get(receiverId);
          const receiverRole = receiverSession?.role || "unknown";

          // Verify learner-tutor communication
          const senderRole = socket.userRole;
          if (senderRole === receiverRole) {
            socket.emit("error", {
              message:
                "Invalid communication: tutors can only message learners and vice versa",
            });
            return;
          }

          // Save message to database with retry logic
          let savedMessage = null;
          let retryCount = 0;
          const maxRetries = 3;

          while (retryCount < maxRetries && !savedMessage) {
            try {
              const newMessage = new Message({
                roomId,
                senderId: socket.userId,
                senderName: socket.userName,
                senderRole: senderRole,
                receiverId,
                receiverRole: receiverRole,
                message: message.trim(),
                timestamp: new Date(),
                isRead: false,
                messageType: "text",
              });

              savedMessage = await newMessage.save();
              console.log(
                `Message saved successfully on attempt ${retryCount + 1}`
              );
            } catch (err) {
              retryCount++;
              console.error(
                `Failed to save message, attempt ${retryCount}:`,
                err
              );
              if (retryCount === maxRetries) {
                throw new Error(
                  "Failed to persist message after multiple attempts"
                );
              }
              // Wait before retrying
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * retryCount)
              );
            }
          }

          const messageData = {
            _id: newMessage._id,
            roomId,
            senderId: socket.userId,
            senderName: socket.userName,
            senderRole: senderRole,
            receiverId,
            receiverRole: receiverRole,
            message: message.trim(),
            timestamp: newMessage.timestamp,
            isRead: false,
          };

          // Send to the specific room
          chatNamespace.to(roomId).emit("chat_message", messageData);

          // Find receiver's active sockets (they might have multiple tabs/devices)
          const receiverSockets = Array.from(
            chatNamespace.sockets.values()
          ).filter((s) => String(s.userId) === String(receiverId));

          if (receiverSockets.length > 0) {
            // Send to all receiver's sockets
            receiverSockets.forEach((receiverSocket) => {
              receiverSocket.emit("new_chat_message", messageData);
            });

            // Update receiver's unread count
            receiverSockets.forEach((receiverSocket) => {
              Message.countDocuments({
                receiverId,
                isRead: false,
              }).then((count) => {
                receiverSocket.emit("unread_count_updated", { count });
              });
            });
          } else {
            // Store unread message for offline user
            console.log(
              `Receiver ${receiverId} (${receiverRole}) is offline, message will be delivered when they reconnect`
            );
          }

          console.log(
            `Message sent in room ${roomId} from ${socket.userName} (${senderRole}) to ${receiverId} (${receiverRole})`
          );
        } catch (error) {
          console.error("Error sending message:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      });

      // Handle typing indicators
      socket.on("typing", (data) => {
        const { isTyping, roomId } = data;

        if (!socket.userId) return;

        // Verify room access before broadcasting typing status
        this.verifyRoomAccess(socket.userId, roomId).then((hasAccess) => {
          if (!hasAccess) return;

          if (isTyping) {
            this.typingUsers.set(socket.userId, {
              roomId,
              timestamp: new Date(),
            });
          } else {
            this.typingUsers.delete(socket.userId);
          }

          // Only broadcast to the specific room
          socket.to(roomId).emit("user_typing", {
            userId: socket.userId,
            userName: socket.userName,
            isTyping,
          });
        });
      });

      // Handle user status updates
      socket.on("update_status", (data) => {
        const { status } = data;
        if (socket.userId) {
          const user = this.connectedUsers.get(socket.userId);
          if (user) {
            user.status = status;
            user.lastSeen = new Date();
          }
        }
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log(`Chat user disconnected: ${socket.id}`);

        if (socket.userId) {
          // Update session info
          const session = this.userSessions.get(socket.userId);
          if (session) {
            session.lastActive = new Date();
            session.status = "offline";
          }

          // Check if user has other active connections
          const hasOtherConnections = Array.from(
            chatNamespace.sockets.values()
          ).some((s) => s.userId === socket.userId && s.id !== socket.id);

          if (!hasOtherConnections) {
            // Remove from connected users if no other connections
            this.connectedUsers.delete(socket.userId);

            // Remove from typing users
            this.typingUsers.delete(socket.userId);

            // Notify rooms about user leaving
            const roomId = this.userRooms.get(socket.userId);
            if (roomId) {
              socket.to(roomId).emit("user_left", {
                userId: socket.userId,
                userName: socket.userName,
                role: socket.userRole,
                timestamp: new Date(),
              });
              this.userRooms.delete(socket.userId);
            }

            // If user is a tutor, notify about status change
            if (socket.userRole === "tutor") {
              this.io.of("/chat").emit("tutor_status_changed", {
                tutorId: socket.userId,
                status: "offline",
                lastSeen: new Date(),
              });
            }
          }
        }
      });

      // Handle getting chat list for tutors
      socket.on("get_chat_list", async () => {
        if (!socket.userId || socket.userRole !== "tutor") {
          socket.emit("error", { message: "Unauthorized" });
          return;
        }

        try {
          // Get all chat rooms where this tutor is a participant
          const tutorRooms = Array.from(this.chatRooms.entries()).filter(
            ([_, room]) => room.participants.includes(socket.userId)
          );

          // Get last message and user info for each chat
          const chatList = await Promise.all(
            tutorRooms.map(async ([roomId, room]) => {
              // Get the other participant (the learner)
              const learnerId = room.participants.find(
                (id) => id !== socket.userId
              );

              // Get last message in this room
              const lastMessage = await Message.findOne({ roomId })
                .sort({ timestamp: -1 })
                .limit(1);

              // Get unread count for this tutor
              const unreadCount = await Message.countDocuments({
                roomId,
                receiverId: socket.userId,
                isRead: false,
              });

              // Check if learner is online
              const learnerInfo = this.connectedUsers.get(learnerId);

              return {
                roomId,
                userId: learnerId,
                name: learnerInfo?.userName || "Unknown Student",
                isOnline: !!learnerInfo,
                lastSeen: learnerInfo?.lastSeen || null,
                lastMessage: lastMessage
                  ? {
                      text: lastMessage.message,
                      timestamp: lastMessage.timestamp,
                      isRead: lastMessage.isRead,
                    }
                  : null,
                unreadCount,
              };
            })
          );

          socket.emit("chat_list", { chats: chatList });
        } catch (error) {
          console.error("Error getting chat list:", error);
          socket.emit("error", { message: "Failed to get chat list" });
        }
      });

      // Handle getting chat list for students
      socket.on("get_student_chats", async () => {
        if (!socket.userId || socket.userRole !== "student") {
          socket.emit("error", { message: "Unauthorized" });
          return;
        }

        try {
          // Get all chat rooms where this student is a participant
          const studentRooms = Array.from(this.chatRooms.entries()).filter(
            ([_, room]) => room.participants.includes(socket.userId)
          );

          // Get last message and tutor info for each chat
          const chatList = await Promise.all(
            studentRooms.map(async ([roomId, room]) => {
              // Get the tutor participant
              const tutorId = room.participants.find(
                (id) => id !== socket.userId
              );

              // Get last message in this room
              const lastMessage = await Message.findOne({ roomId })
                .sort({ timestamp: -1 })
                .limit(1);

              // Get unread count for this student
              const unreadCount = await Message.countDocuments({
                roomId,
                receiverId: socket.userId,
                isRead: false,
              });

              // Check if tutor is online
              const tutorInfo = this.connectedUsers.get(tutorId);

              return {
                roomId,
                userId: tutorId,
                name: tutorInfo?.userName || "Unknown Tutor",
                isOnline: !!tutorInfo,
                lastSeen: tutorInfo?.lastSeen || null,
                lastMessage: lastMessage
                  ? {
                      text: lastMessage.message,
                      timestamp: lastMessage.timestamp,
                      isRead: lastMessage.isRead,
                    }
                  : null,
                unreadCount,
              };
            })
          );

          socket.emit("student_chat_list", { chats: chatList });
        } catch (error) {
          console.error("Error getting student chat list:", error);
          socket.emit("error", { message: "Failed to get chat list" });
        }
      });

      // Handle marking messages as read
      socket.on("mark_messages_read", async (data) => {
        const { roomId } = data;

        if (!socket.userId || !roomId) {
          return;
        }

        try {
          // Verify room access
          const hasAccess = await this.verifyRoomAccess(socket.userId, roomId);
          if (!hasAccess) return;

          // Mark messages as read
          await Message.updateMany(
            {
              roomId,
              receiverId: socket.userId,
              isRead: false,
            },
            {
              $set: {
                isRead: true,
                readAt: new Date(),
              },
            }
          );

          // Get updated unread count
          const unreadCount = await Message.countDocuments({
            receiverId: socket.userId,
            isRead: false,
          });

          // Notify user about updated unread count
          socket.emit("unread_count_updated", { count: unreadCount });

          // Notify sender that messages were read
          const messages = await Message.find({
            roomId,
            receiverId: socket.userId,
            readAt: { $exists: true },
          })
            .select("senderId")
            .distinct("senderId");

          messages.forEach((senderId) => {
            const senderSocket = Array.from(
              chatNamespace.sockets.values()
            ).find((s) => String(s.userId) === String(senderId));

            if (senderSocket) {
              senderSocket.emit("messages_read_by", {
                readBy: socket.userId,
                roomId,
              });
            }
          });
        } catch (error) {
          console.error("Error marking messages as read:", error);
        }
      });

      // Handle errors
      socket.on("error", (error) => {
        console.error("Chat socket error:", error);
      });
    });

    return chatNamespace;
  }

  // Get connected users
  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }

  // Get user status
  getUserStatus(userId) {
    return this.connectedUsers.has(userId);
  }

  // Get typing users in room
  getTypingUsers(roomId) {
    const typingUsers = [];
    for (const [userId, data] of this.typingUsers.entries()) {
      if (data.roomId === roomId) {
        const user = this.connectedUsers.get(userId);
        if (user) {
          typingUsers.push({
            userId,
            userName: user.userName,
            timestamp: data.timestamp,
          });
        }
      }
    }
    return typingUsers;
  }
}

module.exports = ChatSocket;
