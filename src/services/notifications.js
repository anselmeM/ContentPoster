// Notification Service
// Handles push notifications, email reminders, in-app alerts, and Slack integration

import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  where, 
  getDocs,
  updateDoc,
  doc
} from 'firebase/firestore';

// Notification types
export const NOTIFICATION_TYPES = {
  POST_PUBLISHED: 'post_published',
  POST_SCHEDULED: 'post_scheduled',
  POST_FAILED: 'post_failed',
  POST_APPROVED: 'post_approved',
  POST_REJECTED: 'post_rejected',
  COMMENT_ADDED: 'comment_added',
  MEMBER_ADDED: 'member_added',
  WORKSPACE_INVITE: 'workspace_invite',
  SCHEDULE_REMINDER: 'schedule_reminder',
  DAILY_SUMMARY: 'daily_summary',
  WEEKLY_SUMMARY: 'weekly_summary',
  SYSTEM_ALERT: 'system_alert'
};

// Get notifications collection reference
const getNotificationsRef = (userId) => 
  collection(db, 'artifacts', import.meta.env.VITE_APP_ID || 'content-cadence-app', 'users', userId, 'notifications');

// Notification Service
export const notificationService = {
  // Create a notification
  create: async (userId, type, title, message, data = {}) => {
    try {
      const notification = {
        type,
        title,
        message,
        data,
        read: false,
        userId,
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
      };
      
      const notificationsRef = getNotificationsRef(userId);
      const docRef = await addDoc(notificationsRef, notification);
      
      // Also trigger in-app toast for immediate feedback
      toastService.show({
        type: mapTypeToToast(type),
        title,
        message,
        duration: 5000
      });
      
      // Trigger push notification if enabled
      if (pushService.isEnabled()) {
        await pushService.send({ title, message, data });
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  },
  
  // Get user's notifications
  getNotifications: async (userId, options = {}) => {
    const { unreadOnly = false, maxResults = 20 } = options;
    
    try {
      const notificationsRef = getNotificationsRef(userId);
      let constraints = [orderBy('timestamp', 'desc'), limit(maxResults)];
      
      if (unreadOnly) {
        constraints.unshift(where('read', '==', false));
      }
      
      const q = query(notificationsRef, ...constraints);
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: new Date(doc.data().timestamp)
      }));
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return [];
    }
  },
  
  // Mark notification as read
  markAsRead: async (userId, notificationId) => {
    try {
      const notificationRef = doc(db, 'artifacts', import.meta.env.VITE_APP_ID || 'content-cadence-app', 'users', userId, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  },
  
  // Mark all as read
  markAllAsRead: async (userId) => {
    try {
      const notifications = await notificationService.getNotifications(userId, { maxResults: 100 });
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      for (const id of unreadIds) {
        await notificationService.markAsRead(userId, id);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      return false;
    }
  },
  
  // Get unread count
  getUnreadCount: async (userId) => {
    try {
      const notifications = await notificationService.getNotifications(userId, { unreadOnly: true, maxResults: 50 });
      return notifications.length;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  },
  
  // Delete old notifications (cleanup)
  cleanup: async (userId, daysOld = 30) => {
    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    
    try {
      const notifications = await notificationService.getNotifications(userId, { maxResults: 100 });
      // In production, you'd delete old read notifications
      return true;
    } catch (error) {
      console.error('Failed to cleanup notifications:', error);
      return false;
    }
  }
};

// Toast/In-App Alert Service
const toastService = {
  toasts: [],
  listeners: [],
  
  show: function(options) {
    const toast = {
      id: `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: options.type || 'info', // success, error, warning, info
      title: options.title,
      message: options.message,
      duration: options.duration || 5000,
      timestamp: Date.now()
    };
    
    this.toasts.push(toast);
    this.notifyListeners();
    
    // Auto remove after duration
    if (toast.duration > 0) {
      setTimeout(() => this.remove(toast.id), toast.duration);
    }
    
    return toast.id;
  },
  
  remove: function(id) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notifyListeners();
  },
  
  subscribe: function(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  },
  
  notifyListeners: function() {
    this.listeners.forEach(callback => callback(this.toasts));
  },
  
  // Convenience methods
  success: (title, message) => toastService.show({ type: 'success', title, message }),
  error: (title, message) => toastService.show({ type: 'error', title, message }),
  warning: (title, message) => toastService.show({ type: 'warning', title, message }),
  info: (title, message) => toastService.show({ type: 'info', title, message })
};

// Export toast service for direct use
export const toast = toastService;

// Push Notification Service (Browser Notifications API)
const pushService = {
  permission: 'default',
  enabled: false,
  subscription: null,
  
  init: async function() {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }
    
    this.permission = Notification.permission;
    
    if (this.permission === 'granted') {
      this.enabled = true;
    }
    
    return this.enabled;
  },
  
  requestPermission: async function() {
    if (!('Notification' in window)) {
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      this.enabled = permission === 'granted';
      return this.enabled;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  },
  
  isEnabled: function() {
    return this.enabled;
  },
  
  send: async function(options) {
    if (!this.enabled) {
      return false;
    }
    
    try {
      const notification = new Notification(options.title, {
        body: options.message,
        icon: '/icon-512x512.svg',
        badge: '/icon-512x512.svg',
        tag: options.data?.tag || 'content-poster',
        data: options.data,
        vibrate: [200, 100, 200]
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options.onClick) options.onClick();
      };
      
      return true;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  },
  
  // Subscribe to push notifications (for server push)
  subscribe: async function() {
    // In production, this would use the Push API with a service worker
    // For now, we use the Browser Notifications API directly
    return this.requestPermission();
  }
};

// Email Reminder Service
export const emailService = {
  // Schedule an email reminder (would be handled by backend in production)
  scheduleReminder: async (userId, type, scheduleTime, data) => {
    // In production, this would create a scheduled job on the backend
    // For now, store in Firestore for the scheduled function to process
    try {
      const remindersRef = collection(db, 'artifacts', import.meta.env.VITE_APP_ID || 'content-cadence-app', 'users', userId, 'scheduledReminders');
      await addDoc(remindersRef, {
        type,
        scheduledFor: scheduleTime,
        data,
        createdAt: Date.now(),
        status: 'pending'
      });
      return true;
    } catch (error) {
      console.error('Failed to schedule email reminder:', error);
      return false;
    }
  },
  
  // Send daily summary (mock implementation)
  sendDailySummary: async (userId, summaryData) => {
    return notificationService.create(
      userId,
      NOTIFICATION_TYPES.DAILY_SUMMARY,
      'Daily Summary',
      `${summaryData.postsScheduled} posts scheduled, ${summaryData.postsPublished} published today`
    );
  },
  
  // Send weekly summary (mock implementation)
  sendWeeklySummary: async (userId, summaryData) => {
    return notificationService.create(
      userId,
      NOTIFICATION_TYPES.WEEKLY_SUMMARY,
      'Weekly Summary',
      `${summaryData.totalPosts} posts this week, ${summaryData.engagement} total engagement`
    );
  }
};

// Slack Integration Service
export const slackService = {
  webhookUrl: null,
  
  init: function(webhookUrl) {
    this.webhookUrl = webhookUrl;
  },
  
  isConfigured: function() {
    return !!this.webhookUrl || !!localStorage.getItem('slack_webhook');
  },
  
  // Send notification when post is published
  notifyPostPublished: async (postData, channel = null) => {
    if (!this.isConfigured()) {
      console.warn('Slack webhook not configured');
      return false;
    }
    
    const webhook = this.webhookUrl || localStorage.getItem('slack_webhook');
    
    const payload = {
      text: `📢 *New Post Published!*`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${postData.title}* has been published to ${postData.platform}`
          }
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Platform:*\n${postData.platform}` },
            { type: 'mrkdwn', text: `*Time:*\n${new Date().toLocaleString()}` }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `>${postData.content?.substring(0, 100)}...`
          }
        }
      ]
    };
    
    if (channel) {
      payload.channel = channel;
    }
    
    try {
      // In production, this would call your backend which then calls Slack
      // Direct Slack webhooks from client are not recommended for security
      const response = await fetch('/api/slack/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      return response.ok;
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
      return false;
    }
  },
  
  // Test webhook
  testConnection: async () => {
    if (!this.isConfigured()) return false;
    
    try {
      const response = await fetch('/api/slack/test', { method: 'POST' });
      return response.ok;
    } catch {
      return false;
    }
  },
  
  // Configure from settings
  configure: function(webhookUrl) {
    localStorage.setItem('slack_webhook', webhookUrl);
    this.webhookUrl = webhookUrl;
  },
  
  // Disconnect
  disconnect: function() {
    localStorage.removeItem('slack_webhook');
    this.webhookUrl = null;
  }
};

// Initialize services
export const initNotifications = async () => {
  await pushService.init();
  return {
    push: pushService,
    toast: toastService
  };
};

export default {
  notificationService,
  toast,
  pushService,
  emailService,
  slackService,
  NOTIFICATION_TYPES
};