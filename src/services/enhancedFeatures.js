// Utility service for duplicate, search, and undo functionality
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  orderBy,
  limit
} from 'firebase/firestore';

// Get app ID
const appId = import.meta.env.VITE_APP_ID || 'content-cadence-app';

// Trash/Recycle bin for soft delete
export const trashService = {
  // Move item to trash (soft delete)
  softDelete: async (userId, itemType, itemId, itemData) => {
    try {
      const trashRef = collection(db, 'artifacts', appId, 'users', userId, 'trash');
      
      await addDoc(trashRef, {
        itemType, // 'post', 'template', 'task'
        itemId,
        itemData,
        deletedAt: Date.now(),
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
      });
      
      // Actual delete from original collection
      const collectionMap = {
        post: 'posts',
        template: 'templates',
        task: 'tasks'
      };
      
      const originalRef = doc(db, 'artifacts', appId, 'users', userId, collectionMap[itemType], itemId);
      await deleteDoc(originalRef);
      
      return true;
    } catch (error) {
      console.error('Soft delete failed:', error);
      return false;
    }
  },
  
  // Restore from trash
  restore: async (userId, trashItemId) => {
    try {
      const trashRef = collection(db, 'artifacts', appId, 'users', userId, 'trash');
      const trashDoc = await getDocs(query(trashRef, where('__name__', '==', trashItemId)));
      
      if (trashDoc.empty) {
        throw new Error('Item not found in trash');
      }
      
      const item = trashDoc.docs[0].data();
      
      // Restore to original collection
      const collectionMap = {
        post: 'posts',
        template: 'templates', 
        task: 'tasks'
      };
      
      const originalRef = doc(db, 'artifacts', appId, 'users', userId, collectionMap[item.itemType], item.itemId);
      await addDoc(collection(db, 'artifacts', appId, 'users', userId, collectionMap[item.itemType]), item.itemData);
      
      // Remove from trash
      await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'trash', trashItemId));
      
      return true;
    } catch (error) {
      console.error('Restore failed:', error);
      return false;
    }
  },
  
  // Get trash items
  getTrashItems: async (userId, itemType = null) => {
    try {
      const trashRef = collection(db, 'artifacts', appId, 'users', userId, 'trash');
      let q = query(trashRef, orderBy('deletedAt', 'desc'));
      
      if (itemType) {
        q = query(trashRef, where('itemType', '==', itemType), orderBy('deletedAt', 'desc'));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Get trash failed:', error);
      return [];
    }
  },
  
  // Permanently delete
  permanentDelete: async (userId, trashItemId) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'trash', trashItemId));
      return true;
    } catch (error) {
      console.error('Permanent delete failed:', error);
      return false;
    }
  },
  
  // Empty trash
  emptyTrash: async (userId) => {
    try {
      const items = await trashService.getTrashItems(userId);
      for (const item of items) {
        await trashService.permanentDelete(userId, item.id);
      }
      return true;
    } catch (error) {
      console.error('Empty trash failed:', error);
      return false;
    }
  }
};

// Duplicate/Copy service
export const duplicateService = {
  // Duplicate a post
  duplicatePost: async (userId, postId) => {
    try {
      // Get original post
      const postRef = doc(db, 'artifacts', appId, 'users', userId, 'posts', postId);
      // Note: In real implementation, you'd fetch the document data first
      // This is a placeholder - the actual duplicate would happen in the component
      
      // Return the original ID so the component can copy the data
      return postId;
    } catch (error) {
      console.error('Duplicate failed:', error);
      return null;
    }
  },
  
  // Duplicate a template
  duplicateTemplate: async (userId, templateId) => {
    try {
      // Similar to duplicatePost
      return templateId;
    } catch (error) {
      console.error('Duplicate template failed:', error);
      return null;
    }
  }
};

// Search and filter service
export const searchService = {
  // Search posts with filters
  searchPosts: async (userId, filters = {}) => {
    try {
      const postsRef = collection(db, 'artifacts', appId, 'users', userId, 'posts');
      
      let constraints = [];
      
      // Platform filter
      if (filters.platform && filters.platform !== 'all') {
        constraints.push(where('platform', '==', filters.platform));
      }
      
      // Status filter
      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }
      
      // Completed filter
      if (filters.completed !== undefined) {
        constraints.push(where('completed', '==', filters.completed));
      }
      
      // Date range filter
      if (filters.startDate && filters.endDate) {
        constraints.push(where('date', '>=', filters.startDate));
        constraints.push(where('date', '<=', filters.endDate));
      }
      
      constraints.push(orderBy('date', 'asc'));
      
      if (filters.limit) {
        constraints.push(limit(filters.limit));
      }
      
      const q = query(postsRef, ...constraints);
      const snapshot = await getDocs(q);
      
      let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Text search (client-side filtering since Firestore doesn't support full-text)
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        results = results.filter(post => 
          post.title?.toLowerCase().includes(searchLower) ||
          post.content?.toLowerCase().includes(searchLower) ||
          post.hashtags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  },
  
  // Get filter options
  getFilterOptions: () => ({
    platforms: ['instagram', 'twitter', 'facebook', 'linkedin', 'tiktok', 'pinterest', 'youtube', 'snapchat', 'reddit', 'dribbble'],
    statuses: ['draft', 'pending_review', 'approved', 'rejected'],
    dateRanges: [
      { label: 'Today', value: 'today' },
      { label: 'This Week', value: 'week' },
      { label: 'This Month', value: 'month' },
      { label: 'This Year', value: 'year' },
      { label: 'Custom', value: 'custom' }
    ]
  })
};

// Media folder service
export const mediaFolderService = {
  // Create folder
  createFolder: async (userId, folderData) => {
    try {
      const foldersRef = collection(db, 'artifacts', appId, 'users', userId, 'mediaFolders');
      const docRef = await addDoc(foldersRef, {
        ...folderData,
        createdAt: Date.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Create folder failed:', error);
      return null;
    }
  },
  
  // Get folders
  getFolders: async (userId) => {
    try {
      const foldersRef = collection(db, 'artifacts', appId, 'users', userId, 'mediaFolders');
      const snapshot = await getDocs(query(foldersRef, orderBy('name', 'asc')));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Get folders failed:', error);
      return [];
    }
  },
  
  // Move media to folder
  moveToFolder: async (userId, mediaId, folderId) => {
    try {
      const mediaRef = doc(db, 'artifacts', appId, 'users', userId, 'media', mediaId);
      await updateDoc(mediaRef, { folderId });
      return true;
    } catch (error) {
      console.error('Move to folder failed:', error);
      return false;
    }
  },
  
  // Delete folder
  deleteFolder: async (userId, folderId) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'mediaFolders', folderId));
      return true;
    } catch (error) {
      console.error('Delete folder failed:', error);
      return false;
    }
  }
};

export default {
  trashService,
  duplicateService,
  searchService,
  mediaFolderService
};