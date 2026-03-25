// Social Media API Integration Service
// Handles authentication and posting to various social media platforms

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Generic fetch wrapper with auth
const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('social_auth_token');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'API request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
};

// Twitter/X API v2 Integration
export const twitterService = {
  // OAuth flow for Twitter
  initiateAuth: () => {
    const clientId = import.meta.env.VITE_TWITTER_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/twitter/callback`;
    const scope = 'tweet.read tweet.write users.read offline.access';
    
    const authUrl = `https://twitter.com/i/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&state=twitter_auth`;
    
    window.location.href = authUrl;
  },
  
  // Exchange code for tokens
  handleAuthCallback: async (code) => {
    const response = await apiFetch('/auth/twitter/token', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
    
    if (response.access_token) {
      localStorage.setItem('twitter_token', response.access_token);
      localStorage.setItem('twitter_refresh_token', response.refresh_token);
      localStorage.setItem('twitter_user_id', response.user_id);
    }
    
    return response;
  },
  
  // Post a tweet
  createTweet: async (content, mediaUrls = []) => {
    const token = localStorage.getItem('twitter_token');
    
    const payload = {
      text: content,
      ...(mediaUrls.length > 0 && {
        media: {
          media_ids: mediaUrls
        }
      })
    };
    
    return await apiFetch('/twitter/v2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  },
  
  // Upload media to Twitter
  uploadMedia: async (file) => {
    const token = localStorage.getItem('twitter_token');
    
    // First, get upload URL
    const { upload_url } = await apiFetch('/twitter/v2/media/upload-init', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ 
        total_bytes: file.size,
        media_type: file.type 
      })
    });
    
    // Upload the actual media
    const formData = new FormData();
    formData.append('media', file);
    formData.append('media_key', upload_url.media_key);
    
    const response = await fetch(upload_url.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    return response.json();
  },
  
  // Get user profile
  getProfile: async () => {
    const token = localStorage.getItem('twitter_token');
    
    return await apiFetch('/twitter/v2/users/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  
  // Check if connected
  isConnected: () => {
    return !!localStorage.getItem('twitter_token');
  },
  
  // Disconnect
  disconnect: () => {
    localStorage.removeItem('twitter_token');
    localStorage.removeItem('twitter_refresh_token');
    localStorage.removeItem('twitter_user_id');
  }
};

// Instagram Graph API Integration
export const instagramService = {
  // Facebook OAuth for Instagram
  initiateAuth: () => {
    const clientId = import.meta.env.VITE_FACEBOOK_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/facebook/callback`;
    const scope = 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement';
    
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&state=instagram_auth`;
    
    window.location.href = authUrl;
  },
  
  // Exchange code for access token
  handleAuthCallback: async (code) => {
    const response = await apiFetch('/facebook/oauth/token', {
      method: 'POST',
      body: JSON.stringify({ 
        code,
        redirect_uri: `${window.location.origin}/auth/facebook/callback`
      })
    });
    
    if (response.access_token) {
      localStorage.setItem('instagram_access_token', response.access_token);
      localStorage.setItem('instagram_user_id', response.user_id);
    }
    
    return response;
  },
  
  // Get Instagram Business Account
  getBusinessAccount: async () => {
    const token = localStorage.getItem('instagram_access_token');
    
    return await apiFetch('/instagram/business/account', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  
  // Create Instagram Post (Image)
  createImagePost: async (imageUrl, caption) => {
    const token = localStorage.getItem('instagram_access_token');
    const userId = localStorage.getItem('instagram_user_id');
    
    // First, create the media container
    const container = await apiFetch(`/${userId}/media`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: caption
      })
    });
    
    // Then publish the container
    const publish = await apiFetch(`/${userId}/media_publish`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        creation_id: container.id
      })
    });
    
    return publish;
  },
  
  // Create Instagram Post (Video)
  createVideoPost: async (videoUrl, thumbnailUrl, caption) => {
    const token = localStorage.getItem('instagram_access_token');
    const userId = localStorage.getItem('instagram_user_id');
    
    // Create video container
    const container = await apiFetch(`/${userId}/media`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        media_type: 'VIDEO',
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        caption: caption,
        is_carousel_item: false
      })
    });
    
    // Wait for processing and publish
    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        const status = await apiFetch(`/${container.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (status.status === 'FINISHED') {
          const publish = await apiFetch(`/${userId}/media_publish`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ creation_id: container.id })
          });
          resolve(publish);
        } else if (status.status === 'ERROR') {
          reject(new Error('Video processing failed'));
        } else {
          setTimeout(checkStatus, 5000); // Check again in 5 seconds
        }
      };
      
      setTimeout(checkStatus, 10000); // Initial wait
    });
  },
  
  // Get insights
  getInsights: async (metric = 'followers_count') => {
    const token = localStorage.getItem('instagram_access_token');
    const userId = localStorage.getItem('instagram_user_id');
    
    return await apiFetch(`/${userId}/insights`, {
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ metric })
    });
  },
  
  // Check if connected
  isConnected: () => {
    return !!localStorage.getItem('instagram_access_token');
  },
  
  // Disconnect
  disconnect: () => {
    localStorage.removeItem('instagram_access_token');
    localStorage.removeItem('instagram_user_id');
  }
};

// Pinterest API Integration
export const pinterestService = {
  initiateAuth: () => {
    const clientId = import.meta.env.VITE_PINTEREST_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/pinterest/callback`;
    const scope = 'pins:read,pins:write,boards:read,boards:write,user:read';
    
    const authUrl = `https://api.pinterest.com/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&state=pinterest_auth`;
    
    window.location.href = authUrl;
  },
  
  handleAuthCallback: async (code) => {
    const response = await apiFetch('/pinterest/oauth/token', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
    
    if (response.access_token) {
      localStorage.setItem('pinterest_token', response.access_token);
    }
    
    return response;
  },
  
  createPin: async (boardId, title, description, imageUrl, link) => {
    const token = localStorage.getItem('pinterest_token');
    
    return await apiFetch('/v5/pins', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        board_id: boardId,
        title: title,
        description: description,
        link: link,
        image_url: imageUrl
      })
    });
  },
  
  getBoards: async () => {
    const token = localStorage.getItem('pinterest_token');
    
    return await apiFetch('/v5/boards', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  
  isConnected: () => !!localStorage.getItem('pinterest_token'),
  
  disconnect: () => localStorage.removeItem('pinterest_token')
};

// YouTube API Integration
export const youtubeService = {
  initiateAuth: () => {
    const clientId = import.meta.env.VITE_YOUTUBE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/youtube/callback`;
    const scope = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&access_type=offline&state=youtube_auth`;
    
    window.location.href = authUrl;
  },
  
  handleAuthCallback: async (code) => {
    const response = await apiFetch('/youtube/oauth/token', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
    
    if (response.access_token) {
      localStorage.setItem('youtube_token', response.access_token);
      localStorage.setItem('youtube_refresh_token', response.refresh_token);
    }
    
    return response;
  },
  
  // Upload video (this is a simplified version - real implementation would use resumable uploads)
  uploadVideo: async (videoFile, title, description, thumbnailUrl, scheduledTime) => {
    const token = localStorage.getItem('youtube_token');
    
    // For scheduled videos, you'd typically use the scheduled publishing feature
    const payload = {
      snippet: {
        title: title,
        description: description,
        tags: [],
        categoryId: '22' // People & Blogs
      },
      status: {
        privacyStatus: scheduledTime ? 'private' : 'public',
        ...(scheduledTime && { publishAt: scheduledTime })
      },
      recordingDetails: {}
    };
    
    // Note: Actual video upload requires multipart form data
    // This is the metadata upload step
    return await apiFetch('/youtube/v3/videos', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  },
  
  // Set thumbnail
  setThumbnail: async (videoId, thumbnailUrl) => {
    const token = localStorage.getItem('youtube_token');
    
    return await apiFetch(`/youtube/v3/videos/${videoId}/thumbnail`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        snippet: {
          thumbnails: {
            default: { url: thumbnailUrl },
            medium: { url: thumbnailUrl },
            high: { url: thumbnailUrl }
          }
        }
      })
    });
  },
  
  getChannels: async () => {
    const token = localStorage.getItem('youtube_token');
    
    return await apiFetch('/youtube/v3/channels', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  
  isConnected: () => !!localStorage.getItem('youtube_token'),
  
  disconnect: () => {
    localStorage.removeItem('youtube_token');
    localStorage.removeItem('youtube_refresh_token');
  }
};

// Snapchat API Integration  
export const snapchatService = {
  initiateAuth: () => {
    const clientId = import.meta.env.VITE_SNAPCHAT_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/snapchat/callback`;
    const scope = 'snapchat-marketing-api';
    
    const authUrl = `https://accounts.snapchat.com/accounts/oauth2?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&state=snapchat_auth`;
    
    window.location.href = authUrl;
  },
  
  handleAuthCallback: async (code) => {
    const response = await apiFetch('/snapchat/oauth/token', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
    
    if (response.access_token) {
      localStorage.setItem('snapchat_token', response.access_token);
    }
    
    return response;
  },
  
  // Create ad (simplified)
  createAd: async (adData) => {
    const token = localStorage.getItem('snapchat_token');
    
    return await apiFetch('/snapchat/ads', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(adData)
    });
  },
  
  isConnected: () => !!localStorage.getItem('snapchat_token'),
  
  disconnect: () => localStorage.removeItem('snapchat_token')
};

// Reddit API Integration
export const redditService = {
  initiateAuth: () => {
    const clientId = import.meta.env.VITE_REDDIT_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/reddit/callback`;
    const scope = 'submit read';
    
    const authUrl = `https://www.reddit.com/api/v1/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&state=reddit_auth&duration=permanent`;
    
    window.location.href = authUrl;
  },
  
  handleAuthCallback: async (code) => {
    const response = await apiFetch('/reddit/oauth/token', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
    
    if (response.access_token) {
      localStorage.setItem('reddit_token', response.access_token);
      localStorage.setItem('reddit_refresh_token', response.refresh_token);
    }
    
    return response;
  },
  
  // Submit a post
  submitPost: async (subreddit, title, content, kind = 'self', url = null) => {
    const token = localStorage.getItem('reddit_token');
    
    const payload = {
      sr: subreddit,
      kind: kind, // 'self', 'link', 'image', 'video'
      title: title,
      ...(kind === 'self' && { text: content }),
      ...((kind === 'link' || kind === 'image' || kind === 'video') && { url: url || content })
    };
  
    return await apiFetch('/reddit/api/submit', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(payload)
    });
  },
  
  // Get user info
  getUser: async () => {
    const token = localStorage.getItem('reddit_token');
    
    return await apiFetch('/api/v1/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  
  // Get user's subreddits
  getSubreddits: async () => {
    const token = localStorage.getItem('reddit_token');
    
    return await apiFetch('/subreddits/mine/subscriber', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  
  isConnected: () => !!localStorage.getItem('reddit_token'),
  
  disconnect: () => {
    localStorage.removeItem('reddit_token');
    localStorage.removeItem('reddit_refresh_token');
  }
};

// Unified platform posting function
export const postToPlatform = async (platform, content, media, options = {}) => {
  switch (platform) {
    case 'twitter':
      return await twitterService.createTweet(content, media);
    case 'instagram':
      if (media.type === 'video') {
        return await instagramService.createVideoPost(media.url, options.thumbnail, content);
      }
      return await instagramService.createImagePost(media.url, content);
    case 'pinterest':
      return await pinterestService.createPin(options.boardId, options.title || content, content, media.url, options.link);
    case 'youtube':
      return await youtubeService.uploadVideo(media.file, content, options.description, options.thumbnail, options.scheduledTime);
    case 'snapchat':
      return await snapchatService.createAd({ content, media, ...options });
    case 'reddit':
      return await redditService.submitPost(options.subreddit, content, media.url || content, media.type || 'self');
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
};

// Get connection status for all platforms
export const getAllConnectionStatus = () => ({
  twitter: twitterService.isConnected(),
  instagram: instagramService.isConnected(),
  pinterest: pinterestService.isConnected(),
  youtube: youtubeService.isConnected(),
  snapchat: snapchatService.isConnected(),
  reddit: redditService.isConnected()
});