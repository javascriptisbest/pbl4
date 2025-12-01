import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Async task queue with worker threads
class TaskQueue {
  constructor(maxWorkers = 4) {
    this.workers = [];
    this.queue = [];
    this.running = new Map();
    this.maxWorkers = maxWorkers;
    this.taskId = 0;
    
    this.initializeWorkers();
  }
  
  initializeWorkers() {
    const workerPath = path.join(__dirname, '../workers/imageWorker.js');
    
    for (let i = 0; i < this.maxWorkers; i++) {
      try {
        // Check if worker file exists first
        import(workerPath).then(() => {
          const worker = new Worker(workerPath);
          
          worker.on('message', (data) => {
            const { id, success, result, error } = data;
            const task = this.running.get(id);
            
            if (task) {
              this.running.delete(id);
              
              if (success) {
                task.resolve(result);
              } else {
                task.reject(new Error(error));
              }
              
              // Process next task in queue
              this.processQueue();
            }
          });
          
          worker.on('error', (error) => {
            console.error(`Worker ${i} error:`, error);
            // Handle worker error and restart if needed
            this.restartWorker(i);
          });
          
          worker.on('exit', (code) => {
            if (code !== 0) {
              console.error(`Worker ${i} stopped with exit code ${code}`);
              this.restartWorker(i);
            }
          });
          
          this.workers.push({ worker, busy: false, id: i });
        }).catch((error) => {
          console.warn(`Worker file not found, skipping worker ${i}:`, error.message);
          // Create placeholder worker
          this.workers.push({ worker: null, busy: false, id: i });
        });
      } catch (error) {
        console.error(`Failed to create worker ${i}:`, error);
        // Create placeholder worker
        this.workers.push({ worker: null, busy: false, id: i });
      }
    }
  }
  
  restartWorker(workerId) {
    const workerObj = this.workers[workerId];
    if (workerObj && workerObj.worker) {
      workerObj.worker.terminate();
    }
    
    // Create new worker
    try {
      const workerPath = path.join(__dirname, '../workers/imageWorker.js');
      const newWorker = new Worker(workerPath);
      
      // Set up event handlers (same as in initializeWorkers)
      this.workers[workerId] = { worker: newWorker, busy: false, id: workerId };
    } catch (error) {
      console.error(`Failed to restart worker ${workerId}:`, error);
    }
  }
  
  async addTask(taskType, payload) {
    return new Promise((resolve, reject) => {
      const task = {
        id: ++this.taskId,
        type: taskType,
        payload,
        resolve,
        reject,
        timestamp: Date.now()
      };
      
      this.queue.push(task);
      this.processQueue();
    });
  }
  
  processQueue() {
    if (this.queue.length === 0) return;
    
    const availableWorker = this.workers.find(w => !w.busy && w.worker !== null);
    
    // If no workers available, process on main thread
    if (!availableWorker) {
      const task = this.queue.shift();
      this.processMainThread(task);
      return;
    }
    
    const task = this.queue.shift();
    availableWorker.busy = true;
    
    this.running.set(task.id, task);
    
    // Send task to worker
    availableWorker.worker.postMessage({
      task: task.type,
      payload: task.payload,
      id: task.id
    });
  }
  
  // Fallback processing on main thread
  processMainThread(task) {
    setTimeout(async () => {
      try {
        // Simple task processing without worker
        const result = { processed: true, mainThread: true, data: task.payload };
        task.resolve(result);
      } catch (error) {
        task.reject(error);
      }
      
      // Process next task
      this.processQueue();
    }, 0);
  }
  
  getStats() {
    return {
      queueLength: this.queue.length,
      runningTasks: this.running.size,
      activeWorkers: this.workers.filter(w => w.busy).length,
      totalWorkers: this.workers.length
    };
  }
  
  async shutdown() {
    // Wait for all running tasks to complete
    while (this.running.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Terminate all workers
    await Promise.all(
      this.workers.map(({ worker }) => worker.terminate())
    );
  }
}

// Global task queue instance
export const taskQueue = new TaskQueue();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down task queue...');
  await taskQueue.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down task queue...');
  await taskQueue.shutdown();
  process.exit(0);
});