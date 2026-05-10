
## 2024-11-20 - Missing ARIA Labels on Icon-Only Actions
**Learning:** Found a recurring pattern where icon-only action buttons (e.g., FontAwesome icons for delete, edit, close, next/prev) lacked `aria-label`s, rendering them inaccessible to screen readers. This applied to both static layout components (like modal close buttons) and dynamically generated list items (like task and post cards).
**Action:** Always verify that buttons containing only an icon `<i class="..."></i>` or symbols (`&lt;`, `&gt;`) include a descriptive `aria-label="..."` attribute to ensure proper screen reader accessibility.

## 2024-11-20 - Missing ARIA Labels in Complex Modals
**Learning:** Icon-only action buttons hidden within complex sub-components or modals (like the tabbed interface in `BulkUpload.jsx`) are frequently missed when applying accessibility standards. Dynamic values in labels, such as injecting the file name into a delete button's `aria-label` (e.g., `` `Remove file ${file.name}` ``), provide significant context for screen reader users compared to a generic "Delete" label.
**Action:** Always verify that buttons containing only an icon include a descriptive `aria-label` attribute. When the action applies to a specific item in a list (like a file or post), interpolate the item's name or title into the `aria-label` to provide precise context for assistive technologies.

## 2026-04-06 - Accessible Icon Buttons
**Learning:** Icon-only buttons mapped from dynamic data often lack explicit `aria-label`s, rendering them inaccessible to screen readers. Relying only on title tooltips or visual labels on expanded states is insufficient.
**Action:** Always map explicit string labels (e.g. `aria-label={item.label}`) when rendering icon buttons, especially in collapsed sidebars.
