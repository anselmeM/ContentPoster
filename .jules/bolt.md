## 2024-06-18 - [Notification Engine O(N*M) lookups]
**Learning:** Found an O(N*M) lookup pattern in `runNotificationEngine` where `Array.prototype.some()` is used to check for existing notification keys while iterating over posts and tasks.
**Action:** Always pre-compute a `Set` of existing keys before iterating over collections to achieve O(1) lookups, changing the complexity to O(N+M).

## 2024-06-19 - [DOM Layout Thrashing in List Rendering]
**Learning:** The `renderCalendar` function was appending `div` elements directly to the live DOM (`calendarGrid.appendChild()`) inside a loop that runs ~35 times per render. This causes the browser to recalculate layout repeatedly (layout thrashing), which is a significant performance bottleneck in list rendering.
**Action:** Always use a `DocumentFragment` to batch DOM insertions when rendering lists. Append elements to the fragment in the loop, then append the fragment to the DOM once at the end.

## 2024-06-20 - [Redundant iterations and intermediate array allocations with chained filters]
**Learning:** Found an $O(3N)$ operation pattern where `.filter(condition).length` was used repeatedly on the same array to calculate distinct state totals, leading to unnecessary full iterations and garbage-collected intermediate arrays.
**Action:** Always combine multiple counting or filtering operations on the same array into a single-pass loop (e.g., `for...of` or `.reduce()`) rather than using repeated iterations like `.filter().length`, to achieve $O(N)$ time complexity and prevent intermediate array garbage collection.
