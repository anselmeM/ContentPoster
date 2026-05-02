// Rate Limiting and Queue Service
// Manages API request rates and queues posts to prevent abuse

// Rate limits for different platforms (requests per hour)
const RATE_LIMITS = {
  twitter: { posts: 17, media: 100 }, // Twitter v2: 17 tweets/15min, 100 media/15min
  instagram: { posts: 25, media: 50 }, // Instagram: 25 posts/hour
  facebook: { posts: 30, media: 30 }, // Facebook: varies by page
  linkedin: { posts: 100, media: 100 }, // LinkedIn: ~100/day
  pinterest: { posts: 500, media: 500 }, // Pinterest: high limit
  youtube: { posts: 6, media: 6 }, // YouTube: 6 uploads/day
  snapchat: { posts: 100, media: 100 },
  reddit: { posts: 10, media: 10 } // Reddit: 10 posts per 30 min
};

// Queue state (in production, this would be stored in backend/Redis)
const postQueue = new Map();
const requestTimestamps = new Map();

// Rate limiter class
class RateLimiter {
  constructor(platform, limit) {
    this.platform = platform;
    this.limit = limit;
    this.windowMs = 60 * 60 * 1000; // 1 hour
  }
  
  // Check if we can make a request
  canProceed() {
    const now = Date.now();
    const timestamps = requestTimestamps.get(this.platform) || [];
    
    // Filter out timestamps outside the window
    const validTimestamps = timestamps.filter(ts => now - ts < this.windowMs);
    
    requestTimestamps.set(this.platform, validTimestamps);
    
    return validTimestamps.length < this.limit;
  }
  
  // Get time until next slot is available
  getWaitTime() {
    const timestamps = requestTimestamps.get(this.platform) || [];
    if (timestamps.length === 0) return 0;
    
    const oldest = Math.min(...timestamps);
    const timeSinceOldest = Date.now() - oldest;
    const timeUntilAvailable = this.windowMs - timeSinceOldest;
    
    return Math.max(0, timeUntilAvailable);
  }
  
  // Record a request
  recordRequest() {
    const timestamps = requestTimestamps.get(this.platform) || [];
    timestamps.push(Date.now());
    requestTimestamps.set(this.platform, timestamps);
  }
  
  // Get remaining requests
  getRemaining() {
    const timestamps = requestTimestamps.get(this.platform) || [];
    const now = Date.now();
    const validTimestamps = timestamps.filter(ts => now - ts < this.windowMs);
    return Math.max(0, this.limit - validTimestamps.length);
  }
}

// Create rate limiters for each platform
const limiters = {};
Object.keys(RATE_LIMITS).forEach(platform => {
  limiters[platform] = new RateLimiter(platform, RATE_LIMITS[platform].posts);
});

// Queue management
export const queueService = {
  // Add a post to the queue
  enqueue: async (userId, postData) => {
    const queue = postQueue.get(userId) || [];
    
    const queueItem = {
      id: `queue_${crypto.randomUUID()}`,
      userId,
      postData,
      status: 'queued',
      scheduledTime: postData.scheduledTime || Date.now(),
      retryCount: 0,
      createdAt: Date.now(),
      attempts: []
    };
    
    queue.push(queueItem);
    postQueue.set(userId, queue);
    
    return queueItem.id;
  },
  
  // Get user's queue
  getQueue: (userId) => {
    return postQueue.get(userId) || [];
  },
  
  // Get queue item by ID
  getQueueItem: (userId, itemId) => {
    const queue = postQueue.get(userId) || [];
    return queue.find(item => item.id === itemId);
  },
  
  // Remove item from queue
  dequeue: (userId, itemId) => {
    const queue = postQueue.get(userId) || [];
    const filtered = queue.filter(item => item.id !== itemId);
    postQueue.set(userId, filtered);
    return filtered;
  },
  
  // Update queue item status
  updateStatus: (userId, itemId, status, error = null) => {
    const queue = postQueue.get(userId) || [];
    const item = queue.find(i => i.id === itemId);
    
    if (item) {
      item.status = status;
      item.attempts.push({
        timestamp: Date.now(),
        status,
        error
      });
      
      if (status === 'failed') {
        item.retryCount++;
      }
    }
    
    postQueue.set(userId, queue);
    return item;
  },
  
  // Get next scheduled item
  getNextItem: (userId) => {
    const queue = postQueue.get(userId) || [];
    
    // Find items that are ready to be processed
    const readyItems = queue
      .filter(item => item.status === 'queued' && item.scheduledTime <= Date.now())
      .sort((a, b) => a.scheduledTime - b.scheduledTime);
    
    return readyItems[0] || null;
  },
  
  // Clear user's queue
  clearQueue: (userId) => {
    postQueue.set(userId, []);
  },
  
  // Get queue statistics
  getStats: (userId) => {
    const queue = postQueue.get(userId) || [];
    // ⚡ Bolt: O(N) calculation to prevent multiple array traversals
    return queue.reduce(
      (stats, item) => {
        if (stats[item.status] !== undefined) {
          stats[item.status]++;
        }
        return stats;
      },
      {
        total: queue.length,
        queued: 0,
        processing: 0,
        completed: 0,
        failed: 0
      }
    );
  }
};

// Rate limit checks
export const rateLimitService = {
  // Check if platform allows posting
  canPost: (platform) => {
    const limiter = limiters[platform];
    if (!limiter) return { allowed: true, reason: null };
    
    if (!limiter.canProceed()) {
      const waitTime = Math.ceil(limiter.getWaitTime() / 1000);
      return { 
        allowed: false, 
        reason: `Rate limit reached for ${platform}. Please wait ${waitTime} seconds.` 
      };
    }
    
    return { allowed: true, reason: null };
  },
  
  // Record a successful post
  recordPost: (platform) => {
    const limiter = limiters[platform];
    if (limiter) {
      limiter.recordRequest();
    }
  },
  
  // Get remaining posts for platform
  getRemaining: (platform) => {
    const limiter = limiters[platform];
    return limiter ? limiter.getRemaining() : 'unlimited';
  },
  
  // Get wait time for platform
  getWaitTime: (platform) => {
    const limiter = limiters[platform];
    return limiter ? Math.ceil(limiter.getWaitTime() / 1000) : 0;
  },
  
  // Get all platform limits
  getLimits: () => RATE_LIMITS,
  
  // Get status for all platforms
  getAllStatus: () => {
    const status = {};
    Object.keys(limiters).forEach(platform => {
      status[platform] = {
        remaining: limiters[platform].getRemaining(),
        waitTime: Math.ceil(limiters[platform].getWaitTime() / 1000),
        limit: RATE_LIMITS[platform].posts
      };
    });
    return status;
  }
};

// Process queue (for background processing)
export const processQueue = async (userId, processFn) => {
  const nextItem = queueService.getNextItem(userId);
  
  if (!nextItem) {
    return { processed: false, reason: 'No items ready' };
  }
  
  // Check rate limits
  const rateCheck = rateLimitService.canPost(nextItem.postData.platform);
  if (!rateCheck.allowed) {
    return { processed: false, reason: rateCheck.reason };
  }
  
  // Update status to processing
  queueService.updateStatus(userId, nextItem.id, 'processing');
  
  try {
    // Process the post
    const result = await processFn(nextItem.postData);
    
    // Record successful post for rate limiting
    rateLimitService.recordPost(nextItem.postData.platform);
    
    // Mark as completed
    queueService.updateStatus(userId, nextItem.id, 'completed');
    
    return { processed: true, result };
  } catch (error) {
    // Handle failure
    if (nextItem.retryCount < 3) {
      // Retry later
      nextItem.scheduledTime = Date.now() + (nextItem.retryCount + 1) * 60000; // Retry in 1-3 minutes
      queueService.updateStatus(userId, nextItem.id, 'queued', error.message);
    } else {
      // Max retries reached
      queueService.updateStatus(userService, nextItem.id, 'failed', error.message);
    }
    
    return { processed: false, error: error.message };
  }
};

export { RATE_LIMITS };