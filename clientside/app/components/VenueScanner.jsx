import React, { useEffect, useRef, useState } from "react";
import { Lock, CheckCircle, UserCheck, XCircle, Camera, CameraOff } from 'lucide-react';
import { Html5Qrcode } from "html5-qrcode";
import { updateUserProfile, getUserProfile,getEventById, subscribeToUserProfile, uploadUserAvatar, getUserAvatarUrl } from '../../lib/supabase/database';


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

  useEffect(() => {
    startCamera();
    return stopCamera;
  }, []);

  // ---------- QR ----------
  const stopQrScanner = async () => {
    if (!scannerRef.current) return;
    try {
      await scannerRef.current.stop();
      await scannerRef.current.clear();
    } catch { }
    scannerRef.current = null;
  };

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
    setProcessing(true);

    const parsed = parseQrPayload(decodedText);
    if (!parsed?.user_id || !parsed?.event_id) {
      setScanResult("EmptyQR");
      setProcessing(false);
      return;
    }

    const valid = myTickets.some(
      t => t.owner_id === parsed.user_id && t.event_id === parsed.event_id
    );

    if (!valid && t.owner_id != parsed.user_id) {
      setScanResult("invalidUserID");
      setProcessing(false);
      return;
    }

    if (!valid && t.event_id === parsed.event_id) {
      setScanResult("invalidEventID");
      setProcessing(false);
      return;
    }


    await stopQrScanner();
    setQrData(parsed);
    setScanResult("valid");

    setMode("face");
    await startCamera();

    setShowQrOverlay(true);

    // fetch username
    try {
      const profile = await getUserProfile(parsed.user_id);
      setUsername(profile?.full_name);
    } catch (err) {
      console.error("Failed to fetch user profile", err);
      setUsername("Guest");      
    }

    // fetch event name

    try{
      const eventData = await getEventById (parsed.event_id);
      setEventname(eventData?.title);
    }catch(err){
      console.error("Failed to fetch event data", err);
      setEventname("event");
    }

    
    // delay before face scan
    setTimeout(async () => {
      setShowQrOverlay(false);
      setMode("face");
      await startCamera();
    }, 1000);

    setProcessing(false);

  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      await stopQrScanner();
      const imageScanner = new Html5Qrcode("qr-reader");
      const decodedText = await imageScanner.scanFile(file, true);
      await handleQrResult(decodedText);
      await imageScanner.clear();
    } catch {
      setScanResult("EmptyQR");
    };
  }
  // ---------- FACE ----------
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
      setScanResult(data.match ? "verified" : "invalid");
    } catch {
      setScanResult("invalid");
    }

    setProcessing(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-70px)] bg-black">
      <div className="flex-1 flex items-center justify-center gap-8 p-6">

        {/* LEFT: CAMERA / SCANNER */}
        <div className="relative w-full max-w-2xl h-96 bg-black rounded-3xl overflow-hidden border-2 border-slate-800 shadow-xl">

          {mode === "qr" && (

            <div id="qr-reader" className="w-full h-full" />
          )}

          {mode === "face" && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          )}

          {showQrOverlay && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-600/90 text-white z-40">
              <CheckCircle size={64} />
              <h2 className="text-2xl font-bold mt-2">QR VERIFIED</h2>
              <p className="text-lg mt-1">Welcome, {username}</p>
            </div>
          )}


          <canvas ref={canvasRef} className="hidden" />

          {/* PROCESSING */}
          {processing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
            </div>
          )}

          {/* RESULTS */}
          {scanResult === "verified" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-500/90 text-white z-40">
              <CheckCircle size={64} />
              <h2 className="text-2xl font-bold align-middle justify-center-safe">FACE VERIFIED</h2>
              <p className="text-lg mt-1">Enjoy the {eventname}, {username?.split(" ")[0]}!</p>
            </div>
          )}

          {scanResult === "invalid" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/90 text-white z-40">
              <XCircle size={64} />
              <h2 className="text-2xl font-bold">VERIFICATION FAILED, try again!</h2>
            </div>
          )}
          {scanResult === "EmptyQR" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/90 text-white z-40">
              <XCircle size={64} />
              <h2 className="text-2xl font-bold">QR code is invalid!</h2>
            </div>
          )}
          {scanResult === "invalidUserID" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/90 text-white z-40">
              <XCircle size={64} />
              <h2 className="text-2xl font-bold">User ID is invalid</h2>
            </div>
          )}
          {scanResult === "invalidEventID" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/90 text-white z-40">
              <XCircle size={64} />
              <h2 className="text-2xl font-bold">Event ID is invalid</h2>
            </div>
          )}
        </div>

        {/* RIGHT: CONTROLS */}
        <div className="flex flex-col gap-6 h-96 justify-start w-72">

          <div>
            <h3 className="flex items-center gap-2 font-bold text-white mb-2">
              <Lock size={16} className="text-emerald-500" />
              {mode === "qr" ? "QR Scanner" : "Face Scanner"}
            </h3>
            <p className="text-xs text-slate-400">
              {mode === "qr"
                ? "Scan QR to verify ticket"
                : `Face verification for ${username ?? "user"}`}
            </p>
          </div>

          {/* QR STATUS */}
          {mode === "qr" && scanResult === "valid" && (
            <div className="bg-emerald-700 p-3 rounded text-sm">
              QR verified for user {qrData?.user_id}
            </div>
          )}

          {/* UPLOAD QR */}
          {mode === "qr" && (
            <>
              <button
                onClick={() => fileInputRef.current.click()}
                className="rounded-2xl bg-slate-800 hover:bg-slate-700 p-6 text-white"
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

          {/* FACE CAPTURE */}
          {mode === "face" && scanResult === "valid" && (
            <button
              onClick={captureFace}
              disabled={processing}
              className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 p-6 text-white flex items-center justify-center gap-2"
            >
              <Camera />
              Capture Face
            </button>
          )}

          {/* RESET */}
          {scanResult && (
            <button
              onClick={() => {
                setScanResult(null);
                setMode("qr");
                setQrData(null);
              }}
              className="text-sm text-slate-400 underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );

}