## 2024-06-23 - Array Short-Circuit Optimization
**Learning:** Checking for the existence of an error in an array by mapping/filtering the entire array (e.g., `issues.filter(i => i.type === 'error').length === 0`) creates redundant intermediate arrays and iterates through the entire dataset needlessly.
**Action:** Always prefer early-return loop methods like `.some()` or `.every()` (e.g., `!issues.some(i => i.type === 'error')`) to short-circuit array evaluation and maintain O(1) memory complexity, especially when building complex condition checks.
