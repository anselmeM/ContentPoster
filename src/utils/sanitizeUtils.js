/**
 * Sanitizes a URL string by ensuring it uses an allowed protocol.
 * If the URL is invalid or uses an unauthorized protocol (like javascript:),
 * it returns 'about:blank' to prevent XSS attacks.
 *
 * @param {string} url - The URL to sanitize
 * @returns {string} - The sanitized URL or 'about:blank'
 */
export const sanitizeURL = (url) => {
  if (!url) return url;

  // Convert to string in case it's not
  const urlString = String(url).trim();

  // If it's empty after trimming, return it
  if (!urlString) return urlString;

  // Allow relative URLs (starts with / or . or just characters without a scheme)
  // A relative URL won't have a protocol parseable by URL constructor if we don't provide a base,
  // but we must be careful not to allow "javascript:..." without a slash.
  // We can use a dummy base to parse all URLs.

  let parsedUrl;
  try {
    parsedUrl = new URL(urlString, 'http://dummybase.com');
  } catch (e) {
    // If URL parsing completely fails, it's safer to block it
    return 'about:blank';
  }

  // If the parsed URL's origin is our dummy base, it means it was a relative URL
  // or something like "foo" which got parsed as "http://dummybase.com/foo".
  // However, "javascript:alert(1)" gets parsed with protocol "javascript:".

  const protocol = parsedUrl.protocol.toLowerCase();

  // Safelist of allowed protocols
  const allowedProtocols = [
    'http:',
    'https:',
    'mailto:',
    'tel:',
    'blob:'
  ];

  if (protocol === 'data:') {
    return urlString.toLowerCase().startsWith('data:image/') ? urlString : 'about:blank';
  }

  if (allowedProtocols.includes(protocol)) {
    return urlString;
  }

  // Block any other protocols, especially javascript:, vbscript:, etc.
  return 'about:blank';
};
