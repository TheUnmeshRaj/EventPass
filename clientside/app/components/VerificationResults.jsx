'use client';

import React from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export function VerificationSuccess({ userName, confidence, onRetry }) {
  return (
    <div className="w-full space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-green-700 mb-2">Verification Successful!</h3>
        <p className="text-green-600 mb-2">Welcome back, {userName}!</p>
        <p className="text-sm text-green-500">Confidence Score: {(confidence * 100).toFixed(2)}%</p>
      </div>

      <button
        onClick={onRetry}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <CheckCircle className="w-5 h-5" />
        Proceed to Verification
      </button>
    </div>
  );
}

export function VerificationFailure({ onRetry, reason = "Face not recognized" }) {
  return (
    <div className="w-full space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-red-700 mb-2">Verification Failed</h3>
        <p className="text-red-600 mb-2">Sorry, we could not recognize your face.</p>
        <p className="text-sm text-red-500">{reason}</p>
      </div>

      <button
        onClick={onRetry}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-5 h-5" />
        Try Again
      </button>
    </div>
  );
}

export function VerificationPending({ step = 1 }) {
  return (
    <div className="w-full space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
        </div>
        <h3 className="text-lg font-bold text-blue-700 mb-2">Verifying Your Face</h3>
        <p className="text-blue-600">Please wait while we process your image...</p>
      </div>
    </div>
  );
}

export function VerificationWarning({ message, onRetry }) {
  return (
    <div className="w-full space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-yellow-700 mb-2">Unable to Process</h3>
        <p className="text-yellow-600">{message}</p>
      </div>

      <button
        onClick={onRetry}
        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-5 h-5" />
        Try Again
      </button>
    </div>
  );
}
