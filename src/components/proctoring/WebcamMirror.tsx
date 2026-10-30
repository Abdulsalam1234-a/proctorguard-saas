'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, AlertTriangle, ShieldCheck } from 'lucide-react';

interface WebcamMirrorProps {
  onStreamReady?: (stream: MediaStream) => void;
  onError?: (err: string) => void;
  isActive?: boolean;
}

export function WebcamMirror({ onStreamReady, onError, isActive = true }: WebcamMirrorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

        // Attach listeners for premature camera loss
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
  }, [isActive]);

  return (
    <div className="fixed bottom-4 right-4 z-40 bg-slate-900 rounded-xl overflow-hidden shadow-2xl border-2 border-slate-700/80 transition-all hover:scale-105">
      {/* 160x120px strictly sized proctoring corner mirror */}
      <div className="relative w-[160px] h-[120px] bg-slate-950 flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform scale-x-[-1] ${
            streamActive ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {!streamActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-slate-900/90 text-slate-300">
            <CameraOff className="w-6 h-6 text-rose-500 mb-1" />
            <span className="text-[10px] font-medium leading-tight text-rose-400">
              {errorMsg || 'Connecting camera...'}
            </span>
          </div>
        )}

        {/* Status indicator badge */}
        <div className="absolute top-1.5 left-1.5 flex items-center space-x-1 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-semibold text-white">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              streamActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span>{streamActive ? 'REC' : 'OFF'}</span>
        </div>

        <div className="absolute bottom-1 right-1.5 text-[8px] tracking-wider text-slate-400 uppercase font-mono bg-black/60 px-1 rounded">
          Proctor AI
        </div>
      </div>
    </div>
  );
}
