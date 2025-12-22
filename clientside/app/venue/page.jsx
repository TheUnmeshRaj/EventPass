'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/clients';
import { deepfaceAPI } from '../../lib/deepface-api';
import { faceVerificationService } from '../../lib/face-verification-service';
import FaceScanner from '../components/FaceScanner';
import {
  VerificationSuccess,
  VerificationFailure,
  VerificationPending,
  VerificationWarning,
} from '../components/VerificationResults';
import { MapPin, Calendar, ArrowLeft, Info } from 'lucide-react';

export default function VenuePage() {
  const router = useRouter();
  const supabase = createClient();

  // State management
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanningFace, setScanningFace] = useState(false);
  const [verificationStep, setVerificationStep] = useState('scanner'); // 'scanner', 'processing', 'result'
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Venue data (mock or from database)
  const venueData = {
    name: 'Wankhede Stadium',
    location: 'Mumbai, India',
    date: '2025-05-28',
    capacity: 50000,
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push('/login');
          return;
        }

        setUser(session.user);
      } catch (err) {
        console.error('Auth check error:', err);
        router.push('/login');
      }
    };

    checkAuth();
  }, []);

  const handleFaceCapture = async (imageBlob) => {
    setScanningFace(true);
    setVerificationStep('processing');
    setError(null);

    try {
      // Call DeepFace API to verify face
      const result = await deepfaceAPI.verifyFace(imageBlob);

      // Log verification attempt
      if (user) {
        await faceVerificationService.logVerification(user.id, {
          verified: result.verified,
          confidence: result.confidence,
          matched_user: result.matched_user,
        });
      }

      // Set result and display
      setVerificationResult({
        verified: result.verified,
        confidence: result.confidence,
        matched_user: result.matched_user,
        message: result.message,
      });

      setVerificationStep('result');
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || 'Face verification failed. Please try again.');
      setVerificationStep('scanner');
      setVerificationResult({
        verified: false,
        message: err.message,
      });
    } finally {
      setScanningFace(false);
    }
  };

  const handleRetry = () => {
    setVerificationStep('scanner');
    setVerificationResult(null);
    setError(null);
  };

  const handleVerificationSuccess = () => {
    // User has been verified, proceed to event details or next step
    console.log('User verified:', user?.email);
    router.push('/events');
  };

  const handleGoBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-white">Event Check-In</h1>
        <div className="w-10"></div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Venue Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{venueData.name}</h2>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                <p className="text-gray-600">{venueData.location}</p>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                <p className="text-gray-600">{venueData.date}</p>
              </div>
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                <p className="text-gray-600">Capacity: {venueData.capacity.toLocaleString()}</p>
              </div>
            </div>

            {user && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600">Check-in as:</p>
                <p className="font-semibold text-gray-800">{user.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Face Scanner Card */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {verificationStep === 'scanner' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Face Recognition Check-In
                  </h3>
                  <p className="text-gray-600">
                    Please position your face in the frame below. Make sure you're in a well-lit
                    area and looking directly at the camera.
                  </p>
                </div>
                <FaceScanner onCapture={handleFaceCapture} isLoading={scanningFace} />
              </div>
            )}

            {verificationStep === 'processing' && <VerificationPending />}

            {verificationStep === 'result' && verificationResult && (
              <>
                {verificationResult.verified ? (
                  <VerificationSuccess
                    userName={verificationResult.matched_user || 'Guest'}
                    confidence={verificationResult.confidence}
                    onRetry={handleVerificationSuccess}
                  />
                ) : (
                  <VerificationFailure
                    onRetry={handleRetry}
                    reason={
                      verificationResult.message || 'Your face does not match our records.'
                    }
                  />
                )}
              </>
            )}
          </div>

          {/* Instructions Card */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Tips for Best Results:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Ensure good lighting on your face</li>
              <li>✓ Remove sunglasses or hats</li>
              <li>✓ Look directly at the camera</li>
              <li>✓ Keep your face within the frame</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
