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

## 2024-10-24 - React `src`/`href` Attribute Sanitization
**Vulnerability:** User-provided inputs, such as `post.image` or `template.image`, were passed directly to the `src` attribute of `<img>` tags across several components.
**Learning:** While React automatically escapes characters injected directly into the DOM (mitigating standard text-based XSS), it does not sanitize the contents of attributes like `src` or `href` to prevent malicious URI protocols. Consequently, values like `javascript:alert('XSS')` bypass React's standard escaping mechanisms and result in script execution.
**Prevention:** Always implement a dedicated utility function (e.g., `sanitizeURL()`) to validate that any user-controlled URL conforms to a strictly allowed protocol list (`http:`, `https:`, etc.) before passing the variable to an attribute prop in JSX.
## 2025-05-24 - [Fix Stored XSS in Media and Avatars]
**Vulnerability:** Unsanitized variables `user.photoURL` and `item.url` were being injected directly into the `src` attribute of `<img>` tags in `PresenceIndicator.jsx` and `MediaLibrary.jsx`.
**Learning:** Even though images might originate from known or internal sources, user-controlled inputs (like an uploaded avatar or media library item) can potentially be crafted to execute `javascript:` URIs if they are displayed without protocol validation.
**Prevention:** Always wrap dynamically generated or user-controlled URLs in `src` or `href` attributes with a utility like `sanitizeURL` to restrict to allowed protocols.
