import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, QrCode } from 'lucide-react';
import { createClient } from "../../lib/supabase/clients";

export function Navbar({ view, setView, authUser, setAccountOpen, accountOpen, handleSignOut }) {
  const router = useRouter();

  return (
    <nav className="bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-lg border-b border-slate-700">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('marketplace')}>
        <ShieldCheck className="text-emerald-400" size={28} />
        <span className="font-bold text-xl tracking-tight">Satya<span className="text-emerald-400">Ticketing</span></span>
      </div>
      <div className="flex items-center gap-4 text-sm font-medium">
        <div className="hidden sm:flex gap-2">
          <button onClick={() => setView('marketplace')} className={`px-3 py-1 rounded-full ${view === 'marketplace' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>Events</button>
          <button onClick={() => setView('wallet')} className={`px-3 py-1 rounded-full ${view === 'wallet' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>My Tickets</button>
          <button onClick={() => setView('dashboard')} className={`px-3 py-1 rounded-full ${view === 'dashboard' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>Ledger</button>
          <button onClick={() => setView('scanner')} className={`px-3 py-1 rounded-full flex items-center gap-1 ${view === 'scanner' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-emerald-400 border border-emerald-900'}`}><QrCode size={16} /> Venue</button>
        </div>

        <div className="relative">
          {authUser ? (
            <div className="relative">
              <button onClick={() => setAccountOpen(!accountOpen)} className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full">
                <div className="w-8 h-8 bg-emerald-400 text-slate-900 rounded-full flex items-center justify-center font-bold text-sm">{(() => { const name = authUser.user_metadata?.full_name || authUser.email || 'U'; return String(name).charAt(0).toUpperCase(); })()}</div>
                <div className="hidden sm:block text-sm truncate max-w-[120px]">{authUser.user_metadata?.full_name || authUser.email}</div>
              </button>

              {accountOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 text-white rounded shadow-lg p-2 z-50">
                  <button onClick={() => { setView('user-profile'); setAccountOpen(false); }} className="w-full text-left px-2 py-2 hover:bg-slate-700 rounded text-sm">My Profile</button>
                  <button onClick={() => { setView('admin-events'); setAccountOpen(false); }} className="w-full text-left px-2 py-2 hover:bg-slate-700 rounded text-sm">Manage Events</button>
                  <button onClick={() => { setView('dashboard'); setAccountOpen(false); }} className="w-full text-left px-2 py-2 hover:bg-slate-700 rounded text-sm">Ledger</button>
                  <hr className="my-2 border-slate-700" />
                  <button onClick={handleSignOut} className="w-full text-left px-2 py-2 hover:bg-slate-700 rounded text-sm">Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => router.push('/login')} className="px-3 py-1 rounded-full bg-emerald-500 text-slate-900 font-semibold">Login</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
