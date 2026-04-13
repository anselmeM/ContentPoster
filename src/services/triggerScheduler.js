// Trigger Scheduler Service
// Evaluates and executes triggers at configured intervals

import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc,
  query,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  evaluateTriggers, 
  getPostsWithTriggers, 
  TRIGGER_TYPES,
  TRIGGER_ACTIONS 
} from '../utils/triggerEngine';

// Get app ID from environment or use default
const getAppId = () => import.meta.env.VITE_APP_ID || 'default-app-id';

// Check if running in browser (for setInterval)
const isBrowser = typeof window !== 'undefined';

// Trigger Scheduler
export const triggerScheduler = {
  // Interval ID for cleanup
  intervalId: null,
  
  // Start the scheduler
  start: (userId, intervalMs = 60000) => {
    if (!isBrowser || triggerScheduler.intervalId) {
      return; // Already running or not in browser
    }
    
    console.log('[TriggerScheduler] Starting trigger evaluation scheduler');
    
    // Initial evaluation
    triggerScheduler.evaluate(userId);
    
    // Set up interval
    triggerScheduler.intervalId = setInterval(() => {
      triggerScheduler.evaluate(userId);
    }, intervalMs);
  },
  
  // Stop the scheduler
  stop: () => {
    if (triggerScheduler.intervalId) {
      clearInterval(triggerScheduler.intervalId);
      triggerScheduler.intervalId = null;
      console.log('[TriggerScheduler] Stopped trigger evaluation scheduler');
    }
  },
  
  // Evaluate all draft posts with triggers
  evaluate: async (userId) => {
    if (!userId) {
      console.warn('[TriggerScheduler] No userId provided, skipping evaluation');
      return;
    }
    
    try {
      const postsRef = collection(db, 'artifacts', getAppId(), 'users', userId, 'posts');
      
      // Get all draft posts with triggers
      const q = query(
        postsRef,
        where('status', '==', 'draft')
      );
      
      const querySnapshot = await getDocs(q);
      const draftPosts = [];
      
      querySnapshot.forEach((doc) => {
        const postData = doc.data();
        if (postData.triggers && postData.triggers.type !== TRIGGER_TYPES.MANUAL) {
          draftPosts.push({ id: doc.id, ...postData });
        }
      });
      
      if (draftPosts.length === 0) {
        return;
      }
      
      console.log(`[TriggerScheduler] Evaluating ${draftPosts.length} draft posts with triggers`);
      
      // Evaluate each post
      for (const post of draftPosts) {
        const triggerResult = evaluateTriggers(post);
        
        if (triggerResult && triggerResult.action === TRIGGER_ACTIONS.PUBLISH) {
          console.log(`[TriggerScheduler] Trigger fired for post ${post.id}: ${triggerResult.reason}`);
          
          // Auto-publish the post
          await triggerScheduler.executeTrigger(userId, post.id, triggerResult);
        }
      }
    } catch (error) {
      console.error('[TriggerScheduler] Error evaluating triggers:', error);
    }
  },
  
  // Execute a trigger (publish the post)
  executeTrigger: async (userId, postId, triggerResult) => {
    try {
      const postRef = doc(db, 'artifacts', getAppId(), 'users', userId, 'posts', postId);
      
      await updateDoc(postRef, {
        status: 'scheduled',
        publishedAt: new Date().toISOString(),
        triggerExecuted: {
          ...triggerResult,
          executedAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      });
      
      console.log(`[TriggerScheduler] Successfully published post ${postId} via trigger`);
      
      // TODO: Trigger actual publishing to social platforms
      // This would need to call the appropriate platform APIs
      
      return true;
    } catch (error) {
      console.error(`[TriggerScheduler] Error executing trigger for post ${postId}:`, error);
      return false;
    }
  },
  
  // Get next scheduled trigger time for display
  getNextScheduledTrigger: async (userId) => {
    if (!userId) return null;
    
    try {
      const postsRef = collection(db, 'artifacts', getAppId(), 'users', userId, 'posts');
      
      // Get all draft posts with date-based triggers
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