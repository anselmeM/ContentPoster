import { useState } from 'react';
import { useTeam } from '../../context/TeamContext';
import { POST_STATUS, TEAM_ROLES } from '../../services/firebase';
import clsx from 'clsx';

const statusIcons = {
  [POST_STATUS.DRAFT]: 'fa-file-alt',
  [POST_STATUS.PENDING_REVIEW]: 'fa-clock',
  [POST_STATUS.APPROVED]: 'fa-check-circle',
  [POST_STATUS.REJECTED]: 'fa-times-circle'
};

const statusLabels = {
  [POST_STATUS.DRAFT]: 'Draft',
  [POST_STATUS.PENDING_REVIEW]: 'Pending Review',
  [POST_STATUS.APPROVED]: 'Approved',
  [POST_STATUS.REJECTED]: 'Rejected'
};

const StatusBadge = ({ status, onClick }) => {
  const statusClasses = {
    [POST_STATUS.DRAFT]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-300',
    [POST_STATUS.PENDING_REVIEW]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300',
    [POST_STATUS.APPROVED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300',
    [POST_STATUS.REJECTED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        statusClasses[status] || statusClasses[POST_STATUS.DRAFT],
        onClick && 'cursor-pointer hover:opacity-80'
      )}
    >
      <i className={clsx('fas', statusIcons[status] || statusIcons[POST_STATUS.DRAFT])} />
      <span>{statusLabels[status] || statusLabels[POST_STATUS.DRAFT]}</span>
    </button>
  );
};

const StatusDropdown = ({ currentStatus, onStatusChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleStatusChange = (newStatus) => {
    onStatusChange(newStatus);
    setIsOpen(false);
  };
  
  if (disabled) {
    return <StatusBadge status={currentStatus} />;
  }
  
  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="relative"
      >
        <StatusBadge status={currentStatus} />
      </button>
      
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]">
          {Object.values(POST_STATUS).map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={status === currentStatus}
              className={clsx(
                'w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700',
                status === currentStatus && 'bg-gray-50 dark:bg-gray-700 text-gray-400',
                status !== currentStatus && 'text-gray-700 dark:text-gray-200'
              )}
            >
              <i className={clsx('fas', statusIcons[status])} />
              <span>{statusLabels[status]}</span>
              {status === currentStatus && (
                <i className="fas fa-check ml-auto text-green-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ApprovalActions = ({ post, onStatusChange }) => {
  const { currentWorkspace, canEdit, user } = useTeam();
  const [isUpdating, setIsUpdating] = useState(false);
  
  if (!currentWorkspace) {
    return null;
  }
  
  const userRole = currentWorkspace.userRole;
  const canApprove = userRole === TEAM_ROLES.OWNER || userRole === TEAM_ROLES.ADMIN;
  const canEditPost = canEdit(userRole);
  
  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      await onStatusChange(post.id, newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update post status');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Quick action buttons for easy status changes
  const QuickActions = () => {
    if (!canApprove) {
      return null;
    }
    
    return (
      <div className="flex items-center gap-1 ml-2">
        {post.status === POST_STATUS.DRAFT && (
          <button
            onClick={() => handleStatusChange(POST_STATUS.PENDING_REVIEW)}
            disabled={isUpdating}
            className="p-1 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
            title="Submit for review"
          >
            <i className="fas fa-paper-plane" />
          </button>
        )}
        
        {post.status === POST_STATUS.PENDING_REVIEW && (
          <>
            <button
              onClick={() => handleStatusChange(POST_STATUS.APPROVED)}
              disabled={isUpdating}
              className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
              title="Approve post"
            >
              <i className="fas fa-check" />
            </button>
            <button
              onClick={() => handleStatusChange(POST_STATUS.REJECTED)}
              disabled={isUpdating}
              className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
              title="Reject post"
            >
              <i className="fas fa-times" />
            </button>
          </>
        )}
      </div>
    );
  };
  
  return (
    <div className="flex items-center">
      <StatusDropdown
        currentStatus={post.status || POST_STATUS.DRAFT}
        onStatusChange={(newStatus) => handleStatusChange(newStatus)}
        disabled={!canEditPost || isUpdating}
      />
      <QuickActions />
      {isUpdating && (
        <i className="fas fa-spinner fa-spin text-gray-400 ml-2" />
      )}
    </div>
  );
};

// Workflow indicator showing the full pipeline
const WorkflowIndicator = ({ currentStatus, showLabels = true }) => {
  const steps = [
    { status: POST_STATUS.DRAFT, label: 'Draft' },
    { status: POST_STATUS.PENDING_REVIEW, label: 'Review' },
    { status: POST_STATUS.APPROVED, label: 'Approved' }
  ];
  
  const currentIndex = steps.findIndex(s => s.status === currentStatus);
  
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => (
        <div key={step.status} className="flex items-center">
          <div
            className={clsx(
              'w-6 h-6 rounded-full flex items-center justify-center text-xs',
              index < currentIndex
                ? 'bg-green-500 text-white'
                : index === currentIndex
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            )}
          >
            {index < currentIndex ? (
              <i className="fas fa-check" />
            ) : (
              index + 1
            )}
          </div>
          {showLabels && index < steps.length - 1 && (
            <div
              className={clsx(
                'w-8 h-0.5 mx-1',
                index < currentIndex
                  ? 'bg-green-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export { StatusBadge, StatusDropdown, ApprovalActions, WorkflowIndicator };
export default ApprovalActions;