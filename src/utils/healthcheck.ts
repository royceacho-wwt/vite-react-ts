/**
 * Health status of the application
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    dom: boolean;
    memory: boolean;
  };
}

/**
 * Performs a health check on the application
 * @returns HealthStatus object indicating the current health of the application
 */
export function healthcheck(): HealthStatus {
  const timestamp = new Date().toISOString();
  const uptime = performance.now();

  // Check if DOM is available
  const domCheck = typeof document !== 'undefined' && document.documentElement !== null;

  // Check memory usage (if available in the environment)
  let memoryCheck = true;
  if (typeof performance !== 'undefined' && performance.memory) {
    // Memory check passes if we're not using more than 90% of available memory
    const memoryUsagePercent = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100;
    memoryCheck = memoryUsagePercent < 90;
  }

  const checks = {
    dom: domCheck,
    memory: memoryCheck,
  };

  // Determine overall status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (!domCheck) {
    status = 'unhealthy';
  } else if (!memoryCheck) {
    status = 'degraded';
  }

  return {
    status,
    timestamp,
    uptime,
    version: '1.0.0',
    checks,
  };
}
