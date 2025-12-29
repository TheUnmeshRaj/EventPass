import React, { useEffect, useState } from 'react';
import { Ticket, ShieldCheck, Lock, Activity, RefreshCcw } from 'lucide-react';
import { subscribeToUserTickets } from '../../lib/supabase/database';
import { QRCodeCanvas } from "qrcode.react";

export function MyTickets({ myTickets, resellTicket, setView, userId }) {
  useEffect(() => {
    if (!userId) return;
    
    const subscription = subscribeToUserTickets(userId, (payload) => {
      if (payload.eventType === 'INSERT') {
      } else if (payload.eventType === 'UPDATE') {
        // Handled by parent component
      } else if (payload.eventType === 'DELETE') {
        // Handled by parent component
      }
    });

    return () => subscription?.unsubscribe?.();
  }, [userId]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">My Secure Tickets</h2>
      {myTickets.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <Ticket size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">You havent purchased any tickets yet.</p>
          <button onClick={() => setView('marketplace')} className="mt-4 text-emerald-600 font-medium hover:underline">Browse Events</button>
        </div>
      ) : (
        <div className="space-y-6">
          {myTickets.map(ticket => (
            <div key={ticket.ticket_id} className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden flex flex-col md:flex-row">
              <div className="md:w-1/3 bg-slate-900 p-6 text-white relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/20 rounded-full blur-xl"></div>
                <div className="relative z-10">
                  <h3 className="font-bold text-xl mb-1">{ticket.events?.title || 'Event'}</h3>
                  <p className="text-slate-400 text-sm mb-4">{ticket.events?.date || 'Date TBA'}</p>
                  <div className="mt-8 border-t border-slate-700 pt-4">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Ticket ID</div>
                    <div className="font-medium flex items-center gap-2">{ticket.ticket_id} <ShieldCheck size={14} className="text-emerald-400" /></div>
                  </div>
                </div>
              </div>
              <div className="md:w-2/3 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                
                <div className="flex flex-col items-center">
  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-inner">
<QRCodeCanvas
  value={JSON.stringify({
    user_id: userId,
    event_id: ticket.event_id
  })}
  size={120}
  level="H"
  includeMargin
/>

  </div>
  <div className="text-xs font-mono text-slate-400 mt-2">
    {ticket.ticket_id}
  </div>
</div>



                <div className="flex-1 space-y-3 w-full">
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <div className="flex items-center gap-2 text-emerald-800 font-medium text-sm mb-1"><Lock size={14} /> Anti-Scalp Lock Active</div>
                    <p className="text-xs text-emerald-600">This ticket is bound to your biometric hash. Resale is only permitted at face value (₹{ticket.events?.price || 'N/A'}) through this platform.</p>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"><Activity size={16} /> View History</button>
                    <button onClick={() => resellTicket(ticket)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"><RefreshCcw size={16} /> Resell Ticket</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
