// A/B Testing Service
// Firestore CRUD operations for A/B tests

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
const COLLECTION_NAME = 'ab_tests';

// Get app ID from environment or use default
const getAppId = () => import.meta.env.VITE_APP_ID || 'default-app-id';

// Get user-specific collection path
const getUserCollection = (userId) => 
  `users/${userId}/${getAppId()}/${COLLECTION_NAME}`;

// A/B Test Service
export const abTestService = {
  // Create a new A/B test
  create: async (userId, testData) => {
    try {
      const collectionRef = collection(db, getUserCollection(userId));
      const docRef = await addDoc(collectionRef, {
        ...testData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { id: docRef.id, ...testData };
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  },

  // Update an existing A/B test
  update: async (userId, testId, data) => {
    try {
      const docRef = doc(db, getUserCollection(userId), testId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      return { id: testId, ...data };
    } catch (error) {
      console.error('Error updating A/B test:', error);
      throw error;
    }
  },

  // Delete an A/B test
  delete: async (userId, testId) => {
    try {
      const docRef = doc(db, getUserCollection(userId), testId);
      await deleteDoc(docRef);
      return { id: testId, deleted: true };
    } catch (error) {
      console.error('Error deleting A/B test:', error);
      throw error;
    }
  },

  // Get a single A/B test
  get: async (userId, testId) => {
    try {
      const docRef = doc(db, getUserCollection(userId), testId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting A/B test:', error);
      throw error;
    }
  },

  // List A/B tests with optional filters
  list: async (userId, options = {}) => {
    try {
      const { status, limit: limitCount = 50 } = options;
      
      let q = query(
        collection(db, getUserCollection(userId)),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      if (status) {
        q = query(
          collection(db, getUserCollection(userId)),
          where('status', '==', status),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const tests = [];
      
      querySnapshot.forEach((doc) => {
        tests.push({ id: doc.id, ...doc.data() });
      });
      
      return tests;
    } catch (error) {
      console.error('Error listing A/B tests:', error);
      throw error;
    }
  },

  // Subscribe to real-time updates for A/B tests
  subscribe: (userId, callback) => {
    try {
      const collectionRef = collection(db, getUserCollection(userId));
      const q = query(
        collectionRef,
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tests = [];
        snapshot.forEach((doc) => {
          tests.push({ id: doc.id, ...doc.data() });
        });
        callback(tests);
      }, (error) => {
        console.error('Error subscribing to A/B tests:', error);
        callback([]);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up A/B test subscription:', error);
      callback([]);
      return () => {};
    }
  },

  // Update test results
  updateResults: async (userId, testId, results) => {
    try {
      const docRef = doc(db, getUserCollection(userId), testId);
      await updateDoc(docRef, {
        results,
        updatedAt: new Date().toISOString()
      });
      return { id: testId, results };
    } catch (error) {
      console.error('Error updating A/B test results:', error);
      throw error;
    }
  },

  // Update test status (start, pause, complete)
  updateStatus: async (userId, testId, status) => {
    try {
      const docRef = doc(db, getUserCollection(userId), testId);
      const updateData = {
        status,
        updatedAt: new Date().toISOString()
      };
      
      if (status === 'running') {
        updateData.startDate = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.endDate = new Date().toISOString();
      }
      
      await updateDoc(docRef, updateData);
      return { id: testId, status };
    } catch (error) {
      console.error('Error updating A/B test status:', error);
      throw error;
    }
  },

  // Get active (running) tests
  getActiveTests: async (userId) => {
    try {
      const q = query(
        collection(db, getUserCollection(userId)),
        where('status', '==', 'running'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const tests = [];
      
      querySnapshot.forEach((doc) => {
        tests.push({ id: doc.id, ...doc.data() });
      });
      
      return tests;
    } catch (error) {
      console.error('Error getting active A/B tests:', error);
      throw error;
    }
  }
};

export default abTestService;