import { storage, db, appId } from './firebase';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  updateDoc
} from 'firebase/firestore';

export const storageService = {
  // Upload file to storage and save metadata in Firestore
  uploadFile: (userId, file, onProgress) => {
    return new Promise((resolve, reject) => {
      const isVideo = file.type.startsWith('video/');
      const fileType = isVideo ? 'video' : 'image';
      const storagePath = `${userId}/media/${Date.now()}_${file.name}`;
      const fileRef = ref(storage, storagePath);
      
      const uploadTask = uploadBytesResumable(fileRef, file);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(Math.round(progress));
          }
        },
        (error) => {
          console.error('Storage upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Add metadata to Firestore media collection
            const mediaItem = {
              name: file.name,
              url: downloadURL,
              storagePath: storagePath,
              type: fileType,
              size: file.size,
              tags: [],
              folder: '/',
              category: 'uncategorized',
              uploadedAt: Date.now()
            };
            
            const mediaCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'media');
            const docRef = await addDoc(mediaCollectionRef, mediaItem);
            
            resolve({
              id: docRef.id,
              ...mediaItem
            });
          } catch (err) {
            console.error('Error saving storage metadata to Firestore:', err);
            reject(err);
          }
        }
      );
    });
  },

  // Delete file from storage and remove metadata from Firestore
  deleteFile: async (userId, mediaId, storagePath) => {
    // 1. Delete from Firebase Storage (wrap in try-catch so metadata is still cleanable if storage file is missing)
    if (storagePath) {
      try {
        const fileRef = ref(storage, storagePath);
        await deleteObject(fileRef);
      } catch (err) {
        console.warn('Failed to delete file from Firebase Storage, proceeding to delete metadata:', err);
      }
    }
    
    // 2. Delete metadata document from Firestore
    const docRef = doc(db, 'artifacts', appId, 'users', userId, 'media', mediaId);
    await deleteDoc(docRef);
    return true;
  },

  // Real-time listener for the user's media library
  subscribeFiles: (userId, callback) => {
    const mediaCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'media');
    const q = query(mediaCollectionRef, orderBy('uploadedAt', 'desc'));
    
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(items);
      },
      (error) => {
        console.error('Firestore media subscription error:', error);
        callback([]);
      }
    );
  },

  // Update file metadata (tags, folder, category) in Firestore
  updateFileMetadata: async (userId, mediaId, metadata) => {
    const docRef = doc(db, 'artifacts', appId, 'users', userId, 'media', mediaId);
    await updateDoc(docRef, {
      ...metadata,
      updatedAt: Date.now()
    });
    return true;
  }
};

export default storageService;