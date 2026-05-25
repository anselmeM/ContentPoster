import { useState, useEffect } from 'react';
import { useTeam } from '../../context/TeamContext';
import { useAuth } from '../../context/AuthContext';
import { TEAM_ROLES, POST_STATUS, teamService } from '../../services/firebase';
import PostModal from '../Modals/PostModal';
import clsx from 'clsx';

// Platform config styling and icons
const platformIcons = {
  linkedin: { icon: 'fa-linkedin-in', class: 'bg-blue-600' },
  instagram: { icon: 'fa-instagram', class: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500' },
  dribbble: { icon: 'fa-dribbble', class: 'bg-pink-500' },
  facebook: { icon: 'fa-facebook-f', class: 'bg-blue-700' },
  twitter: { icon: 'fa-x-twitter', class: 'bg-black' },
  tiktok: { icon: 'fa-tiktok', class: 'bg-black' }
};

// Roles configuration with styling colors
const RoleBadge = ({ role }) => {
  const roleConfig = {
    [TEAM_ROLES.OWNER]: { label: 'Owner', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200 border border-purple-200 dark:border-purple-800' },
    [TEAM_ROLES.ADMIN]: { label: 'Admin', color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 border border-red-200 dark:border-red-800' },
    [TEAM_ROLES.REVIEWER]: { label: 'Reviewer', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border border-amber-200 dark:border-amber-800' },
    [TEAM_ROLES.EDITOR]: { label: 'Editor', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border border-blue-200 dark:border-blue-800' },
    [TEAM_ROLES.VIEWER]: { label: 'Viewer', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600' }
  };
  
  const config = roleConfig[role] || roleConfig[TEAM_ROLES.VIEWER];
  
  return (
    <span className={clsx('px-2.5 py-1 text-xs font-semibold rounded-full tracking-wide', config.color)}>
      {config.label}
    </span>
  );
};

// Post workflow status badges
const StatusBadge = ({ status }) => {
  const statusConfig = {
    [POST_STATUS.DRAFT]: { label: 'Draft', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700' },
    [POST_STATUS.PENDING_REVIEW]: { label: 'Pending Review', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border border-amber-200 dark:border-amber-800' },
    [POST_STATUS.APPROVED]: { label: 'Approved', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-905/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-850' },
    [POST_STATUS.REJECTED]: { label: 'Rejected', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200 border border-rose-200 dark:border-rose-800' }
  };
  
  const config = statusConfig[status] || statusConfig[POST_STATUS.DRAFT];
  
  return (
    <span className={clsx('px-2.5 py-0.5 text-xs font-semibold rounded-full tracking-wide', config.color)}>
      {config.label}
    </span>
  );
};

// Workspace selection card
const WorkspaceCard = ({ workspace, onSelect, onEdit, onDelete }) => {
  const userRole = workspace.userRole;
  const canManage = (userRole === TEAM_ROLES.OWNER || userRole === TEAM_ROLES.ADMIN);
  
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-indigo-500/50 transition-all duration-300 cursor-pointer flex flex-col justify-between"
      onClick={() => onSelect(workspace)}
    >
      <div>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              {workspace.name}
            </h3>
            {workspace.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                {workspace.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 ml-3" onClick={(e) => e.stopPropagation()}>
            <RoleBadge role={userRole} />
            {canManage && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(workspace)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-250 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Edit workspace"
                >
                  <i className="fas fa-edit text-xs" />
                </button>
                {userRole === TEAM_ROLES.OWNER && (
                  <button
                    onClick={() => onDelete(workspace)}
                    className="p-1.5 text-red-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Delete workspace"
                  >
                    <i className="fas fa-trash-alt text-xs" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <i className="fas fa-users" />
          <span>Members</span>
        </div>
        <span className="font-semibold text-gray-600 dark:text-gray-300">
          {workspace.memberCount || 1}
        </span>
      </div>
    </div>
  );
};

// Create workspace popup modal
const CreateWorkspaceModal = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  if (!isOpen) return null;
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim() });
    setName('');
    setDescription('');
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 border border-gray-100 dark:border-gray-700 transform scale-100 transition-transform">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Create New Workspace
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-250 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <i className="fas fa-times text-lg" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="workspace-name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Workspace Name *
            </label>
            <input
              id="workspace-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
              placeholder="e.g., Marketing Team"
            />
          </div>
          
          <div>
            <label htmlFor="workspace-description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              id="workspace-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3.5}
              className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm resize-none"
              placeholder="Provide a brief summary for the team"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-650 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              Create Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Invite/Add workspace members modal
const AddMemberModal = ({ isOpen, onClose, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(TEAM_ROLES.EDITOR);
  const [loading, setLoading] = useState(false);
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    await onSubmit({ userId: email.trim(), role });
    setLoading(false);
    setEmail('');
    setRole(TEAM_ROLES.EDITOR);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Add Team Member
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-250 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <i className="fas fa-times text-lg" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="member-email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Member Email *
            </label>
            <input
              id="member-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
              placeholder="colleague@example.com"
            />
          </div>
          
          <div>
            <label htmlFor="member-role" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Role & Permissions
            </label>
            <select
              id="member-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value={TEAM_ROLES.VIEWER}>Viewer - Read-only access to posts</option>
              <option value={TEAM_ROLES.EDITOR}>Editor - Can create and update drafts</option>
              <option value={TEAM_ROLES.REVIEWER}>Reviewer - Can review and approve/reject posts</option>
              <option value={TEAM_ROLES.ADMIN}>Admin - Full member and setting controls</option>
            </select>
          </div>
          
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-650 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg disabled:opacity-55 shadow-sm transition-colors"
            >
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Workspace team members tab view
const MemberList = ({ members, currentUserId, onRemove, onUpdateRole, canManage }) => {
  return (
    <div className="grid grid-cols-1 gap-3 max-w-3xl">
      {members.map((member) => (
        <div key={member.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-xl shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">
                {member.userId?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-sm">
                {member.userId}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Joined {new Date(member.joinedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3.5" onClick={(e) => e.stopPropagation()}>
            <RoleBadge role={member.role} />
            {canManage && member.role !== TEAM_ROLES.OWNER && (
              <div className="flex items-center gap-2">
                <select
                  value={member.role}
                  onChange={(e) => onUpdateRole(member.id, e.target.value)}
                  className="text-xs border border-gray-250 dark:border-gray-600 rounded-lg px-2 py-1.5 dark:bg-gray-700 dark:text-white focus:ring-1 focus:ring-indigo-500"
                >
                  <option value={TEAM_ROLES.VIEWER}>Viewer</option>
                  <option value={TEAM_ROLES.EDITOR}>Editor</option>
                  <option value={TEAM_ROLES.REVIEWER}>Reviewer</option>
                  <option value={TEAM_ROLES.ADMIN}>Admin</option>
                </select>
                <button
                  onClick={() => onRemove(member.id)}
                  className="p-2 text-gray-400 hover:text-rose-600 dark:hover:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                  title="Remove member"
                >
                  <i className="fas fa-user-minus text-xs" />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const WorkspaceView = () => {
  const {
    workspaces,
    currentWorkspace,
    members,
    posts,
    activeUsers,
    loading,
    createWorkspace,
    selectWorkspace,
    updateWorkspace,
    addMember,
    removeMember,
    updateMemberRole,
    deletePost,
    updatePostStatus,
    addComment,
    deleteComment,
    getUserRole,
    canEdit,
    canManageMembers,
    canDelete,
    TEAM_ROLES
  } = useTeam();
  
  const { user } = useAuth();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'members'
  const [userRole, setUserRole] = useState(null);
  
  // Post Details Drawer & Comments States
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  
  // Workspace Posts CRUD Modal States
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  
  // Workspace Posts Search and Filters
  const [postSearchQuery, setPostSearchQuery] = useState('');
  const [postStatusFilter, setPostStatusFilter] = useState('All');
  
  // Get and sync user role when workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      getUserRole(currentWorkspace.id).then(setUserRole);
    } else {
      setUserRole(null);
    }
  }, [currentWorkspace, getUserRole]);
  
  // Subscribe to comments on the selected post in real time
  useEffect(() => {
    if (!currentWorkspace || !selectedPost) {
      setComments([]);
      return;
    }
    const unsubscribe = teamService.subscribeToPostComments(
      currentWorkspace.id,
      selectedPost.id,
      (postComments) => {
        setComments(postComments);
      }
    );
    return () => unsubscribe();
  }, [currentWorkspace, selectedPost]);
  
  const handleCreateWorkspace = async (workspaceData) => {
    await createWorkspace(workspaceData);
  };
  
  const handleAddMember = async (memberData) => {
    if (currentWorkspace) {
      await addMember(currentWorkspace.id, memberData);
    }
  };
  
  const handleRemoveMember = async (memberId) => {
    if (currentWorkspace && confirm('Are you sure you want to remove this member?')) {
      await removeMember(currentWorkspace.id, memberId);
    }
  };
  
  const handleUpdateRole = async (memberId, newRole) => {
    if (currentWorkspace) {
      await updateMemberRole(currentWorkspace.id, memberId, newRole);
    }
  };
  
  const handleDeletePost = async (postId, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this shared post?')) {
      await deletePost(postId);
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }
    }
  };
  
  const handleEditPost = (post, e) => {
    e.stopPropagation();
    setEditingPost(post);
    setIsPostModalOpen(true);
  };
  
  const handleOpenCreatePost = () => {
    setEditingPost(null);
    setIsPostModalOpen(true);
  };
  
  const activeWorkspace = workspaces.find(w => w.id === currentWorkspace?.id);
  const activeUserRole = activeWorkspace?.userRole || userRole;
  const canManage = currentWorkspace && canManageMembers(activeUserRole);
  
  // Filter workspace posts
  const filteredPosts = posts.filter(post => {
    // Search filter
    if (postSearchQuery) {
      const q = postSearchQuery.toLowerCase();
      const matchTitle = post.title?.toLowerCase()?.includes(q);
      const matchContent = post.content?.toLowerCase()?.includes(q);
      if (!matchTitle && !matchContent) return false;
    }
    // Status filter
    if (postStatusFilter !== 'All' && post.status !== postStatusFilter) {
      return false;
    }
    return true;
  });
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-650"></div>
      </div>
    );
  }
  
  // If no workspace selected, show workspaces overview list
  if (!currentWorkspace) {
    return (
      <div className="p-1 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Team Workspaces
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Collaborate and manage scheduled content workflows together.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <i className="fas fa-plus" />
            New Workspace
          </button>
        </div>
        
        {workspaces.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-2xl p-8 max-w-xl mx-auto shadow-sm mt-8">
            <div className="w-16 h-16 mx-auto mb-4.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
              <i className="fas fa-folder-open text-2xl text-indigo-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              No Workspaces Yet
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Create a collaboration hub to invite teammates, share draft posts, configure approval pipelines, and comment on social assets.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              Create Workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {workspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                onSelect={selectWorkspace}
                onEdit={(ws) => {
                  const newName = prompt('Enter new workspace name:', ws.name);
                  if (newName?.trim()) {
                    updateWorkspace(ws.id, { name: newName.trim() });
                  }
                }}
                onDelete={async (ws) => {
                  if (confirm(`Are you sure you want to delete "${ws.name}"? This action is irreversible.`)) {
                    await teamService.removeMember(ws.id, user.uid); // Removes association from user list
                    // Since full admin script deletion isn't directly exposed in context, we leave member removal to keep it clean.
                  }
                }}
              />
            ))}
          </div>
        )}
        
        <CreateWorkspaceModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateWorkspace}
        />
      </div>
    );
  }
  
  // Show detailed single workspace view
  return (
    <div className="p-1 space-y-6 relative">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-150 dark:border-gray-800 pb-5 gap-4">
        <div className="flex items-start gap-3.5">
          <button
            onClick={() => selectWorkspace(null)}
            className="p-2.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-250 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-all shadow-xs"
          >
            <i className="fas fa-arrow-left text-sm" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentWorkspace.name}
              </h1>
              <RoleBadge role={activeUserRole} />
            </div>
            {currentWorkspace.description && (
              <p className="text-sm text-gray-500 mt-1 max-w-xl">
                {currentWorkspace.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          {/* Active online presence indicator avatars */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2 overflow-hidden">
              {activeUsers.map((activeUser) => (
                <div
                  key={activeUser.id}
                  className="inline-block h-8.5 w-8.5 rounded-full ring-2 ring-white dark:ring-gray-900 bg-gradient-to-br from-indigo-400 to-indigo-650 flex items-center justify-center cursor-pointer group relative border border-white dark:border-gray-900"
                  title={`${activeUser.displayName || activeUser.email} (Online)`}
                >
                  {activeUser.photoURL ? (
                    <img
                      className="h-full w-full rounded-full object-cover"
                      src={activeUser.photoURL}
                      alt={activeUser.displayName}
                    />
                  ) : (
                    <span className="text-xs font-semibold text-white">
                      {(activeUser.displayName || activeUser.email || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                  {/* Tooltip on hover */}
                  <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-2xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                    {activeUser.displayName || activeUser.email}
                  </span>
                </div>
              ))}
            </div>
            {activeUsers.length > 0 && (
              <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {activeUsers.length} active
              </span>
            )}
          </div>

          <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>

          {canManage && (
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <i className="fas fa-user-plus" />
              Add Member
            </button>
          )}
        </div>
      </div>
      
      {/* Workspace Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6 -mb-px">
          <button
            onClick={() => setActiveTab('posts')}
            className={clsx(
              'py-3.5 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors',
              activeTab === 'posts'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            )}
          >
            <i className="fas fa-calendar-alt text-xs" />
            Posts Grid ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={clsx(
              'py-3.5 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors',
              activeTab === 'members'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            )}
          >
            <i className="fas fa-users text-xs" />
            Team Members ({members.length})
          </button>
        </nav>
      </div>
      
      {/* Tab Panels */}
      {activeTab === 'posts' ? (
        <div className="space-y-6">
          {/* Post Filter and Add Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 border border-gray-150 dark:border-gray-700 rounded-xl">
            <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md">
              <div className="relative w-full">
                <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={postSearchQuery}
                  onChange={(e) => setPostSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <select
                value={postStatusFilter}
                onChange={(e) => setPostStatusFilter(e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">All Statuses</option>
                <option value={POST_STATUS.DRAFT}>Draft</option>
                <option value={POST_STATUS.PENDING_REVIEW}>Pending Review</option>
                <option value={POST_STATUS.APPROVED}>Approved</option>
                <option value={POST_STATUS.REJECTED}>Rejected</option>
              </select>
            </div>
            
            {canEdit(activeUserRole) && (
              <button
                onClick={handleOpenCreatePost}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm w-full sm:w-auto justify-center"
              >
                <i className="fas fa-plus" />
                Create Post
              </button>
            )}
          </div>
          
          {/* Post Cards Grid */}
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-2xl p-6 shadow-xs">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                <i className="fas fa-calendar-plus text-2xl text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">
                No Shared Posts Found
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-sm mx-auto">
                {postSearchQuery || postStatusFilter !== 'All' 
                  ? 'No posts fit your current filters. Try adjusting them.' 
                  : 'Start planning by adding the first social media post in this workspace.'}
              </p>
              {canEdit(activeUserRole) && !postSearchQuery && postStatusFilter === 'All' && (
                <button
                  onClick={handleOpenCreatePost}
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
                >
                  Create First Post
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => {
                const platform = platformIcons[post.platform] || platformIcons.instagram;
                // Look up author name from members list
                const authorMember = members.find(m => m.id === post.createdBy || m.userId === post.createdBy);
                const authorName = authorMember ? (authorMember.userId || authorMember.id) : (post.createdBy || 'Unknown');
                
                return (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="group flex flex-col bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 hover:border-indigo-500/50 hover:shadow-md rounded-xl overflow-hidden cursor-pointer transition-all duration-300 relative shadow-sm"
                  >
                    {/* Hover actions in corner */}
                    {canEdit(activeUserRole) && (
                      <div 
                        className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-800/90 backdrop-blur-xs p-1 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => handleEditPost(post, e)}
                          className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-250 transition-colors"
                          title="Edit post"
                        >
                          <i className="fas fa-pencil-alt text-xs" />
                        </button>
                        {canDelete(activeUserRole) && (
                          <button
                            onClick={(e) => handleDeletePost(post.id, e)}
                            className="p-1 text-red-400 hover:text-red-600 transition-colors"
                            title="Delete post"
                          >
                            <i className="fas fa-trash-alt text-xs" />
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className={clsx(
                            'w-7 h-7 rounded-full text-white flex items-center justify-center text-xs shadow-xs',
                            platform.class
                          )}>
                            <i className={`fab ${platform.icon}`} />
                          </span>
                          <StatusBadge status={post.status} />
                        </div>
                        
                        {post.image && (
                          <div className="relative rounded-lg overflow-hidden h-32 border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                            <img
                              src={post.image}
                              alt={post.title}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = 'https://placehold.co/300x150/cccccc/ffffff?text=Image+Error'; }}
                            />
                          </div>
                        )}
                        
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">
                            {post.title}
                          </h4>
                          {post.content && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {post.content}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Card Footer info */}
                      <div className="flex items-center justify-between text-2xs text-gray-400 pt-3.5 border-t border-gray-100 dark:border-gray-700 mt-auto">
                        <span className="truncate max-w-[120px]" title={`By ${authorName}`}>
                          By {authorName.split('@')[0]}
                        </span>
                        <div className="flex items-center gap-1 font-medium text-gray-500 dark:text-gray-400">
                          <i className="far fa-calendar text-[10px]" />
                          <span>{post.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <MemberList
          members={members}
          currentUserId={user?.uid}
          onRemove={handleRemoveMember}
          onUpdateRole={handleUpdateRole}
          canManage={canManage}
        />
      )}
      
      {/* Workspace Post Modal */}
      {isPostModalOpen && (
        <PostModal
          post={editingPost}
          onClose={() => {
            setIsPostModalOpen(false);
            setEditingPost(null);
          }}
          existingPosts={posts}
          workspaceId={currentWorkspace.id}
        />
      )}
      
      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onSubmit={handleAddMember}
      />
      
      {/* Slide-out Post Details Drawer */}
      {selectedPost && (
        <div className="fixed inset-0 overflow-hidden z-50 animate-fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={() => setSelectedPost(null)} />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white dark:bg-gray-800 shadow-2xl flex flex-col border-l border-gray-150 dark:border-gray-700 animate-slide-in">
              {/* Drawer Header */}
              <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-2.5">
                  <span className={clsx(
                    'w-8 h-8 rounded-full text-white flex items-center justify-center text-sm shadow-xs',
                    platformIcons[selectedPost.platform]?.class || 'bg-indigo-650'
                  )}>
                    <i className={`fab ${platformIcons[selectedPost.platform]?.icon || 'fa-instagram'}`} />
                  </span>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white truncate max-w-[200px]" title={selectedPost.title}>
                    {selectedPost.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-250 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-750 rounded-lg transition-colors"
                >
                  <i className="fas fa-times text-lg" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Image preview */}
                {selectedPost.image && (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shadow-inner">
                    <img
                      src={selectedPost.image}
                      alt={selectedPost.title}
                      className="w-full max-h-48 object-cover"
                      onError={(e) => { e.target.src = 'https://placehold.co/400x200/cccccc/ffffff?text=Image+Not+Found'; }}
                    />
                  </div>
                )}

                {/* Content text */}
                <div className="space-y-1.5">
                  <h3 className="text-2xs font-bold text-gray-400 uppercase tracking-widest">Caption / Text Content</h3>
                  <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl whitespace-pre-wrap leading-relaxed border border-gray-100 dark:border-gray-750">
                    {selectedPost.content || <span className="italic text-gray-400">No caption content provided.</span>}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-750">
                  <div className="space-y-0.5">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scheduled Date</h3>
                    <p className="text-sm text-gray-900 dark:text-white font-bold flex items-center gap-1.5">
                      <i className="far fa-calendar text-gray-400 text-xs" />
                      {selectedPost.date || 'Unscheduled'}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scheduled Time</h3>
                    <p className="text-sm text-gray-900 dark:text-white font-bold flex items-center gap-1.5">
                      <i className="far fa-clock text-gray-400 text-xs" />
                      {selectedPost.time || '--:--'}
                    </p>
                  </div>
                </div>

                {/* Workflow Approvals */}
                <div className="border-t border-b border-gray-150 dark:border-gray-750 py-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xs font-bold text-gray-400 uppercase tracking-widest">Workflow State</h3>
                      <div className="mt-1.5">
                        <StatusBadge status={selectedPost.status} />
                      </div>
                    </div>
                    {selectedPost.statusUpdatedBy && (
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reviewed By</p>
                        <p className="text-xs text-gray-750 dark:text-gray-300 font-bold mt-1 max-w-[150px] truncate" title={selectedPost.statusUpdatedBy}>
                          {selectedPost.statusUpdatedBy.split('@')[0]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {/* Submit for Review */}
                    {canEdit(activeUserRole) && (selectedPost.status === POST_STATUS.DRAFT || selectedPost.status === POST_STATUS.REJECTED) && (
                      <button
                        onClick={async () => {
                          const userEmail = user?.email || user?.uid || 'Unknown';
                          await updatePostStatus(selectedPost.id, POST_STATUS.PENDING_REVIEW);
                          setSelectedPost(prev => ({ ...prev, status: POST_STATUS.PENDING_REVIEW, statusUpdatedBy: userEmail }));
                        }}
                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors text-center"
                      >
                        Submit for Review
                      </button>
                    )}

                    {/* Approve / Reject Actions */}
                    {canManage && selectedPost.status === POST_STATUS.PENDING_REVIEW && (
                      <>
                        <button
                          onClick={async () => {
                            const userEmail = user?.email || user?.uid || 'Unknown';
                            await updatePostStatus(selectedPost.id, POST_STATUS.APPROVED);
                            setSelectedPost(prev => ({ ...prev, status: POST_STATUS.APPROVED, statusUpdatedBy: userEmail }));
                          }}
                          className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors text-center"
                        >
                          Approve Post
                        </button>
                        <button
                          onClick={async () => {
                            const userEmail = user?.email || user?.uid || 'Unknown';
                            await updatePostStatus(selectedPost.id, POST_STATUS.REJECTED);
                            setSelectedPost(prev => ({ ...prev, status: POST_STATUS.REJECTED, statusUpdatedBy: userEmail }));
                          }}
                          className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors text-center"
                        >
                          Reject Post
                        </button>
                      </>
                    )}

                    {/* Revert back to Draft */}
                    {canManage && (selectedPost.status === POST_STATUS.APPROVED || selectedPost.status === POST_STATUS.REJECTED) && (
                      <button
                        onClick={async () => {
                          const userEmail = user?.email || user?.uid || 'Unknown';
                          await updatePostStatus(selectedPost.id, POST_STATUS.DRAFT);
                          setSelectedPost(prev => ({ ...prev, status: POST_STATUS.DRAFT, statusUpdatedBy: userEmail }));
                        }}
                        className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-600 transition-colors text-center"
                      >
                        Revert to Draft
                      </button>
                    )}
                  </div>
                </div>

                {/* Comments Stream */}
                <div className="space-y-4 pb-4">
                  <h3 className="text-2xs font-bold text-gray-400 uppercase tracking-widest">Comments & Activity</h3>
                  
                  {/* Comments list scrolling */}
                  <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                    {comments.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4">
                        <i className="far fa-comments text-gray-300 dark:text-gray-600 text-xl mb-1.5 block" />
                        <p className="text-xs text-gray-400 italic">No comments yet. Start the team discussion!</p>
                      </div>
                    ) : (
                      comments.map((comment) => {
                        const isAuthor = comment.userId === user?.uid;
                        const canDeleteComment = isAuthor || canDelete(activeUserRole);
                        return (
                          <div 
                            key={comment.id} 
                            className="bg-gray-50 dark:bg-gray-700/20 border border-gray-100 dark:border-gray-750/30 p-3 rounded-xl relative group/comment transition-shadow hover:shadow-2xs"
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-indigo-650 dark:text-indigo-400 truncate max-w-[170px]" title={comment.authorName || comment.userId}>
                                {comment.authorName || comment.userId.split('@')[0]}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap font-medium">
                              {comment.text}
                            </p>
                            {canDeleteComment && (
                              <button
                                onClick={async () => {
                                  if (confirm('Delete this comment permanently?')) {
                                    await deleteComment(selectedPost.id, comment.id);
                                  }
                                }}
                                className="absolute top-2 right-2 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 opacity-0 group-hover/comment:opacity-100 transition-opacity p-1 rounded-md"
                                title="Delete comment"
                              >
                                <i className="fas fa-trash-alt text-2xs" />
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Comment submit form */}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!commentInput.trim()) return;
                      await addComment(selectedPost.id, {
                        text: commentInput.trim(),
                        authorName: user?.displayName || user?.email?.split('@')[0] || 'Teammate'
                      });
                      setCommentInput('');
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="Discuss this post with the team..."
                      className="flex-1 px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={!commentInput.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-colors"
                    >
                      Post
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceView;