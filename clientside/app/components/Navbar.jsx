import React, { useState, useEffect } from 'react';
import { getUserAvatarUrl } from '../../lib/supabase/database';

import {Calendar, Ticket, Wallet, BarChart3, QrCode, ShieldCheck, Menu, X} from "lucide-react";

import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";

export function Navbar({ view, setView, authUser, setAccountOpen, accountOpen, handleSignOut }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const navItems = [
    { id: "marketplace", label: "Events", icon: Calendar },
    { id: "wallet", label: "My Tickets", icon: Ticket },
    { id: "balance", label: "Balance", icon: Wallet },
    { id: "dashboard", label: "Ledger", icon: BarChart3 }
  ];

  useEffect(() => {
    const fetchProfileImage = async () => {
      if (!authUser?.id) return;

      try {
        setLoading(true);
        const avatarUrl = getUserAvatarUrl(authUser.id);
        setPreview(avatarUrl || null);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        // Set minimal data from auth user
      } finally {
        setLoading(false);
      }
    };
    fetchProfileImage();
  },
    [authUser?.id]);

  const handleNavSelection = (nextView) => {
    setView(nextView);
    setIsMobileNavOpen(false);
  };

  useEffect(() => {
    if (isMobileNavOpen) {
      setAccountOpen(false);
    }
  }, [isMobileNavOpen, setAccountOpen]);

  return (
    <nav className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 px-4 sm:px-6 py-4 shadow-slate-900/30 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handleNavSelection("marketplace")}
        >
          <ShieldCheck className="text-emerald-400" size={26} />
          <span className="font-bold text-lg">
            Satya<span className="text-emerald-400">Ticketing</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-3 text-sm">
          <div className="relative flex gap-2 bg-slate-800/50 rounded-full p-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavSelection(item.id)}
                className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors duration-200 ${
                  view === item.id ? "text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {view === item.id && (
                  <motion.div
                    layoutId="navPill"
                    className="absolute inset-0 bg-slate-700 rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <item.icon size={16} className="relative z-10" />
                <span className="relative z-10">{item.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => handleNavSelection("scanner")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
              view === "scanner"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                : "bg-slate-800 text-emerald-400 border border-emerald-900/50 hover:bg-slate-700 hover:border-emerald-700"
            }`}
          >
            <QrCode size={16} />
            <span>Venue</span>
          </button>

          {authUser ? (
            <div className="relative">
              <button
                onClick={() => setAccountOpen(!accountOpen)}
                className="w-9 h-9 flex items-center justify-center bg-slate-800 px-0.5 rounded-full transition-colors hover:bg-slate-700"
                aria-label="Account menu"
              >
                <div className="w-8 h-8 bg-emerald-400 text-slate-900 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden">
                  <img
                    src={preview || "/luffy.png"}
                    alt="User Avatar"
                    onError={(e) => {
                      e.currentTarget.src = "/luffy.png";
                    }}
                    className="rounded-full object-cover w-full h-full"
                  />
                </div>
              </button>

              {accountOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 bg-slate-800 text-white rounded-lg shadow-xl border border-slate-700 overflow-hidden z-50"
                >
                  <div className="p-1">
                    <button
                      onClick={() => {
                        handleNavSelection("user-profile");
                        setAccountOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded-md text-sm transition-colors"
                    >
                      My Profile
                    </button>

                    {authUser?.email === "unmeshraj.raj@gmail.com" && (
                      <button
                        onClick={() => {
                          handleNavSelection("admin-events");
                          setAccountOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded-md text-sm transition-colors"
                      >
                        Manage Events
                      </button>
                    )}

                    <hr className="my-1 border-slate-700" />

                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 hover:bg-red-600/20 text-red-400 rounded-md text-sm transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold transition-colors"
            >
              Login
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 md:hidden">
          {authUser ? (
            <button
              onClick={() => handleNavSelection("scanner")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                view === "scanner" ? "bg-emerald-600 text-white" : "bg-slate-800 text-emerald-400"
              }`}
            >
              <QrCode size={16} />
              Venue
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="px-3 py-1.5 rounded-full bg-emerald-500 text-slate-900 text-sm font-semibold"
            >
              Login
            </button>
          )}

          <button
            onClick={() => setIsMobileNavOpen((prev) => !prev)}
            aria-label="Toggle navigation"
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition"
          >
            {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {isMobileNavOpen && (
        <div className="md:hidden mt-4 space-y-3 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavSelection(item.id)}
                className={`flex items-center justify-between rounded-xl px-4 py-3 border text-sm font-semibold transition ${
                  view === item.id
                    ? "bg-emerald-500/10 border-emerald-400 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-200"
                }`}
              >
                <span className="flex items-center gap-2">
                  <item.icon size={16} />
                  {item.label}
                </span>
                {view === item.id && <motion.span layoutId="mobileNavDot" className="h-2 w-2 rounded-full bg-emerald-400" />}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleNavSelection("scanner")}
            className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              view === "scanner"
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 text-emerald-400 border border-emerald-500/30"
            }`}
          >
            <QrCode size={16} />
            Venue Scanner
          </button>

          {authUser ? (
            <div className="space-y-2 border-t border-slate-800 pt-3">
              <button
                onClick={() => handleNavSelection("user-profile")}
                className="w-full text-left px-3 py-2 rounded-lg bg-slate-800 text-sm font-medium"
              >
                My Profile
              </button>
              {authUser?.email === "unmeshraj.raj@gmail.com" && (
                <button
                  onClick={() => handleNavSelection("admin-events")}
                  className="w-full text-left px-3 py-2 rounded-lg bg-slate-800 text-sm font-medium"
                >
                  Manage Events
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 rounded-lg bg-red-600/20 text-red-300 text-sm font-medium"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="w-full rounded-xl bg-emerald-500 text-slate-900 text-sm font-semibold py-3"
            >
              Login to continue
            </button>
          )}
        </div>
      )}
    </nav>
  );
}