import React, { useEffect, useRef, useState } from 'react';
import {
  Lock,
  CheckCircle,
  UserCheck,
  XCircle,
  Camera,
  CameraOff,
} from 'lucide-react';

export function VenueScanner({
  processing,
  scanResult,
  myTickets,
  simulateScan,
  setProcessing,
  setScanResult,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        setCameraError(null);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setCameraActive(true);
        }
      } catch (err) {
        setCameraError(err.message || 'Unable to access camera');
        console.error('Camera error:', err);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        setCameraActive(false);
      }
    };
  }, []);

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;
    if (myTickets.length === 0) return;

    setProcessing(true);

    try {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);

      // Convert canvas to base64
      const imageBase64 = canvasRef.current.toDataURL('image/jpeg');

      // Get ticket holder ID (first ticket)
      const ticketHolderId = myTickets[0]?.owner_id || 'user1';

      // Send to Flask backend
      const response = await fetch('http://localhost:5000/api/verify-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageBase64,
          user_id: ticketHolderId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setScanResult(result.result);
        console.log('Face verification result:', result.similarity)
      } else {
        setScanResult('invalid');
      }
    } catch (error) {
      console.error('Face verification error:', error);
      setScanResult('invalid');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-70px)] bg-black">
      <div className="flex-1 flex items-center justify-center gap-8 p-6 bg-black">
        {/* Camera on Left */}
        <div className="relative w-full max-w-2xl h-96 bg-black rounded-3xl overflow-hidden border-2 border-slate-800 shadow-xl shrink-0">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            style={{ display: cameraActive ? 'block' : 'none' }}
          />

          <canvas ref={canvasRef} className="hidden" />

          {cameraError && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
              <div className="text-center">
                <CameraOff
                  size={48}
                  className="mx-auto mb-4 text-red-500"
                />
                <p className="text-sm text-red-400">{cameraError}</p>
              </div>
            </div>
          )}

          {/* Scan Results Overlay */}
          {scanResult === 'valid' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-500/90 text-white rounded-2xl z-40">
              <CheckCircle size={64} className="mb-2" />
              <h2 className="text-2xl font-bold">FACE VERIFIED</h2>
              <p className="text-sm opacity-90">Biometric Match Confirmed</p>
            </div>
          )}
          {scanResult === 'mismatch' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-orange-500/90 text-white rounded-2xl z-40">
              <UserCheck size={64} className="mb-2" />
              <h2 className="text-2xl font-bold">ID MISMATCH</h2>
              <p className="text-sm opacity-90">Biometrics do not match ticket owner</p>
            </div>
          )}
          {scanResult === 'invalid' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/90 text-white rounded-2xl z-40">
              <XCircle size={64} className="mb-2" />
              <h2 className="text-2xl font-bold">VERIFICATION FAILED</h2>
              <p className="text-sm opacity-90">Unable to verify face</p>
            </div>
          )}

          {processing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-2"></div>
                <p className="text-emerald-400 text-sm">Scanning Face...</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls on Right */}
        <div className="flex flex-col gap-6 h-96 justify-start">
          <div>
            <h3 className="flex items-center gap-2 font-bold text-white mb-2">
              <Lock size={16} className="text-emerald-500" />
              Face Scanner
            </h3>
            <p className="text-xs text-slate-400">
              {cameraActive
                ? 'Click button to scan'
                : cameraError
                ? 'Camera unavailable'
                : 'Initializing...'}
            </p>
          </div>

          {cameraActive && !cameraError && myTickets.length > 0 ? (
            <button
              onClick={captureFrame}
              disabled={processing}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 p-6 text-white transition-all h-fit"
            >
              <Camera size={32} />
              <span className="text-sm font-medium">Capture Face</span>
            </button>
          ) : myTickets.length > 0 && cameraError ? (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => simulateScan(myTickets[0])}
                disabled={processing}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 p-6 text-white transition-all"
              >
                <CheckCircle size={32} />
                <span className="text-sm font-medium">Scan Valid</span>
              </button>
              <button
                onClick={() => {
                  setProcessing(true);
                  setTimeout(() => {
                    setScanResult('mismatch');
                    setProcessing(false);
                  }, 1500);
                }}
                disabled={processing}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 p-6 text-white transition-all"
              >
                <UserCheck size={32} />
                <span className="text-sm font-medium">Simulate Mismatch</span>
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/50 p-6 text-center text-slate-500 text-xs">
              {myTickets.length === 0
                ? '📱 Purchase a ticket first'
                : '⏳ Initializing camera...'}
            </div>
          )}

          {scanResult && (
            <button
              onClick={() => setScanResult(null)}
              className="text-sm text-slate-400 underline hover:text-white"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
