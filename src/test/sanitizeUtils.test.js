import { describe, it, expect } from 'vitest';
import { sanitizeURL } from '../utils/sanitizeUtils';

describe('sanitizeURL', () => {
  it('should return empty or input if falsy or empty', () => {
    expect(sanitizeURL(null)).toBe(null);
    expect(sanitizeURL(undefined)).toBe(undefined);
    expect(sanitizeURL('')).toBe('');
    expect(sanitizeURL('  ')).toBe('');
  });

  it('should allow valid protocols', () => {
    expect(sanitizeURL('http://example.com')).toBe('http://example.com');
    expect(sanitizeURL('https://example.com')).toBe('https://example.com');
    expect(sanitizeURL('mailto:test@example.com')).toBe('mailto:test@example.com');
    expect(sanitizeURL('tel:+123456789')).toBe('tel:+123456789');
  });

  it('should allow relative URLs', () => {
    expect(sanitizeURL('/path/to/resource')).toBe('/path/to/resource');
    expect(sanitizeURL('./relative/path')).toBe('./relative/path');
    expect(sanitizeURL('relative/path')).toBe('relative/path');
  });

  it('should allow blob URLs', () => {
    expect(sanitizeURL('blob:https://example.com/a42b-42b4-82a1-a4b2')).toBe('blob:https://example.com/a42b-42b4-82a1-a4b2');
  });

  it('should block javascript: URLs', () => {
    expect(sanitizeURL('javascript:alert("XSS")')).toBe('about:blank');
    expect(sanitizeURL('javascript://alert("XSS")')).toBe('about:blank');
    expect(sanitizeURL('  javascript:alert("XSS") ')).toBe('about:blank');
    expect(sanitizeURL('JAVASCRIPT:alert("XSS")')).toBe('about:blank');
  });

  it('should allow data:image/ URLs', () => {
    expect(sanitizeURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
    expect(sanitizeURL('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAGBAQABAAAAAAAAAAAAAAAAAA//2Q==')).toBe('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAGBAQABAAAAAAAAAAAAAAAAAA//2Q==');
  });

  it('should block malicious data: URLs', () => {
    expect(sanitizeURL('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe('about:blank');
    expect(sanitizeURL('data:text/javascript;charset=utf-8,%61%6c%65%72%74%28%31%29')).toBe('about:blank');
    expect(sanitizeURL('data:application/pdf;base64,JVBERi0xLjQK')).toBe('about:blank');
  });

  it('should gracefully handle invalid URLs', () => {
    // This expects to be treated as a relative URL "not-a-url" which will be appended to the dummybase and have HTTP protocol, hence allowed, BUT wait...
    // If it is just 'not-a-url', `new URL('not-a-url', 'http://dummybase.com')` makes it `http://dummybase.com/not-a-url`.
    // The protocol is http:, so it returns 'not-a-url'.
    expect(sanitizeURL('not-a-url')).toBe('not-a-url');
  });
});
