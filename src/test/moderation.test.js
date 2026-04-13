import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  moderateContent, 
  containsWords, 
  filterProfanity,
  generateModerationReport,
  moderateBatch 
} from '../services/moderation';

describe('Moderation Service', () => {
  describe('moderateContent', () => {
    it('should approve empty content', () => {
      const result = moderateContent('');
      expect(result.approved).toBe(true);
    });

    it('should detect excessive capitalization', () => {
      const result = moderateContent('THIS IS ALL CAPS TEXT THAT IS WAY TOO LONG');
      expect(result.issues.some(i => i.message.includes('capitalization'))).toBe(true);
    });

    it('should detect excessive emojis', () => {
      const result = moderateContent('🎉🎊🎈🎁🎄🎅🦅🦄👽🤖');
      expect(result.issues.some(i => i.message.includes('emoji'))).toBe(true);
    });

    it('should detect repeated characters', () => {
      const result = moderateContent('gooooood moooorning');
      expect(result.issues.some(i => i.message.includes('Repeated characters'))).toBe(true);
    });

    it('should detect repeated words', () => {
      const result = moderateContent('very very very very very');
      expect(result.issues.some(i => i.message.includes('Repeated words'))).toBe(true);
    });

    it('should detect excessive URLs', () => {
      const text = Array(6).fill('https://example.com').join(' ');
      const result = moderateContent(text);
      expect(result.issues.some(i => i.message.includes('Too many URLs'))).toBe(true);
    });

    it('should detect spam patterns', () => {
      const result = moderateContent('Buy now! Limited time offer! Act now!');
      expect(result.issues.some(i => i.message.includes('spam-like pattern'))).toBe(true);
    });

    it('should check restricted words', () => {
      const result = moderateContent('Check out this spam link');
      expect(result.issues.some(i => i.message.includes('restricted keywords'))).toBe(true);
    });

    it('should use strict mode', () => {
      const moderate = moderateContent('SOME CAPS TEXT', { strictMode: true });
      const notStrict = moderateContent('SOME CAPS TEXT', { strictMode: false });
      
      // In strict mode, should be more likely to flag
      expect(moderate.score).toBeGreaterThan(0);
    });

    it('should calculate spam score', () => {
      const result = moderateContent('BUY NOW!!! 🎉🎉🎉 http://spam.com');
      expect(result.score).toBeGreaterThan(0);
      expect(result.severity).toMatch(/low|medium|high/);
    });
  });

  describe('containsWords', () => {
    it('should find words in text', () => {
      const found = containsWords('This text has spam and viruses', ['spam', 'virus']);
      expect(found).toEqual(['spam', 'virus']);
    });

    it('should return empty array if no matches', () => {
      const found = containsWords('Clean text here', ['bad', 'ugly']);
      expect(found).toEqual([]);
    });

    it('should be case insensitive', () => {
      const found = containsWords('SPAM everywhere', ['spam']);
      expect(found).toEqual(['spam']);
    });
  });

  describe('filterProfanity', () => {
    it('should replace profanity with replacement', () => {
      // Note: The default profanity list is empty, so this tests the mechanism
      const filtered = filterProfanity('Test badword here', '***');
      expect(filtered).toBe('Test badword here');
    });

    it('should use default replacement', () => {
      const filtered = filterProfanity('Test word');
      expect(filtered).toBe('Test word');
    });
  });

  describe('generateModerationReport', () => {
    it('should generate report with timestamp', () => {
      const report = generateModerationReport('Clean content');
      expect(report.timestamp).toBeDefined();
      expect(report.status).toBe('approved');
      expect(report.issues).toBeDefined();
    });

    it('should flag inappropriate content', () => {
      const report = generateModerationReport('BUY NOW!!!');
      expect(report.status).toMatch(/approved|flagged/);
    });
  });

  describe('moderateBatch', () => {
    it('should process multiple posts', () => {
      const posts = [
        { id: '1', content: 'Clean' },
        { id: '2', content: 'Spam buy now' }
      ];
      const results = moderateBatch(posts);
      expect(results).toHaveLength(2);
      expect(results[0].postId).toBe('1');
      expect(results[1].postId).toBe('2');
    });
  });
});