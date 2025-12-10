import { Injectable } from '@nestjs/common'

type Entry<T> = { value: T; expiresAt: number }

@Injectable()
export class StudentCacheService {
  private store = new Map<string, Entry<any>>()
  private readonly defaultTtl = 5 * 60 * 1000

  get<T>(key: string): T | null {
    const e = this.store.get(key)
    if (!e) return null
    if (Date.now() > e.expiresAt) {
      this.store.delete(key)
      return null
    }
    return e.value as T
  }

  set<T>(key: string, value: T, ttl = this.defaultTtl): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttl })
  }

  async wrap<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) return cached
    const result = await fn()
    this.set(key, result, ttl)
    return result
  }

  clearByPrefix(prefix: string): void {
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) this.store.delete(k)
    }
  }

  clearByStudent(studentId: number): void {
    this.clearByPrefix(`student:${studentId}:`)
  }
}
