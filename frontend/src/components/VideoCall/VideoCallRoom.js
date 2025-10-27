import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useWebRTC from '../../hooks/useWebRTC';
import BookingService from '../../services/BookingService';
import './VideoCallRoom.scss';

const VideoCallRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [chatMessage, setChatMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const chatEndRef = useRef(null);

  const {
    isConnected,
    isConnecting,
    error,
    localStream,
    remoteStream,
    localVideoRef,
    remoteVideoRef,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    chatMessages,
    sendChatMessage,
    roomInfo,
    participants,
    startCall,
    leaveRoom
  } = useWebRTC(roomId, token);

  // Get room token on mount
  useEffect(() => {
    const getRoomToken = async () => {
      try {
        setIsLoading(true);
        
        // Get token from URL params first
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        
        if (urlToken) {
          setToken(urlToken);
          setIsLoading(false);
          return;
        }

        // If no token in URL, try to get from booking
        try {
          const response = await BookingService.getRoomToken(roomId);
          setToken(response.token);
          setRoomData(response);
          
          // Redirect to room with token
          navigate(`/room/${roomId}?token=${response.token}`, { replace: true });
        } catch (bookingError) {
          // If booking token fails, allow direct room access (for demo purposes)
          console.warn('Could not get booking token, allowing direct room access:', bookingError);
          toast.info('Đang kết nối trực tiếp đến phòng học...');
          setToken('direct-access'); // Use a placeholder token for direct access
          setIsLoading(false);
        }
        
      } catch (error) {
        console.error('Error getting room token:', error);
        toast.error('Không thể truy cập phòng học');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    if (roomId) {
      getRoomToken();
    }
  }, [roomId, navigate]);

  // Timer countdown
  useEffect(() => {
    if (!roomData) return;

    const updateTimer = () => {
      const now = new Date();
      const endTime = new Date(roomData.endTime);
      const remaining = Math.max(0, endTime - now);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [roomData]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Format time remaining
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

  // Handle chat message send
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      sendChatMessage(chatMessage.trim());
      setChatMessage('');
    }
  };

  // Handle leave room
  const handleLeaveRoom = () => {
    if (window.confirm('Bạn có chắc muốn rời khỏi phòng học?')) {
      leaveRoom();
      navigate('/bookings/me');
    }
  };

  if (isLoading) {
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
          <button className="btn btn-primary" onClick={() => navigate('/bookings/me')}>
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
            <span className={timeRemaining < 300000 ? 'warning' : ''}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>
        
        <div className="connection-status">
          {isConnecting && (
            <span className="status connecting">
              <i className="fas fa-spinner fa-spin"></i>
              Đang kết nối...
            </span>
          )}
          {isConnected && (
            <span className="status connected">
              <i className="fas fa-circle"></i>
              Đã kết nối
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
              {!isVideoEnabled && (
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
            className={`control-btn ${isScreenSharing ? 'active' : ''}`}
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
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
            {chatMessages.length > 0 && (
              <span className="notification-badge">{chatMessages.length}</span>
            )}
          </button>

          <button
            className="control-btn"
            onClick={() => setShowParticipants(!showParticipants)}
            title="Người tham gia"
          >
            <i className="fas fa-users"></i>
            <span className="participant-count">{participants.length}</span>
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
            onClick={handleLeaveRoom}
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
            <div ref={chatEndRef} />
          </div>
          
          <form className="chat-input" onSubmit={handleSendMessage}>
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

      {/* Participants sidebar */}
      {showParticipants && (
        <div className="participants-sidebar">
          <div className="participants-header">
            <h5>Người tham gia ({participants.length})</h5>
            <button onClick={() => setShowParticipants(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="participants-list">
            {participants.map((participant) => (
              <div key={participant} className="participant-item">
                <div className="participant-avatar">
                  <i className="fas fa-user"></i>
                </div>
                <div className="participant-info">
                  <span className="participant-name">
                    {participant === roomInfo?.tutorId ? 'Gia sư' : 'Học viên'}
                  </span>
                  <span className="participant-status">
                    <i className="fas fa-circle"></i>
                    Đang tham gia
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCallRoom;
