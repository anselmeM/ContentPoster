// A/B Test Traffic Routing Service
// Provides client-side framework for A/B test variant assignment
// Note: For production, this should be handled by Firebase Cloud Functions
// to ensure proper randomization and prevent client-side manipulation

import { 
  collection, 
  getDocs, 
  query, 
  where,
  doc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db } from './firebase';

// Get app ID from environment or use default
const getAppId = () => import.meta.env.VITE_APP_ID || 'default-app-id';

// A/B Test Traffic Router
export const abTestRouter = {
  // Get active A/B test for a user
  getActiveTest: async (userId) => {
    try {
      const testsRef = collection(db, 'users', userId, getAppId(), 'ab_tests');
      
      const q = query(
        testsRef,
        where('status', '==', 'running')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      // Return the first active test
      const testDoc = querySnapshot.docs[0];
      return { id: testDoc.id, ...testDoc.data() };
    } catch (error) {
      console.error('[ABTestRouter] Error getting active test:', error);
      return null;
    }
  },
  
  // Assign user to a test variant
  assignVariant: async (userId, testId, trafficSplit = { variantA: 50, variantB: 50 }) => {
    try {
      // Simple client-side randomization based on user ID hash
      const userHash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const random = (userHash % 100) + 1;
      
      const variant = random <= trafficSplit.variantA ? 'variantA' : 'variantB';
      
      console.log(`[ABTestRouter] Assigned user ${userId} to ${variant} (random: ${random})`);
      
      // Update impression count in Firestore
      const testRef = doc(db, 'users', userId, getAppId(), 'ab_tests', testId);
      const resultsField = `${variant}.impressions`;
      
      await updateDoc(testRef, {
        [resultsField]: increment(1)
      });
      
      return variant;
    } catch (error) {
      console.error('[ABTestRouter] Error assigning variant:', error);
      return 'variantA'; // Default fallback
    }
  },
  
  // Track conversion/event for a variant
  trackEvent: async (userId, testId, variant, eventType, eventData = {}) => {
    try {
      const testRef = doc(db, 'users', userId, getAppId(), 'ab_tests', testId);
      
      // Track the specific metric based on event type
      const metricsMap = {
        click: 'clicks',
        engagement: 'engagement',
        conversion: 'conversions',
        view: 'impressions'
      };
      
      const metricField = metricsMap[eventType] || 'engagement';
      const updateField = `${variant}.${metricField}`;
      
      await updateDoc(testRef, {
        [updateField]: increment(1)
      });
      
      console.log(`[ABTestRouter] Tracked ${eventType} for ${variant} in test ${testId}`);
      
      return true;
    } catch (error) {
      console.error('[ABTestRouter] Error tracking event:', error);
      return false;
    }
  },
  
  // Get variant for a specific test (deterministic based on user ID)
  getDeterministicVariant: (userId, trafficSplit = { variantA: 50, variantB: 50 }) => {
    // Create consistent hash from user ID
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const normalizedHash = Math.abs(hash) % 100;
    const threshold = trafficSplit.variantA || 50;
    
    return normalizedHash < threshold ? 'variantA' : 'variantB';
  }
};

export default abTestRouter;