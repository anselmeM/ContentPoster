import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  validateContent, 
  validateImage, 
  validateVideo,
  getCharacterLimit,
  getHashtagLimit,
  supportsMediaType,
  formatValidationResult
} from '../../services/validation';

// Mock platform config
vi.mock('../../config/platforms', () => ({
  getPlatformConfig: (platform) => ({
    instagram: {
      id: 'instagram',
      name: 'Instagram',
      maxCaptionLength: 2200,
      maxHashtags: 30,
      supportsVideo: true,
      supportsImages: true
    },
    twitter: {
      id: 'twitter',
      name: 'Twitter',
      maxCaptionLength: 280,
      maxHashtags: 5,
      supportsVideo: true,
      supportsImages: true
    }
  })[platform]
}));

describe('Validation Service', () => {
  describe('validateContent', () => {
    it('should return valid for empty content', () => {
      const result = validateContent('instagram', {});
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate caption length for Twitter', () => {
      const content = { caption: 'a'.repeat(300) };
      const result = validateContent('twitter', content);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('exceeds 280 character limit');
    });

    it('should validate caption length for Instagram', () => {
      const content = { caption: 'a'.repeat(2201) };
      const result = validateContent('instagram', content);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('exceeds 2200 character limit');
    });

    it('should validate hashtag count', () => {
      const content = { hashtags: ['#tag1', '#tag2', '#tag3', '#tag4', '#tag5', '#tag6'] };
      const result = validateContent('twitter', content);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Too many hashtags');
    });

    it('should validate valid hashtag format', () => {
      const content = { hashtags: ['#valid', '#alsoValid'] };
      const result = validateContent('instagram', content);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid hashtag format', () => {
      const content = { hashtags: ['#valid', 'invalid'] };
      const result = validateContent('instagram', content);
      expect(result.errors.some(e => e.includes('Invalid hashtag format'))).toBe(true);
    });

    it('should warn when caption is near limit', () => {
      const content = { caption: 'a'.repeat(2000) }; // 2200 max, so this is 90%+
      const result = validateContent('instagram', content);
      expect(result.warnings.some(w => w.includes('approaching'))).toBe(true);
    });

    it('should validate media type support', () => {
      const content = { mediaType: 'video', media: [{}] };
      const result = validateContent('instagram', content);
      // Should not have media error since Instagram supports video
      expect(result.errors.filter(e => e.includes('does not support'))).toHaveLength(0);
    });

    it('should reject video on platforms that dont support it', () => {
      // Dribbble doesn't support video
      const content = { mediaType: 'video', media: [{}] };
      const result = validateContent('dribbble', content);
      expect(result.errors.some(e => e.includes('does not support video posts'))).toBe(true);
    });

    it('should validate scheduling date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const content = { scheduledDate: pastDate.toISOString() };
      const result = validateContent('instagram', content);
      expect(result.errors).toContain('Scheduled date must be in the future');
    });
  });

  describe('validateImage', () => {
    it('should return null for valid image file', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      expect(validateImage(file, 'instagram')).toBeNull();
    });

    it('should reject unsupported image formats', () => {
      const file = new File(['test'], 'test.bmp', { type: 'image/bmp' });
      const result = validateImage(file, 'instagram');
      expect(result).toContain('Unsupported image format');
    });

    it('should reject files over size limit', () => {
      const file = new File(['x'.repeat(40 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' });
      const result = validateImage(file, 'instagram');
      expect(result).toContain('exceeds');
    });
  });

  describe('validateVideo', () => {
    it('should return null for valid video file', () => {
      const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });
      expect(validateVideo(file, 'twitter')).toBeNull();
    });

    it('should reject unsupported video formats', () => {
      const file = new File(['test'], 'test.avi', { type: 'video/x-msvideo' });
      const result = validateVideo(file, 'instagram');
      expect(result).toContain('Unsupported video format');
    });
  });

  describe('getCharacterLimit', () => {
    it('should return platform-specific character limit', () => {
      expect(getCharacterLimit('twitter')).toBe(280);
      expect(getCharacterLimit('instagram')).toBe(2200);
    });
  });

  describe('getHashtagLimit', () => {
    it('should return platform-specific hashtag limit', () => {
      expect(getHashtagLimit('twitter')).toBe(5);
      expect(getHashtagLimit('instagram')).toBe(30);
    });
  });

  describe('supportsMediaType', () => {
    it('should check if platform supports media type', () => {
      expect(supportsMediaType('instagram', 'image')).toBe(true);
      expect(supportsMediaType('instagram', 'video')).toBe(true);
      expect(supportsMediaType('dribbble', 'image')).toBe(true);
      expect(supportsMediaType('dribbble', 'video')).toBe(false);
    });
  });

  describe('formatValidationResult', () => {
    it('should format valid result as success', () => {
      const result = { valid: true, warnings: [], errors: [] };
      const messages = formatValidationResult(result);
      expect(messages[0].type).toBe('success');
    });

    it('should format errors', () => {
      const result = { valid: false, errors: ['Error 1'], warnings: [] };
      const messages = formatValidationResult(result);
      expect(messages.some(m => m.type === 'error')).toBe(true);
    });

    it('should format warnings', () => {
      const result = { valid: true, errors: [], warnings: ['Warning 1'] };
      const messages = formatValidationResult(result);
      expect(messages.some(m => m.type === 'warning')).toBe(true);
    });
  });
});