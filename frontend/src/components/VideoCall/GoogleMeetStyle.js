import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import './GoogleMeetStyle.scss';

const GoogleMeetStyle = () => {
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [participants, setParticipants] = useState(['Bạn']);
  const [timeRemaining, setTimeRemaining] = useState(3600000);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [meetingInfo, setMeetingInfo] = useState({
    title: 'Phòng học EduMatch',
    duration: '1 giờ',
    participants: 1
  });
  const [recordingStatus, setRecordingStatus] = useState('stopped');
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [backgroundBlur, setBackgroundBlur] = useState(false);
  const [virtualBackground, setVirtualBackground] = useState(null);
  const [isLocalVideoExpanded, setIsLocalVideoExpanded] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const socketRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Check current permissions
  const checkPermissions = async () => {
    try {
      if (navigator.permissions) {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' });
        const microphonePermission = await navigator.permissions.query({ name: 'microphone' });
        
        console.log('Camera permission:', cameraPermission.state);
        console.log('Microphone permission:', microphonePermission.state);
        
        return {
          camera: cameraPermission.state,
          microphone: microphonePermission.state
        };
      }
    } catch (error) {
      console.warn('Could not check permissions:', error);
    }
    return null;
  };

  // Reset permissions by reloading the page
  const resetPermissions = () => {
    // Clear any stored permission data
    localStorage.removeItem('cameraPermission');
    localStorage.removeItem('microphonePermission');
    
    // Reload the page to reset permissions
    window.location.reload();
  };

  // Initialize local media stream
  const initializeLocalStream = async () => {
    try {
      // Check if media devices are available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices not supported');
      }

      // Check if we're on HTTPS or localhost
      const isSecureContext = window.isSecureContext || 
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1';

      if (!isSecureContext) {
        throw new Error('Secure context required for camera/microphone access');
      }

      // Check current permissions first
      const permissions = await checkPermissions();
      if (permissions) {
        console.log('Current permissions:', permissions);
      }

      // Try with basic constraints first (most compatible)
      let stream;
      try {
        console.log('Attempting to get media stream with basic constraints...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        console.log('✅ Basic constraints successful');
      } catch (basicError) {
        console.warn('Basic constraints failed:', basicError);
        
        // Try with advanced constraints as fallback
        try {
          console.log('Trying advanced constraints...');
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user'
            },
            audio: { 
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          console.log('✅ Advanced constraints successful');
        } catch (advancedError) {
          console.error('Both basic and advanced constraints failed');
          throw basicError; // Throw the original error
        }
      }
      
      localStreamRef.current = stream;
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      console.log('✅ Local stream initialized successfully');
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('❌ Error accessing media devices:', error);
      
      let errorMessage = 'Không thể truy cập camera/microphone';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Quyền truy cập camera/microphone đã bị từ chối. Vui lòng reset quyền và thử lại.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Không tìm thấy camera/microphone. Vui lòng kiểm tra thiết bị.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera/microphone đang được sử dụng bởi ứng dụng khác.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Thiết bị không hỗ trợ cài đặt camera/microphone yêu cầu.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Lỗi bảo mật khi truy cập camera/microphone. Vui lòng sử dụng HTTPS hoặc localhost.';
      } else if (error.name === 'TypeError') {
        errorMessage = 'Trình duyệt không hỗ trợ truy cập camera/microphone.';
      } else if (error.message === 'Secure context required for camera/microphone access') {
        errorMessage = 'Cần kết nối an toàn (HTTPS) để truy cập camera/microphone. Vui lòng sử dụng HTTPS hoặc localhost.';
      }
      
      setError(errorMessage);
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

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    peerConnection.ontrack = (event) => {
      console.log('📹 Received remote stream');
      const [remoteStream] = event.streams;
      setRemoteStream(remoteStream);
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log('🧊 Sending ICE candidate');
        socketRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          data: { candidate: event.candidate }
        }));
      }
    };

    return peerConnection;
  };

  // Connect to socket
  const connectSocket = () => {
    try {
      // Use Socket.io client instead of raw WebSocket
      const socket = io('http://localhost:5000/webrtc', {
        transports: ['websocket', 'polling']
      });
      
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('🔌 Connected to WebRTC server');
        setIsConnected(true);
        setIsConnecting(false);
        
        // Join room directly
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

      socket.on('room-joined-direct', (data) => {
        console.log('✅ Joined room successfully:', data);
        setParticipants(prev => [...prev, 'Người tham gia mới']);
      });

      socket.on('user-joined', (data) => {
        console.log('👤 User joined:', data);
        setParticipants(prev => [...prev, 'Người tham gia mới']);
      });

      socket.on('user-left', (data) => {
        console.log('👤 User left:', data);
        setParticipants(prev => prev.slice(0, -1));
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
        // Bỏ thông báo toast
      });

      socket.on('screen-share-stop', (data) => {
        console.log('🖥️ Screen sharing stopped by:', data.from);
        // Bỏ thông báo toast
      });

    } catch (error) {
      console.error('❌ Failed to connect:', error);
      setError('Không thể kết nối đến phòng học');
      setIsConnecting(false);
    }
  };

  // Start call
  const startCall = async () => {
    try {
      if (!peerConnectionRef.current) {
        createPeerConnection();
      }
      
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      if (socketRef.current) {
        socketRef.current.emit('offer', { offer });
      }
      
      console.log('📤 Sent offer');
      // Bỏ thông báo toast
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error('Không thể bắt đầu cuộc gọi');
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

  // Screen sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            mediaSource: 'screen',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: true
        });
        
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);
        
        if (peerConnectionRef.current) {
          const videoTrack = screenStream.getVideoTracks()[0];
          const sender = peerConnectionRef.current.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        }
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        // Notify other participants
        if (socketRef.current) {
          socketRef.current.emit('screen-share-start', { from: 'user' });
        }
        
        // Handle screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };
        
        console.log('🖥️ Screen sharing started');
        // Bỏ thông báo toast
        
      } catch (error) {
        console.error('Error starting screen share:', error);
        if (error.name === 'NotAllowedError') {
          toast.error('Bạn đã từ chối chia sẻ màn hình');
        } else {
          toast.error('Không thể bắt đầu chia sẻ màn hình');
        }
      }
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
      
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
        socketRef.current.emit('screen-share-stop', { from: 'user' });
      }
      
      console.log('🖥️ Screen sharing stopped');
      // Bỏ thông báo toast
    }
  };

  // Chat functions
  const sendChatMessage = (e) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      const message = {
        id: Date.now(),
        message: chatMessage.trim(),
        timestamp: new Date(),
        sender: 'Bạn',
        userId: 'user'
      };
      
      setChatMessages(prev => [...prev, message]);
      setChatMessage('');
      
      // Send to other participants
      if (socketRef.current) {
        socketRef.current.emit('chat-message', message);
      }
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

  // Show/hide controls
  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  // Mouse movement handler
  const handleMouseMove = () => {
    showControlsTemporarily();
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // New functions for enhanced features
  const toggleRecording = () => {
    if (recordingStatus === 'stopped') {
      setRecordingStatus('recording');
      // Bỏ thông báo toast
    } else {
      setRecordingStatus('stopped');
      // Bỏ thông báo toast
    }
  };

  const toggleHandRaise = () => {
    setIsHandRaised(!isHandRaised);
    if (!isHandRaised) {
      // Bỏ thông báo toast
    }
  };

  const toggleBackgroundBlur = () => {
    setBackgroundBlur(!backgroundBlur);
    // Bỏ thông báo toast
  };

  const changeVirtualBackground = (background) => {
    setVirtualBackground(background);
    // Bỏ thông báo toast
  };

  const toggleLocalVideoExpanded = () => {
    setIsLocalVideoExpanded(!isLocalVideoExpanded);
    // Bỏ thông báo toast để giao diện sạch hơn
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' && e.ctrlKey) {
        e.preventDefault();
        toggleAudio();
      } else if (e.code === 'KeyV' && e.ctrlKey) {
        e.preventDefault();
        toggleVideo();
      } else if (e.code === 'KeyS' && e.ctrlKey) {
        e.preventDefault();
        toggleScreenShare();
      } else if (e.code === 'KeyC' && e.ctrlKey) {
        e.preventDefault();
        setIsChatOpen(!isChatOpen);
      } else if (e.code === 'KeyF' && e.ctrlKey) {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === 'KeyR' && e.ctrlKey) {
        e.preventDefault();
        toggleRecording();
      } else if (e.code === 'KeyH' && e.ctrlKey) {
        e.preventDefault();
        toggleHandRaise();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isChatOpen]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          toast.warning('Phiên học đã kết thúc');
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (roomId) {
      setIsConnecting(true);
      initializeLocalStream().then(() => {
        connectSocket();
      });
    }

    // Show keyboard shortcuts info
    // Bỏ thông báo mẹo dài

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
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [roomId]);

  if (isConnecting) {
    return (
      <div className="meet-loading">
        <div className="loading-spinner"></div>
        <h2>Đang kết nối...</h2>
        <p>Vui lòng chờ trong giây lát</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="meet-error">
        <div className="error-icon">⚠️</div>
        <h2>Không thể kết nối</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button className="retry-btn" onClick={() => {
            setError(null);
            setIsConnecting(true);
            initializeLocalStream().finally(() => setIsConnecting(false));
          }}>
            <i className="fas fa-redo"></i>
            Thử lại
          </button>
          <button className="permission-btn" onClick={async () => {
            try {
              // Try to request permissions with basic constraints
              const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
              });
              
              // Stop the stream immediately as we just wanted to test permissions
              stream.getTracks().forEach(track => track.stop());
              
              // If successful, try to initialize properly
              setError(null);
              setIsConnecting(true);
              await initializeLocalStream();
            } catch (permissionError) {
              console.error('Permission test failed:', permissionError);
              toast.error('Vui lòng cấp quyền truy cập camera/microphone trong cài đặt trình duyệt');
            } finally {
              setIsConnecting(false);
            }
          }}>
            <i className="fas fa-cog"></i>
            Cấp quyền
          </button>
          <button className="continue-btn" onClick={() => {
            setError(null);
            setIsConnecting(false);
            // Continue without camera/mic
            toast.info('Tiếp tục mà không có camera/microphone');
          }}>
            <i className="fas fa-play"></i>
            Tiếp tục
          </button>
          <button className="settings-btn" onClick={() => {
            // Open browser settings
            if (navigator.userAgent.includes('Chrome')) {
              window.open('chrome://settings/content/camera', '_blank');
            } else if (navigator.userAgent.includes('Firefox')) {
              window.open('about:preferences#privacy', '_blank');
            } else if (navigator.userAgent.includes('Safari')) {
              window.open('x-apple.systempreferences:com.apple.preference.security?Privacy_Camera', '_blank');
            } else {
              toast.info('Vui lòng mở cài đặt trình duyệt và tìm phần Camera/Microphone');
            }
          }}>
            <i className="fas fa-external-link-alt"></i>
            Mở cài đặt
          </button>
          <button className="reset-btn" onClick={() => {
            if (window.confirm('Bạn có chắc muốn reset quyền truy cập? Trang sẽ được tải lại.')) {
              resetPermissions();
            }
          }}>
            <i className="fas fa-undo"></i>
            Reset quyền
          </button>
        </div>
        <div className="error-help">
          <h4>Hướng dẫn khắc phục:</h4>
          <ul>
            <li><strong>Reset quyền:</strong> Nhấn nút "Reset quyền" để xóa quyền cũ và yêu cầu lại</li>
            <li>Kiểm tra camera/microphone có được kết nối không</li>
            <li>Đảm bảo không có ứng dụng nào khác đang sử dụng camera/microphone</li>
            <li>Cấp quyền truy cập camera/microphone cho trình duyệt</li>
            <li>Đảm bảo đang sử dụng HTTPS hoặc localhost (không phải IP)</li>
            <li>Thử refresh trang hoặc khởi động lại trình duyệt</li>
            <li>Kiểm tra cài đặt bảo mật của trình duyệt</li>
            <li><strong>Lưu ý:</strong> Nếu đã từ chối quyền trước đó, cần reset quyền để có thể cấp lại</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`meet-container ${isFullscreen ? 'fullscreen' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Main video area */}
      <div className="main-video-area">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted={false}
            className="main-video"
          />
        ) : (
          <div className="waiting-screen">
            <div className="waiting-icon">👥</div>
            <h2>Đang chờ người tham gia...</h2>
            <p>Chia sẻ link phòng học với người khác để bắt đầu</p>
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        <div 
          className={`local-video-container ${isLocalVideoExpanded ? 'expanded' : ''}`}
          onClick={toggleLocalVideoExpanded}
          title={isLocalVideoExpanded ? 'Click để thu nhỏ' : 'Click để phóng to'}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted={true}
            className="local-video"
          />
          <div className="local-video-overlay">
            {isScreenSharing && (
              <div className="screen-share-badge">
                <i className="fas fa-desktop"></i>
                <span>Đang chia sẻ màn hình</span>
              </div>
            )}
            <div className="expand-indicator">
              <i className={`fas ${isLocalVideoExpanded ? 'fa-compress' : 'fa-expand'}`}></i>
            </div>
          </div>
        </div>

        {/* Meeting info */}
        <div className="meeting-info">
          <div className="meeting-time">
            <i className="fas fa-clock"></i>
            <span>{formatTime(timeRemaining)}</span>
          </div>
          <div className="meeting-id">
            <i className="fas fa-link"></i>
            <span>Phòng: {roomId}</span>
          </div>
          {recordingStatus === 'recording' && (
            <div className="recording-indicator">
              <div className="recording-dot"></div>
              <span>Đang ghi âm</span>
            </div>
          )}
          {isHandRaised && (
            <div className="hand-raised-indicator">
              <i className="fas fa-hand-paper"></i>
              <span>Đã giơ tay</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className={`bottom-controls ${showControls ? 'show' : 'hide'}`}>
        <div className="controls-left">
          <div className="meeting-info-mobile">
            <span className="meeting-time">{formatTime(timeRemaining)}</span>
            <span className="meeting-id">Phòng: {roomId}</span>
          </div>
        </div>

        <div className="controls-center">
          <button
            className={`control-btn mic-btn ${isAudioEnabled ? 'enabled' : 'disabled'}`}
            onClick={toggleAudio}
            title={`${isAudioEnabled ? 'Tắt mic' : 'Bật mic'} (Ctrl+Space)`}
          >
            <i className={`fas ${isAudioEnabled ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
          </button>

          <button
            className={`control-btn video-btn ${isVideoEnabled ? 'enabled' : 'disabled'}`}
            onClick={toggleVideo}
            title={`${isVideoEnabled ? 'Tắt camera' : 'Bật camera'} (Ctrl+V)`}
          >
            <i className={`fas ${isVideoEnabled ? 'fa-video' : 'fa-video-slash'}`}></i>
          </button>

          <button
            className={`control-btn screen-btn ${isScreenSharing ? 'active' : ''}`}
            onClick={toggleScreenShare}
            title={`${isScreenSharing ? 'Dừng chia sẻ màn hình' : 'Chia sẻ màn hình'} (Ctrl+S)`}
          >
            <i className="fas fa-desktop"></i>
          </button>

          <button
            className="control-btn participants-btn"
            onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
            title="Người tham gia"
          >
            <i className="fas fa-users"></i>
            <span className="participant-count">{participants.length}</span>
          </button>

          <button
            className="control-btn chat-btn"
            onClick={() => setIsChatOpen(!isChatOpen)}
            title="Chat (Ctrl+C)"
          >
            <i className="fas fa-comment"></i>
          </button>

          <button
            className="control-btn fullscreen-btn"
            onClick={toggleFullscreen}
            title="Toàn màn hình (Ctrl+F)"
          >
            <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
          </button>

          <button
            className={`control-btn recording-btn ${recordingStatus === 'recording' ? 'recording' : ''}`}
            onClick={toggleRecording}
            title="Ghi âm (Ctrl+R)"
          >
            <i className="fas fa-circle"></i>
          </button>

          <button
            className={`control-btn hand-raise-btn ${isHandRaised ? 'raised' : ''}`}
            onClick={toggleHandRaise}
            title="Giơ tay (Ctrl+H)"
          >
            <i className="fas fa-hand-paper"></i>
          </button>

          <button
            className="control-btn background-btn"
            onClick={toggleBackgroundBlur}
            title="Làm mờ nền"
          >
            <i className="fas fa-blur"></i>
          </button>
        </div>

        <div className="controls-right">
          <button
            className="control-btn end-call-btn"
            onClick={() => navigate('/')}
            title="Rời khỏi cuộc gọi"
          >
            <i className="fas fa-phone-slash"></i>
          </button>
        </div>
      </div>

      {/* Chat sidebar */}
      {isChatOpen && (
        <div className="chat-sidebar">
          <div className="chat-header">
            <h3>Chat</h3>
            <button 
              className="close-btn"
              onClick={() => setIsChatOpen(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="chat-messages">
            {chatMessages.map((message) => (
              <div key={message.id} className="chat-message">
                <div className="message-sender">{message.sender}</div>
                <div className="message-content">{message.message}</div>
                <div className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString()}
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
              autoFocus
            />
            <button type="submit" disabled={!chatMessage.trim()}>
              <i className="fas fa-paper-plane"></i>
            </button>
          </form>
        </div>
      )}

      {/* Participants sidebar */}
      {isParticipantsOpen && (
        <div className="participants-sidebar">
          <div className="participants-header">
            <h3>Người tham gia ({participants.length})</h3>
            <button 
              className="close-btn"
              onClick={() => setIsParticipantsOpen(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="participants-list">
            {participants.map((participant, index) => (
              <div key={index} className="participant-item">
                <div className="participant-avatar">
                  <i className="fas fa-user"></i>
                </div>
                <div className="participant-info">
                  <span className="participant-name">{participant}</span>
                  <span className="participant-status">Đang tham gia</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMeetStyle;
