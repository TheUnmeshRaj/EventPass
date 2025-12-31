import React, { useEffect, useRef, useState } from "react";
import { Lock, CheckCircle, XCircle, Upload, Camera } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

export function VenueScanner({
  processing,
  scanResult,
  myTickets,
  setProcessing,
  setScanResult,
}) {
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [qrData, setQrData] = useState(null);
  const [faceMode, setFaceMode] = useState(false);

  // -----------------------------
  // START QR SCANNER
  // -----------------------------
  useEffect(() => {
    if (myTickets.length === 0 || faceMode) return;

    const startScanner = async () => {
      try {
        scannerRef.current = new Html5Qrcode("qr-reader");
        await scannerRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 350, height: 350 } },
          handleQrResult
        );
      } catch (err) {
        console.error("QR start error:", err);
      }
    };

    startScanner();
    return stopQrScanner;
  }, [myTickets, faceMode]);

  const stopQrScanner = async () => {
    if (!scannerRef.current) return;
    try {
      await scannerRef.current.stop();
      await scannerRef.current.clear();
    } catch {}
    scannerRef.current = null;
  };

  // -----------------------------
  // SAFE PARSE QR
  // -----------------------------
  const parseQrPayload = (decodedText) => {
    try {
      let data = JSON.parse(decodedText);
      if (typeof data === "string") data = JSON.parse(data);
      return data;
    } catch {
      return null;
    }
  };

  // -----------------------------
  // HANDLE QR RESULT
  // -----------------------------
  const handleQrResult = async (decodedText) => {
    setProcessing(true);

    const parsed = parseQrPayload(decodedText);
    if (!parsed?.user_id || !parsed?.event_id) {
      setScanResult("invalid");
      setProcessing(false);
      return;
    }

    const isValid = myTickets.some(
      (t) => t.event_id === parsed.event_id && t.owner_id === parsed.user_id
    );

    if (!isValid) {
      setScanResult("invalid");
      setProcessing(false);
      return;
    }

    await stopQrScanner();
    setQrData(parsed);
    setScanResult("valid");
    setProcessing(false);
  };

  // -----------------------------
  // UPLOAD QR IMAGE ✅
  // -----------------------------
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      await stopQrScanner();
      const imageScanner = new Html5Qrcode("qr-reader");
      const decodedText = await imageScanner.scanFile(file, true);
      await handleQrResult(decodedText);
      await imageScanner.clear();
    } catch (err) {
      console.error("QR image scan failed:", err);
      setScanResult("invalid");
    }
  };

  // -----------------------------
  // FACE CAMERA
  // -----------------------------
  const startFaceCamera = async () => {
    setFaceMode(true);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
    });

    videoRef.current.srcObject = stream;
    streamRef.current = stream;
  };

  const captureFace = async () => {
    setProcessing(true);

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);

    const imageBase64 = canvas.toDataURL("image/jpeg");

    const res = await fetch("http://localhost:5000/verify-face-by-qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: qrData.user_id,
        image: imageBase64,
      }),
    });

    const data = await res.json();
    console.log("Face verification result:", data);
    setScanResult(data.match ? "Welcome" : "invalid");
    setProcessing(false);
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="p-6 bg-black text-white flex flex-col gap-6">
      <div className="h-96 rounded-xl border border-slate-700 overflow-hidden">
        {!faceMode ? (
          <div id="qr-reader" className="w-full h-full" />
        ) : (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        )}
      </div>

      {scanResult === "valid" && (
        <div className="bg-green-600 p-3 rounded flex items-center gap-2">
          <CheckCircle /> QR verified for user {qrData.user_id}
        </div>
      )}

      {scanResult === "invalid" && (
        <div className="bg-red-600 p-3 rounded flex items-center gap-2">
          <XCircle /> Bakchodi
        </div>
      )}

      {scanResult === "Welcome" && (
        <div className="bg-emerald-600 p-4 rounded text-center text-2xl">
          🎉 WELCOME 🎉
        </div>
      )}

      {/* ACTIONS */}
      {!faceMode && (
        <>
          <button
            onClick={() => fileInputRef.current.click()}
            className="bg-slate-800 hover:bg-slate-700 p-4 rounded flex items-center gap-2 justify-center"
          >
            <Upload /> Upload QR Image
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

      {scanResult === "valid" && !faceMode && (
        <button
          onClick={startFaceCamera}
          className="bg-emerald-600 hover:bg-emerald-700 p-4 rounded flex items-center gap-2 justify-center"
        >
          <Camera /> Proceed to Face Scan
        </button>
      )}

      {faceMode && scanResult === "valid" && (
        <button
          onClick={captureFace}
          className="bg-emerald-600 hover:bg-emerald-700 p-4 rounded"
        >
          Capture Face
        </button>
      )}
    </div>
  );
}
