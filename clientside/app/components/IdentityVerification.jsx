import { Fingerprint, ShieldCheck, CheckCircle } from 'lucide-react';

export function IdentityVerification({ isScanningFace, user, scanProgress, handleVerifyIdentity, selectedEvent, buyTicket, processing }) {
  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        {!isScanningFace && !user.verified ? (
          <>
            <div className="text-center mb-6">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Fingerprint size={32} className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">One-Time Verification</h3>
              <p className="text-slate-500 text-sm mt-2">To prevent fraud, tickets are linked to your biometrics. We only store a secure hash, never your image.</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">User ID (Aadhaar/PAN/Unique ID)</label>
                <div className="flex items-center gap-2 mt-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <ShieldCheck size={18} className="text-slate-400" />
                  <span className="font-mono text-slate-700">{user.id}</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded ml-auto">Linked</span>
                </div>
              </div>
            </div>

            <button onClick={handleVerifyIdentity} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
              <Fingerprint size={20} /> Scan Biometrics to Verify
            </button>
          </>
        ) : isScanningFace ? (
          <div className="text-center py-8">
            <div className="relative w-32 h-32 mx-auto mb-6 rounded-full border-4 border-slate-100 overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-b from-emerald-500/20 to-transparent animate-pulse"></div>
              <div className="absolute left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] transition-all duration-200" style={{ top: `${scanProgress}%` }} />
              
              <img
  className="w-full h-full object-cover opacity-50"
  src={`https://oirysflqkblhxoehavox.supabase.co/storage/v1/object/public/avatars/${user.id}.png`}
  alt="face"
  width={128}
  height={128}
/>


            </div>
            <h3 className="text-lg font-bold text-slate-800 animate-pulse">Generating Biometric Hash...</h3>
            <p className="text-sm text-slate-500 mt-2">Mapping facial landmarks to blockchain identity</p>
          </div>
        ) : (
          <div className="text-center py-6">
            <CheckCircle size={64} className="text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900">Identity Verified</h3>
            <p className="text-sm text-slate-500 mb-6">Your biometric hash: <span className="font-mono text-xs bg-slate-100 p-1 rounded">{user.bioHash?.substring(0,16)}...</span></p>
            <button onClick={() => { if (selectedEvent) buyTicket(selectedEvent); }} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">{processing ? "Minting Ticket..." : `Confirm Purchase (₹${selectedEvent?.price})`}</button>
          </div>
        )}
      </div>
    </div>
  );
}
