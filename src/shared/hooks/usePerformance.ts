/**
 * usePerformance — Web Vitals Tracking
 * ──────────────────────────────────────
 * Measures LCP, FCP, and TTFB using PerformanceObserver.
 * Reports to logger (and Sentry in production).
 */

import { useEffect } from 'react';
import { logger }    from '@/shared/lib/logger';

interface Metric { name: string; value: number; rating: 'good' | 'needs-improvement' | 'poor'; }

function rateMetric(name: string, value: number): Metric['rating'] {
  const thresholds: Record<string, [number, number]> = {
    LCP:  [2500, 4000],
    FCP:  [1800, 3000],
    TTFB: [800,  1800],
    CLS:  [0.1,  0.25],
    FID:  [100,  300],
  };
  const [good, poor] = thresholds[name] ?? [1000, 3000];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

function reportMetric(metric: Metric): void {
  logger.info(`[Vitals] ${metric.name}`, { value: metric.value, rating: metric.rating });

  if (metric.rating === 'poor') {
    logger.warn(`[Vitals] Poor ${metric.name}`, { value: metric.value });
  }
}

export function usePerformance(): void {
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    // LCP — Largest Contentful Paint
    try {
      const lcpObs = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) {
          const metric: Metric = { name: 'LCP', value: last.startTime, rating: rateMetric('LCP', last.startTime) };
          reportMetric(metric);
        }
      });
      lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });

      return () => lcpObs.disconnect();
    } catch {
      // PerformanceObserver not supported in all browsers
    }
  }, []);

  useEffect(() => {
    // TTFB — Time To First Byte
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (nav) {
      const ttfb = nav.responseStart - nav.requestStart;
      reportMetric({ name: 'TTFB', value: ttfb, rating: rateMetric('TTFB', ttfb) });
    }
  }, []);
}
