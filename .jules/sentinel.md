## 2026-03-14 - XSS Vulnerability in DOM Injection
**Vulnerability:** User-controlled inputs like task text, post titles, images, and notifications were being inserted directly into the DOM using `innerHTML` without prior sanitization.
**Learning:** This exposes the application to severe Cross-Site Scripting (XSS) attacks. Malicious users could execute arbitrary JavaScript. The root cause was trusting user-provided inputs within template literals that directly formed HTML injected into the page.
**Prevention:** Implement a global escaping utility (e.g., `App.utils.escapeHTML`) to convert potentially dangerous characters (`&`, `<`, `>`, `"`, `'`) to their HTML entity equivalents before embedding any user data into the DOM via `innerHTML`. Alternatively, use safer properties like `textContent` where HTML parsing is not intended.

## 2026-03-14 - Insufficient sanitization of URL attributes
**Vulnerability:** The `escapeHTML` function is insufficient to sanitize user-provided URLs in HTML attributes like `src` or `href`. For example, javascript: URIs can bypass HTML escaping because they do not rely on HTML entities to execute scripts when set as an image source (`src="javascript:alert('XSS')"`) or link destination.
**Learning:** Only relying on `escapeHTML` for URLs is a severe XSS risk. Input values meant for URL attributes must be explicitly checked and validated against a list of safe protocols (e.g., `http:`, `https:`, `mailto:`).
**Prevention:** Implement a global URL sanitization utility (e.g., `App.utils.sanitizeURL`) to parse the URL and verify that its protocol matches a predefined safelist. Use this utility to wrap any user-controlled inputs before injecting them into URL attributes like `src` or `href`, possibly applying `escapeHTML` afterwards as an additional layer of defense.

## 2026-03-14 - Missed XSS vector in Preview Area
**Vulnerability:** A fallback condition in the `updatePreview` function injected the `platform` variable directly into the DOM via `innerHTML` without sanitization (`<div class="...">Preview for ${platform} coming soon...</div>`).
**Learning:** Even internal state variables (like `platform` derived from radio buttons) can be manipulated if the DOM is altered or if values are unexpectedly passed. Trusting any dynamically constructed HTML string for `innerHTML` without escaping is risky.
**Prevention:** Always wrap variables injected into HTML strings destined for `innerHTML` with an escaping function like `App.utils.escapeHTML()`, regardless of whether the source appears "safe" or controlled.
