import { describe, it, expect } from 'vitest';
import { sanitize, stripHtml }  from '../sanitize';

describe('sanitize()', () => {
  it('passes through safe formatting tags', () => {
    expect(sanitize('<strong>Hello</strong>')).toBe('<strong>Hello</strong>');
    expect(sanitize('<em>World</em>')).toBe('<em>World</em>');
  });

  it('strips script tags completely', () => {
    const result = sanitize('<script>alert("xss")</script>Hello');
    expect(result).not.toContain('<script>');
    expect(result).toContain('Hello');
  });

  it('strips inline event handlers', () => {
    const result = sanitize('<strong onmouseover="alert(1)">click</strong>');
    expect(result).not.toContain('onmouseover');
    expect(result).toContain('<strong>click</strong>');
  });

  it('strips style attributes', () => {
    const result = sanitize('<span style="color:red">text</span>');
    expect(result).not.toContain('style=');
  });

  it('strips iframe tags', () => {
    const result = sanitize('<iframe src="evil.com"></iframe>safe');
    expect(result).not.toContain('<iframe');
    expect(result).toContain('safe');
  });

  it('strips img with onerror payload', () => {
    const result = sanitize('<img src=x onerror=alert(1)>');
    expect(result).not.toContain('<img');
    expect(result).not.toContain('onerror');
  });

  it('handles empty string gracefully', () => {
    expect(sanitize('')).toBe('');
  });

  it('passes plain text through unchanged', () => {
    expect(sanitize('Hello World')).toBe('Hello World');
  });
});

describe('stripHtml()', () => {
  it('removes all tags, leaves text content', () => {
    expect(stripHtml('<strong>Hello <em>World</em></strong>')).toBe('Hello World');
  });

  it('returns empty string for tag-only input', () => {
    expect(stripHtml('<script>alert(1)</script>')).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(stripHtml('')).toBe('');
  });
});
