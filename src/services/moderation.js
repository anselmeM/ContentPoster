// Content Moderation Service
// Filters inappropriate content and validates against community guidelines

// Common profanity word list (abbreviated - in production use a proper library)
const PROFANITY_LIST = [
  // Add actual words you want to filter
  // This is a placeholder list - replace with comprehensive list
];

// Additional restricted words (non-profanity but restricted)
const RESTRICTED_WORDS = [
  'spam',
  'scam',
  'phishing',
  'virus',
  'malware',
  'hack',
  'crack',
  'bypass'
];

// Suspicious patterns (potential spam indicators)
const SPAM_PATTERNS = [
  /buy\s+now/i,
  /click\s+here/i,
  /limited\s+time/i,
  /act\s+now/i,
  /free\s+money/i,
  /make\s+money/i,
  /\$\d+\s+per\s+(day|hour|week)/i,
  /work\s+from\s+home/i,
  /100%\s+guarantee/i,
  /no\s+risk/i,
  /investment/i,
  /crypto/i,
  /bitcoin/i,
  /\bwin\b.*\bprize\b/i
];

// Multiplier for different languages (detect potential foreign language spam)
const SPAM_SCORE_WEIGHTS = {
  excessiveCaps: 0.3,      // TOO MUCH CAPS
  excessiveEmoji: 0.2,     // Too many emojis
  profanity: 0.5,          // Inappropriate language
  restricted: 0.4,         // Restricted keywords
  spamPattern: 0.6,        // Spam-like patterns
  repeatedChars: 0.2,      // gooood => good
  repeatedWords: 0.3       // very very very
};

// Content moderation result
export const moderateContent = (text, options = {}) => {
  const {
    checkProfanity = true,
    checkSpam = true,
    checkRestricted = true,
    strictMode = false
  } = options;
  
  const issues = [];
  let spamScore = 0;
  let profanityCount = 0;
  let hasSuspiciousPattern = false;
  
  if (!text) {
    return {
      approved: true,
      issues: [],
      score: 0
    };
  }
  
  const words = text.toLowerCase().split(/\s+/);
  
  // 1. Check for excessive capitalization
  const upperCaseRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (upperCaseRatio > 0.5) {
    issues.push({ type: 'warning', message: 'Excessive capitalization detected' });
    spamScore += SPAM_SCORE_WEIGHTS.excessiveCaps;
  }
  
  // 2. Check for excessive emojis
  const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}]/gu) || []).length;
  const emojiRatio = emojiCount / words.length;
  if (emojiRatio > 0.3) {
    issues.push({ type: 'warning', message: 'Excessive emoji usage detected' });
    spamScore += SPAM_SCORE_WEIGHTS.excessiveEmoji;
  }
  
  // 3. Check profanity (if enabled)
  if (checkProfanity) {
    const foundProfanity = PROFANITY_LIST.filter(word => 
      words.some(w => w.includes(word))
    );
    
    if (foundProfanity.length > 0) {
      issues.push({ type: 'error', message: `Inappropriate language detected: ${foundProfanity[0]}` });
      profanityCount = foundProfanity.length;
      spamScore += SPAM_SCORE_WEIGHTS.profanity * profanityCount;
    }
  }
  
  // 4. Check restricted words (if enabled)
  if (checkRestricted) {
    const foundRestricted = RESTRICTED_WORDS.filter(word =>
      words.includes(word)
    );
    
    if (foundRestricted.length > 0) {
      issues.push({ type: 'warning', message: `Contains restricted keywords: ${foundRestricted.join(', ')}` });
      spamScore += SPAM_SCORE_WEIGHTS.restricted * foundRestricted.length;
    }
  }
  
  // 5. Check spam patterns (if enabled)
  if (checkSpam) {
    SPAM_PATTERNS.forEach(pattern => {
      if (pattern.test(text)) {
        issues.push({ type: 'warning', message: 'Detected spam-like pattern' });
        hasSuspiciousPattern = true;
        spamScore += SPAM_SCORE_WEIGHTS.spamPattern;
      }
    });
  }
  
  // 6. Check for repeated characters (e.g., "goooood")
  const repeatedChars = text.match(/(.)\1{3,}/g);
  if (repeatedChars && repeatedChars.length > 0) {
    issues.push({ type: 'warning', message: 'Repeated characters detected' });
    spamScore += SPAM_SCORE_WEIGHTS.repeatedChars;
  }
  
  // 7. Check for repeated words
  const repeatedWords = words.filter((word, i) => words.indexOf(word) !== i);
  if (repeatedWords.length > 3) {
    issues.push({ type: 'warning', message: 'Repeated words detected' });
    spamScore += SPAM_SCORE_WEIGHTS.repeatedWords;
  }
  
  // 8. URL detection
  const urlCount = (text.match(/https?:\/\/[^\s]+/g) || []).length;
  if (urlCount > 5) {
    issues.push({ type: 'warning', message: 'Too many URLs in content' });
    spamScore += 0.3;
  }
  
  // Determine approval status
  const approved = strictMode 
    ? issues.filter(i => i.type === 'error').length === 0 && spamScore < 0.5
    : issues.filter(i => i.type === 'error').length === 0 && spamScore < 1.0;
  
  return {
    approved,
    issues,
    score: spamScore,
    profanityCount,
    hasSuspiciousPattern,
    severity: spamScore >= 1.0 ? 'high' : spamScore >= 0.5 ? 'medium' : 'low'
  };
};

// Check if content contains specific words
export const containsWords = (text, wordList) => {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  return wordList.filter(word => words.includes(word.toLowerCase()));
};

// Filter/clean text by removing profanity
export const filterProfanity = (text, replacement = '***') => {
  let filtered = text;
  PROFANITY_LIST.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(regex, replacement);
  });
  return filtered;
};

// Generate a moderation report
export const generateModerationReport = (content) => {
  const result = moderateContent(content, { strictMode: true });
  
  return {
    timestamp: new Date().toISOString(),
    status: result.approved ? 'approved' : 'flagged',
    score: result.score,
    issues: result.issues,
    summary: result.approved 
      ? 'Content passes moderation guidelines' 
      : 'Content requires review or contains policy violations'
  };
};

// Batch moderate multiple posts
export const moderateBatch = (posts) => {
  return posts.map((post, index) => ({
    index,
    postId: post.id,
    result: moderateContent(post.content || post.caption || '')
  }));
};

// Settings for moderation (can be stored in user preferences)
export const moderationSettings = {
  enabled: true,
  strictMode: false,
  checkProfanity: true,
  checkSpam: true,
  checkRestricted: true,
  autoFilter: false, // If true, automatically filter instead of flagging
  
  // Sensitivity levels
  sensitivity: 'medium', // low, medium, high
  
  getThresholds: function() {
    switch (this.sensitivity) {
      case 'low':
        return { warning: 0.3, block: 1.0 };
      case 'medium':
        return { warning: 0.2, block: 0.7 };
      case 'high':
        return { warning: 0.1, block: 0.4 };
      default:
        return { warning: 0.2, block: 0.7 };
    }
  }
};

export default {
  moderateContent,
  containsWords,
  filterProfanity,
  generateModerationReport,
  moderateBatch,
  moderationSettings
};