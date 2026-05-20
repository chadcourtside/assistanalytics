import { describe, it, expect } from 'vitest';
import {
  getEmbedStartSeconds,
  getYoutubeWatchUrl,
  loadFilmPreroll,
} from './youtube.js';

describe('youtube film helpers', () => {
  it('subtracts preroll for embed start', () => {
    expect(getEmbedStartSeconds(50, 3)).toBe(47);
    expect(getEmbedStartSeconds(2, 3)).toBe(0);
  });

  it('builds watch url with timestamp', () => {
    expect(getYoutubeWatchUrl('abc123def45', 47)).toBe(
      'https://www.youtube.com/watch?v=abc123def45&t=47s'
    );
  });

  it('defaults preroll to 3', () => {
    expect(loadFilmPreroll()).toBe(3);
  });
});
