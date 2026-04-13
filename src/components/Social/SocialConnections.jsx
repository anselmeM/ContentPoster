import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { getAllConnectionStatus, 
  twitterService, 
  instagramService, 
  pinterestService, 
  youtubeService, 
  snapchatService, 
  redditService 
} from '../../services/socialApi';

const PlatformConnectionCard = ({ 
  platform, 
  name, 
  icon, 
  color, 
  isConnected, 
  onConnect, 
  onDisconnect,
  description 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleClick = async () => {
    if (isConnected) {
      if (confirm(`Disconnect ${name}? This will not delete your scheduled posts.`)) {
        setIsLoading(true);
        await onDisconnect();
        setIsLoading(false);
      }
    } else {
      setIsLoading(true);
      await onConnect();
      setIsLoading(false);
    }
  };
  
  return (
    <div className={clsx(
      'bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-2 transition-all',
      isConnected ? 'border-green-500 dark:border-green-400' : 'border-gray-200 dark:border-gray-700'
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl',
            color
          )}>
            <i className={clsx('fab', icon)} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
        
        <button
          onClick={handleClick}
          disabled={isLoading}
          className={clsx(
            'px-4 py-2 rounded-lg font-medium transition-colors',
            isConnected 
              ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
              : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50',
            isLoading && 'opacity-50 cursor-wait'
          )}
        >
          {isLoading ? (
            <i className="fas fa-spinner fa-spin" />
          ) : isConnected ? (
            <>
              <i className="fas fa-check-circle mr-2" />
              Connected
            </>
          ) : (
            <>
              <i className="fas fa-link mr-2" />
              Connect
            </>
          )}
        </button>
      </div>
      
      {isConnected && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center text-sm text-green-600 dark:text-green-400">
            <i className="fas fa-circle text-xs mr-2 animate-pulse" />
            <span>API connection active</span>
          </div>
        </div>
      )}
    </div>
  );
};

const SocialConnections = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    twitter: false,
    instagram: false,
    pinterest: false,
    youtube: false,
    snapchat: false,
    reddit: false
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    checkConnections();
  }, []);
  
  const checkConnections = async () => {
    setLoading(true);
    try {
      const status = getAllConnectionStatus();
      setConnectionStatus(status);
    } catch (error) {
      console.error('Failed to check connections:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const platformConfigs = [
    {
      id: 'twitter',
      name: 'Twitter / X',
      icon: 'fa-x-twitter',
      color: 'bg-black',
      description: 'Post tweets, threads, and media',
      onConnect: () => twitterService.initiateAuth(),
      onDisconnect: () => twitterService.disconnect()
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: 'fa-instagram',
      color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500',
      description: 'Post photos, videos, and stories',
      onConnect: () => instagramService.initiateAuth(),
      onDisconnect: () => instagramService.disconnect()
    },
    {
      id: 'pinterest',
      name: 'Pinterest',
      icon: 'fa-pinterest-p',
      color: 'bg-red-600',
      description: 'Create pins and boards',
      onConnect: () => pinterestService.initiateAuth(),
      onDisconnect: () => pinterestService.disconnect()
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: 'fa-youtube',
      color: 'bg-red-600',
      description: 'Upload videos with scheduling',
      onConnect: () => youtubeService.initiateAuth(),
      onDisconnect: () => youtubeService.disconnect()
    },
    {
      id: 'snapchat',
      name: 'Snapchat',
      icon: 'fa-snapchat',
      color: 'bg-yellow-500',
      description: 'Create ads and content',
      onConnect: () => snapchatService.initiateAuth(),
      onDisconnect: () => snapchatService.disconnect()
    },
    {
      id: 'reddit',
      name: 'Reddit',
      icon: 'fa-reddit-alien',
      color: 'bg-orange-500',
      description: 'Post to subreddits',
      onConnect: () => redditService.initiateAuth(),
      onDisconnect: () => redditService.disconnect()
    }
  ];
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  const connectedCount = Object.values(connectionStatus).filter(Boolean).length;
  
  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
            <i className="fas fa-plug text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">
              Social Media API Connections
            </h3>
            <p className="text-sm text-indigo-700 dark:text-indigo-300">
              {connectedCount} of {platformConfigs.length} platforms connected
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platformConfigs.map((platform) => (
          <PlatformConnectionCard
            key={platform.id}
            platform={platform.id}
            name={platform.name}
            icon={platform.icon}
            color={platform.color}
            description={platform.description}
            isConnected={connectionStatus[platform.id]}
            onConnect={platform.onConnect}
            onDisconnect={platform.onDisconnect}
          />
        ))}
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          <i className="fas fa-info-circle mr-2" />
          About API Connections
        </h4>
        <ul className="space-y-1">
          <li>• Connections use OAuth 2.0 for secure authentication</li>
          <li>• Your credentials are never stored on our servers</li>
          <li>• Disconnecting removes API access but preserves scheduled posts</li>
          <li>• Some features require API keys - see environment variables</li>
        </ul>
      </div>
    </div>
  );
};

export default SocialConnections;