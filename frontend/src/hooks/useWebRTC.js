import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const useWebRTC = (roomId, token) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);
  const [participants, setParticipants] = useState([]);

  // Refs
  const socketRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  // ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ]
  };

  // Setup socket event handlers
  const setupSocketEventHandlers = useCallback((socket) => {
    socket.on('room-joined', (data) => {
      console.log('✅ Joined room:', data);
      setRoomInfo(data.roomInfo);
      setParticipants(data.roomInfo.participants);
      setChatMessages(data.roomInfo.chatHistory || []);
    });

    socket.on('user-joined', (data) => {
      console.log('👤 User joined:', data);
      setParticipants(data.roomInfo.participants);
    });

    socket.on('user-left', (data) => {
      console.log('👤 User left:', data);
      setParticipants(data.roomInfo?.participants || []);
    });

    // WebRTC signaling
    socket.on('offer', async (data) => {
      console.log('📤 Received offer from:', data.from);
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(data.offer);
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          socket.emit('answer', { answer });
        }
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    socket.on('answer', async (data) => {
      console.log('📤 Received answer from:', data.from);
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(data.answer);
        }
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    });

    socket.on('ice-candidate', async (data) => {
      console.log('🧊 Received ICE candidate from:', data.from);
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(data.candidate);
        }
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    });

    // Chat messages
    socket.on('chat-message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    // Screen sharing
    socket.on('screen-share-start', (data) => {
      console.log('🖥️ Screen sharing started by:', data.from);
    });

    socket.on('screen-share-stop', (data) => {
      console.log('🖥️ Screen sharing stopped by:', data.from);
    });

    // Media controls
    socket.on('user-audio-toggle', (data) => {
      console.log('🔇 Audio toggled by:', data.userId, data.enabled);
    });

    socket.on('user-video-toggle', (data) => {
      console.log('📹 Video toggled by:', data.userId, data.enabled);
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      setError(error.message);
    });
  }, []);

  // Initialize socket connection
  const connectSocket = useCallback(() => {
    if (!roomId || !token) return;

    setIsConnecting(true);
    setError(null);

    // Handle direct access (demo mode)
    if (token === 'direct-access') {
      console.log('🔓 Direct access mode - connecting without authentication');
      const socket = io(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/webrtc`, {
        transports: ['websocket', 'polling']
      });
      
      socketRef.current = socket;
      
      socket.on('connect', () => {
        console.log('🔌 Connected to WebRTC server (direct access)');
        setIsConnected(true);
        setIsConnecting(false);
        // For direct access, we'll join room without authentication
        socket.emit('join-room-direct', { roomId });
      });
      
      socket.on('disconnect', () => {
        console.log('🔌 Disconnected from WebRTC server');
        setIsConnected(false);
      });
      
      socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
        setError('Không thể kết nối đến phòng học');
        setIsConnecting(false);
      });
      
      // Handle direct room join response
      socket.on('room-joined-direct', (data) => {
        console.log('✅ Joined room (direct access):', data);
        setRoomInfo({ participants: [data.userId], status: 'active' });
        setParticipants([data.userId]);
      });
      
      // Set up other event handlers for direct access
      setupSocketEventHandlers(socket);
      return;
    }

    // Normal authenticated connection
    const socket = io(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/webrtc`, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Connected to WebRTC server');
      setIsConnected(true);
      setIsConnecting(false);
      socket.emit('join-room');
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebRTC server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      setError(error.message);
      setIsConnecting(false);
    });

    // Set up event handlers
    setupSocketEventHandlers(socket);

  }, [roomId, token]);

  // Initialize local media stream
  const initializeLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      console.log('✅ Local stream initialized');
    } catch (error) {
      console.error('❌ Error accessing media devices:', error);
      setError('Không thể truy cập camera/microphone');
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    const peerConnection = new RTCPeerConnection(iceServers);
    peerConnectionRef.current = peerConnection;

    // Add local stream to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('📹 Received remote stream');
      const [remoteStream] = event.streams;
      setRemoteStream(remoteStream);
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log('🧊 Sending ICE candidate');
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', peerConnection.connectionState);
    };

    return peerConnection;
  }, []);


  // Start call (create offer)
  const startCall = useCallback(async () => {
    try {
      const peerConnection = createPeerConnection();
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      socketRef.current.emit('offer', { offer });
      console.log('📤 Sent offer');
    } catch (error) {
      console.error('Error starting call:', error);
    }
  }, [createPeerConnection]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        
        socketRef.current?.emit('toggle-audio', { enabled: audioTrack.enabled });
      }
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        
        socketRef.current?.emit('toggle-video', { enabled: videoTrack.enabled });
      }
    }
  }, []);

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);
      
      // Replace video track in peer connection
      if (peerConnectionRef.current) {
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      }
      
      // Update local video display
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }
      
      socketRef.current?.emit('screen-share-start');
      
      // Handle screen share end
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
      
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  }, []);

  // Stop screen sharing
  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
      
      // Restore camera
      if (localStreamRef.current) {
        if (peerConnectionRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0];
          const sender = peerConnectionRef.current.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        }
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }
      
      socketRef.current?.emit('screen-share-stop');
    }
  }, []);

  // Send chat message
  const sendChatMessage = useCallback((message, type = 'text') => {
    if (socketRef.current && message.trim()) {
      socketRef.current.emit('chat-message', { message, type });
    }
  }, []);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    setIsConnected(false);
    setLocalStream(null);
    setRemoteStream(null);
    setChatMessages([]);
    setRoomInfo(null);
    setParticipants([]);
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (roomId && token) {
      initializeLocalStream().then(() => {
        connectSocket();
      });
    }

    return () => {
      leaveRoom();
    };
  }, [roomId, token, initializeLocalStream, connectSocket, leaveRoom]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    error,
    
    // Media streams
    localStream,
    remoteStream,
    localVideoRef,
    remoteVideoRef,
    
    // Media controls
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    
    // Chat
    chatMessages,
    sendChatMessage,
    
    // Room info
    roomInfo,
    participants,
    
    // Actions
    startCall,
    leaveRoom
  };
};

export default useWebRTC;
