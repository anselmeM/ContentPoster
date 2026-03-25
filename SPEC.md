# Technical Specification: Time Zone Grid & Draft Scheduling

## 1. Time Zone Grid Feature

### 1.1 Purpose
Visual display of posting times across multiple time zones for global audience targeting.

### 1.2 Data Model

```javascript
// New timezone display configuration
const displayTimezones = [
  { value: 'America/New_York', label: 'New York', offset: '-05:00' },
  { value: 'America/Los_Angeles', label: 'Los Angeles', offset: '-08:00' },
  { value: 'Europe/London', label: 'London', offset: '+00:00' },
  { value: 'Asia/Tokyo', label: 'Tokyo', offset: '+09:00' },
  // User can add more
];

// Post model enhancement
{
  id: string,
  date: string,        // ISO date
  time: string,        // HH:mm format in user's timezone
  timezone: string,    // User's selected timezone
  displayTimezones: string[], // Timezones to show in grid
  // ... existing fields
}
```

### 1.3 Component Hierarchy

```
TimeZoneGrid (new component)
├── TimeZoneRow (multiple)
│   ├── TimeZoneLabel
│   ├── TimeSlot (for each post)
│   └── CurrentTimeIndicator
└── ReferenceTimeSelector (choose which time to display)
```

### 1.4 Implementation Location
- New component: `src/components/UI/TimeZoneGrid.jsx`
- Integration: Add to `CalendarView.jsx` as an optional view mode

---

## 2. Draft Scheduling Feature

### 2.1 Purpose
Save and queue draft posts for future publishing with conditional triggers.

### 2.2 Data Model

```javascript
// Draft with triggers
{
  id: string,
  title: string,
  content: string,
  platform: string,
  status: 'draft' | 'scheduled' | 'published',
  
  // Scheduling
  scheduledDate: string | null,    // When to auto-publish
  scheduledTime: string | null,
  
  // Conditional Triggers
  triggers: Trigger[] | null,
  
  // Metadata
  createdAt: timestamp,
  updatedAt: timestamp,
}

// Trigger types
const TRIGGER_TYPES = {
  MANUAL: 'manual',           // User manually publishes
  DATE_BASED: 'date_based',  // Auto-publish on date
  CONDITIONAL: 'conditional', // Based on conditions
};

// Conditional trigger options
{
  type: 'conditional',
  conditions: [
    {
      field: 'engagement_likes',   // What to monitor
      operator: 'greater_than',    // Comparison
      value: number                // Threshold
    },
    // Supported fields:
    // - engagement_likes
    // - engagement_comments
    // - engagement_shares
    // - time_since_draft_hours
    // - day_of_week (1-7)
    // Supported operators:
    // - equals, not_equals, greater_than, less_than
  ],
  logic: 'all' | 'any',  // AND/OR for multiple conditions
  action: 'publish' | 'notify' | 'escalate'
}
```

### 2.3 Component Hierarchy

```
DraftScheduler (Modal section)
├── TriggerTypeSelector
│   ├── ManualButton
│   ├── DateBasedButton
│   └── ConditionalButton
├── DateTimePicker (for date-based)
├── ConditionBuilder (for conditional)
│   ├── ConditionRow (multiple)
│   │   ├── FieldSelector
│   │   ├── OperatorSelector
│   │   └── ValueInput
│   ├── LogicToggle (AND/OR)
│   └── ActionSelector
└── PreviewSection (shows when triggers will fire)
```

### 2.4 Trigger Evaluation Logic

```javascript
// Pseudo-code for trigger evaluation
function evaluateTriggers(post, metrics) {
  if (!post.triggers) return null;
  
  const results = post.triggers.conditions.map(condition => {
    const currentValue = getMetricValue(condition.field, metrics);
    return evaluateCondition(currentValue, condition.operator, condition.value);
  });
  
  const allMet = post.triggers.logic === 'all' 
    ? results.every(r => r) 
    : results.some(r => r);
    
  if (allMet && post.triggers.action === 'publish') {
    return { action: 'publish', postId: post.id };
  }
  
  return null;
}

// Run this check:
// 1. Every hour via setInterval
// 2. On app load
// 3. When metrics are updated
```

### 2.5 Implementation Location
- Updates to: `src/components/Modals/PostModal.jsx`
- New hooks: `src/hooks/useDraftScheduler.js`
- Service update: `src/services/draftScheduler.js`

---

## 3. Integration Points

### 3.1 Calendar View
- Add toggle between "Standard" and "Time Zone Grid" view
- TimeZoneGrid appears as overlay/alternative view

### 3.2 Post Modal
- Add "Draft Triggers" section between Hashtags and Actions
- Show trigger status in post card indicators

### 3.3 Dashboard
- Add "Pending Drafts with Triggers" widget
- Show next triggered post countdown

---

## 4. Acceptance Criteria

### Time Zone Grid
- [x] Display at least 4 time zones in grid format
- [x] Convert user-selected time to each displayed timezone
- [x] Show visual indicator for "now" in each timezone
- [x] Highlight current time slots in each timezone
- [x] Allow user to customize which timezones to display

### Draft Scheduling
- [x] Allow saving posts as drafts with scheduled date
- [x] Support manual trigger (user clicks publish)
- [x] Support date-based triggers (auto-publish on date)
- [x] Support conditional triggers with:
  - [x] Time-based conditions (hours since creation)
  - [x] Day-of-week conditions
- [x] Display next trigger firing time in UI
- [ ] Log trigger evaluations for debugging

---

## 5. File Structure Changes

```
src/
├── components/
│   ├── UI/
│   │   └── TimeZoneGrid.jsx     [NEW]
│   └── Modals/
│       └── PostModal.jsx         [MODIFIED - add triggers]
├── hooks/
│   └── useDraftScheduler.js      [NEW]
├── services/
│   └── draftScheduler.js         [NEW]
└── utils/
    ├── timezone.js               [MODIFIED - add display helpers]
    └── triggerEngine.js          [NEW]