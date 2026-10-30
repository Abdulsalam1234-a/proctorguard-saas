/**
 * Low-Bandwidth "Zero-Data-Loss" Synchronization Engine
 * Designed for emerging markets and erratic network connectivity.
 * Employs local storage write-through cache, monotonic queue dispatch,
 * and fail-safe integrity payload serialization.
 */

export interface QueuedAnswer {
  queueId: string;
  attemptId: string;
  questionId: string;
  selectedAnswer: string | string[];
  clientTimestamp: number;
  retries: number;
}

export interface StoredAttemptCache {
  attemptId: string;
  examId: string;
  studentId: string;
  answers: Record<string, string | string[]>;
  timeRemainingSeconds: number;
  lastUpdated: number;
}

const STORAGE_PREFIX = 'proctorguard_';

export class OfflineSyncManager {
  private attemptId: string;
  private isFlushing: boolean = false;
  private onStatusChange?: (isOnline: boolean, pendingCount: number) => void;

  constructor(attemptId: string, onStatusChange?: (isOnline: boolean, pendingCount: number) => void) {
    this.attemptId = attemptId;
    this.onStatusChange = onStatusChange;
    this.setupListeners();
  }

  private setupListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.notifyStatus(true);
      this.flushQueue();
    });

    window.addEventListener('offline', () => {
      this.notifyStatus(false);
    });
  }

  private getQueueKey(): string {
    return `${STORAGE_PREFIX}sync_queue_${this.attemptId}`;
  }

  private getCacheKey(): string {
    return `${STORAGE_PREFIX}cache_${this.attemptId}`;
  }

  /**
   * Reads current queued updates
   */
  public getPendingQueue(): QueuedAnswer[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.getQueueKey());
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveQueue(queue: QueuedAnswer[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.getQueueKey(), JSON.stringify(queue));
      this.notifyStatus(navigator.onLine);
    } catch (e) {
      console.error('Failed to write to localStorage sync queue:', e);
    }
  }

  /**
   * Instantly commits answer to client local storage,
   * then queues it for asynchronous backend dispatch.
   */
  public recordAnswer(questionId: string, selectedAnswer: string | string[]): void {
    if (typeof window === 'undefined') return;

    // 1. Instant local write-through cache
    try {
      const cacheKey = this.getCacheKey();
      const rawCache = localStorage.getItem(cacheKey);
      const cache: StoredAttemptCache = rawCache
        ? JSON.parse(rawCache)
        : { attemptId: this.attemptId, examId: '', studentId: '', answers: {}, timeRemainingSeconds: 0, lastUpdated: Date.now() };

      cache.answers[questionId] = selectedAnswer;
      cache.lastUpdated = Date.now();
      localStorage.setItem(cacheKey, JSON.stringify(cache));
    } catch (e) {
      console.warn('Local cache write error:', e);
    }

    // 2. Enqueue into monotonic dispatch buffer
    const queue = this.getPendingQueue();
    // Remove older unsent entry for same question to avoid stale overwrite
    const filtered = queue.filter((item) => item.questionId !== questionId);

    const queuedItem: QueuedAnswer = {
      queueId: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      attemptId: this.attemptId,
      questionId,
      selectedAnswer,
      clientTimestamp: Date.now(),
      retries: 0,
    };

    filtered.push(queuedItem);
    this.saveQueue(filtered);

    // 3. Trigger optimistic flush if currently online
    if (navigator.onLine) {
      this.flushQueue();
    }
  }

  /**
   * Reads all answers currently saved in local storage
   */
  public getCachedAnswers(): Record<string, string | string[]> {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(this.getCacheKey());
      if (!raw) return {};
      const parsed: StoredAttemptCache = JSON.parse(raw);
      return parsed.answers || {};
    } catch {
      return {};
    }
  }

  /**
   * Flushes queued answers to the backend API sequentially
   */
  public async flushQueue(): Promise<void> {
    if (this.isFlushing || typeof window === 'undefined' || !navigator.onLine) {
      return;
    }

    const queue = this.getPendingQueue();
    if (queue.length === 0) return;

    this.isFlushing = true;

    try {
      // Sort monotonically by timestamp
      const sorted = [...queue].sort((a, b) => a.clientTimestamp - b.clientTimestamp);

      while (sorted.length > 0 && navigator.onLine) {
        const item = sorted[0];

        try {
          const res = await fetch('/api/student/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              attemptId: item.attemptId,
              questionId: item.questionId,
              selectedAnswer: item.selectedAnswer,
              clientTimestamp: item.clientTimestamp,
            }),
          });

          if (res.ok) {
            sorted.shift(); // Successfully synced
            this.saveQueue(sorted);
          } else {
            // Server error: increment retry counter and pause
            item.retries += 1;
            this.saveQueue(sorted);
            break;
          }
        } catch (netErr) {
          // Network drop during request
          console.warn('Network sync failed, will retry upon reconnection:', netErr);
          break;
        }
      }
    } finally {
      this.isFlushing = false;
      this.notifyStatus(navigator.onLine);
    }
  }

  /**
   * Generates a fail-safe integrity payload of all locally cached answers
   * for emergency submission when the connection is degraded or severed.
   */
  public generateFailSafePayload(): {
    attemptId: string;
    cachedAnswers: Record<string, string | string[]>;
    timestamp: number;
    checksum: string;
  } {
    const answers = this.getCachedAnswers();
    const payloadStr = JSON.stringify(answers);

    // Compute lightweight browser-safe SHA/FNV-like checksum
    let hash = 0;
    for (let i = 0; i < payloadStr.length; i++) {
      const char = payloadStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }

    return {
      attemptId: this.attemptId,
      cachedAnswers: answers,
      timestamp: Date.now(),
      checksum: Math.abs(hash).toString(16),
    };
  }

  /**
   * Clears state for this attempt after verified final submission
   */
  public clearLocalCache(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(this.getCacheKey());
      localStorage.removeItem(this.getQueueKey());
    } catch {}
  }

  private notifyStatus(isOnline: boolean) {
    if (this.onStatusChange) {
      const pending = this.getPendingQueue().length;
      this.onStatusChange(isOnline, pending);
    }
  }
}
