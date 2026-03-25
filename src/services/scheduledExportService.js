// Scheduled Export Service
// Manages scheduled export jobs stored in Firestore

import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

// Collection name
const COLLECTION_NAME = 'scheduled_exports';

// Get app ID from environment or use default
const getAppId = () => import.meta.env.VITE_APP_ID || 'default-app-id';

// Get user-specific collection path
const getUserCollection = (userId) => 
  `users/${userId}/${getAppId()}/${COLLECTION_NAME}`;

// Export frequency options
export const EXPORT_FREQUENCY = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
};

// Export format options
export const EXPORT_FORMAT = {
  CSV: 'csv',
  EXCEL: 'excel',
  JSON: 'json',
  PDF: 'pdf'
};

// Scheduled Export Service
export const scheduledExportService = {
  // Create a new scheduled export
  create: async (userId, scheduleData) => {
    try {
      const collectionRef = collection(db, getUserCollection(userId));
      const docRef = await addDoc(collectionRef, {
        ...scheduleData,
        enabled: true,
        lastRun: null,
        nextRun: calculateNextRun(scheduleData.frequency, scheduleData.time),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { id: docRef.id, ...scheduleData };
    } catch (error) {
      console.error('Error creating scheduled export:', error);
      throw error;
    }
  },

  // Update an existing scheduled export
  update: async (userId, scheduleId, data) => {
    try {
      const docRef = doc(db, getUserCollection(userId), scheduleId);
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      // Recalculate next run if frequency or time changed
      if (data.frequency || data.time) {
        const existing = await getDoc(docRef);
        const existingData = existing.data();
        updateData.nextRun = calculateNextRun(
          data.frequency || existingData.frequency,
          data.time || existingData.time
        );
      }
      
      await updateDoc(docRef, updateData);
      return { id: scheduleId, ...updateData };
    } catch (error) {
      console.error('Error updating scheduled export:', error);
      throw error;
    }
  },

  // Delete a scheduled export
  delete: async (userId, scheduleId) => {
    try {
      const docRef = doc(db, getUserCollection(userId), scheduleId);
      await deleteDoc(docRef);
      return { id: scheduleId, deleted: true };
    } catch (error) {
      console.error('Error deleting scheduled export:', error);
      throw error;
    }
  },

  // Get a single scheduled export
  get: async (userId, scheduleId) => {
    try {
      const docRef = doc(db, getUserCollection(userId), scheduleId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting scheduled export:', error);
      throw error;
    }
  },

  // List all scheduled exports for a user
  list: async (userId) => {
    try {
      const q = query(
        collection(db, getUserCollection(userId)),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      const schedules = [];
      
      querySnapshot.forEach((doc) => {
        schedules.push({ id: doc.id, ...doc.data() });
      });
      
      return schedules;
    } catch (error) {
      console.error('Error listing scheduled exports:', error);
      throw error;
    }
  },

  // Subscribe to real-time updates for scheduled exports
  subscribe: (userId, callback) => {
    try {
      const collectionRef = collection(db, getUserCollection(userId));
      const q = query(
        collectionRef,
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const schedules = [];
        snapshot.forEach((doc) => {
          schedules.push({ id: doc.id, ...doc.data() });
        });
        callback(schedules);
      }, (error) => {
        console.error('Error subscribing to scheduled exports:', error);
        callback([]);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up scheduled export subscription:', error);
      callback([]);
      return () => {};
    }
  },

  // Toggle scheduled export enabled/disabled
  toggle: async (userId, scheduleId, enabled) => {
    try {
      const docRef = doc(db, getUserCollection(userId), scheduleId);
      await updateDoc(docRef, {
        enabled,
        updatedAt: new Date().toISOString()
      });
      return { id: scheduleId, enabled };
    } catch (error) {
      console.error('Error toggling scheduled export:', error);
      throw error;
    }
  },

  // Get pending exports (that should run now)
  getPendingExports: async (userId) => {
    try {
      const now = new Date().toISOString();
      const q = query(
        collection(db, getUserCollection(userId)),
        where('enabled', '==', true),
        where('nextRun', '<=', now)
      );
      
      const querySnapshot = await getDocs(q);
      const pending = [];
      
      querySnapshot.forEach((doc) => {
        pending.push({ id: doc.id, ...doc.data() });
      });
      
      return pending;
    } catch (error) {
      console.error('Error getting pending exports:', error);
      throw error;
    }
  },

  // Update last run timestamp
  markRunComplete: async (userId, scheduleId) => {
    try {
      const docRef = doc(db, getUserCollection(userId), scheduleId);
      const schedule = await getDoc(docRef);
      
      if (!schedule.exists()) return null;
      
      const scheduleData = schedule.data();
      const nextRun = calculateNextRun(scheduleData.frequency, scheduleData.time);
      
      await updateDoc(docRef, {
        lastRun: new Date().toISOString(),
        nextRun,
        updatedAt: new Date().toISOString()
      });
      
      return { id: scheduleId, nextRun };
    } catch (error) {
      console.error('Error marking export as complete:', error);
      throw error;
    }
  }
};

// Helper function to calculate next run time
function calculateNextRun(frequency, time) {
  const now = new Date();
  const [hours, minutes] = (time || '09:00').split(':').map(Number);
  
  let nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);
  
  switch (frequency) {
    case EXPORT_FREQUENCY.DAILY:
      // If time has passed today, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
      
    case EXPORT_FREQUENCY.WEEKLY:
      // Schedule for next week at the same time
      nextRun.setDate(nextRun.getDate() + 7);
      break;
      
    case EXPORT_FREQUENCY.MONTHLY:
      // Schedule for next month at the same time
      nextRun.setMonth(nextRun.getMonth() + 1);
      break;
      
    default:
      // Default to daily
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
  }
  
  return nextRun.toISOString();
}

export default scheduledExportService;