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
  getDoc,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  getDocs
} from 'firebase/firestore';
import firebaseConfig from '../config/firebase';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export db for other services
export { db };

// Get app ID from environment or use default
const appId = import.meta.env.VITE_APP_ID || 'default-app-id';

// Default page size for pagination
const DEFAULT_PAGE_SIZE = 20;

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

  // Get paginated posts - useful for large datasets
  getPaginated: async (userId, pageSize = DEFAULT_PAGE_SIZE, lastDoc = null) => {
    const postsRef = getPostsRef(userId);
    let q;
    if (lastDoc) {
      q = query(postsRef, orderBy('date', 'asc'), orderBy('time', 'asc'), startAfter(lastDoc), limit(pageSize));
    } else {
      q = query(postsRef, orderBy('date', 'asc'), orderBy('time', 'asc'), limit(pageSize));
    }
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
    const hasMore = snapshot.docs.length === pageSize;
    return { posts, lastDoc: lastVisible, hasMore };
  },

  // Get posts by date range with pagination
  getByDateRange: async (userId, startDate, endDate, pageSize = DEFAULT_PAGE_SIZE, lastDoc = null) => {
    const postsRef = getPostsRef(userId);
    let q;
    if (lastDoc) {
      q = query(
        postsRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc'),
        startAfter(lastDoc),
        limit(pageSize)
      );
    } else {
      q = query(
        postsRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc'),
        limit(pageSize)
      );
    }
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
    const hasMore = snapshot.docs.length === pageSize;
    return { posts, lastDoc: lastVisible, hasMore };
  },

  // Get posts by platform with pagination
  getByPlatform: async (userId, platform, pageSize = DEFAULT_PAGE_SIZE, lastDoc = null) => {
    const postsRef = getPostsRef(userId);
    let q;
    if (lastDoc) {
      q = query(
        postsRef,
        where('platform', '==', platform),
        orderBy('date', 'asc'),
        startAfter(lastDoc),
        limit(pageSize)
      );
    } else {
      q = query(
        postsRef,
        where('platform', '==', platform),
        orderBy('date', 'asc'),
        limit(pageSize)
      );
    }
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
    const hasMore = snapshot.docs.length === pageSize;
    return { posts, lastDoc: lastVisible, hasMore };
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

  // Get paginated tasks
  getPaginated: async (userId, pageSize = DEFAULT_PAGE_SIZE, lastDoc = null) => {
    const tasksRef = getTasksRef(userId);
    let q;
    if (lastDoc) {
      q = query(tasksRef, orderBy('createdAt', 'asc'), startAfter(lastDoc), limit(pageSize));
    } else {
      q = query(tasksRef, orderBy('createdAt', 'asc'), limit(pageSize));
    }
    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
    const hasMore = snapshot.docs.length === pageSize;
    return { tasks, lastDoc: lastVisible, hasMore };
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

  // Get paginated templates
  getPaginated: async (userId, pageSize = DEFAULT_PAGE_SIZE, lastDoc = null) => {
    const templatesRef = getTemplatesRef(userId);
    let q;
    if (lastDoc) {
      q = query(templatesRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize));
    } else {
      q = query(templatesRef, orderBy('createdAt', 'desc'), limit(pageSize));
    }
    const snapshot = await getDocs(q);
    const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
    const hasMore = snapshot.docs.length === pageSize;
    return { templates, lastDoc: lastVisible, hasMore };
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

// Team workspaces collection
const getWorkspacesRef = () => 
  collection(db, 'artifacts', appId, 'workspaces');

const getWorkspaceMembersRef = (workspaceId) => 
  collection(db, 'artifacts', appId, 'workspaces', workspaceId, 'members');

const getWorkspacePostsRef = (workspaceId) => 
  collection(db, 'artifacts', appId, 'workspaces', workspaceId, 'posts');

// Role constants
export const TEAM_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer'
};

// Post status for approval workflow
export const POST_STATUS = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export const teamService = {
  // Create a new workspace
  createWorkspace: async (userId, workspaceData) => {
    const workspacesRef = getWorkspacesRef();
    const docRef = await addDoc(workspacesRef, {
      ...workspaceData,
      ownerId: userId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    // Add owner as member with owner role
    const membersRef = getWorkspaceMembersRef(docRef.id);
    await addDoc(membersRef, {
      userId,
      role: TEAM_ROLES.OWNER,
      joinedAt: Date.now()
    });
    
    return docRef.id;
  },

  // Get workspaces where user is a member
  subscribeToUserWorkspaces: (userId, callback) => {
    const membersRef = collection(db, 'artifacts', appId, 'members', userId, 'workspaces');
    return onSnapshot(membersRef, async (snapshot) => {
      if (snapshot.empty) {
        callback([]);
        return;
      }
      
      const workspaceIds = snapshot.docs.map(doc => doc.id);
      const workspaces = [];
      
      for (const wsId of workspaceIds) {
        const wsDoc = await getDoc(doc(db, 'artifacts', appId, 'workspaces', wsId));
        if (wsDoc.exists()) {
          const wsData = wsDoc.data();
          const memberDoc = await getDoc(doc(db, 'artifacts', appId, 'members', userId, 'workspaces', wsId));
          workspaces.push({
            id: wsId,
            ...wsData,
            userRole: memberDoc.exists() ? memberDoc.data().role : null
          });
        }
      }
      
      callback(workspaces);
    });
  },

  // Get single workspace details
  getWorkspace: async (workspaceId) => {
    const wsDoc = await getDoc(doc(db, 'artifacts', appId, 'workspaces', workspaceId));
    return wsDoc.exists() ? { id: wsDoc.id, ...wsDoc.data() } : null;
  },

  // Update workspace
  updateWorkspace: async (workspaceId, workspaceData) => {
    const wsRef = doc(db, 'artifacts', appId, 'workspaces', workspaceId);
    await updateDoc(wsRef, {
      ...workspaceData,
      updatedAt: Date.now()
    });
  },

  // Add member to workspace
  addMember: async (workspaceId, memberData) => {
    const memberId = memberData.userId;
    
    // Add to workspace members
    const membersRef = getWorkspaceMembersRef(workspaceId);
    await setDoc(doc(membersRef, memberId), {
      ...memberData,
      joinedAt: Date.now()
    });
    
    // Add workspace to user's workspace list
    const userWorkspacesRef = collection(db, 'artifacts', appId, 'members', memberId, 'workspaces');
    await setDoc(doc(userWorkspacesRef, workspaceId), {
      role: memberData.role,
      joinedAt: Date.now()
    });
  },

  // Remove member from workspace
  removeMember: async (workspaceId, memberId) => {
    const membersRef = getWorkspaceMembersRef(workspaceId);
    await deleteDoc(doc(membersRef, memberId));
    
    const userWorkspacesRef = collection(db, 'artifacts', appId, 'members', memberId, 'workspaces');
    await deleteDoc(doc(userWorkspacesRef, workspaceId));
  },

  // Update member role
  updateMemberRole: async (workspaceId, memberId, newRole) => {
    const membersRef = getWorkspaceMembersRef(workspaceId);
    await updateDoc(doc(membersRef, memberId), { role: newRole });
    
    const userWorkspacesRef = collection(db, 'artifacts', appId, 'members', memberId, 'workspaces');
    await updateDoc(doc(userWorkspacesRef, workspaceId), { role: newRole });
  },

  // Get workspace members
  subscribeToWorkspaceMembers: (workspaceId, callback) => {
    const membersRef = getWorkspaceMembersRef(workspaceId);
    return onSnapshot(membersRef, (snapshot) => {
      const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(members);
    });
  },

  // Get user's role in workspace
  getUserRole: async (workspaceId, userId) => {
    const memberDoc = await getDoc(doc(db, 'artifacts', appId, 'workspaces', workspaceId, 'members', userId));
    return memberDoc.exists() ? memberDoc.data().role : null;
  },

  // Check if user can perform action based on role
  canEdit: (role) => {
    return role === TEAM_ROLES.OWNER || role === TEAM_ROLES.ADMIN || role === TEAM_ROLES.EDITOR;
  },

  canManageMembers: (role) => {
    return role === TEAM_ROLES.OWNER || role === TEAM_ROLES.ADMIN;
  },

  canDelete: (role) => {
    return role === TEAM_ROLES.OWNER || role === TEAM_ROLES.ADMIN;
  },

  // Workspace posts (shared posts)
  subscribeToWorkspacePosts: (workspaceId, callback) => {
    const postsRef = getWorkspacePostsRef(workspaceId);
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(posts);
    });
  },

  createWorkspacePost: async (workspaceId, userId, postData) => {
    const postsRef = getWorkspacePostsRef(workspaceId);
    const docRef = await addDoc(postsRef, {
      ...postData,
      status: postData.status || POST_STATUS.DRAFT,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    return docRef.id;
  },

  updateWorkspacePost: async (workspaceId, postId, postData) => {
    const postRef = doc(db, 'artifacts', appId, 'workspaces', workspaceId, 'posts', postId);
    await updateDoc(postRef, {
      ...postData,
      updatedAt: Date.now()
    });
  },

  deleteWorkspacePost: async (workspaceId, postId) => {
    const postRef = doc(db, 'artifacts', appId, 'workspaces', workspaceId, 'posts', postId);
    await deleteDoc(postRef);
  },

  // Update post status (approval workflow)
  updatePostStatus: async (workspaceId, postId, newStatus, userId) => {
    const postRef = doc(db, 'artifacts', appId, 'workspaces', workspaceId, 'posts', postId);
    await updateDoc(postRef, {
      status: newStatus,
      statusUpdatedBy: userId,
      statusUpdatedAt: Date.now(),
      updatedAt: Date.now()
    });
  },

  // Comments on posts
  subscribeToPostComments: (workspaceId, postId, callback) => {
    const commentsRef = collection(db, 'artifacts', appId, 'workspaces', workspaceId, 'posts', postId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(comments);
    });
  },

  addComment: async (workspaceId, postId, userId, commentData) => {
    const commentsRef = collection(db, 'artifacts', appId, 'workspaces', workspaceId, 'posts', postId, 'comments');
    const docRef = await addDoc(commentsRef, {
      ...commentData,
      userId,
      createdAt: Date.now()
    });
    return docRef.id;
  },

  deleteComment: async (workspaceId, postId, commentId) => {
    const commentRef = doc(db, 'artifacts', appId, 'workspaces', workspaceId, 'posts', postId, 'comments', commentId);
    await deleteDoc(commentRef);
  },

  // Real-time presence/cursors
  subscribeToActiveUsers: (workspaceId, callback) => {
    const presenceRef = collection(db, 'artifacts', appId, 'workspaces', workspaceId, 'presence');
    return onSnapshot(presenceRef, (snapshot) => {
      const activeUsers = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.lastActive > Date.now() - 30000); // Filter out stale presence (30s)
      callback(activeUsers);
    });
  },

  // Update user presence
  updatePresence: async (workspaceId, userId, userData) => {
    const presenceRef = doc(db, 'artifacts', appId, 'workspaces', workspaceId, 'presence', userId);
    await setDoc(presenceRef, {
      ...userData,
      lastActive: Date.now()
    }, { merge: true });
  },

  // Remove presence on logout/disconnect
  removePresence: async (workspaceId, userId) => {
    const presenceRef = doc(db, 'artifacts', appId, 'workspaces', workspaceId, 'presence', userId);
    await deleteDoc(presenceRef);
  }
};