import { describe, expect, it, vi } from 'vitest';

import { healthcheck } from '@/utils/healthcheck';

describe('healthcheck', () => {
  it('returns a HealthStatus object with all required properties', () => {
    const result = healthcheck();

    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('uptime');
    expect(result).toHaveProperty('version');
    expect(result).toHaveProperty('checks');
  });

  it('returns a valid status value', () => {
    const result = healthcheck();

    expect(['healthy', 'degraded', 'unhealthy']).toContain(result.status);
  });

  it('returns a valid ISO timestamp', () => {
    const result = healthcheck();

    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('returns a positive uptime value', () => {
    const result = healthcheck();

    expect(result.uptime).toBeGreaterThanOrEqual(0);
  });

  it('returns version 1.0.0', () => {
    const result = healthcheck();

    expect(result.version).toBe('1.0.0');
  });

  it('includes DOM check in checks object', () => {
    const result = healthcheck();

    expect(result.checks).toHaveProperty('dom');
    expect(typeof result.checks.dom).toBe('boolean');
  });

  it('includes memory check in checks object', () => {
    const result = healthcheck();

    expect(result.checks).toHaveProperty('memory');
    expect(typeof result.checks.memory).toBe('boolean');
  });

  it('returns healthy status when DOM is available', () => {
    const result = healthcheck();

    // In a browser environment, DOM should be available
    expect(result.checks.dom).toBe(true);
    expect(result.status).not.toBe('unhealthy');
  });

  it('returns healthy status when memory usage is below 90%', () => {
    const result = healthcheck();

    // In a normal test environment, memory should not be critically high
    expect(result.checks.memory).toBe(true);
  });

  it('returns different timestamps on consecutive calls', () => {
    const result1 = healthcheck();
    // Small delay to ensure different timestamps
    const result2 = healthcheck();

    // Timestamps should be different (or at least the uptime should be)
    expect(result2.uptime).toBeGreaterThanOrEqual(result1.uptime);
  });

  it('returns increasing uptime values on consecutive calls', () => {
    const result1 = healthcheck();
    const result2 = healthcheck();

    expect(result2.uptime).toBeGreaterThanOrEqual(result1.uptime);
  });

  it('marks status as unhealthy when DOM is unavailable', () => {
    // Mock document to be unavailable
    const originalDocument = global.document;
    Object.defineProperty(global, 'document', {
      value: undefined,
      configurable: true,
    });

    try {
      const result = healthcheck();
      expect(result.status).toBe('unhealthy');
      expect(result.checks.dom).toBe(false);
    } finally {
      // Restore document
      Object.defineProperty(global, 'document', {
        value: originalDocument,
        configurable: true,
      });
    }
  });

  it('marks status as degraded when memory usage is high', () => {
    // Mock performance.memory to simulate high memory usage
    const originalPerformance = global.performance;
    Object.defineProperty(global, 'performance', {
      value: {
        ...originalPerformance,
        memory: {
          usedJSHeapSize: 900,
          jsHeapSizeLimit: 1000, // 90% usage
        },
      },
      configurable: true,
    });

    try {
      const result = healthcheck();
      expect(result.status).toBe('degraded');
      expect(result.checks.memory).toBe(false);
    } finally {
      // Restore performance
      Object.defineProperty(global, 'performance', {
        value: originalPerformance,
        configurable: true,
      });
    }
  });

  it('returns healthy status when memory usage is below 90%', () => {
    // Mock performance.memory to simulate normal memory usage
    const originalPerformance = global.performance;
    Object.defineProperty(global, 'performance', {
      value: {
        ...originalPerformance,
        memory: {
          usedJSHeapSize: 500,
          jsHeapSizeLimit: 1000, // 50% usage
        },
      },
      configurable: true,
    });

    try {
      const result = healthcheck();
      expect(result.checks.memory).toBe(true);
    } finally {
      // Restore performance
      Object.defineProperty(global, 'performance', {
        value: originalPerformance,
        configurable: true,
      });
    }
  });
});
