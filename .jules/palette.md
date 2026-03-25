
## 2024-11-20 - Missing ARIA Labels on Icon-Only Actions
**Learning:** Found a recurring pattern where icon-only action buttons (e.g., FontAwesome icons for delete, edit, close, next/prev) lacked `aria-label`s, rendering them inaccessible to screen readers. This applied to both static layout components (like modal close buttons) and dynamically generated list items (like task and post cards).
**Action:** Always verify that buttons containing only an icon `<i class="..."></i>` or symbols (`&lt;`, `&gt;`) include a descriptive `aria-label="..."` attribute to ensure proper screen reader accessibility.
