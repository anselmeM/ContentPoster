import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../config/firebase';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Get app ID from environment or use default
const appId = import.meta.env.VITE_APP_ID || 'default-app-id';

// Auth helpers
export const authService = {
  subscribe: (callback) => onAuthStateChanged(auth, callback),
  
  login: async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  },
  
  signup: async (email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  },
  
  logout: () => signOut(auth),
  
  updatePassword: async (currentPassword, newPassword) => {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  },
  
  getCurrentUser: () => auth.currentUser
};

// Posts collection
const getPostsRef = (userId) => 
  collection(db, 'artifacts', appId, 'users', userId, 'posts');

export const postsService = {
  subscribe: (userId, callback) => {
    const postsRef = getPostsRef(userId);
    const q = query(postsRef, orderBy('date', 'asc'), orderBy('time', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(posts);
    });
  },
  
  create: async (userId, postData) => {
    const postsRef = getPostsRef(userId);
    const docRef = await addDoc(postsRef, {
      ...postData,
      completed: false,
      createdAt: Date.now()
    });
    return docRef.id;
  },
  
  update: async (userId, postId, postData) => {
    const postRef = doc(db, 'artifacts', appId, 'users', userId, 'posts', postId);
    await updateDoc(postRef, postData);
  },
  
  delete: async (userId, postId) => {
    const postRef = doc(db, 'artifacts', appId, 'users', userId, 'posts', postId);
    await deleteDoc(postRef);
  }
};

// Tasks collection
const getTasksRef = (userId) => 
  collection(db, 'artifacts', appId, 'users', userId, 'tasks');

export const tasksService = {
  subscribe: (userId, callback) => {
    const tasksRef = getTasksRef(userId);
    const q = query(tasksRef, orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(tasks);
    });
  },
  
  create: async (userId, taskData) => {
    const tasksRef = getTasksRef(userId);
    const docRef = await addDoc(tasksRef, {
      ...taskData,
      createdAt: Date.now()
    });
    return docRef.id;
  },
  
  update: async (userId, taskId, taskData) => {
    const taskRef = doc(db, 'artifacts', appId, 'users', userId, 'tasks', taskId);
    await updateDoc(taskRef, taskData);
  },
  
  delete: async (userId, taskId) => {
    const taskRef = doc(db, 'artifacts', appId, 'users', userId, 'tasks', taskId);
    await deleteDoc(taskRef);
  }
};

// Templates collection
const getTemplatesRef = (userId) => 
  collection(db, 'artifacts', appId, 'users', userId, 'templates');

export const templatesService = {
  subscribe: (userId, callback) => {
    const templatesRef = getTemplatesRef(userId);
    const q = query(templatesRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(templates);
    });
  },
  
  create: async (userId, templateData) => {
    const templatesRef = getTemplatesRef(userId);
    const docRef = await addDoc(templatesRef, {
      ...templateData,
      createdAt: Date.now()
    });
    return docRef.id;
  },
  
  update: async (userId, templateId, templateData) => {
    const templateRef = doc(db, 'artifacts', appId, 'users', userId, 'templates', templateId);
    await updateDoc(templateRef, templateData);
  },
  
  delete: async (userId, templateId) => {
    const templateRef = doc(db, 'artifacts', appId, 'users', userId, 'templates', templateId);
    await deleteDoc(templateRef);
  }
};

// User settings
const getSettingsRef = (userId) => 
  doc(db, 'artifacts', appId, 'users', userId, 'settings', 'user');

export const settingsService = {
  subscribe: (userId, callback) => {
    const settingsRef = getSettingsRef(userId);
    return onSnapshot(settingsRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.data() : null);
    });
  },
  
  update: async (userId, settingsData) => {
    const settingsRef = getSettingsRef(userId);
    await setDoc(settingsRef, settingsData, { merge: true });
  }
};

// Export to CSV utility
export const exportToCSV = (posts, filename = 'content_cadence_posts.csv') => {
  const headers = ['ID', 'Title', 'Date', 'Time', 'Platform', 'Image URL', 'Completed'];
  const escapeCsv = (str) => `"${(str || '').replace(/"/g, '""')}"`;
  
  const csvRows = [headers.join(',')];
  
  posts.forEach(post => {
    const row = [
      post.id,
      escapeCsv(post.title),
      post.date,
      post.time,
      post.platform,
      escapeCsv(post.image),
      post.completed
    ];
    csvRows.push(row.join(','));
  });
  
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export { auth, db };
export default app;