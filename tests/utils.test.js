import test from 'node:test';
import assert from 'node:assert';

// Mock window object for Node.js environment
global.window = {
    location: {
        origin: 'http://localhost:8000'
    }
};

import { sanitizeURL, escapeHTML, formatDate, showFeedback, debounce } from '../js/utils.js';

test('sanitizeURL', async (t) => {
    await t.test('allows safe protocols (http, https, mailto)', () => {
        assert.strictEqual(sanitizeURL('http://example.com'), 'http://example.com/');
        assert.strictEqual(sanitizeURL('https://example.com'), 'https://example.com/');
        assert.strictEqual(sanitizeURL('mailto:test@example.com'), 'mailto:test@example.com');
    });

    await t.test('blocks unsafe protocols like javascript:', () => {
        const fallback = 'https://placehold.co/200x100/cccccc/ffffff?text=Invalid+URL';
        assert.strictEqual(sanitizeURL('javascript:alert(1)'), fallback);
        assert.strictEqual(sanitizeURL('data:text/html,<script>alert(1)</script>'), fallback);
    });

    await t.test('handles empty or missing URLs', () => {
        const fallback = 'https://placehold.co/200x100/cccccc/ffffff?text=Invalid+URL';
        assert.strictEqual(sanitizeURL(''), fallback);
        assert.strictEqual(sanitizeURL(null), fallback);
        assert.strictEqual(sanitizeURL(undefined), fallback);
    });
});

test('escapeHTML', async (t) => {
    await t.test('escapes XSS characters', () => {
        assert.strictEqual(escapeHTML('<script>alert("XSS & testing\'s")</script>'), '&lt;script&gt;alert(&quot;XSS &amp; testing&#39;s&quot;)&lt;/script&gt;');
    });

    await t.test('handles non-string values gracefully', () => {
        assert.strictEqual(escapeHTML(123), '123');
        assert.strictEqual(escapeHTML(true), 'true');
    });
});

test('formatDate', async (t) => {
    await t.test('formats dates consistently using UTC input (year, monthIndex, day)', () => {
        // Month index 0 is January
        const date = new Date(2023, 0, 15);
        assert.strictEqual(formatDate(date), '2023-01-15');
    });

    await t.test('pads single-digit months and days', () => {
        const date = new Date(2024, 8, 5); // September 5
        assert.strictEqual(formatDate(date), '2024-09-05');
    });
});

test('showFeedback', async (t) => {
    await t.test('updates element properties correctly', () => {
        const dummyElement = { textContent: '', className: '' };
        let capturedCb;
        const dummySetTimeout = (fn) => { capturedCb = fn; return 1; };

        // Save global setTimeout
        const originalSetTimeout = global.setTimeout;
        global.setTimeout = dummySetTimeout;

        try {
            showFeedback(dummyElement, 'Success!', false);
            assert.strictEqual(dummyElement.textContent, 'Success!');
            assert.strictEqual(dummyElement.className, 'text-sm text-green-600');

            capturedCb();

            assert.strictEqual(dummyElement.textContent, '');
            assert.strictEqual(dummyElement.className, '');
        } finally {
            global.setTimeout = originalSetTimeout;
        }
    });

    await t.test('updates element correctly with custom setTimeout', () => {
        const dummyElement = { textContent: '', className: '' };
        let callbackFired = false;

        const originalSetTimeout = global.setTimeout;
        global.setTimeout = (cb, ms) => {
            assert.strictEqual(ms, 3000);
            callbackFired = true;
            // Removed immediate cb() call so we can check className before it's cleared
            // We'll call it manually if needed, or just let it be since this tests custom setTimeout assignment
            return 123;
        };

        try {

            showFeedback(dummyElement, 'Success message');
            assert.strictEqual(dummyElement.className, 'text-sm text-green-600');
            assert.strictEqual(callbackFired, true);

            showFeedback(dummyElement, 'Error message', true);
            assert.strictEqual(dummyElement.className, 'text-sm text-red-600');
        } finally {
            global.setTimeout = originalSetTimeout;
        }
    });
});

test('debounce', async (t) => {
    await t.test('executes function only once after wait time', async () => {
        let callCount = 0;
        const fn = () => { callCount++; };
        const debouncedFn = debounce(fn, 10);

        debouncedFn();
        debouncedFn();
        debouncedFn();

        assert.strictEqual(callCount, 0);

        await new Promise(resolve => setTimeout(resolve, 20));

        assert.strictEqual(callCount, 1);
    });

    await t.test('passes correct arguments to the function', async () => {
        let result = null;
        const fn = (arg1, arg2) => { result = arg1 + arg2; };
        const debouncedFn = debounce(fn, 10);

        debouncedFn(5, 10);

        await new Promise(resolve => setTimeout(resolve, 20));

        assert.strictEqual(result, 15);
    });
});
