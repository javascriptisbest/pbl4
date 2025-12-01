// Performance monitoring and optimization utilities

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.isMonitoring = import.meta.env.DEV;
    this.initWorkerSupport();
  }

  initWorkerSupport() {
    // Check for Web Worker support
    this.supportsWorkers = typeof Worker !== "undefined";
    this.supportsSharedArrayBuffer = typeof SharedArrayBuffer !== "undefined";
    this.supportsConcurrency = navigator.hardwareConcurrency || 2;

    console.log("🔧 Performance Features:");
    console.log("  Web Workers:", this.supportsWorkers);
    console.log("  SharedArrayBuffer:", this.supportsSharedArrayBuffer);
    console.log("  CPU Cores:", this.supportsConcurrency);
  }

  // Measure function execution time
  measure(name, fn) {
    if (!this.isMonitoring) return fn;

    return async (...args) => {
      const start = performance.now();
      const result = await fn(...args);
      const end = performance.now();

      const duration = end - start;
      this.recordMetric(name, duration);

      if (duration > 100) {
        console.warn(
          `⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms`
        );
      }

      return result;
    };
  }

  recordMetric(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        count: 0,
        total: 0,
        min: Infinity,
        max: 0,
        avg: 0,
      });
    }

    const metric = this.metrics.get(name);
    metric.count++;
    metric.total += value;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    metric.avg = metric.total / metric.count;
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  // Monitor memory usage
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
      };
    }
    return null;
  }

  // Monitor FPS
  startFPSMonitoring() {
    if (!this.isMonitoring) return;

    let frames = 0;
    let lastTime = performance.now();

    const countFPS = () => {
      frames++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        this.recordMetric("fps", fps);

        if (fps < 30) {
          console.warn(`⚠️ Low FPS: ${fps}`);
        }

        frames = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(countFPS);
    };

    requestAnimationFrame(countFPS);
  }

  // Monitor network performance
  measureNetworkRequest(url, options = {}) {
    if (!this.isMonitoring) {
      return fetch(url, options);
    }

    const start = performance.now();

    return fetch(url, options).then((response) => {
      const end = performance.now();
      const duration = end - start;

      this.recordMetric("networkRequest", duration);
      this.recordMetric(`network_${new URL(url).pathname}`, duration);

      if (duration > 2000) {
        console.warn(
          `⚠️ Slow network request: ${url} took ${duration.toFixed(2)}ms`
        );
      }

      return response;
    });
  }

  // Report performance summary
  generateReport() {
    const metrics = this.getMetrics();
    const memory = this.getMemoryUsage();

    console.group("📊 Performance Report");

    if (memory) {
      console.log(
        `💾 Memory: ${memory.used}MB / ${memory.total}MB (${Math.round(
          (memory.used / memory.total) * 100
        )}%)`
      );
    }

    Object.entries(metrics).forEach(([name, metric]) => {
      console.log(
        `⏱️ ${name}: avg ${metric.avg.toFixed(2)}ms (${
          metric.count
        } calls, min: ${metric.min.toFixed(2)}ms, max: ${metric.max.toFixed(
          2
        )}ms)`
      );
    });

    console.groupEnd();
  }

  // Auto-report every 30 seconds in development
  startAutoReporting() {
    if (this.isMonitoring) {
      setInterval(() => {
        this.generateReport();
      }, 30000);
    }
  }

  clear() {
    this.metrics.clear();
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();

// Wrapper functions for common operations
export const measureAsync = (name, fn) => performanceMonitor.measure(name, fn);
export const measureNetwork = (url, options) =>
  performanceMonitor.measureNetworkRequest(url, options);

// Auto-start monitoring in development
if (import.meta.env.DEV) {
  performanceMonitor.startFPSMonitoring();
  performanceMonitor.startAutoReporting();

  // Global access for debugging
  window.performanceMonitor = performanceMonitor;
}
