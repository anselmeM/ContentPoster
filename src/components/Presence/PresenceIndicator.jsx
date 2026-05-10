import { useTeam } from '../../context/TeamContext';
import clsx from 'clsx';
import { sanitizeURL } from '../../utils/sanitizeUtils';

const ActiveUser = ({ user, isCurrentUser }) => {
  // Generate a consistent color based on user ID
  const getAvatarColor = (id) => {
    const colors = [
      'bg-red-500',
      'bg-orange-500',
      'bg-amber-500',
      'bg-yellow-500',
      'bg-lime-500',
      'bg-green-500',
      'bg-emerald-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-sky-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-violet-500',
      'bg-purple-500',
      'bg-fuchsia-500',
      'bg-pink-500',
      'bg-rose-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < (id || '').length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };
  
  const initials = (user.displayName || user.email || 'U')
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase();
  
  return (
    <div className="relative group" title={user.displayName || user.email || 'User'}>
      <div className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium border-2',
        isCurrentUser ? 'border-indigo-500' : 'border-white dark:border-gray-800',
        getAvatarColor(user.userId || user.id)
      )}>
        {user.photoURL ? (
          <img 
            src={sanitizeURL(user.photoURL)}
            alt={user.displayName || 'User'}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {isCurrentUser ? 'You' : (user.displayName || user.email || 'User')}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
      </div>
      
      {/* Online indicator */}
      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
    </div>
  );
};

const ActiveUserList = ({ maxDisplay = 5 }) => {
  const { activeUsers, user } = useTeam();
  
  // Filter out current user for display
  const otherUsers = activeUsers.filter(u => (u.userId || u.id) !== user?.uid);
  const displayUsers = otherUsers.slice(0, maxDisplay);
  const remainingCount = otherUsers.length - maxDisplay;
  
  if (activeUsers.length === 0) {
    return null;
  }
  
  return (
    <div className="flex items-center">
      {/* Current user */}
      {user && (
        <div className="mr-1">
          <ActiveUser 
            user={{ 
              userId: user.uid, 
              displayName: user.displayName, 
              email: user.email,
              photoURL: user.photoURL 
            }} 
            isCurrentUser={true} 
          />
        </div>
      )}
      
      {/* Other users */}
      {displayUsers.map((activeUser, index) => (
        <div 
          key={activeUser.userId || activeUser.id} 
          className="ml-1"
          style={{ marginLeft: index === 0 && user ? '-4px' : '-4px' }}
        >
          <ActiveUser user={activeUser} isCurrentUser={false} />
        </div>
      ))}
      
      {/* More indicator */}
      {remainingCount > 0 && (
        <div className="ml-1 w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800">
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

const PresenceIndicator = () => {
  const { activeUsers, currentWorkspace } = useTeam();
  
  if (!currentWorkspace) {
    return null;
  }
  
  const uniqueUsers = new Set(activeUsers.map(u => u.userId || u.id)).size;
  
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <div className="flex -space-x-2">
        <ActiveUserList maxDisplay={3} />
      </div>
      <span>
        {uniqueUsers === 0 
          ? 'Only you' 
          : uniqueUsers === 1 
            ? '1 other viewing' 
            : `${uniqueUsers} people viewing`
        }
      </span>
    </div>
  );
};

// Cursor component for showing position on the scheduler
const CursorOverlay = () => {
  const { activeUsers, user } = useTeam();
  
  // This would need to be integrated with the actual cursor tracking
  // For now, we just show the active users list
  // In a full implementation, you'd track mouse position and broadcast it
  
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {activeUsers
        .filter(u => (u.userId || u.id) !== user?.uid && u.cursorPosition)
        .map((activeUser) => (
          <div
            key={activeUser.userId || activeUser.id}
            className="absolute transition-all duration-100"
            style={{
              left: activeUser.cursorPosition.x,
              top: activeUser.cursorPosition.y
            }}
          >
            {/* Cursor arrow */}
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="currentColor"
              className="text-blue-500"
            >
              <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L5.92 2.86a.5.5 0 0 0-.42.35z" />
            </svg>
            
            {/* Name label */}
            <div className="absolute left-4 top-4 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {activeUser.displayName || activeUser.email || 'User'}
            </div>
          </div>
        ))}
    </div>
  );
};

export { ActiveUser, ActiveUserList, PresenceIndicator, CursorOverlay };
export default PresenceIndicator;