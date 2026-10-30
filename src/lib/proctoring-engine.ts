import { ViolationType } from './types';

export interface ProctoringCallbacks {
  onTabSwitch: (count: number, maxAllowed: number) => void;
  onViolationBreached: () => void;
  onCameraDropped: (reason: string) => void;
  onFullscreenExit: () => void;
  onContextMenuAttempt: () => void;
}

export interface ProctoringConfig {
  attemptId: string;
  maxTabSwitches: number;
  requireCamera: boolean;
}

export class ProctoringEngine {
  private config: ProctoringConfig;
  private callbacks: ProctoringCallbacks;
  private tabSwitchCount: number = 0;
  private mediaStream: MediaStream | null = null;
  private isActive: boolean = false;
  private lastBlurTimestamp: number = 0;

  constructor(config: ProctoringConfig, callbacks: ProctoringCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }

  /**
   * Initializes proctoring listeners:
   * - Tab / window blur tracking
   * - Fullscreen change listener
   * - Context menu and clipboard prevention
   */
  public start(currentSwitches: number = 0): void {
    if (typeof window === 'undefined' || this.isActive) return;
    this.isActive = true;
    this.tabSwitchCount = currentSwitches;

    // 1. Visibility & Blur tracking
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('blur', this.handleWindowBlur);

    // 2. Fullscreen change listener
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);

    // 3. Prevent right-click context menu
    document.addEventListener('contextmenu', this.handleContextMenu);

    // 4. Block copy, cut, paste, and inspect shortcuts
    document.addEventListener('keydown', this.handleKeyDown);

    // 5. Prevent text selection
    document.body.style.userSelect = 'none';
  }

  /**
   * Cleans up all listeners and stops media streams
   */
  public stop(): void {
    if (typeof window === 'undefined') return;
    this.isActive = false;

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('blur', this.handleWindowBlur);
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('contextmenu', this.handleContextMenu);
    document.removeEventListener('keydown', this.handleKeyDown);

    document.body.style.userSelect = 'auto';

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  /**
   * Requests webcam stream and attaches track end listeners
   */
  public async initCamera(videoElement: HTMLVideoElement): Promise<MediaStream | null> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.callbacks.onCameraDropped('Webcam API is not supported on this browser.');
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: 'user',
        },
        audio: false,
      });

      this.mediaStream = stream;
      videoElement.srcObject = stream;
      await videoElement.play().catch(() => {});

      // Monitor stream tracks for premature disconnections
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          this.reportViolation('CAMERA_BLOCKED', 'Webcam track ended unexpectedly');
          this.callbacks.onCameraDropped('Webcam track ended.');
        };
        track.onmute = () => {
          this.reportViolation('CAMERA_BLOCKED', 'Webcam muted or hardware covered');
          this.callbacks.onCameraDropped('Webcam hardware blocked.');
        };
      });

      return stream;
    } catch (err: any) {
      const msg = err.name === 'NotAllowedError' ? 'Camera permission was denied.' : err.message;
      this.reportViolation('CAMERA_BLOCKED', `Camera acquisition failed: ${msg}`);
      this.callbacks.onCameraDropped(msg);
      return null;
    }
  }

  /**
   * Requests entering fullscreen mode
   */
  public async requestFullscreen(): Promise<boolean> {
    if (typeof document === 'undefined') return false;
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      return true;
    } catch {
      return false;
    }
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      this.recordFocusLoss('document.visibilityState === hidden');
    }
  };

  private handleWindowBlur = () => {
    // Debounce to prevent double-counting when visibilityState also triggers
    const now = Date.now();
    if (now - this.lastBlurTimestamp < 1000) return;
    this.lastBlurTimestamp = now;

    this.recordFocusLoss('window.onblur');
  };

  private recordFocusLoss(source: string) {
    if (!this.isActive) return;

    this.tabSwitchCount += 1;
    this.reportViolation('TAB_SWITCH', `Lost window focus via ${source}. Total switches: ${this.tabSwitchCount}`);

    if (this.tabSwitchCount > this.config.maxTabSwitches) {
      this.callbacks.onViolationBreached();
    } else {
      this.callbacks.onTabSwitch(this.tabSwitchCount, this.config.maxTabSwitches);
    }
  }

  private handleFullscreenChange = () => {
    if (!this.isActive) return;
    if (!document.fullscreenElement) {
      this.reportViolation('FULLSCREEN_EXIT', 'Exited mandatory fullscreen mode');
      this.callbacks.onFullscreenExit();
    }
  };

  private handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    this.callbacks.onContextMenuAttempt();
    return false;
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    // Block standard copy/paste, inspect, and devtool shortcuts
    const isCtrlOrMeta = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();

    // Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+U (view source), Ctrl+Shift+I / F12 (DevTools)
    if (
      (isCtrlOrMeta && ['c', 'v', 'x', 'u', 'a', 'p', 's'].includes(key)) ||
      (isCtrlOrMeta && e.shiftKey && ['i', 'j', 'c'].includes(key)) ||
      e.key === 'F12'
    ) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  /**
   * Asynchronously dispatches violation record to the backend
   */
  public async reportViolation(type: ViolationType, details: string): Promise<void> {
    try {
      await fetch('/api/student/violation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: this.config.attemptId,
          type,
          details,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.warn('Failed to dispatch violation log to server:', err);
    }
  }
}
