// Trigger Scheduler Service
// Client-side UI helper for trigger scheduling

import { 
  collection, 
  getDocs, 
  query,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { TRIGGER_TYPES } from '../utils/triggerEngine';

// Get app ID from environment or use default
const getAppId = () => import.meta.env.VITE_APP_ID || 'default-app-id';

// Trigger Scheduler UI Helper
export const triggerScheduler = {
  // Get next scheduled trigger time for display
  getNextScheduledTrigger: async (userId) => {
    if (!userId) return null;
    
    try {
      const postsRef = collection(db, 'artifacts', getAppId(), 'users', userId, 'posts');
      
      // Get all draft posts
      const q = query(
        postsRef,
        where('status', '==', 'draft')
      );
      
      const querySnapshot = await getDocs(q);
      let nearestDate = null;
      let nearestPostId = null;
      
      querySnapshot.forEach((doc) => {
        const postData = doc.data();
        if (postData.triggers?.type === TRIGGER_TYPES.DATE_BASED && postData.triggers?.scheduledDate) {
          const scheduled = new Date(`${postData.triggers.scheduledDate}T${postData.triggers.scheduledTime || '00:00'}`);
          
          if (scheduled > new Date() && (!nearestDate || scheduled < nearestDate)) {
            nearestDate = scheduled;
            nearestPostId = doc.id;
          }
        }
      });
      
      if (nearestDate) {
        return {
          postId: nearestPostId,
          scheduledFor: nearestDate,
          label: nearestDate.toLocaleString()
        };
      }
      
      return null;
    } catch (error) {
      console.error('[TriggerScheduler] Error getting next scheduled trigger:', error);
      return null;
    }
  }
};

export default triggerScheduler;