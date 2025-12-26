import React, { useState, useEffect } from 'react';
import { getUserAvatarUrl } from '../../lib/supabase/database';

import {Calendar, Ticket, Wallet, BarChart3, QrCode, ShieldCheck} from "lucide-react";

import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";

export function Navbar({ view, setView, authUser, setAccountOpen, accountOpen, handleSignOut }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

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

  return (
    <nav className="bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 border-b border-slate-700">
      {/* Logo */}
      <div
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setView("marketplace")}
      >
        <ShieldCheck className="text-emerald-400" size={26} />
        <span className="font-bold text-lg">
          Satya<span className="text-emerald-400">Ticketing</span>
        </span>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2 text-sm">
        {/* Main Nav Buttons with Sliding Background */}
        <div className="relative flex gap-2 bg-slate-800/50 rounded-full p-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors duration-200
                ${view === item.id ? "text-white" : "text-slate-400 hover:text-white"}
              `}
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

        {/* Venue Scanner Button */}
        <button
          onClick={() => setView("scanner")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200
            ${view === "scanner"
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
              : "bg-slate-800 text-emerald-400 border border-emerald-900/50 hover:bg-slate-700 hover:border-emerald-700"
            }
          `}
        >
          <QrCode size={16} />
          <span>Venue</span>
        </button>

        {/* User Account */}
        {authUser ? (
          <div className="relative">
            <button
              onClick={() => setAccountOpen(!accountOpen)}

              className="w-9 h-9 items-center gap-2 bg-slate-800 px-0.5 rounded-full transition-colors hover:bg-slate-700 "
            >
              <div className="w-8 h-8 bg-emerald-400 text-slate-900 rounded-full flex items-center justify-center font-bold text-sm">
                {(() => {
                  
                  const image = <img src={preview || "/luffy.png"} alt="User Avatar"
                    onError={(e) => {e.currentTarget.src = "/luffy.png";}}
                    className="rounded-full object-cover w-8 h-8"
                  />

                  return image ? (image) : "U";
                })()}
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
                      setView("user-profile");
                      setAccountOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded-md text-sm transition-colors"
                  >
                    My Profile
                  </button>

                  {authUser?.email === "unmeshraj.raj@gmail.com" && (
                    <button
                      onClick={() => {
                        setView("admin-events");
                        setAccountOpen(true);
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
    </nav>
  );
}