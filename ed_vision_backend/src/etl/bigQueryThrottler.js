/**
 * Global BigQuery DML Throttler
 * Giới hạn concurrent DML statements để tránh vượt quá BigQuery limit (20 concurrent per table)
 */

class BigQueryThrottler {
  constructor(maxConcurrent = 8) {
    this.maxConcurrent = maxConcurrent;
    this.activeRequests = 0;
    this.queue = [];
  }

  async execute(fn) {
    // Nếu đang quá tải → thêm vào queue
    if (this.activeRequests >= this.maxConcurrent) {
      return new Promise((resolve, reject) => {
        this.queue.push({ fn, resolve, reject });
      });
    }

    // Execute ngay
    return this._run(fn);
  }

  async _run(fn) {
    this.activeRequests++;
    
    try {
      const result = await fn();
      return result;
    } finally {
      this.activeRequests--;
      
      // Process queue nếu có
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        this._run(next.fn).then(next.resolve).catch(next.reject);
      }
    }
  }

  getStats() {
    return {
      active: this.activeRequests,
      queued: this.queue.length,
      total: this.activeRequests + this.queue.length
    };
  }
}

// Singleton instance
const throttler = new BigQueryThrottler(8); // Max 8 concurrent BigQuery DML

module.exports = { throttler };
