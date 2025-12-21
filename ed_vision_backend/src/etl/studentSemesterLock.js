/**
 * In-memory lock to serialize updates per (student_sk, academic_year, semester_number)
 * Prevents concurrent BigQuery MERGE on the same row
 */

class StudentSemesterLock {
  constructor() {
    this.locks = new Map(); // key: "student_sk:academic_year:semester_number", value: Promise
    this.pending = new Map(); // key -> count
  }

  /**
   * Execute fn with exclusive lock for the given student/semester combination
   */
  async withLock(student_sk, academic_year, semester_number, fn) {
    const key = `${student_sk}:${academic_year}:${semester_number}`;
    
    // Wait for any existing lock on this key
    while (this.locks.has(key)) {
      const existingLock = this.locks.get(key);
      try {
        await existingLock;
      } catch (e) {
        // Ignore errors from previous lock
      }
    }

    // Acquire lock
    const lockPromise = (async () => {
      const count = (this.pending.get(key) || 0) + 1;
      this.pending.set(key, count);
      
      try {
        return await fn();
      } finally {
        const remaining = this.pending.get(key) - 1;
        if (remaining <= 0) {
          this.pending.delete(key);
        } else {
          this.pending.set(key, remaining);
        }
        
        // Release lock
        this.locks.delete(key);
      }
    })();

    this.locks.set(key, lockPromise);
    return lockPromise;
  }

  getStats() {
    return {
      activeLocks: this.locks.size,
      pending: Array.from(this.pending.entries()).map(([k, v]) => ({ key: k, count: v }))
    };
  }
}

// Singleton
const studentSemesterLock = new StudentSemesterLock();

module.exports = { studentSemesterLock };
