// Async utility functions for better concurrency and performance

/**
 * Debounce function for async operations
 * Prevents multiple rapid calls to expensive operations
 */
export function debounceAsync(func, delay) {
  let timeoutId;
  let lastPromise;
  
  return function(...args) {
    clearTimeout(timeoutId);
    
    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await func.apply(this, args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
}

/**
 * Throttle function for async operations
 * Limits the frequency of expensive operations
 */
export function throttleAsync(func, limit) {
  let inThrottle;
  let lastResult;
  
  return async function(...args) {
    if (!inThrottle) {
      inThrottle = true;
      lastResult = await func.apply(this, args);
      setTimeout(() => inThrottle = false, limit);
    }
    return lastResult;
  };
}

/**
 * Batch async operations
 * Groups multiple operations and executes them in batches
 */
export class AsyncBatcher {
  constructor(batchSize = 10, delay = 100) {
    this.batchSize = batchSize;
    this.delay = delay;
    this.queue = [];
    this.processing = false;
  }
  
  async add(operation) {
    return new Promise((resolve, reject) => {
      this.queue.push({ operation, resolve, reject });
      
      if (!this.processing) {
        this.processBatch();
      }
    });
  }
  
  async processBatch() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      
      try {
        // Execute batch operations in parallel
        const results = await Promise.allSettled(
          batch.map(({ operation }) => operation())
        );
        
        // Resolve/reject each promise based on result
        results.forEach((result, index) => {
          const { resolve, reject } = batch[index];
          
          if (result.status === 'fulfilled') {
            resolve(result.value);
          } else {
            reject(result.reason);
          }
        });
      } catch (error) {
        // Reject all promises in case of unexpected error
        batch.forEach(({ reject }) => reject(error));
      }
      
      // Small delay between batches
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }
    
    this.processing = false;
  }
}

/**
 * Parallel async operations with concurrency limit
 */
export async function parallelLimit(operations, limit = 5) {
  const results = [];
  const executing = [];
  
  for (const operation of operations) {
    const promise = Promise.resolve(operation()).then(result => {
      executing.splice(executing.indexOf(promise), 1);
      return result;
    });
    
    results.push(promise);
    executing.push(promise);
    
    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }
  
  return Promise.all(results);
}

/**
 * Retry async operation with exponential backoff
 */
export async function retryAsync(operation, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Cache async operation results
 */
export class AsyncCache {
  constructor(ttl = 60000) { // 1 minute default TTL
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  async get(key, factory) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.value;
    }
    
    const value = await factory();
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
    
    return value;
  }
  
  clear() {
    this.cache.clear();
  }
  
  delete(key) {
    this.cache.delete(key);
  }
}

// Global instances
export const messageBatcher = new AsyncBatcher(20, 50); // Batch messages
export const imageBatcher = new AsyncBatcher(5, 200);   // Batch image operations
export const apiCache = new AsyncCache(30000);          // 30s API cache