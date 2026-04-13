// Hashtag and trending topic suggestions

// Popular hashtags by category
export const HASHTAG_CATEGORIES = {
  marketing: [
    '#marketing', '#digitalmarketing', '#marketingtips', '#socialmedia', '#branding',
    '#contentmarketing', '#marketingstrategy', '#growthhacking', '#startup', '#business'
  ],
  technology: [
    '#tech', '#technology', '#innovation', '#ai', '#machinelearning',
    '#coding', '#developer', '#programming', '#software', '#datascience'
  ],
  business: [
    '#business', '#entrepreneur', '#success', '#motivation', '#leadership',
    '#startup', '#smallbusiness', '#management', '#strategy', '#growth'
  ],
  design: [
    '#design', '#graphicdesign', '#ui', '#ux', '#webdesign',
    '#creativity', '#art', '#inspiration', '#illustration', '#photography'
  ],
  social: [
    '#socialmedia', '#instagram', '#twitter', '#linkedin', '#facebook',
    '#contentcreator', '#influencer', '#viral', '#trending'
  ],
  lifestyle: [
    '#lifestyle', '#life', '#motivation', '#goals', '#success',
    '#mindset', '#wellness', '#health', '#fitness', '#travel'
  ]
};

// Trending topics (mock data - would integrate with real APIs in production)
export const TRENDING_TOPICS = [
  { tag: '#AI', posts: '2.5M', category: 'Technology' },
  { tag: '#MarketingTips', posts: '850K', category: 'Marketing' },
  { tag: '#RemoteWork', posts: '1.2M', category: 'Business' },
  { tag: '#Sustainability', posts: '3.1M', category: 'Lifestyle' },
  { tag: '#StartupLife', posts: '980K', category: 'Business' },
  { tag: '#ContentCreation', posts: '750K', category: 'Social' },
  { tag: '#DigitalTransformation', posts: '420K', category: 'Technology' },
  { tag: '#BrandBuilding', posts: '310K', category: 'Marketing' }
];

// Get hashtag suggestions based on platform and content
export const getHashtagSuggestions = (platform, content = '') => {
  // Determine category based on content keywords
  const keywords = content.toLowerCase();
  
  let category = 'marketing'; // default
  
  if (keywords.includes('tech') || keywords.includes('code') || keywords.includes('app')) {
    category = 'technology';
  } else if (keywords.includes('design') || keywords.includes('art') || keywords.includes('creative')) {
    category = 'design';
  } else if (keywords.includes('business') || keywords.includes('entrepreneur') || keywords.includes('money')) {
    category = 'business';
  } else if (keywords.includes('life') || keywords.includes('health') || keywords.includes('travel')) {
    category = 'lifestyle';
  }
  
  const suggestions = HASHTAG_CATEGORIES[category] || HASHTAG_CATEGORIES.marketing;
  
  // Platform-specific limits
  const limits = {
    twitter: 3,
    linkedin: 5,
    instagram: 10,
    facebook: 5,
    tiktok: 5,
    dribbble: 3
  };
  
  const limit = limits[platform] || 5;
  
  // Return random selection from category
  const shuffled = [...suggestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, limit);
};

// Get related hashtags
export const getRelatedHashtags = (hashtags) => {
  const related = new Set();
  
  hashtags.forEach(tag => {
    // Find matching category and add related tags
    Object.values(HASHTAG_CATEGORIES).forEach(category => {
      if (category.includes(tag.toLowerCase())) {
        category.forEach(t => related.add(t));
      }
    });
  });
  
  // Remove already used tags
  hashtags.forEach(tag => related.delete(tag.toLowerCase()));
  
  return Array.from(related).slice(0, 10);
};

// Extract hashtags from text
export const extractHashtags = (text) => {
  const regex = /#[\w]+/g;
  return text.match(regex) || [];
};

// Validate hashtag count
export const validateHashtagCount = (platform, count) => {
  const maxHashtags = {
    twitter: 5,
    linkedin: 5,
    instagram: 30,
    facebook: 30,
    tiktok: 100,
    dribbble: 5
  };
  
  const max = maxHashtags[platform] || 30;
  return {
    valid: count <= max,
    max,
    remaining: Math.max(0, max - count)
  };
};

// Generate hashtag combination for optimal engagement
export const generateOptimalHashtags = (platform, niche = 'marketing') => {
  const category = HASHTAG_CATEGORIES[niche] || HASHTAG_CATEGORIES.marketing;
  
  // Mix of popular, niche, and branded tags
  const popular = category.slice(0, 2);
  const nicheTags = category.slice(2, 6);
  
  const limits = {
    twitter: 3,
    linkedin: 4,
    instagram: 8,
    facebook: 4,
    tiktok: 5,
    dribbble: 3
  };
  
  const count = limits[platform] || 5;
  const combined = [...popular, ...nicheTags];
  
  return combined.slice(0, count);
};

// Trending search suggestions
export const getTrendingSearches = (category = null) => {
  if (category) {
    return TRENDING_TOPICS.filter(t => 
      t.category.toLowerCase() === category.toLowerCase()
    );
  }
  return TRENDING_TOPICS;
};