// Content Validation Service
// Validates content against platform-specific limits and requirements

import { getPlatformConfig } from '../config/platforms';

// Platform-specific constraints
const PLATFORM_CONSTRAINTS = {
  image: {
    maxSizeMB: 30,
    supportedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxDimensions: 4096,
    minDimensions: 320
  },
  video: {
    maxSizeMB: 512,
    supportedFormats: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
    maxDuration: {
      twitter: 140,
      instagram: 60,
      facebook: 240,
      tiktok: 180,
      youtube: 43200 // 12 hours
    }
  }
};

// Validate content against platform requirements
export const validateContent = (platform, content) => {
  const errors = [];
  const warnings = [];
  const platformConfig = getPlatformConfig(platform);
  
  if (!platformConfig) {
    return { valid: false, errors: [`Unknown platform: ${platform}`], warnings: [] };
  }
  
  // 1. Caption length validation
  if (content.caption) {
    const captionLength = content.caption.length;
    const maxLength = platformConfig.maxCaptionLength || 2200;
    
    if (captionLength > maxLength) {
      errors.push(`Caption exceeds ${maxLength} character limit for ${platformConfig.name} (${captionLength}/${maxLength})`);
    } else if (captionLength > maxLength * 0.9) {
      warnings.push(`Caption is approaching ${maxLength} character limit (${captionLength}/${maxLength})`);
    }
  }
  
  // 2. Hashtag validation
  if (content.hashtags && content.hashtags.length > 0) {
    const maxHashtags = platformConfig.maxHashtags || 30;
    
    if (content.hashtags.length > maxHashtags) {
      errors.push(`Too many hashtags: ${content.hashtags.length}/${maxHashtags} for ${platformConfig.name}`);
    }
    
    // Check for valid hashtag format
    const invalidHashtags = content.hashtags.filter(tag => !tag.match(/^#[a-zA-Z0-9_]+$/));
    if (invalidHashtags.length > 0) {
      errors.push(`Invalid hashtag format: ${invalidHashtags.join(', ')}`);
    }
  }
  
  // 3. Media validation
  if (content.media && content.media.length > 0) {
    // Check if platform supports media
    if (content.mediaType === 'image' && !platformConfig.supportsImages) {
      errors.push(`${platformConfig.name} does not support image posts`);
    }
    
    if (content.mediaType === 'video' && !platformConfig.supportsVideo) {
      errors.push(`${platformConfig.name} does not support video posts`);
    }
    
    // Validate image files
    for (const media of content.media) {
      if (media.file) {
        const imageError = validateImage(media.file, platform);
        if (imageError) errors.push(imageError);
      }
    }
    
    // Validate video files
    if (content.mediaType === 'video' && content.media[0]?.file) {
      const videoError = validateVideo(content.media[0].file, platform);
      if (videoError) errors.push(videoError);
    }
  }
  
  // 4. Scheduling validation
  if (content.scheduledDate) {
    const scheduledDate = new Date(content.scheduledDate);
    const now = new Date();
    
    if (scheduledDate < now) {
      errors.push('Scheduled date must be in the future');
    }
    
    // Check if too far in the future (some platforms have limits)
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);
    
    if (scheduledDate > maxFutureDate) {
      warnings.push('Scheduled date is more than 1 year in the future');
    }
  }
  
  // 5. Platform-specific validations
  if (platform === 'twitter' && content.caption) {
    // Twitter: Count URLs as 23 characters each
    const urlCount = (content.caption.match(/https?:\/\/[^\s]+/g) || []).length;
    const adjustedLength = content.caption.length + (urlCount * (23 - 12)); // URLs count as 23, average is ~12
    if (adjustedLength > 280) {
      errors.push(`Tweet exceeds 280 characters (including URLs)`);
    }
  }
  
  if (platform === 'linkedin' && content.caption) {
    // LinkedIn: Check for too many emojis (can cause issues)
    const emojiCount = (content.caption.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}]/gu) || []).length;
    if (emojiCount > 10) {
      warnings.push('LinkedIn posts with many emojis may not display correctly');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    characterCount: content.caption?.length || 0,
    hashtagCount: content.hashtags?.length || 0,
    mediaCount: content.media?.length || 0
  };
};

// Validate single image file
export const validateImage = (file, platform) => {
  if (!file) return null;
  
  // Check file size
  const maxSizeMB = PLATFORM_CONSTRAINTS.image.maxSizeMB;
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `Image file exceeds ${maxSizeMB}MB limit`;
  }
  
  // Check file type
  if (!PLATFORM_CONSTRAINTS.image.supportedFormats.includes(file.type)) {
    return `Unsupported image format: ${file.type}. Supported: JPEG, PNG, GIF, WebP`;
  }
  
  return null;
};

// Validate single video file
export const validateVideo = (file, platform) => {
  if (!file) return null;
  
  // Check file size
  const maxSizeMB = PLATFORM_CONSTRAINTS.video.maxSizeMB;
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `Video file exceeds ${maxSizeMB}MB limit`;
  }
  
  // Check file type
  if (!PLATFORM_CONSTRAINTS.video.supportedFormats.includes(file.type)) {
    return `Unsupported video format: ${file.type}. Supported: MP4, MOV, AVI`;
  }
  
  // Check platform-specific duration (would need to analyze video metadata)
  // This is a placeholder - in production you'd analyze the video
  
  return null;
};

// Get platform-specific character limit info
export const getCharacterLimit = (platform) => {
  const config = getPlatformConfig(platform);
  return config?.maxCaptionLength || 2200;
};

// Get hashtag limit info
export const getHashtagLimit = (platform) => {
  const config = getPlatformConfig(platform);
  return config?.maxHashtags || 30;
};

// Check if platform supports specific media type
export const supportsMediaType = (platform, mediaType) => {
  const config = getPlatformConfig(platform);
  if (!config) return false;
  
  if (mediaType === 'image') return config.supportsImages;
  if (mediaType === 'video') return config.supportsVideo;
  return false;
};

// Format validation result for display
export const formatValidationResult = (result) => {
  const messages = [];
  
  if (result.valid && result.warnings.length === 0) {
    messages.push({ type: 'success', text: 'Content is valid and ready to schedule' });
  }
  
  result.errors.forEach(error => {
    messages.push({ type: 'error', text: error });
  });
  
  result.warnings.forEach(warning => {
    messages.push({ type: 'warning', text: warning });
  });
  
  return messages;
};