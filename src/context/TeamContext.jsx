import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { teamService, TEAM_ROLES } from '../services/firebase';

const TeamContext = createContext(null);

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};

export const TeamProvider = ({ children }) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [workspacePosts, setWorkspacePosts] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to user's workspaces
  useEffect(() => {
    if (!user) {
      setWorkspaces([]);
      setLoading(false);
      return;
    }

    const unsubscribe = teamService.subscribeToUserWorkspaces(user.uid, (userWorkspaces) => {
      setWorkspaces(userWorkspaces);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Subscribe to current workspace members
  useEffect(() => {
    if (!currentWorkspace) {
      setMembers([]);
      return;
    }

    const unsubscribe = teamService.subscribeToWorkspaceMembers(currentWorkspace.id, (workspaceMembers) => {
      setMembers(workspaceMembers);
    });

    return () => unsubscribe();
  }, [currentWorkspace]);

  // Subscribe to workspace posts
  useEffect(() => {
    if (!currentWorkspace) {
      setWorkspacePosts([]);
      return;
    }

    const unsubscribe = teamService.subscribeToWorkspacePosts(currentWorkspace.id, (posts) => {
      setWorkspacePosts(posts);
    });

    return () => unsubscribe();
  }, [currentWorkspace]);

  // Subscribe to active users (presence)
  useEffect(() => {
    if (!currentWorkspace) {
      setActiveUsers([]);
      return;
    }

    const unsubscribe = teamService.subscribeToActiveUsers(currentWorkspace.id, (users) => {
      setActiveUsers(users);
    });

    return () => unsubscribe();
  }, [currentWorkspace]);

  // Update presence when user is active
  useEffect(() => {
    if (!currentWorkspace || !user) return;

    const updatePresence = () => {
      teamService.updatePresence(currentWorkspace.id, user.uid, {
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email,
        photoURL: user.photoURL
      });
    };

    // Update presence on mount and every 10 seconds
    updatePresence();
    const interval = setInterval(updatePresence, 10000);

    // Clean up on unmount
    return () => {
      clearInterval(interval);
      teamService.removePresence(currentWorkspace.id, user.uid);
    };
  }, [currentWorkspace, user]);

  const createWorkspace = useCallback(async (workspaceData) => {
    if (!user) throw new Error('Must be logged in to create workspace');
    const workspaceId = await teamService.createWorkspace(user.uid, workspaceData);
    return workspaceId;
  }, [user]);

  const selectWorkspace = useCallback(async (workspace) => {
    setCurrentWorkspace(workspace);
  }, []);

  const updateWorkspace = useCallback(async (workspaceId, workspaceData) => {
    await teamService.updateWorkspace(workspaceId, workspaceData);
  }, []);

  const addMember = useCallback(async (workspaceId, memberData) => {
    await teamService.addMember(workspaceId, memberData);
  }, []);

  const removeMember = useCallback(async (workspaceId, memberId) => {
    await teamService.removeMember(workspaceId, memberId);
  }, []);

  const updateMemberRole = useCallback(async (workspaceId, memberId, newRole) => {
    await teamService.updateMemberRole(workspaceId, memberId, newRole);
  }, []);

  const createPost = useCallback(async (postData) => {
    if (!currentWorkspace || !user) throw new Error('Must be in a workspace to create post');
    return await teamService.createWorkspacePost(currentWorkspace.id, user.uid, postData);
  }, [currentWorkspace, user]);

  const updatePost = useCallback(async (postId, postData) => {
    if (!currentWorkspace) throw new Error('Must be in a workspace to update post');
    await teamService.updateWorkspacePost(currentWorkspace.id, postId, postData);
  }, [currentWorkspace]);

  const deletePost = useCallback(async (postId) => {
    if (!currentWorkspace) throw new Error('Must be in a workspace to delete post');
    await teamService.deleteWorkspacePost(currentWorkspace.id, postId);
  }, [currentWorkspace]);

  const updatePostStatus = useCallback(async (postId, newStatus) => {
    if (!currentWorkspace || !user) throw new Error('Must be in a workspace to update status');
    await teamService.updatePostStatus(currentWorkspace.id, postId, newStatus, user.uid);
  }, [currentWorkspace, user]);

  const addComment = useCallback(async (postId, commentData) => {
    if (!currentWorkspace || !user) throw new Error('Must be in a workspace to add comment');
    return await teamService.addComment(currentWorkspace.id, postId, user.uid, commentData);
  }, [currentWorkspace, user]);

  const deleteComment = useCallback(async (postId, commentId) => {
    if (!currentWorkspace) throw new Error('Must be in a workspace to delete comment');
    await teamService.deleteComment(currentWorkspace.id, postId, commentId);
  }, [currentWorkspace]);

  const getUserRole = useCallback(async (workspaceId) => {
    if (!user) return null;
    return await teamService.getUserRole(workspaceId, user.uid);
  }, [user]);

  const canEdit = useCallback((role) => teamService.canEdit(role), []);
  const canManageMembers = useCallback((role) => teamService.canManageMembers(role), []);
  const canDelete = useCallback((role) => teamService.canDelete(role), []);

  const value = {
    workspaces,
    currentWorkspace,
    members,
    posts: workspacePosts,
    activeUsers,
    loading,
    createWorkspace,
    selectWorkspace,
    updateWorkspace,
    addMember,
    removeMember,
    updateMemberRole,
    createPost,
    updatePost,
    deletePost,
    updatePostStatus,
    addComment,
    deleteComment,
    getUserRole,
    canEdit,
    canManageMembers,
    canDelete,
    TEAM_ROLES
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
};

export default TeamContext;