// Trigger Engine for Draft Scheduling
// Evaluates conditional triggers for draft posts

// Trigger types
export const TRIGGER_TYPES = {
  MANUAL: 'manual',
  DATE_BASED: 'date_based',
  CONDITIONAL: 'conditional'
};

// Supported condition fields
export const CONDITION_FIELDS = {
  TIME_SINCE_DRAFT_HOURS: 'time_since_draft_hours',
  DAY_OF_WEEK: 'day_of_week',
  TIME_OF_DAY: 'time_of_day',
  ENGAGEMENT_LIKES: 'engagement_likes',
  ENGAGEMENT_COMMENTS: 'engagement_comments',
  ENGAGEMENT_SHARES: 'engagement_shares',
  ENGAGEMENT_VIEWS: 'engagement_views'
};

// Supported operators
export const CONDITION_OPERATORS = {
  EQUALS: 'equals',
  NOT_EQUALS: 'not_equals',
  GREATER_THAN: 'greater_than',
  LESS_THAN: 'less_than',
  CONTAINS: 'contains'
};

// Supported actions
export const TRIGGER_ACTIONS = {
  PUBLISH: 'publish',
  NOTIFY: 'notify',
  ESCALATE: 'escalate'
};

// Evaluate a single condition
const evaluateCondition = (currentValue, operator, targetValue) => {
  switch (operator) {
    case CONDITION_OPERATORS.EQUALS:
      return currentValue === targetValue;
    case CONDITION_OPERATORS.NOT_EQUALS:
      return currentValue !== targetValue;
    case CONDITION_OPERATORS.GREATER_THAN:
      return currentValue > targetValue;
    case CONDITION_OPERATORS.LESS_THAN:
      return currentValue < targetValue;
    case CONDITION_OPERATORS.CONTAINS:
      return String(currentValue).includes(String(targetValue));
    default:
      return false;
  }
};

// Get current metric value for a field
const getMetricValue = (field, post, metrics = {}) => {
  const now = new Date();
  
  switch (field) {
    case CONDITION_FIELDS.TIME_SINCE_DRAFT_HOURS:
      if (!post.createdAt) return 0;
      const created = post.createdAt.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
      return Math.floor((now - created) / (1000 * 60 * 60));
    
    case CONDITION_FIELDS.DAY_OF_WEEK:
      return now.getDay(); // 0 = Sunday, 6 = Saturday
    
    case CONDITION_FIELDS.TIME_OF_DAY:
      return now.getHours();
    
    case CONDITION_FIELDS.ENGAGEMENT_LIKES:
      return post.engagement?.likes || 0;
    
    case CONDITION_FIELDS.ENGAGEMENT_COMMENTS:
      return post.engagement?.comments || 0;
    
    case CONDITION_FIELDS.ENGAGEMENT_SHARES:
      return post.engagement?.shares || 0;
    
    case CONDITION_FIELDS.ENGAGEMENT_VIEWS:
      return post.engagement?.views || 0;
    
    default:
      return 0;
  }
};

// Main trigger evaluation function
export const evaluateTriggers = (post, metrics = {}) => {
  if (!post.triggers || !post.triggers.type) {
    return null;
  }
  
  const { triggers } = post;
  
  // Handle date-based triggers
  if (triggers.type === TRIGGER_TYPES.DATE_BASED) {
    if (!triggers.scheduledDate || !triggers.scheduledTime) {
      return null;
    }
    
    const now = new Date();
    const scheduled = new Date(`${triggers.scheduledDate}T${triggers.scheduledTime}`);
    
    // Check if scheduled time has passed
    if (scheduled <= now) {
      return {
        action: TRIGGER_ACTIONS.PUBLISH,
        postId: post.id,
        reason: 'Scheduled date reached'
      };
    }
    
    return null;
  }
  
  // Handle conditional triggers
  if (triggers.type === TRIGGER_TYPES.CONDITIONAL) {
    if (!triggers.conditions || triggers.conditions.length === 0) {
      return null;
    }
    
    const results = triggers.conditions.map(condition => {
      const currentValue = getMetricValue(condition.field, post, metrics);
      return evaluateCondition(currentValue, condition.operator, condition.value);
    });
    
    // Determine if all or any conditions are met
    const logic = triggers.logic || 'all';
    const allMet = logic === 'all' 
      ? results.every(r => r === true)
      : results.some(r => r === true);
    
    if (allMet) {
      return {
        action: triggers.action || TRIGGER_ACTIONS.PUBLISH,
        postId: post.id,
        reason: 'Conditional trigger met'
      };
    }
  }
  
  return null;
};

// Get next trigger event for a post
export const getNextTriggerEvent = (post) => {
  if (!post.triggers || !post.triggers.type) {
    return null;
  }
  
  const { triggers } = post;
  
  if (triggers.type === TRIGGER_TYPES.DATE_BASED && triggers.scheduledDate) {
    const scheduled = new Date(`${triggers.scheduledDate}T${triggers.scheduledTime || '00:00'}`);
    return {
      type: 'date_based',
      scheduledFor: scheduled,
      label: `Scheduled for ${scheduled.toLocaleString()}`
    };
  }
  
  if (triggers.type === TRIGGER_TYPES.CONDITIONAL) {
    // For conditional triggers, we can only estimate based on time-based conditions
    if (triggers.conditions?.some(c => c.field === CONDITION_FIELDS.TIME_SINCE_DRAFT_HOURS)) {
      const timeCondition = triggers.conditions.find(c => c.field === CONDITION_FIELDS.TIME_SINCE_DRAFT_HOURS);
      if (timeCondition && timeCondition.operator === CONDITION_OPERATORS.GREATER_THAN) {
        const hoursNeeded = timeCondition.value;
        const created = post.createdAt?.toDate ? post.createdAt.toDate() : new Date();
        const triggerTime = new Date(created.getTime() + hoursNeeded * 60 * 60 * 1000);
        
        return {
          type: 'conditional',
          scheduledFor: triggerTime,
          label: `After ${hoursNeeded} hours from creation`
        };
      }
    }
    
    return {
      type: 'conditional',
      label: 'Based on engagement metrics'
    };
  }
  
  return null;
};

// Format condition for display
export const formatCondition = (condition) => {
  const fieldLabels = {
    [CONDITION_FIELDS.TIME_SINCE_DRAFT_HOURS]: 'Time since draft',
    [CONDITION_FIELDS.DAY_OF_WEEK]: 'Day of week',
    [CONDITION_FIELDS.TIME_OF_DAY]: 'Time of day',
    [CONDITION_FIELDS.ENGAGEMENT_LIKES]: 'Likes',
    [CONDITION_FIELDS.ENGAGEMENT_COMMENTS]: 'Comments',
    [CONDITION_FIELDS.ENGAGEMENT_SHARES]: 'Shares',
    [CONDITION_FIELDS.ENGAGEMENT_VIEWS]: 'Views'
  };
  
  const operatorLabels = {
    [CONDITION_OPERATORS.EQUALS]: 'equals',
    [CONDITION_OPERATORS.NOT_EQUALS]: 'does not equal',
    [CONDITION_OPERATORS.GREATER_THAN]: 'is greater than',
    [CONDITION_OPERATORS.LESS_THAN]: 'is less than',
    [CONDITION_OPERATORS.CONTAINS]: 'contains'
  };
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  let displayValue = condition.value;
  if (condition.field === CONDITION_FIELDS.DAY_OF_WEEK) {
    displayValue = dayNames[condition.value] || condition.value;
  } else if (condition.field === CONDITION_FIELDS.TIME_OF_DAY) {
    displayValue = `${condition.value}:00`;
  }
  
  return `${fieldLabels[condition.field] || condition.field} ${operatorLabels[condition.operator] || condition.operator} ${displayValue}`;
};

// Check if a post should be auto-published
export const shouldAutoPublish = (post) => {
  const trigger = evaluateTriggers(post);
  return trigger?.action === TRIGGER_ACTIONS.PUBLISH ? trigger : null;
};

// Get all posts with active triggers (for monitoring)
export const getPostsWithTriggers = (posts) => {
  return posts.filter(post => 
    post.status === 'draft' && 
    post.triggers && 
    (post.triggers.type === TRIGGER_TYPES.DATE_BASED || 
     post.triggers.type === TRIGGER_TYPES.CONDITIONAL)
  );
};