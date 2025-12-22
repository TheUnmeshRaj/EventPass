'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Camera, RefreshCw, Zap } from 'lucide-react';

export default function FaceScanner({ onCapture, isLoading = false, title = "Scan Your Face" }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraReady(true);
          setError(null);
        }
      } catch (err) {
        setError('Unable to access camera. Please check permissions.');
        console.error('Camera error:', err);
      }
    };

    initCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) {
      setError('Camera is not ready');
      return;
    }

    try {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);

      canvasRef.current.toBlob((blob) => {
        if (blob) {
          onCapture(blob);
        }
      }, 'image/jpeg', 0.95);
    } catch (err) {
      setError('Failed to capture image');
      console.error('Capture error:', err);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center justify-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" />
          {title}
        </h3>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="relative w-full bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-96 object-cover"
          onLoadedMetadata={() => setIsCameraReady(true)}
        />
        
        {/* Face detection overlay circle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-64 border-2 border-green-500 rounded-lg opacity-75"></div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <button
        onClick={captureFrame}
        disabled={!isCameraReady || isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            Capture Face
          </>
        )}
      </button>
    </div>
  );
}
