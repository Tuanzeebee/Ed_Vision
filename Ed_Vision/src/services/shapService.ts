import predictionService from './predictionService';
import cacheService from './cacheService';

interface QueueItem {
  uploadId: string;
  topK: number;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
}

/**
 * SHAP Service với tối ưu cho multiple concurrent users
 * 
 * Features:
 * 1. Request deduplication - merge duplicate requests
 * 2. Queue management - handle concurrent requests
 * 3. Local caching - cache in browser for session
 * 4. Debouncing - prevent spam clicks
 */
class ShapService {
  private queue: QueueItem[] = [];
  private processing: Set<string> = new Set();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private readonly MAX_CONCURRENT = 3; // Max 3 concurrent SHAP requests
  private readonly DEBOUNCE_MS = 500; // 500ms debounce
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Get SHAP explanation với deduplication và queueing
   */
  async getShapExplanation(uploadId: string, topK: number = 8): Promise<any> {
    const cacheKey = `shap:${uploadId}:${topK}`;

    // 1. Check local cache first (fastest)
    const cached = cacheService.get(cacheKey);
    if (cached) {
      console.log(`[SHAP] Cache hit: ${cacheKey}`);
      return cached;
    }

    // 2. Check if same request is already in flight (deduplication)
    const existingRequest = this.pendingRequests.get(cacheKey);
    if (existingRequest) {
      console.log(`[SHAP] Deduplicating request: ${cacheKey}`);
      return existingRequest;
    }

    // 3. Create new request promise
    const requestPromise = new Promise<any>((resolve, reject) => {
      this.queue.push({
        uploadId,
        topK,
        resolve,
        reject,
        timestamp: Date.now()
      });

      // Process queue
      this.processQueue();
    });

    // Store pending request for deduplication
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache result for 10 minutes
      cacheService.set(cacheKey, result, 10 * 60 * 1000);
      
      return result;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Get SHAP explanation with debouncing (for UI interactions)
   */
  async getShapExplanationDebounced(uploadId: string, topK: number = 8): Promise<any> {
    const key = `${uploadId}:${topK}`;

    return new Promise((resolve, reject) => {
      // Clear existing debounce timer
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new debounce timer
      const timer = setTimeout(async () => {
        this.debounceTimers.delete(key);
        try {
          const result = await this.getShapExplanation(uploadId, topK);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, this.DEBOUNCE_MS);

      this.debounceTimers.set(key, timer);
    });
  }

  /**
   * Process queue with concurrency limit
   */
  private async processQueue() {
    // Check if we can process more requests
    if (this.processing.size >= this.MAX_CONCURRENT) {
      console.log(`[SHAP] Queue full, waiting... (${this.processing.size}/${this.MAX_CONCURRENT})`);
      return;
    }

    // Get next item from queue
    const item = this.queue.shift();
    if (!item) return;

    const cacheKey = `shap:${item.uploadId}:${item.topK}`;

    // Mark as processing
    this.processing.add(cacheKey);
    console.log(`[SHAP] Processing: ${cacheKey} (${this.processing.size}/${this.MAX_CONCURRENT})`);

    try {
      // Call actual API
      const result = await predictionService.getShapExplanation(item.uploadId, item.topK);
      item.resolve(result);
    } catch (error) {
      console.error(`[SHAP] Error processing ${cacheKey}:`, error);
      item.reject(error);
    } finally {
      // Mark as done
      this.processing.delete(cacheKey);
      console.log(`[SHAP] Completed: ${cacheKey} (${this.processing.size}/${this.MAX_CONCURRENT})`);
      
      // Process next item in queue
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 100); // Small delay between requests
      }
    }
  }

  /**
   * Pre-fetch SHAP for all students in background (called after prediction)
   */
  async prefetchShap(uploadId: string, topK: number = 8): Promise<void> {
    console.log(`[SHAP] Pre-fetching SHAP for upload: ${uploadId}`);
    
    // Non-blocking prefetch
    this.getShapExplanation(uploadId, topK).catch(err => {
      console.warn(`[SHAP] Pre-fetch failed (non-critical):`, err);
    });
  }

  /**
   * Get queue status (for debugging/monitoring)
   */
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing.size,
      maxConcurrent: this.MAX_CONCURRENT,
      pendingRequests: this.pendingRequests.size
    };
  }

  /**
   * Clear all pending requests (e.g., on page unmount)
   */
  clearQueue() {
    this.queue.forEach(item => {
      item.reject(new Error('Queue cleared'));
    });
    this.queue = [];
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}

export const shapService = new ShapService();
export default shapService;
