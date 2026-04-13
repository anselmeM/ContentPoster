
## 2024-11-20 - Missing ARIA Labels on Icon-Only Actions
**Learning:** Found a recurring pattern where icon-only action buttons (e.g., FontAwesome icons for delete, edit, close, next/prev) lacked `aria-label`s, rendering them inaccessible to screen readers. This applied to both static layout components (like modal close buttons) and dynamically generated list items (like task and post cards).
**Action:** Always verify that buttons containing only an icon `<i class="..."></i>` or symbols (`&lt;`, `&gt;`) include a descriptive `aria-label="..."` attribute to ensure proper screen reader accessibility.

## 2024-11-20 - Missing ARIA Labels in Complex Modals
**Learning:** Icon-only action buttons hidden within complex sub-components or modals (like the tabbed interface in `BulkUpload.jsx`) are frequently missed when applying accessibility standards. Dynamic values in labels, such as injecting the file name into a delete button's `aria-label` (e.g., `` `Remove file ${file.name}` ``), provide significant context for screen reader users compared to a generic "Delete" label.
**Action:** Always verify that buttons containing only an icon include a descriptive `aria-label` attribute. When the action applies to a specific item in a list (like a file or post), interpolate the item's name or title into the `aria-label` to provide precise context for assistive technologies.

## 2026-04-13 - Missing ARIA attributes on interactive and toggle buttons
**Learning:** Found a pattern where dynamically toggled contextual menus (like "Comment options" `fa-ellipsis-h` icon buttons) and section toggle buttons missed `aria-expanded` and `aria-label` attributes. This leaves screen reader users completely unaware of the button's action and current state (whether the menu/section is currently expanded or collapsed).
**Action:** Always ensure that icon-only interactive elements receive descriptive `aria-label`s, and that any button that toggles visibility of other UI elements has an `aria-expanded={boolean}` attribute synced with its state.
