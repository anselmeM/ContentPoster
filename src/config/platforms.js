// Platform configurations for social media scheduling
export const PLATFORMS = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    icon: 'fa-instagram',
    color: 'from-yellow-400 via-red-500 to-purple-500',
    bgColor: '#E1306C',
    maxCaptionLength: 2200,
    maxHashtags: 30,
    supportsVideo: true,
    supportsImages: true,
    optimalTimes: {
      weekday: ['9:00', '12:00', '19:00', '21:00'],
      weekend: ['10:00', '14:00', '19:00']
    }
  },
  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: 'fa-x-twitter',
    color: 'bg-black',
    bgColor: '#000000',
    maxCaptionLength: 280,
    maxHashtags: 5,
    supportsVideo: true,
    supportsImages: true,
    optimalTimes: {
      weekday: ['9:00', '12:00', '17:00', '20:00'],
      weekend: ['10:00', '13:00', '18:00']
    }
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    icon: 'fa-facebook-f',
    color: 'bg-blue-600',
    bgColor: '#1877F2',
    maxCaptionLength: 63206,
    maxHashtags: 30,
    supportsVideo: true,
    supportsImages: true,
    optimalTimes: {
      weekday: ['9:00', '13:00', '16:00'],
      weekend: ['11:00', '15:00']
    }
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'fa-linkedin-in',
    color: 'bg-blue-700',
    bgColor: '#0077B5',
    maxCaptionLength: 3000,
    maxHashtags: 5,
    supportsVideo: true,
    supportsImages: true,
    optimalTimes: {
      weekday: ['7:00', '9:00', '12:00', '17:00'],
      weekend: []
    }
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'fa-tiktok',
    color: 'bg-black',
    bgColor: '#000000',
    maxCaptionLength: 2200,
    maxHashtags: 100,
    supportsVideo: true,
    supportsImages: false,
    optimalTimes: {
      weekday: ['6:00', '10:00', '19:00', '22:00'],
      weekend: ['7:00', '11:00', '20:00', '23:00']
    }
  },
  dribbble: {
    id: 'dribbble',
    name: 'Dribbble',
    icon: 'fa-dribbble',
    color: 'bg-pink-500',
    bgColor: '#EA4C89',
    maxCaptionLength: 500,
    maxHashtags: 5,
    supportsVideo: false,
    supportsImages: true,
    optimalTimes: {
      weekday: ['10:00', '14:00', '17:00'],
      weekend: ['11:00', '15:00']
    }
  },
  pinterest: {
    id: 'pinterest',
    name: 'Pinterest',
    icon: 'fa-pinterest-p',
    color: 'bg-red-600',
    bgColor: '#BD081C',
    maxCaptionLength: 500,
    maxHashtags: 20,
    supportsVideo: false,
    supportsImages: true,
    optimalTimes: {
      weekday: ['14:00', '16:00', '20:00'],
      weekend: ['10:00', '14:00', '19:00']
    },
    requiresApi: true
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    icon: 'fa-youtube',
    color: 'bg-red-600',
    bgColor: '#FF0000',
    maxCaptionLength: 5000,
    maxHashtags: 15,
    supportsVideo: true,
    supportsImages: false,
    supportsThumbnails: true,
    optimalTimes: {
      weekday: ['14:00', '16:00', '19:00'],
      weekend: ['11:00', '13:00', '16:00']
    },
    requiresApi: true
  },
  snapchat: {
    id: 'snapchat',
    name: 'Snapchat',
    icon: 'fa-snapchat',
    color: 'bg-yellow-500',
    bgColor: '#FFFC00',
    maxCaptionLength: 2500,
    maxHashtags: 20,
    supportsVideo: true,
    supportsImages: true,
    optimalTimes: {
      weekday: ['12:00', '16:00', '20:00'],
      weekend: ['10:00', '15:00', '21:00']
    },
    requiresApi: true
  },
  reddit: {
    id: 'reddit',
    name: 'Reddit',
    icon: 'fa-reddit-alien',
    color: 'bg-orange-500',
    bgColor: '#FF4500',
    maxCaptionLength: 40000,
    maxHashtags: 10,
    supportsVideo: true,
    supportsImages: true,
    optimalTimes: {
      weekday: ['7:00', '12:00', '17:00'],
      weekend: ['9:00', '14:00', '19:00']
    },
    requiresApi: true
  }
};

export const PLATFORM_LIST = Object.values(PLATFORMS);

// Get platform config by ID
export const getPlatformConfig = (platformId) => {
  return PLATFORMS[platformId] || null;
};

// Get all platform IDs
export const getAllPlatformIds = () => Object.keys(PLATFORMS);