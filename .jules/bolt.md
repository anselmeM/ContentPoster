## 2024-06-18 - [Notification Engine O(N*M) lookups]
**Learning:** Found an O(N*M) lookup pattern in `runNotificationEngine` where `Array.prototype.some()` is used to check for existing notification keys while iterating over posts and tasks.
**Action:** Always pre-compute a `Set` of existing keys before iterating over collections to achieve O(1) lookups, changing the complexity to O(N+M).

## 2024-06-19 - [DOM Layout Thrashing in List Rendering]
**Learning:** The `renderCalendar` function was appending `div` elements directly to the live DOM (`calendarGrid.appendChild()`) inside a loop that runs ~35 times per render. This causes the browser to recalculate layout repeatedly (layout thrashing), which is a significant performance bottleneck in list rendering.
**Action:** Always use a `DocumentFragment` to batch DOM insertions when rendering lists. Append elements to the fragment in the loop, then append the fragment to the DOM once at the end.

## 2024-06-20 - [Redundant Iterations in Statistics Calculation]
**Learning:** Found an anti-pattern in `updateStats` where `.filter().length` was called three times on the `posts` array to calculate different metrics (`statCompleted`, `statInProgress`, `statOutOfScheduled`). This resulted in O(3N) time complexity and unnecessary allocation of intermediate arrays for each calculation.
**Action:** Always combine multiple counting or filtering logic into a single-pass loop (e.g., `for...of` or `.reduce()`) when deriving multiple metrics from the same array. This changes the complexity to O(N) and eliminates garbage collection overhead from temporary array creation.

## 2024-06-21 - [Date Instantiations and Multi-pass Arrays in Stats]
**Learning:** Found an anti-pattern in `renderPostStatsChart` where `.filter` and `.forEach` were used to traverse the same `posts` array multiple times, while repetitively instantiating `new Date()` within the loop (even instantiating `new Date()` twice per post). This resulted in redundant parsing overhead and higher time complexity.
**Action:** Always calculate multiple metrics from a single source array using a single-pass `for...of` loop or `.reduce()`. Cache values that don't change per item (like `new Date()` for current time) outside the loop to minimize redundant object instantiations and parsing.

## 2026-03-20 - [O(5*N) Operations and Layout Thrashing in Post Calendar Render]
**Learning:** Found an anti-pattern in `renderPosts` where the `.filter` method was used repeatedly in a loop (over 5 days) on the entire `filteredPosts` array to get the posts for each day, resulting in O(5*N) time complexity and redundant Date instantiations. In addition, `dayColumn` DOM nodes were being individually appended to the live `grid` element within this loop, compounding the performance cost by triggering layout thrashing during the render cycle.
**Action:** When categorizing an array's items into multiple groups (e.g., by day of week) to render them, use a single O(N) pass to pre-group items into a hash map first, and then iterate through the pre-computed map. Furthermore, when appending multiple elements iteratively, batch the insertions using a single `DocumentFragment` to avoid redundant browser layout recalcuations.

## 2026-03-22 - [O(N) Sequential Wait Times in Independent Asynchronous Loop]
**Learning:** Found an anti-pattern in `handleClearNotifications` where a `for...of` loop sequentially `await`s individual `updateNotification` network requests for each unread notification. This forces the UI thread to wait for each request to complete before initiating the next one, resulting in O(N) wait times which scale linearly with the number of items.
**Action:** When performing independent asynchronous operations within a loop (like database updates or API calls), map the operations into an array of Promises and execute them concurrently using `Promise.all()`. This allows the browser to dispatch the requests simultaneously and minimizes the total wait time to approximately O(1) in terms of overall latency.

## 2026-03-22 - [Bypassing Utility Functions for Micro-optimizations]
**Learning:** Attempted to optimize ~60 redundant `new Date()` instantiations per calendar render by replacing a central utility call (`App.utils.formatDate`) with inline string concatenation (`${year}-${monthStr}-${dayStr}`). This was rejected because breaking the Single Source of Truth for a utility function introduces significant technical debt and risks silent failures for unnoticeable fraction-of-a-millisecond performance gains.
**Action:** Never bypass established utility functions for the sake of micro-optimizations. Only implement optimizations that provide measurable impact without sacrificing code maintainability or architecture.

## 2026-03-22 - [Unoptimized Image Loading in Dynamic Lists]
**Learning:** Found an anti-pattern in `createPostCard` and `updatePreview` where dynamic `<img>` tags (which can potentially render many items below the fold) lacked the `loading="lazy"` attribute, leading to eager loading of all images and unnecessary initial bandwidth and memory usage.
**Action:** Always add native `loading="lazy"` attributes to `<img>` tags, especially those rendered dynamically in lists, feeds, or off-screen preview panels, to defer network requests and improve initial load performance.
