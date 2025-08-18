import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from './NewsDetails';

describe('sanitizeHtml', () => {
  it('removes script tags and event handlers', () => {
    const malicious = '<img src=x onerror="alert(1)"><script>alert("xss")</script>';
    const sanitized = sanitizeHtml(malicious);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('onerror');
  });
});
