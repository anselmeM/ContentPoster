## 2024-06-18 - [Notification Engine O(N*M) lookups]
**Learning:** Found an O(N*M) lookup pattern in `runNotificationEngine` where `Array.prototype.some()` is used to check for existing notification keys while iterating over posts and tasks.
**Action:** Always pre-compute a `Set` of existing keys before iterating over collections to achieve O(1) lookups, changing the complexity to O(N+M).

## 2024-06-19 - [DOM Layout Thrashing in List Rendering]
**Learning:** The `renderCalendar` function was appending `div` elements directly to the live DOM (`calendarGrid.appendChild()`) inside a loop that runs ~35 times per render. This causes the browser to recalculate layout repeatedly (layout thrashing), which is a significant performance bottleneck in list rendering.
**Action:** Always use a `DocumentFragment` to batch DOM insertions when rendering lists. Append elements to the fragment in the loop, then append the fragment to the DOM once at the end.
