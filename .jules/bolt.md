## 2024-03-24 - Double Memoization and Timezones
**Learning:** Optimizing `Date` operations via string comparisons breaks UTC-to-local timezone conversion in complex date validations. Furthermore, bypassing unstable parent functions via custom `areEqual` in `React.memo` creates stale closures, breaking core React principles.
**Action:** Always prefer `Set` conversions for nested iteration O(n²) reduction. Only memoize parent callback structures cleanly, and never compromise timezone parsing for speed.
