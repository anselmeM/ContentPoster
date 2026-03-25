import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

const navItems = [
  { id: 'scheduler', label: 'Scheduler', icon: 'fa-calendar-alt' },
  { id: 'analytics', label: 'Analytics', icon: 'fa-chart-line' },
  { id: 'media', label: 'Media Library', icon: 'fa-images' },
  { id: 'tasks', label: 'Tasks', icon: 'fa-check-square' },
  { id: 'templates', label: 'Templates', icon: 'fa-file-alt' },
  { id: 'settings', label: 'Settings', icon: 'fa-cog' }
];

const Sidebar = ({ currentView, setCurrentView, isPanelCollapsed, togglePanel, onLogout }) => {
  const { user } = useAuth();

  return (
    <aside 
      className={clsx(
        'bg-white dark:bg-gray-800 flex flex-col items-center py-6 space-y-8 flex-shrink-0 transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-700',
        isPanelCollapsed ? 'w-16' : 'w-20'
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="text-2xl font-bold text-indigo-600" aria-label="Content Cadence">
        CC
      </div>
      
      {/* Navigation */}
      <nav className="flex flex-col items-center space-y-6" role="menubar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={clsx(
              'group relative p-3 rounded-lg transition-colors duration-200',
              currentView === item.id 
                ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' 
                : 'text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
            )}
            role="menuitem"
            aria-current={currentView === item.id ? 'page' : undefined}
            title={isPanelCollapsed ? item.label : undefined}
          >
            <i className={`fas ${item.icon}`} aria-hidden="true" />
            
            {/* Tooltip */}
            {!isPanelCollapsed && (
              <span 
                className="absolute left-full ml-4 top-1/2 -translate-y-1/2 w-auto min-w-max p-2 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"
                role="tooltip"
              >
                {item.label}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Collapse button */}
      <button
        onClick={togglePanel}
        className="group relative text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-3 rounded-lg transition-colors duration-200"
        aria-label={isPanelCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={isPanelCollapsed ? 'Expand' : 'Collapse'}
      >
        <i 
          className={clsx('fas transition-transform duration-200', isPanelCollapsed ? 'fa-chevron-right' : 'fa-chevron-left')} 
          aria-hidden="true" 
        />
        <span 
          className="absolute left-full ml-4 top-1/2 -translate-y-1/2 w-auto min-w-max p-2 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"
        >
          {isPanelCollapsed ? 'Expand' : 'Collapse'}
        </span>
      </button>

      {/* Logout */}
      <div className="mt-auto">
        <button
          onClick={onLogout}
          className="group relative text-gray-400 hover:text-red-600 p-3 rounded-lg transition-colors duration-200"
          aria-label="Log out"
          title="Logout"
        >
          <i className="fas fa-sign-out-alt" aria-hidden="true" />
          <span 
            className="absolute left-full ml-4 top-1/2 -translate-y-1/2 w-auto min-w-max p-2 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"
          >
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;