import { useState } from 'react';
import { useTeam } from '../../context/TeamContext';
import { TEAM_ROLES, POST_STATUS } from '../../services/firebase';
import clsx from 'clsx';

// Icons using Font Awesome class names (assuming Font Awesome is loaded)
const RoleBadge = ({ role }) => {
  const roleConfig = {
    [TEAM_ROLES.OWNER]: { label: 'Owner', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    [TEAM_ROLES.ADMIN]: { label: 'Admin', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    [TEAM_ROLES.EDITOR]: { label: 'Editor', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    [TEAM_ROLES.VIEWER]: { label: 'Viewer', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' }
  };
  
  const config = roleConfig[role] || roleConfig[TEAM_ROLES.VIEWER];
  
  return (
    <span className={clsx('px-2 py-1 text-xs font-medium rounded-full', config.color)}>
      {config.label}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const statusConfig = {
    [POST_STATUS.DRAFT]: { label: 'Draft', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
    [POST_STATUS.PENDING_REVIEW]: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    [POST_STATUS.APPROVED]: { label: 'Approved', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    [POST_STATUS.REJECTED]: { label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
  };
  
  const config = statusConfig[status] || statusConfig[POST_STATUS.DRAFT];
  
  return (
    <span className={clsx('px-2 py-1 text-xs font-medium rounded-full', config.color)}>
      {config.label}
    </span>
  );
};

const WorkspaceCard = ({ workspace, onSelect, onEdit, onDelete }) => {
  const { members, user } = useTeam();
  const userRole = workspace.userRole;
  const canManage = (userRole === TEAM_ROLES.OWNER || userRole === TEAM_ROLES.ADMIN);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 cursor-pointer" onClick={() => onSelect(workspace)}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {workspace.name}
          </h3>
          {workspace.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {workspace.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <RoleBadge role={userRole} />
          {canManage && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(workspace); }}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Edit workspace"
              >
                <i className="fas fa-edit" />
              </button>
              {userRole === TEAM_ROLES.OWNER && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(workspace); }}
                  className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
                  title="Delete workspace"
                >
                  <i className="fas fa-trash" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
        <i className="fas fa-users mr-2" />
        <span>{workspace.memberCount || 0} members</span>
      </div>
    </div>
  );
};

const CreateWorkspaceModal = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  if (!isOpen) return null;
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, description });
    setName('');
    setDescription('');
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create New Workspace
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <i className="fas fa-times text-xl" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="workspace-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Workspace Name *
            </label>
            <input
              id="workspace-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Marketing Team"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="workspace-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="workspace-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="Optional description for this workspace"
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg"
            >
              Create Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddMemberModal = ({ isOpen, onClose, onSubmit, workspaceId }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(TEAM_ROLES.EDITOR);
  const [loading, setLoading] = useState(false);
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({ userId: email, role }); // In real app, would look up user ID by email
    setLoading(false);
    setEmail('');
    setRole(TEAM_ROLES.EDITOR);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Add Team Member
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <i className="fas fa-times text-xl" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="member-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Member Email *
            </label>
            <input
              id="member-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="colleague@example.com"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="member-role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select
              id="member-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value={TEAM_ROLES.VIEWER}>Viewer - Can view posts only</option>
              <option value={TEAM_ROLES.EDITOR}>Editor - Can create and edit posts</option>
              <option value={TEAM_ROLES.ADMIN}>Admin - Can manage members and settings</option>
            </select>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MemberList = ({ members, currentUserId, onRemove, onUpdateRole, canManage }) => {
  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <span className="text-indigo-600 dark:text-indigo-300 font-medium">
                {member.userId?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {member.userId}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Joined {new Date(member.joinedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RoleBadge role={member.role} />
            {canManage && member.role !== TEAM_ROLES.OWNER && (
              <div className="flex gap-1">
                <select
                  value={member.role}
                  onChange={(e) => onUpdateRole(member.id, e.target.value)}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-600 dark:text-white"
                >
                  <option value={TEAM_ROLES.VIEWER}>Viewer</option>
                  <option value={TEAM_ROLES.EDITOR}>Editor</option>
                  <option value={TEAM_ROLES.ADMIN}>Admin</option>
                </select>
                <button
                  onClick={() => onRemove(member.id)}
                  className="p-1 text-red-500 hover:text-red-700"
                  title="Remove member"
                >
                  <i className="fas fa-user-minus" />
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
    loading,
    createWorkspace,
    selectWorkspace,
    addMember,
    removeMember,
    updateMemberRole,
    getUserRole,
    canManageMembers
  } = useTeam();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'members'
  const [userRole, setUserRole] = useState(null);
  
  // Get user role when workspace changes
  useState(() => {
    if (currentWorkspace) {
      getUserRole(currentWorkspace.id).then(setUserRole);
    }
  });
  
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
  
  const canManage = currentWorkspace && canManageMembers(currentWorkspace.userRole);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  // If no workspace selected, show workspace list
  if (!currentWorkspace) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Team Workspaces
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg"
          >
            <i className="fas fa-plus" />
            New Workspace
          </button>
        </div>
        
        {workspaces.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <i className="fas fa-folder-open text-3xl text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Workspaces Yet
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create a workspace to start collaborating with your team
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg"
            >
              Create Your First Workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                onSelect={selectWorkspace}
                onEdit={(ws) => console.log('Edit', ws)}
                onDelete={(ws) => console.log('Delete', ws)}
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
  
  // Show workspace detail view
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => selectWorkspace(null)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <i className="fas fa-arrow-left" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentWorkspace.name}
            </h1>
            {currentWorkspace.description && (
              <p className="text-gray-500 dark:text-gray-400">
                {currentWorkspace.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <RoleBadge role={currentWorkspace.userRole} />
          {canManage && (
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm"
            >
              <i className="fas fa-user-plus" />
              Add Member
            </button>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('posts')}
            className={clsx(
              'py-2 px-1 border-b-2 font-medium text-sm',
              activeTab === 'posts'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            )}
          >
            <i className="fas fa-calendar-alt mr-2" />
            Posts
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={clsx(
              'py-2 px-1 border-b-2 font-medium text-sm',
              activeTab === 'members'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            )}
          >
            <i className="fas fa-users mr-2" />
            Team Members ({members.length})
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'posts' ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <i className="fas fa-calendar-plus text-3xl text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Workspace Posts
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Posts in this workspace will appear here with approval workflow
          </p>
          <button
            className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg"
          >
            Create Post
          </button>
        </div>
      ) : (
        <MemberList
          members={members}
          currentUserId={currentWorkspace.userRole}
          onRemove={handleRemoveMember}
          onUpdateRole={handleUpdateRole}
          canManage={canManage}
        />
      )}
      
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onSubmit={handleAddMember}
        workspaceId={currentWorkspace?.id}
      />
    </div>
  );
};

export default WorkspaceView;