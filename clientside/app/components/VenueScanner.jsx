import React, { useEffect, useRef, useState } from "react";
import { Lock, CheckCircle, UserCheck, XCircle, Camera, CameraOff } from 'lucide-react';
import { Html5Qrcode } from "html5-qrcode";
import { updateUserProfile, getUserProfile, getEventById, subscribeToUserProfile, uploadUserAvatar, getUserAvatarUrl } from '../../lib/supabase/database';


export function VenueScanner({
  processing,
  scanResult,
  myTickets,
  setProcessing,
  setScanResult,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [mode, setMode] = useState("qr");
  const [username, setUsername] = useState(null);
  const [showQrOverlay, setShowQrOverlay] = useState(false);
  const [eventname, setEventname] = useState(null);


  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      setCameraError(err.message);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  // ---------- QR SCANNER (LIVE) ----------
  const startQrScanner = async () => {
    try {
      await stopQrScanner();
      stopCamera();
      
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // Successfully scanned QR
          await handleQrResult(decodedText);
        },
        (errorMessage) => {
          // Scanning errors (no QR detected) - can be ignored
        }
      );
    } catch (err) {
      console.error("Failed to start QR scanner:", err);
      setCameraError("Failed to start QR scanner");
    }
  };

  const stopQrScanner = async () => {
    if (!scannerRef.current) return;
    try {
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      await scannerRef.current.clear();
    } catch (err) {
      console.error("Error stopping scanner:", err);
    }
    scannerRef.current = null;
  };

  useEffect(() => {
    if (mode === "qr") {
      startQrScanner();
    }
    return () => {
      stopQrScanner();
      stopCamera();
    };
  }, [mode]);

  // ---------- QR PARSING & VALIDATION ----------
  const parseQrPayload = (decodedText) => {
    try {
      let data = JSON.parse(decodedText);
      if (typeof data === "string") data = JSON.parse(data);
      return data;
    } catch {
      return null;
    }
  };

  const handleQrResult = async (decodedText) => {
    if (processing) return; // Prevent multiple scans
    
    setProcessing(true);
    await stopQrScanner(); // Stop scanning immediately after successful read

    const parsed = parseQrPayload(decodedText);
    
    // Invalid QR format
    if (!parsed?.user_id || !parsed?.event_id) {
      setScanResult("notQR");
      setProcessing(false);
      return;
    }

    // Check if this ticket exists in myTickets
    const matchingTicket = myTickets.find(
      t => t.owner_id === parsed.user_id && t.event_id === parsed.event_id
    );

    if (!matchingTicket) {
      // Check if it's wrong user or wrong event
      const hasEventId = myTickets.some(t => t.event_id === parsed.event_id);
      const hasUserId = myTickets.some(t => t.owner_id === parsed.user_id);
      
      if (!hasUserId && !hasEventId) {
        setScanResult("invalidTicket");
      } else if (!hasUserId) {
        setScanResult("invalidUserID");
      } else if (!hasEventId) {
        setScanResult("invalidEventID");
      }
      setProcessing(false);
      return;
    }

    // Valid QR - store data and proceed
    setQrData(parsed);
    setScanResult("validQR");

    // Fetch username
    try {
      const profile = await getUserProfile(parsed.user_id);
      setUsername(profile?.full_name || "Guest");
    } catch (err) {
      console.error("Failed to fetch user profile", err);
      setUsername("Guest");
    }

    // Fetch event name
    try {
      const eventData = await getEventById(parsed.event_id);
      setEventname(eventData?.title || "Event");
    } catch (err) {
      console.error("Failed to fetch event data", err);
      setEventname("Event");
    }

    // Show QR verified overlay
    setShowQrOverlay(true);

    // Wait 2 seconds, then switch to face mode
    setTimeout(async () => {
      setShowQrOverlay(false);
      setMode("face");
      await startCamera();
      setProcessing(false);
    }, 2000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProcessing(true);
    await stopQrScanner();

    try {
      const imageScanner = new Html5Qrcode("qr-reader");
      const decodedText = await imageScanner.scanFile(file, true);
      await imageScanner.clear();
      await handleQrResult(decodedText);
    } catch (err) {
      console.error("QR scan from file failed:", err);
      setScanResult("notQR");
      setProcessing(false);
    }
  };

  // ---------- FACE VERIFICATION ----------
  const captureFace = async () => {
    if (!qrData || !videoRef.current) return;

    setProcessing(true);

    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);

    const newImage = canvas.toDataURL("image/jpeg");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verify-face-by-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: qrData.user_id,
          image: newImage,
        }),
      });

      const data = await res.json();
      console.log("Face verification response:", data);

      if (data.match) {
        setScanResult("verified");
      } else if (data.no_face_detected) {
        setScanResult("noFaceDetected");
      } else {
        setScanResult("invalidFace");
      }
    } catch (err) {
      console.error("Face verification error:", err);
      setScanResult("invalidFace");
    }

    setProcessing(false);
  };

  // ---------- RESET FUNCTION ----------
  const resetScanner = async () => {
    setScanResult(null);
    setQrData(null);
    setUsername(null);
    setEventname(null);
    setShowQrOverlay(false);
    setMode("qr");
    stopCamera();
    await startQrScanner();
  };

  // ---------- RENDER OVERLAYS ----------
  const renderOverlay = () => {
    if (showQrOverlay && scanResult === "validQR") {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-600/95 text-white z-40 text-center px-6">
          <CheckCircle size={56} className="mb-3" />
          <h2 className="text-2xl font-bold">QR VERIFIED</h2>
          <p className="text-lg mt-1">Welcome, {username}</p>
          <p className="text-sm mt-1 opacity-80">Preparing face verification...</p>
        </div>
      );
    }

    if (scanResult === "verified") {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-500/95 text-white z-40 text-center px-6">
          <CheckCircle size={64} />
          <h2 className="text-2xl font-bold mt-2">FACE VERIFIED</h2>
          <p className="text-lg mt-1">Enjoy the {eventname}, {username?.split(" ")[0]}!</p>
          <p className="text-sm mt-1 opacity-80">Access granted ✓</p>
        </div>
      );
    }

    if (scanResult === "invalidFace") {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/95 text-white z-40 text-center px-6">
          <XCircle size={64} />
          <h2 className="text-2xl font-bold mt-2">FACE MISMATCH</h2>
          <p className="text-lg mt-1">This face doesn't match the ticket owner</p>
          <p className="text-sm mt-1 opacity-80">Please try again or contact support</p>
        </div>
      );
    }

    if (scanResult === "noFaceDetected") {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-amber-600/95 text-white z-40 text-center px-6">
          <XCircle size={64} />
          <h2 className="text-2xl font-bold mt-2">NO FACE DETECTED</h2>
          <p className="text-lg mt-1">Please position your face clearly in the camera</p>
          <p className="text-sm mt-1 opacity-80">Ensure good lighting and face the camera</p>
        </div>
      );
    }

    if (scanResult === "notQR") {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/95 text-white z-40 text-center px-6">
          <XCircle size={64} />
          <h2 className="text-2xl font-bold mt-2">INVALID QR CODE</h2>
          <p className="text-lg mt-1">This is not a valid ticket QR code</p>
          <p className="text-sm mt-1 opacity-80">Please scan a valid ticket</p>
        </div>
      );
    }

    if (scanResult === "invalidUserID") {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/95 text-white z-40 text-center px-6">
          <XCircle size={64} />
          <h2 className="text-2xl font-bold mt-2">INVALID USER</h2>
          <p className="text-lg mt-1">This ticket belongs to a different user</p>
          <p className="text-sm mt-1 opacity-80">User ID does not match any valid tickets</p>
        </div>
      );
    }

    if (scanResult === "invalidEventID") {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/95 text-white z-40 text-center px-6">
          <XCircle size={64} />
          <h2 className="text-2xl font-bold mt-2">WRONG EVENT</h2>
          <p className="text-lg mt-1">This ticket is for a different event</p>
          <p className="text-sm mt-1 opacity-80">Event ID does not match</p>
        </div>
      );
    }

    if (scanResult === "invalidTicket") {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/95 text-white z-40 text-center px-6">
          <XCircle size={64} />
          <h2 className="text-2xl font-bold mt-2">INVALID TICKET</h2>
          <p className="text-lg mt-1">This ticket is not valid for this venue</p>
          <p className="text-sm mt-1 opacity-80">No matching ticket found</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 text-white px-4 py-6">
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-10 items-stretch">
        
        <div className="relative flex-1 min-h-[320px] sm:min-h-[420px] lg:min-h-[520px] rounded-3xl border border-slate-800 bg-black/70 overflow-hidden shadow-2xl">

          {mode === "qr" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                id="qr-reader"
                className="w-[300px] h-[300px] max-w-full max-h-full rounded-3xl border-2 border-emerald-500/80 bg-black/80 overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.35)]"
              />
            </div>
          )}

          {mode === "face" && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          <canvas ref={canvasRef} className="hidden" />

          {renderOverlay()}

          {processing && !showQrOverlay && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
            </div>
          )}

          {mode === "qr" && !scanResult && !processing && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900/80 text-white px-4 py-2 rounded-full text-sm">
              📷 Scanning for QR code...
            </div>
          )}
        </div>

        <div className="w-full lg:w-72 bg-slate-900/70 border border-slate-800 rounded-3xl p-4 sm:p-6 flex flex-col gap-4 shadow-xl">

          <div>
            <h3 className="flex items-center gap-2 font-bold text-white mb-1 text-base">
              <Lock size={18} className="text-emerald-500" />
              {mode === "qr" ? "QR Scanner" : "Face Verification"}
            </h3>
            <p className="text-xs text-slate-400">
              {mode === "qr"
                ? "Point the device camera at the QR or upload an image."
                : `Face verification for ${username ?? "user"}`}
            </p>
          </div>

          {mode === "qr" && scanResult === "validQR" && (
            <div className="bg-emerald-600/20 border border-emerald-500/40 text-sm text-emerald-100 px-4 py-3 rounded-2xl">
              QR verified for {username}
            </div>
          )}

          {mode === "qr" && !scanResult && (
            <>
              <button
                onClick={() => fileInputRef.current.click()}
                disabled={processing}
                className="rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 text-sm font-semibold transition"
              >
                Upload QR Image
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </>
          )}

          {mode === "face" && scanResult === "validQR" && (
            <button
              onClick={captureFace}
              disabled={processing}
              className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition"
            >
              <Camera />
              Capture Face
            </button>
          )}

          {scanResult && (
            <button
              onClick={resetScanner}
              className="text-sm text-slate-400 underline mt-2 text-left"
            >
              Reset
            </button>
          )}

          {qrData && (
            <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-2xl text-xs text-slate-300 space-y-1">
              <div><span className="font-semibold">User:</span> {username}</div>
              <div><span className="font-semibold">Event:</span> {eventname}</div>
            </div>
          )}
        </div>
      </div>
      <style jsx global>{`
        #qr-reader__dashboard_section_csr,
        #qr-reader__dashboard_section_swaplink,
        #qr-reader__dashboard_section {
          display: none !important;
        }
        #qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover;
        }
      `}</style>
    </div>
  );
}