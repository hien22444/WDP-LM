import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useChat } from '../../contexts/ChatContext';
import notificationService from '../../services/NotificationService';
import './NotificationCenter.scss';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const userState = useSelector((state) => state.user);
  const isAuthenticated = userState?.isAuthenticated;
  
  // Get chat notifications from ChatContext
  const { 
    notifications: chatNotifications, 
    unreadCount: chatUnreadCount,
    openChatFromNotification,
    markNotificationAsRead
  } = useChat();

  // Load notifications from API
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadNotifications = async () => {
      try {
        setLoading(true);
        const [notificationsData, unreadData] = await Promise.all([
          notificationService.getNotifications(1, 10),
          notificationService.getUnreadCount()
        ]);
        
        setNotifications(notificationsData.notifications || []);
        setUnreadCount(unreadData.count || 0);
      } catch (error) {
        console.error('Error loading notifications:', error);
        toast.error('Không thể tải thông báo');
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [isAuthenticated]);

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read on server
      if (!notification.read) {
        await notificationService.markAsRead(notification._id);
        
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n._id === notification._id ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Handle action based on type
      if (notification.link) {
        window.location.href = notification.link;
      } else {
        switch (notification.type) {
          case 'booking_created':
            window.location.href = '/bookings/tutor';
            break;
          case 'booking_accepted':
            window.location.href = '/bookings/me';
            break;
          case 'payment_success':
            window.location.href = '/payments';
            break;
          case 'tutor_verification':
            window.location.href = '/profile';
            break;
          case 'admin_tutor_verification':
            // Admin verification removed
            break;
          default:
            break;
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Không thể cập nhật thông báo');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      toast.success('✅ Đã đánh dấu tất cả thông báo là đã đọc');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Không thể đánh dấu tất cả thông báo');
    }
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_created':
        return '📚';
      case 'booking_accepted':
        return '✅';
      case 'booking_rejected':
        return '❌';
      case 'payment_success':
        return '💰';
      case 'payment_failed':
        return '💳';
      case 'tutor_verification':
        return '🎓';
      case 'admin_tutor_verification':
        return '🎓';
      case 'message':
        return '💬';
      default:
        return '🔔';
    }
  };

  // Handle chat notification click
  const handleChatNotificationClick = (notification) => {
    openChatFromNotification(notification);
    setIsOpen(false);
  };

  // Combine all notifications (API + Chat)
  const allNotifications = [
    ...chatNotifications.map(notif => ({
      ...notif,
      _id: notif.id,
      read: notif.isRead,
      type: 'message',
      title: `Tin nhắn từ ${notif.senderName}`,
      message: notif.message,
      createdAt: notif.timestamp,
      isChatNotification: true
    })),
    ...notifications
  ].sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp));

  // Calculate total unread count
  const totalUnreadCount = unreadCount + chatUnreadCount;

  // Debug logs
  console.log('🔔 NotificationCenter Debug:', {
    apiNotifications: notifications.length,
    chatNotifications: chatNotifications.length,
    totalNotifications: allNotifications.length,
    totalUnreadCount,
    chatUnreadCount,
    apiUnreadCount: unreadCount,
    allNotificationsUnread: allNotifications.filter(n => !n.read && !n.isRead).length
  });

  if (!isAuthenticated) return null;

  return (
    <div className="notification-center">
      {/* Notification Bell */}
      <div 
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className="fas fa-bell"></i>
        {totalUnreadCount > 0 && (
          <span className="notification-badge">{totalUnreadCount}</span>
        )}
      </div>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h5>Thông báo</h5>
            {totalUnreadCount > 0 && (
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={markAllAsRead}
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Đang tải thông báo...</p>
              </div>
            ) : allNotifications.length === 0 ? (
              <div className="notification-empty">
                <i className="fas fa-bell-slash"></i>
                <p>Chưa có thông báo nào</p>
              </div>
            ) : (
              allNotifications.map(notification => (
                <div 
                  key={notification._id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => {
                    if (notification.isChatNotification) {
                      handleChatNotificationClick(notification);
                    } else {
                      handleNotificationClick(notification);
                    }
                  }}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                      {!notification.read && <span className="unread-dot"></span>}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {formatTime(notification.createdAt || notification.timestamp)}
                    </div>
                  </div>
                  <div className="notification-action">
                    <i className="fas fa-chevron-right"></i>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="notification-footer">
            <a href="/notifications" className="btn btn-link">
              Xem tất cả thông báo
            </a>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="notification-backdrop"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationCenter;
