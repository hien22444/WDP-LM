import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './VideoCallRoom.scss';

const SimpleVideoCall = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(3600000); // 1 hour default

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize local media stream
  const initializeLocalStream = async () => {
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
  };

  // Create peer connection
  const createPeerConnection = () => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ]
    });

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

    return peerConnection;
  };

  // Connect to socket
  const connectSocket = () => {
    try {
      const socket = new WebSocket('ws://localhost:5000/socket.io/?EIO=4&transport=websocket');
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('🔌 Connected to WebRTC server');
        setIsConnected(true);
        setIsConnecting(false);
        
        // Join room
        socket.send(JSON.stringify({
          type: 'join-room-direct',
          data: { roomId }
        }));
      };

      socket.onclose = () => {
        console.log('🔌 Disconnected from WebRTC server');
        setIsConnected(false);
      };

      socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('Không thể kết nối đến phòng học');
        setIsConnecting(false);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Received message:', data);
          
          if (data.type === 'room-joined-direct') {
            console.log('✅ Joined room successfully');
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

    } catch (error) {
      console.error('❌ Failed to connect:', error);
      setError('Không thể kết nối đến phòng học');
      setIsConnecting(false);
    }
  };

  // Start call
  const startCall = async () => {
    try {
      const peerConnection = createPeerConnection();
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      if (socketRef.current) {
        socketRef.current.send(JSON.stringify({
          type: 'offer',
          data: { offer }
        }));
      }
      
      console.log('📤 Sent offer');
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Start screen sharing
  const startScreenShare = async () => {
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
      
      // Notify other participants
      if (socketRef.current) {
        socketRef.current.send(JSON.stringify({
          type: 'screen-share-start',
          data: { from: 'user' }
        }));
      }
      
      // Handle screen share end
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
      
      console.log('🖥️ Screen sharing started');
      
    } catch (error) {
      console.error('Error starting screen share:', error);
      toast.error('Không thể bắt đầu chia sẻ màn hình');
    }
  };

  // Stop screen sharing
  const stopScreenShare = () => {
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
      
      // Notify other participants
      if (socketRef.current) {
        socketRef.current.send(JSON.stringify({
          type: 'screen-share-stop',
          data: { from: 'user' }
        }));
      }
      
      console.log('🖥️ Screen sharing stopped');
    }
  };

  // Toggle screen sharing
  const toggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  // Send chat message
  const sendChatMessage = (e) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      const message = {
        id: Date.now(),
        message: chatMessage.trim(),
        timestamp: new Date(),
        role: 'user'
      };
      setChatMessages(prev => [...prev, message]);
      setChatMessage('');
    }
  };

  // Format time
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Initialize on mount
  useEffect(() => {
    if (roomId) {
      setIsConnecting(true);
      initializeLocalStream().then(() => {
        connectSocket();
      });
    }

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [roomId]);

  if (isConnecting) {
    return (
      <div className="video-call-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
        <p>Đang kết nối đến phòng học...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="video-call-error">
        <div className="error-content">
          <i className="fas fa-exclamation-triangle"></i>
          <h3>Lỗi kết nối</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-call-room">
      {/* Header */}
      <div className="video-call-header">
        <div className="room-info">
          <h4>Phòng học: {roomId}</h4>
          <div className="timer">
            <i className="fas fa-clock"></i>
            <span>{formatTime(timeRemaining)}</span>
          </div>
        </div>
        
        <div className="connection-status">
          {isConnected ? (
            <span className="status connected">
              <i className="fas fa-circle"></i>
              Đã kết nối
            </span>
          ) : (
            <span className="status connecting">
              <i className="fas fa-spinner fa-spin"></i>
              Đang kết nối...
            </span>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="video-call-content">
        {/* Video grid */}
        <div className="video-grid">
          {/* Remote video */}
          <div className="video-container remote-video">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={false}
              className="video-element"
            />
            {!remoteStream && (
              <div className="video-placeholder">
                <i className="fas fa-user"></i>
                <p>Đang chờ người tham gia...</p>
              </div>
            )}
          </div>

          {/* Local video */}
          <div className="video-container local-video">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted={true}
              className="video-element"
            />
            <div className="video-overlay">
              <span className="video-label">Bạn</span>
              {isScreenSharing && (
                <div className="screen-share-indicator">
                  <i className="fas fa-desktop"></i>
                  <span>Đang chia sẻ màn hình</span>
                </div>
              )}
              {!isVideoEnabled && !isScreenSharing && (
                <div className="video-disabled">
                  <i className="fas fa-video-slash"></i>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="video-controls">
          <button
            className={`control-btn ${isAudioEnabled ? 'active' : 'disabled'}`}
            onClick={toggleAudio}
            title={isAudioEnabled ? 'Tắt mic' : 'Bật mic'}
          >
            <i className={`fas ${isAudioEnabled ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
          </button>

          <button
            className={`control-btn ${isVideoEnabled ? 'active' : 'disabled'}`}
            onClick={toggleVideo}
            title={isVideoEnabled ? 'Tắt camera' : 'Bật camera'}
          >
            <i className={`fas ${isVideoEnabled ? 'fa-video' : 'fa-video-slash'}`}></i>
          </button>

          <button
            className={`control-btn screen-share ${isScreenSharing ? 'active' : ''}`}
            onClick={toggleScreenShare}
            title={isScreenSharing ? 'Dừng chia sẻ màn hình' : 'Chia sẻ màn hình'}
          >
            <i className="fas fa-desktop"></i>
          </button>

          <button
            className="control-btn"
            onClick={() => setShowChat(!showChat)}
            title="Chat"
          >
            <i className="fas fa-comments"></i>
          </button>

          <button
            className="control-btn start-call"
            onClick={startCall}
            title="Bắt đầu cuộc gọi"
          >
            <i className="fas fa-phone"></i>
          </button>

          <button
            className="control-btn leave"
            onClick={() => navigate('/')}
            title="Rời khỏi phòng"
          >
            <i className="fas fa-phone-slash"></i>
          </button>
        </div>
      </div>

      {/* Chat sidebar */}
      {showChat && (
        <div className="chat-sidebar">
          <div className="chat-header">
            <h5>Chat</h5>
            <button onClick={() => setShowChat(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="chat-messages">
            {chatMessages.map((message) => (
              <div key={message.id} className={`chat-message ${message.role}`}>
                <div className="message-content">
                  <span className="message-text">{message.message}</span>
                  <span className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <form className="chat-input" onSubmit={sendChatMessage}>
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              maxLength={500}
            />
            <button type="submit" disabled={!chatMessage.trim()}>
              <i className="fas fa-paper-plane"></i>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default SimpleVideoCall;
