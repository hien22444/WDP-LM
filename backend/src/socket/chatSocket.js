const Message = require("../models/Message");
const User = require("../models/User");
const Conversation = require("../models/Conversation");

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

      // Handle joining chat room (support both conversationId and roomId)
      socket.on("join_chat_room", async (data) => {
        const { conversationId, roomId, tutorId } = data;

        if (!socket.userId) {
          socket.emit("error", { message: "User not authenticated" });
          return;
        }

        try {
          let actualConversationId = conversationId;
          let actualRoomId = roomId;

          // Nếu có conversationId (kiến trúc mới)
          if (conversationId) {
            // Verify user has access to this conversation
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
              socket.emit("error", { message: "Conversation not found" });
              return;
            }

            const isParticipant = conversation.participants.some(
              (p) => String(p._id || p) === String(socket.userId)
            );
            if (!isParticipant) {
              socket.emit("error", { message: "Access denied to conversation" });
              return;
            }

            // Generate roomId từ conversationId để backward compatibility
            const [id1, id2] = conversation.participants.map(p => String(p._id || p)).sort();
            actualRoomId = `chat_${id1}_${id2}`;
          } 
          // Nếu chỉ có roomId (backward compatibility)
          else if (roomId) {
            // Verify user has access to this room
            const hasAccess = await this.verifyRoomAccess(socket.userId, roomId);
            if (!hasAccess) {
              socket.emit("error", { message: "Access denied to chat room" });
              return;
            }
            actualRoomId = roomId;
          } else {
            socket.emit("error", { message: "conversationId or roomId is required" });
            return;
          }

          // Leave previous room if any
          const previousRoom = this.userRooms.get(socket.userId);
          if (previousRoom) {
            socket.leave(previousRoom);
          }

          // Join socket room - join cả conversationId và roomId để đảm bảo nhận được messages
          if (actualConversationId) {
            socket.join(String(actualConversationId));
            console.log(`✅ Joined conversationId room: ${actualConversationId}`);
          }
          if (actualRoomId) {
            socket.join(actualRoomId);
            console.log(`✅ Joined roomId room: ${actualRoomId}`);
          }
          
          // Store room mapping
          this.userRooms.set(socket.userId, actualRoomId || String(actualConversationId));

          // Load chat history
          let messages = [];
          if (actualConversationId) {
            // Dùng conversationId (kiến trúc mới)
            messages = await Message.find({
              conversationId: actualConversationId,
              isDeleted: false,
            })
              .select("-__v")
              .sort({ timestamp: 1 })
              .limit(50)
              .populate("senderId", "full_name email profile")
              .lean()
              .exec();
          } else {
            // Dùng roomId (backward compatibility)
            messages = await Message.find({
              roomId: actualRoomId,
              $or: [
                { senderId: socket.userId, isDeleted: false },
                { receiverId: socket.userId, isDeleted: false },
              ],
            })
              .select("-__v")
              .sort({ timestamp: 1 })
              .limit(50)
              .lean()
              .exec();
          }

          socket.emit("chat_history", messages);

          // Notify other user in room
          socket.to(actualRoomId).emit("user_joined", {
            userId: socket.userId,
            userName: socket.userName,
          });

          console.log(`User ${socket.userName} joined room ${actualRoomId}`);
        } catch (error) {
          console.error("Error joining chat room:", error);
          socket.emit("error", { message: "Failed to join chat room" });
        }
      });

      // Handle sending messages (support both conversationId and roomId)
      socket.on("send_message", async (data, ack) => {
        const { message, content, receiverId, conversationId, roomId } = data;

        if (!socket.userId) {
          socket.emit("error", { message: "User not authenticated" });
          if (typeof ack === "function") {
            ack({ status: "error", error: "User not authenticated" });
          }
          return;
        }

        const messageContent = message || content || "";
        if (!messageContent.trim()) {
          socket.emit("error", { message: "Message content is required" });
          if (typeof ack === "function") {
            ack({ status: "error", error: "Message content is required" });
          }
          return;
        }

        try {
          let conversation = null;
          let actualConversationId = conversationId;
          let actualRoomId = roomId;
          let actualReceiverId = receiverId;

          // Nếu có conversationId (kiến trúc mới)
          if (conversationId) {
            conversation = await Conversation.findById(conversationId);
            if (!conversation) {
              socket.emit("error", { message: "Conversation not found" });
              if (typeof ack === "function") {
                ack({ status: "error", error: "Conversation not found" });
              }
              return;
            }

            // Verify user has access
            const isParticipant = conversation.participants.some(
              (p) => String(p._id || p) === String(socket.userId)
            );
            if (!isParticipant) {
              socket.emit("error", { message: "Access denied" });
              if (typeof ack === "function") {
                ack({ status: "error", error: "Access denied" });
              }
              return;
            }

            // Get receiverId from conversation if not provided
            if (!receiverId) {
              const otherParticipant = conversation.getOtherParticipant(socket.userId);
              if (!otherParticipant) {
                socket.emit("error", { message: "Invalid conversation" });
                if (typeof ack === "function") {
                  ack({ status: "error", error: "Invalid conversation" });
                }
                return;
              }
              actualReceiverId = String(otherParticipant._id || otherParticipant);
            } else {
              actualReceiverId = String(receiverId);
            }

            // Generate roomId từ conversation participants để đảm bảo consistency
            const participants = conversation.participants.map(p => String(p._id || p)).sort();
            if (participants.length === 2) {
              actualRoomId = `chat_${participants[0]}_${participants[1]}`;
            } else {
              // Fallback nếu không có đủ participants
              actualRoomId = conversationId.toString();
            }
            
            console.log(`🔍 send_message: conversationId=${actualConversationId}, roomId=${actualRoomId}, senderId=${socket.userId}, receiverId=${actualReceiverId}`);
          } 
          // Nếu chỉ có roomId (backward compatibility) - tạo conversation mới
          else if (roomId) {
            if (!receiverId) {
              socket.emit("error", { message: "receiverId is required when using roomId" });
              if (typeof ack === "function") {
                ack({ status: "error", error: "receiverId is required" });
              }
              return;
            }

            // Verify access
            const hasAccess = await this.verifyRoomAccess(socket.userId, roomId);
            if (!hasAccess) {
              socket.emit("error", { message: "Access denied" });
              if (typeof ack === "function") {
                ack({ status: "error", error: "Access denied" });
              }
              return;
            }

            // Tìm hoặc tạo conversation từ roomId
            const [id1, id2] = roomId.replace("chat_", "").split("_").sort();
            conversation = await Conversation.findOrCreate(id1, id2);
            actualConversationId = conversation._id;
            actualReceiverId = String(receiverId);
            actualRoomId = roomId;
          } else {
            socket.emit("error", { message: "conversationId or roomId is required" });
            if (typeof ack === "function") {
              ack({ status: "error", error: "conversationId or roomId is required" });
            }
            return;
          }

          // Get receiver's session info
          const receiverSession = this.userSessions.get(actualReceiverId);
          const receiverRole = receiverSession?.role || "unknown";

          // Verify learner-tutor communication
          const senderRole = socket.userRole;
          if (senderRole === receiverRole) {
            socket.emit("error", {
              message: "Invalid communication: tutors can only message learners and vice versa",
            });
            if (typeof ack === "function") {
              ack({ status: "error", error: "Invalid communication" });
            }
            return;
          }

          // Validate conversationId trước khi save
          if (!actualConversationId) {
            console.error("❌ Error: actualConversationId is null/undefined");
            socket.emit("error", { message: "Invalid conversation" });
            if (typeof ack === "function") {
              ack({ status: "error", error: "Invalid conversation" });
            }
            return;
          }

          // Save message to database
          // Log chi tiết trước khi save
          const mongoose = require("mongoose");
          console.log("💾 Preparing to save message:", {
            conversationId: actualConversationId,
            conversationIdType: typeof actualConversationId,
            conversationIdValid: mongoose.Types.ObjectId.isValid(actualConversationId),
            roomId: actualRoomId,
            senderId: socket.userId,
            senderIdType: typeof socket.userId,
            senderIdValid: mongoose.Types.ObjectId.isValid(socket.userId),
            senderName: socket.userName,
            senderRole: socket.userRole,
            receiverId: actualReceiverId,
            receiverIdType: typeof actualReceiverId,
            receiverIdValid: mongoose.Types.ObjectId.isValid(actualReceiverId),
            messageLength: messageContent.trim().length,
          });

          let savedMessage = null;
          let retryCount = 0;
          const maxRetries = 3;

          while (retryCount < maxRetries && !savedMessage) {
            try {
              // Convert IDs to ObjectId nếu cần
              const conversationIdObj = mongoose.Types.ObjectId.isValid(actualConversationId)
                ? new mongoose.Types.ObjectId(actualConversationId)
                : actualConversationId;
              
              const senderIdObj = mongoose.Types.ObjectId.isValid(socket.userId)
                ? new mongoose.Types.ObjectId(socket.userId)
                : socket.userId;
              
              const receiverIdObj = mongoose.Types.ObjectId.isValid(actualReceiverId)
                ? new mongoose.Types.ObjectId(actualReceiverId)
                : actualReceiverId;

              const newMessage = new Message({
                conversationId: conversationIdObj,
                roomId: actualRoomId || null, // Backward compatibility (có thể null)
                senderId: senderIdObj,
                senderName: socket.userName || "Unknown",
                receiverId: receiverIdObj,
                message: messageContent.trim(),
                content: messageContent.trim(), // Sync với message
                timestamp: new Date(),
                isRead: false,
                messageType: "text",
              });

              console.log(`💾 Attempting to save message (attempt ${retryCount + 1}/${maxRetries})...`);
              savedMessage = await newMessage.save();
              console.log(`✅ Message saved successfully! messageId: ${savedMessage._id}, conversationId: ${savedMessage.conversationId}, senderId: ${savedMessage.senderId}, receiverId: ${savedMessage.receiverId}`);
            } catch (err) {
              retryCount++;
              console.error(`❌ Failed to save message, attempt ${retryCount}/${maxRetries}:`, err);
              console.error("❌ Error details:", {
                conversationId: actualConversationId,
                conversationIdValid: mongoose.Types.ObjectId.isValid(actualConversationId),
                senderId: socket.userId,
                senderIdValid: mongoose.Types.ObjectId.isValid(socket.userId),
                receiverId: actualReceiverId,
                receiverIdValid: mongoose.Types.ObjectId.isValid(actualReceiverId),
                errorMessage: err.message,
                errorName: err.name,
                errorCode: err.code,
                errorStack: err.stack,
              });
              
              if (retryCount === maxRetries) {
                // Không throw error để tránh crash server, chỉ log và báo lỗi
                console.error("❌ CRITICAL: Failed to persist message after multiple attempts");
                console.error("❌ Final error:", err);
                socket.emit("error", { 
                  message: "Failed to save message. Please try again.",
                  error: err.message 
                });
                if (typeof ack === "function") {
                  ack({ status: "error", error: "Failed to save message" });
                }
                return; // Return thay vì throw
              }
              await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
            }
          }

          // Update conversation's lastMessage (không block nếu fail)
          try {
            await Conversation.findByIdAndUpdate(actualConversationId, {
              lastMessage: messageContent.trim().substring(0, 100), // Preview
              lastMessageAt: new Date(),
            });
            console.log("✅ Conversation lastMessage updated");
          } catch (err) {
            console.error("⚠️ Failed to update conversation lastMessage (non-critical):", err);
            // Không throw, tiếp tục xử lý
          }

          // Kiểm tra savedMessage có tồn tại không
          if (!savedMessage) {
            console.error("❌ CRITICAL: savedMessage is null after save attempts");
            socket.emit("error", { message: "Failed to save message" });
            if (typeof ack === "function") {
              ack({ status: "error", error: "Failed to save message" });
            }
            return;
          }

          const messageData = {
            _id: savedMessage._id,
            conversationId: actualConversationId,
            roomId: actualRoomId, // Backward compatibility
            senderId: socket.userId,
            senderName: socket.userName,
            senderRole: senderRole,
            receiverId: actualReceiverId,
            receiverRole: receiverRole,
            message: messageContent.trim(),
            content: messageContent.trim(),
            timestamp: savedMessage.timestamp,
            isRead: false,
          };

          // Send to the specific room (dùng conversationId hoặc roomId)
          // Emit đến cả conversationId room và roomId room để đảm bảo receiver nhận được
          try {
            // Emit đến room bằng conversationId (nếu có)
            if (actualConversationId) {
              chatNamespace.to(String(actualConversationId)).emit("chat_message", messageData);
              console.log(`📤 Message broadcasted to conversationId room: ${actualConversationId}`);
            }
            
            // Emit đến room bằng roomId (backward compatibility)
            if (actualRoomId) {
              chatNamespace.to(actualRoomId).emit("chat_message", messageData);
              console.log(`📤 Message broadcasted to roomId room: ${actualRoomId}`);
            }
          } catch (emitError) {
            console.error("❌ Error emitting to room:", emitError);
          }

          // Find receiver's active sockets
          try {
            const receiverSockets = Array.from(chatNamespace.sockets.values()).filter(
              (s) => s.userId && String(s.userId) === String(actualReceiverId)
            );

            if (receiverSockets.length > 0) {
              // Send to all receiver's sockets
              receiverSockets.forEach((receiverSocket) => {
                try {
                  receiverSocket.emit("new_chat_message", messageData);
                  receiverSocket.emit("chat_message", messageData);
                } catch (emitError) {
                  console.error("❌ Error emitting to receiver socket:", emitError);
                }
              });

              // Update receiver's unread count (không block nếu fail)
              receiverSockets.forEach((receiverSocket) => {
                Message.countDocuments({
                  receiverId: actualReceiverId,
                  isRead: false,
                  isDeleted: false,
                })
                  .then((count) => {
                    try {
                      receiverSocket.emit("unread_count_updated", { count });
                    } catch (emitError) {
                      console.error("❌ Error emitting unread count:", emitError);
                    }
                  })
                  .catch((err) => {
                    console.error("❌ Error counting unread messages:", err);
                  });
              });

              // Notify receiver to refresh chat list (cả tutor và student)
              receiverSockets.forEach((receiverSocket) => {
                try {
                  // Emit cho cả tutor và student để refresh chat list
                  receiverSocket.emit("chat_list_updated");
                  console.log(`📢 Notified ${receiverSocket.userRole} to refresh chat list`);
                } catch (emitError) {
                  console.error("❌ Error emitting chat_list_updated:", emitError);
                }
              });
            } else {
              console.log(
                `Receiver ${actualReceiverId} (${receiverRole}) is offline, message will be delivered when they reconnect`
              );
            }
          } catch (socketError) {
            console.error("❌ Error finding receiver sockets:", socketError);
            // Không throw, tiếp tục xử lý
          }

          console.log(
            `✅ Message sent in conversation ${actualConversationId} from ${socket.userName} (${senderRole}) to ${actualReceiverId} (${receiverRole})`
          );

          // Acknowledge to sender
          try {
            if (typeof ack === "function") {
              ack({ status: "success", messageId: savedMessage._id });
            }
          } catch (ackError) {
            console.error("❌ Error sending acknowledgment:", ackError);
          }
        } catch (error) {
          console.error("❌ CRITICAL Error in send_message handler:", error);
          console.error("❌ Error stack:", error.stack);
          
          // Không throw error để tránh crash server
          try {
            socket.emit("error", { 
              message: "Failed to send message",
              error: error.message 
            });
            if (typeof ack === "function") {
              ack({ status: "error", error: error.message || "Failed to send message" });
            }
          } catch (emitError) {
            console.error("❌ Error emitting error message:", emitError);
          }
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
          const tutorId = String(socket.userId);
          
          // Kiến trúc mới: Query conversations từ Conversation model
          const conversations = await Conversation.find({
            participants: tutorId
          })
            .populate("participants", "full_name email profile")
            .sort({ lastMessageAt: -1 })
            .lean();

          // Get chat info for each conversation
          const chatList = await Promise.all(
            conversations.map(async (conv) => {
              // Get the other participant (student/learner)
              const otherParticipant = conv.participants.find(
                (p) => String(p._id || p) !== String(tutorId)
              );

              if (!otherParticipant) return null;

              const learnerId = String(otherParticipant._id || otherParticipant);

              // Get last message in this conversation
              const lastMessage = await Message.findOne({ 
                conversationId: conv._id,
                isDeleted: false 
              })
                .sort({ timestamp: -1 })
                .lean();

              // Generate roomId for backward compatibility
              const [id1, id2] = [String(tutorId), learnerId].sort();
              const roomId = `chat_${id1}_${id2}`;

              // Get unread count for this tutor
              const unreadCount = await Message.countDocuments({
                conversationId: conv._id,
                receiverId: tutorId,
                isRead: false,
                isDeleted: false
              });

              // Check if learner is online
              const learnerInfo = this.connectedUsers.get(learnerId);

              return {
                conversationId: conv._id,
                roomId, // Backward compatibility
                userId: learnerId,
                name: otherParticipant?.full_name || otherParticipant?.email || "Unknown Student",
                avatar: otherParticipant?.profile?.avatar || "https://via.placeholder.com/40",
                isOnline: !!learnerInfo,
                lastSeen: learnerInfo?.lastSeen || null,
                lastMessage: lastMessage
                  ? {
                      text: lastMessage.message || lastMessage.content,
                      timestamp: lastMessage.timestamp,
                      isRead: lastMessage.isRead,
                    }
                  : null,
                unreadCount,
              };
            })
          );

          // Filter out null entries
          const validChats = chatList.filter(chat => chat !== null);

          console.log(`✅ get_chat_list: Found ${validChats.length} conversations for tutor ${tutorId}`);
          socket.emit("chat_list", { chats: validChats });
        } catch (error) {
          console.error("❌ Error getting chat list:", error);
          socket.emit("error", { message: "Failed to get chat list" });
        }
      });

      // Handle getting tutor chats (alternative endpoint)
      socket.on("get_tutor_chats", async (data) => {
        const tutorId = data?.tutorId || socket.userId;
        
        if (!tutorId || socket.userRole !== "tutor") {
          socket.emit("error", { message: "Unauthorized" });
          return;
        }

        try {
          const tutorIdStr = String(tutorId);
          
          // Kiến trúc mới: Query conversations từ Conversation model (giống get_chat_list)
          const conversations = await Conversation.find({
            participants: tutorIdStr
          })
            .populate("participants", "full_name email profile")
            .sort({ lastMessageAt: -1 })
            .lean();

          // Get chat info for each conversation
          const chatList = await Promise.all(
            conversations.map(async (conv) => {
              // Get the other participant (student/learner)
              const otherParticipant = conv.participants.find(
                (p) => String(p._id || p) !== String(tutorIdStr)
              );

              if (!otherParticipant) return null;

              const learnerId = String(otherParticipant._id || otherParticipant);

              // Get last message in this conversation
              const lastMessage = await Message.findOne({ 
                conversationId: conv._id,
                isDeleted: false 
              })
                .sort({ timestamp: -1 })
                .lean();

              // Generate roomId for backward compatibility
              const [id1, id2] = [String(tutorIdStr), learnerId].sort();
              const roomId = `chat_${id1}_${id2}`;

              // Get unread count for this tutor
              const unreadCount = await Message.countDocuments({
                conversationId: conv._id,
                receiverId: tutorIdStr,
                isRead: false,
                isDeleted: false
              });

              // Check if learner is online
              const learnerInfo = this.connectedUsers.get(learnerId);

              return {
                conversationId: conv._id,
                roomId, // Backward compatibility
                userId: learnerId,
                name: otherParticipant?.full_name || otherParticipant?.email || "Unknown Student",
                avatar: otherParticipant?.profile?.avatar || "https://via.placeholder.com/40",
                isOnline: !!learnerInfo,
                lastSeen: learnerInfo?.lastSeen || null,
                lastMessage: lastMessage
                  ? {
                      text: lastMessage.message || lastMessage.content,
                      timestamp: lastMessage.timestamp,
                      isRead: lastMessage.isRead,
                    }
                  : null,
                unreadCount,
              };
            })
          );

          // Filter out null entries
          const validChats = chatList.filter(chat => chat !== null);

          console.log(`✅ get_tutor_chats: Found ${validChats.length} conversations for tutor ${tutorIdStr}`);
          socket.emit("tutor_chats", { chats: validChats });
          socket.emit("chat_list", { chats: validChats });
        } catch (error) {
          console.error("❌ Error getting tutor chats:", error);
          socket.emit("error", { message: "Failed to get tutor chats" });
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
