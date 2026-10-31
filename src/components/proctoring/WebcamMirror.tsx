'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, AlertTriangle, Eye, ShieldAlert, Users, UserCheck } from 'lucide-react';
import { ViolationType } from '@/lib/types';

export type AIAttentionStatus = 'FOCUSED' | 'LOOKING_AWAY' | 'NO_FACE' | 'MULTIPLE_FACES' | 'HIGH_MOTION';

interface WebcamMirrorProps {
  onStreamReady?: (stream: MediaStream) => void;
  onError?: (err: string) => void;
  onAIViolation?: (event: { type: ViolationType; message: string; details: any }) => void;
  onAttentionChange?: (status: AIAttentionStatus) => void;
  isActive?: boolean;
}

export function WebcamMirror({
  onStreamReady,
  onError,
  onAIViolation,
  onAttentionChange,
  isActive = true,
}: WebcamMirrorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attentionStatus, setAttentionStatus] = useState<AIAttentionStatus>('FOCUSED');
  const [lookingAwaySeconds, setLookingAwaySeconds] = useState<number>(0);

  // Vision tracking memory refs
  const prevFrameLumaRef = useRef<Uint8Array | null>(null);
  const consecutiveLookingAwayRef = useRef<number>(0);
  const consecutiveNoFaceRef = useRef<number>(0);
  const lastViolationEmitRef = useRef<number>(0);
  const lastChimeTimeRef = useRef<number>(0);

  // Play subtle warning audio chime when student looks away
  const playRefocusChime = useCallback(() => {
    const now = Date.now();
    if (now - lastChimeTimeRef.current < 5000) return; // Debounce 5s
    lastChimeTimeRef.current = now;

    if (typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(520, ctx.currentTime);
          osc.frequency.setValueAtTime(390, ctx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        }
      } catch {}
    }
  }, []);

  // 1. Setup Camera MediaStream
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function setupCamera() {
      if (!isActive) return;

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Webcam media devices not supported on this browser');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            facingMode: 'user',
          },
          audio: false,
        });

        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        setStreamActive(true);
        setErrorMsg(null);
        if (onStreamReady) onStreamReady(stream);

        // Attach track loss listener
        stream.getVideoTracks().forEach((track) => {
          track.onended = () => {
            setStreamActive(false);
            setErrorMsg('Webcam stream disconnected');
            if (onError) onError('Webcam stream disconnected');
          };
        });
      } catch (err: any) {
        setStreamActive(false);
        const msg = err.name === 'NotAllowedError' ? 'Webcam permission denied' : err.message;
        setErrorMsg(msg);
        if (onError) onError(msg);
      }
    }

    setupCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isActive, onError, onStreamReady]);

  // 2. Vision Intelligence Analysis Loop (Runs every 400ms)
  useEffect(() => {
    if (!streamActive || !isActive) return;

    const interval = setInterval(async () => {
      const video = videoRef.current;
      const offscreenCanvas = canvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      if (!video || !offscreenCanvas || video.readyState < 2) return;

      const width = 160;
      const height = 120;
      offscreenCanvas.width = width;
      offscreenCanvas.height = height;

      const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // Draw current video frame to offscreen canvas
      ctx.drawImage(video, 0, 0, width, height);

      let currentStatus: AIAttentionStatus = 'FOCUSED';
      let faceBox: { x: number; y: number; w: number; h: number } | null = null;
      let detectedLookingAway = false;
      let detectedMultipleFaces = false;
      let detectedNoFace = false;
      let motionScore = 0;

      // Check native FaceDetector API (Chromium / Edge)
      let usedNativeDetector = false;
      if (typeof window !== 'undefined' && 'FaceDetector' in window) {
        try {
          const FaceDetectorClass = (window as any).FaceDetector;
          const detector = new FaceDetectorClass({ fastMode: true, maxDetectedFaces: 3 });
          const faces = await detector.detect(offscreenCanvas);
          usedNativeDetector = true;

          if (faces.length === 0) {
            detectedNoFace = true;
          } else if (faces.length > 1) {
            detectedMultipleFaces = true;
            faceBox = {
              x: faces[0].boundingBox.x,
              y: faces[0].boundingBox.y,
              w: faces[0].boundingBox.width,
              h: faces[0].boundingBox.height,
            };
          } else {
            const f = faces[0];
            const box = f.boundingBox;
            faceBox = { x: box.x, y: box.y, w: box.width, h: box.height };

            // Normalized centroid of face
            const cx = (box.x + box.width / 2) / width;
            const cy = (box.y + box.height / 2) / height;

            // Looking away if face centroid is deviated significantly left/right or downwards
            // Normal centered screen view is roughly 0.32 <= cx <= 0.68 and cy <= 0.72
            if (cx < 0.28 || cx > 0.72 || cy > 0.76) {
              detectedLookingAway = true;
            }

            // Check eye landmarks if available
            if (f.landmarks && f.landmarks.length >= 2) {
              const eyes = f.landmarks.filter((l: any) => l.type === 'eye');
              if (eyes.length === 2) {
                const dy = Math.abs(eyes[0].location.y - eyes[1].location.y);
                const dx = Math.abs(eyes[0].location.x - eyes[1].location.x);
                if (dx > 0 && dy / dx > 0.45) {
                  detectedLookingAway = true; // Severe head roll / tilt away
                }
              }
            }
          }
        } catch {
          usedNativeDetector = false;
        }
      }

      // Algorithmic Cross-Browser Color & Motion Analyzer Fallback / Hybrid
      if (!usedNativeDetector) {
        const frameData = ctx.getImageData(0, 0, width, height);
        const data = frameData.data;
        const totalPixels = width * height;

        let skinPixelCount = 0;
        let sumX = 0;
        let sumY = 0;
        let minX = width;
        let maxX = 0;
        let minY = height;
        let maxY = 0;

        const currentLuma = new Uint8Array(totalPixels);
        let diffSum = 0;
        const prevLuma = prevFrameLumaRef.current;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const pixelIndex = i / 4;
          const px = pixelIndex % width;
          const py = Math.floor(pixelIndex / width);

          // Luminance for motion differencing
          const yVal = 0.299 * r + 0.587 * g + 0.114 * b;
          currentLuma[pixelIndex] = yVal;
          if (prevLuma) {
            diffSum += Math.abs(yVal - prevLuma[pixelIndex]);
          }

          // YCbCr skin tone segmentation
          const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
          const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

          if (cr >= 133 && cr <= 173 && cb >= 77 && cb <= 127 && yVal > 40) {
            skinPixelCount++;
            sumX += px;
            sumY += py;
            if (px < minX) minX = px;
            if (px > maxX) maxX = px;
            if (py < minY) minY = py;
            if (py > maxY) maxY = py;
          }
        }

        prevFrameLumaRef.current = currentLuma;
        motionScore = diffSum / totalPixels;

        const skinRatio = skinPixelCount / totalPixels;

        if (skinRatio < 0.025) {
          // Less than 2.5% skin area -> Face missing from camera
          detectedNoFace = true;
        } else {
          const cx = sumX / skinPixelCount / width;
          const cy = sumY / skinPixelCount / height;
          faceBox = {
            x: minX,
            y: minY,
            w: Math.max(20, maxX - minX),
            h: Math.max(20, maxY - minY),
          };

          // If face bounding box is fragmented across wide spectrum or two distinct clusters
          if (faceBox.w > width * 0.85 && skinRatio > 0.4) {
            detectedMultipleFaces = true;
          } else if (cx < 0.26 || cx > 0.74 || cy > 0.78) {
            // Head turned or eyes averted towards left/right/downward
            detectedLookingAway = true;
          }
        }
      }

      // State Transition & Consecutive Streak Filtering (Debouncing false positives)
      if (detectedMultipleFaces) {
        currentStatus = 'MULTIPLE_FACES';
        consecutiveLookingAwayRef.current = 0;
        consecutiveNoFaceRef.current = 0;
      } else if (detectedNoFace) {
        consecutiveNoFaceRef.current += 1;
        consecutiveLookingAwayRef.current = 0;
        if (consecutiveNoFaceRef.current >= 4) {
          // > 1.6s of absent face
          currentStatus = 'NO_FACE';
        }
      } else if (detectedLookingAway) {
        consecutiveLookingAwayRef.current += 1;
        consecutiveNoFaceRef.current = 0;
        if (consecutiveLookingAwayRef.current >= 3) {
          // > 1.2s of looking away
          currentStatus = 'LOOKING_AWAY';
        }
      } else {
        consecutiveLookingAwayRef.current = 0;
        consecutiveNoFaceRef.current = 0;
        currentStatus = 'FOCUSED';
      }

      setAttentionStatus(currentStatus);
      if (onAttentionChange) onAttentionChange(currentStatus);

      // Track seconds spent looking away
      if (currentStatus === 'LOOKING_AWAY') {
        setLookingAwaySeconds((prev) => prev + 1);
        playRefocusChime();

        // Emit violation event to backend if sustained for > 2.5s (throttled every 10s)
        const now = Date.now();
        if (now - lastViolationEmitRef.current > 10000 && consecutiveLookingAwayRef.current >= 5) {
          lastViolationEmitRef.current = now;
          if (onAIViolation) {
            onAIViolation({
              type: 'LOOKING_AWAY',
              message: 'Gaze averted away from examination screen',
              details: {
                consecutiveFrames: consecutiveLookingAwayRef.current,
                durationSeconds: Math.round(consecutiveLookingAwayRef.current * 0.4),
              },
            });
          }
        }
      } else if (currentStatus === 'NO_FACE') {
        const now = Date.now();
        if (now - lastViolationEmitRef.current > 12000 && consecutiveNoFaceRef.current >= 6) {
          lastViolationEmitRef.current = now;
          if (onAIViolation) {
            onAIViolation({
              type: 'NO_FACE_DETECTED',
              message: 'No candidate face detected within camera frame',
              details: {
                consecutiveFrames: consecutiveNoFaceRef.current,
              },
            });
          }
        }
      }

      // Draw HUD reticle on overlay canvas
      if (overlayCanvas) {
        overlayCanvas.width = width;
        overlayCanvas.height = height;
        const oCtx = overlayCanvas.getContext('2d');
        if (oCtx) {
          oCtx.clearRect(0, 0, width, height);

          if (faceBox) {
            const reticleColor =
              currentStatus === 'LOOKING_AWAY'
                ? '#f43f5e' // Rose red
                : currentStatus === 'MULTIPLE_FACES'
                ? '#e11d48'
                : '#10b981'; // Emerald green

            oCtx.strokeStyle = reticleColor;
            oCtx.lineWidth = 1.5;

            // Draw futuristic corner brackets around detected face
            const bx = faceBox.x;
            const by = faceBox.y;
            const bw = faceBox.w;
            const bh = faceBox.h;
            const corner = Math.min(10, bw / 4);

            oCtx.beginPath();
            // Top-left
            oCtx.moveTo(bx, by + corner);
            oCtx.lineTo(bx, by);
            oCtx.lineTo(bx + corner, by);
            // Top-right
            oCtx.moveTo(bx + bw - corner, by);
            oCtx.lineTo(bx + bw, by);
            oCtx.lineTo(bx + bw, by + corner);
            // Bottom-right
            oCtx.moveTo(bx + bw, by + bh - corner);
            oCtx.lineTo(bx + bw, by + bh);
            oCtx.lineTo(bx + bw - corner, by + bh);
            // Bottom-left
            oCtx.moveTo(bx + corner, by + bh);
            oCtx.lineTo(bx, by + bh);
            oCtx.lineTo(bx, by + bh - corner);
            oCtx.stroke();
          }
        }
      }
    }, 400);

    return () => clearInterval(interval);
  }, [streamActive, isActive, onAttentionChange, onAIViolation, playRefocusChime]);

  return (
    <div
      className={`fixed bottom-4 right-4 z-40 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 border-2 ${
        attentionStatus === 'LOOKING_AWAY'
          ? 'border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.6)] ring-4 ring-rose-500/30'
          : attentionStatus === 'NO_FACE'
          ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)] ring-4 ring-amber-500/20'
          : attentionStatus === 'MULTIPLE_FACES'
          ? 'border-red-600 shadow-[0_0_25px_rgba(220,38,38,0.7)]'
          : 'border-slate-700/80'
      }`}
    >
      {/* 160x120px strictly sized proctoring corner mirror with Vision HUD */}
      <div className="relative w-[160px] h-[120px] bg-slate-950 flex items-center justify-center">
        {/* Hidden processing canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Mirrored Video Stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${
            streamActive ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* HUD Reticle Overlay Canvas */}
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none transform scale-x-[-1]"
        />

        {/* Camera Off / Disconnected Overlay */}
        {!streamActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-slate-900/95 text-slate-300 z-10">
            <CameraOff className="w-6 h-6 text-rose-500 mb-1" />
            <span className="text-[10px] font-medium leading-tight text-rose-400">
              {errorMsg || 'Connecting camera...'}
            </span>
          </div>
        )}

        {/* Top Badges Bar */}
        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
          {/* Stream Active Indicator */}
          <div className="flex items-center space-x-1 bg-black/75 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-bold text-white shadow-sm">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                streamActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span>{streamActive ? 'LIVE' : 'OFF'}</span>
          </div>

          {/* AI Gaze / Attention Status Badge */}
          {streamActive && (
            <div
              className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-black tracking-tight uppercase shadow-md transition-colors ${
                attentionStatus === 'FOCUSED'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                  : attentionStatus === 'LOOKING_AWAY'
                  ? 'bg-rose-950 text-rose-200 border border-rose-500 animate-pulse'
                  : attentionStatus === 'NO_FACE'
                  ? 'bg-amber-950 text-amber-200 border border-amber-500'
                  : 'bg-red-950 text-red-200 border border-red-500'
              }`}
            >
              {attentionStatus === 'FOCUSED' && <UserCheck className="w-2.5 h-2.5 text-emerald-400" />}
              {attentionStatus === 'LOOKING_AWAY' && <Eye className="w-2.5 h-2.5 text-rose-400 animate-bounce" />}
              {attentionStatus === 'NO_FACE' && <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />}
              {attentionStatus === 'MULTIPLE_FACES' && <Users className="w-2.5 h-2.5 text-red-400" />}

              <span>
                {attentionStatus === 'FOCUSED' && 'Focused'}
                {attentionStatus === 'LOOKING_AWAY' && 'Averted'}
                {attentionStatus === 'NO_FACE' && 'No Face'}
                {attentionStatus === 'MULTIPLE_FACES' && 'Multi-Face'}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Banner Alert if Looking Away */}
        {attentionStatus === 'LOOKING_AWAY' && (
          <div className="absolute bottom-0 inset-x-0 bg-rose-600/90 text-white text-[9px] font-bold py-0.5 px-1 text-center animate-pulse z-20">
            Look at screen!
          </div>
        )}

        {/* Bottom AI Tag */}
        {attentionStatus === 'FOCUSED' && (
          <div className="absolute bottom-1 right-1.5 text-[8px] tracking-wider text-slate-400 uppercase font-mono bg-black/60 px-1 rounded pointer-events-none">
            Proctor AI
          </div>
        )}
      </div>
    </div>
  );
}
