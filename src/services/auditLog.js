// Audit Log Service
// Tracks all content changes with timestamps for compliance and debugging

import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  where, 
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

// Audit action types
export const AUDIT_ACTIONS = {
  POST_CREATED: 'post_created',
  POST_UPDATED: 'post_updated',
  POST_DELETED: 'post_deleted',
  POST_PUBLISHED: 'post_published',
  POST_SCHEDULED: 'post_scheduled',
  POST_FAILED: 'post_failed',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  SETTINGS_CHANGED: 'settings_changed',
  PLATFORM_CONNECTED: 'platform_connected',
  PLATFORM_DISCONNECTED: 'platform_disconnected',
  WORKSPACE_CREATED: 'workspace_created',
  WORKSPACE_UPDATED: 'workspace_updated',
  WORKSPACE_MEMBER_ADDED: 'workspace_member_added',
  WORKSPACE_MEMBER_REMOVED: 'workspace_member_removed',
  TEMPLATE_CREATED: 'template_created',
  TEMPLATE_UPDATED: 'template_updated',
  TEMPLATE_DELETED: 'template_deleted',
  CONTENT_MODERATED: 'content_moderated',
  EXPORT_CREATED: 'export_created',
  BULK_UPLOAD: 'bulk_upload'
};

// Get audit log collection reference
const getAuditRef = (userId) => 
  collection(db, 'artifacts', import.meta.env.VITE_APP_ID || 'content-cadence-app', 'users', userId, 'auditLogs');

export const auditService = {
  // Log an action
  log: async (userId, action, details = {}, metadata = {}) => {
    try {
      const auditEntry = {
        action,
        userId,
        details: {
          ...details,
          // Add client-side info
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          // Add any additional metadata
          ...metadata
        },
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
      };
      
      const auditRef = getAuditRef(userId);
      const docRef = await addDoc(auditRef, auditEntry);
      
      return docRef.id;
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging shouldn't break the app
      return null;
    }
  },
  
  // Get audit logs with filtering
  getLogs: async (userId, options = {}) => {
    const {
      action = null,
      startDate = null,
      endDate = null,
      maxResults = 50
    } = options;
    
    try {
      const auditRef = getAuditRef(userId);
      let constraints = [orderBy('timestamp', 'desc'), limit(maxResults)];
      
      if (action) {
        constraints.unshift(where('action', '==', action));
      }
      
      if (startDate) {
        constraints.unshift(where('timestamp', '>=', startDate));
      }
      
      if (endDate) {
        constraints.unshift(where('timestamp', '<=', endDate));
      }
      
      const q = query(auditRef, ...constraints);
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: new Date(doc.data().timestamp)
      }));
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  },
  
  // Get logs for a specific post
  getPostLogs: async (userId, postId) => {
    try {
      const auditRef = getAuditRef(userId);
      const q = query(
        auditRef,
        where('details.postId', '==', postId),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: new Date(doc.data().timestamp)
      }));
    } catch (error) {
      console.error('Failed to get post audit logs:', error);
      return [];
    }
  },
  
  // Get recent activity (dashboard friendly)
  getRecentActivity: async (userId, count = 10) => {
    return await auditService.getLogs(userId, { maxResults: count });
  },
  
  // Get activity by date range
  getActivityByDateRange: async (userId, startDate, endDate) => {
    return await auditService.getLogs(userId, {
      startDate: startDate.getTime(),
      endDate: endDate.getTime(),
      maxResults: 100
    });
  },
  
  // Get action statistics
  getStats: async (userId, days = 7) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const logs = await auditService.getLogs(userId, {
      startDate: startDate.getTime(),
      maxResults: 500
    });
    
    // Count by action type
    const actionCounts = {};
    logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });
    
    return {
      total: logs.length,
      byAction: actionCounts,
      period: `${days} days`
    };
  },
  
  // Search logs
  search: async (userId, searchTerm) => {
    // Note: Firestore doesn't support full-text search
    // This is a basic implementation - in production consider Algolia/Elasticsearch
    const logs = await auditService.getLogs(userId, { maxResults: 200 });
    
    return logs.filter(log => {
      const searchLower = searchTerm.toLowerCase();
      return (
        log.action.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.details).toLowerCase().includes(searchLower)
      );
    });
  },
  
  // Export audit logs
  exportLogs: async (userId, options = {}) => {
    const logs = await auditService.getLogs(userId, { 
      ...options, 
      maxResults: 1000 
    });
    
    const csvHeaders = ['ID', 'Action', 'Timestamp', 'Details'];
    const csvRows = logs.map(log => [
      log.id,
      log.action,
      log.timestamp.toISOString(),
      JSON.stringify(log.details).replace(/"/g, '""')
    ]);
    
    const csv = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
    
    // Download as CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }
};

// Helper to log common actions
export const logPostCreated = (userId, postData) => 
  auditService.log(userId, AUDIT_ACTIONS.POST_CREATED, { postId: postData.id, title: postData.title });

export const logPostUpdated = (userId, postId, changes) => 
  auditService.log(userId, AUDIT_ACTIONS.POST_UPDATED, { postId, changes: Object.keys(changes) });

export const logPostDeleted = (userId, postId) => 
  auditService.log(userId, AUDIT_ACTIONS.POST_DELETED, { postId });

export const logPostPublished = (userId, postId, platform) => 
  auditService.log(userId, AUDIT_ACTIONS.POST_PUBLISHED, { postId, platform });

export const logSettingsChanged = (userId, setting, oldValue, newValue) => 
  auditService.log(userId, AUDIT_ACTIONS.SETTINGS_CHANGED, { setting, oldValue, newValue });

export const logPlatformConnected = (userId, platform) => 
  auditService.log(userId, AUDIT_ACTIONS.PLATFORM_CONNECTED, { platform });

export const logPlatformDisconnected = (userId, platform) => 
  auditService.log(userId, AUDIT_ACTIONS.PLATFORM_DISCONNECTED, { platform });

export const logContentModerated = (userId, postId, result) => 
  auditService.log(userId, AUDIT_ACTIONS.CONTENT_MODERATED, { postId, score: result.score, approved: result.approved });