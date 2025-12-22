import React, { useEffect } from 'react';
import { subscribeToLedger } from '../../lib/supabase/database';

export function Ledger({ ledger }) {
  useEffect(() => {
    const subscription = subscribeToLedger((payload) => {
      // New ledger entries handled by parent component state
    });

    return () => subscription?.unsubscribe?.();
  }, []);
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Blockchain Ledger</h2>
        <p className="text-slate-500">Immutable record of all ticketing events. Transparency is key.</p>
      </div>

      <div className="bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-700 font-mono text-sm">
        <div className="flex bg-slate-800 p-3 text-slate-400 border-b border-slate-700 text-xs uppercase tracking-wider">
          <div className="w-32">Type</div>
          <div className="w-48">Hash</div>
          <div className="flex-1">Details</div>
          <div className="w-40 text-right">Time</div>
        </div>
        <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-800">
          {ledger.map((block, idx) => (
            <div key={idx} className="flex p-4 text-slate-300 hover:bg-slate-800/50 transition-colors">
              <div className="w-32">
                <span className={`px-2 py-1 rounded text-xs font-bold ${block.type === 'MINT' ? 'bg-emerald-900 text-emerald-400' : block.type === 'BURN' ? 'bg-red-900 text-red-400' : 'bg-blue-900 text-blue-400'}`}>{block.type}</span>
              </div>
              <div className="w-48 text-slate-500 truncate pr-4">{block.hash}</div>
              <div className="flex-1">
                {block.type === 'MINT' && (<span>Minted <span className="text-white">{block.details.ticketId}</span> for <span className="text-emerald-400">₹{block.details.price}</span> to {block.details.buyer}</span>)}
                {block.type === 'BURN' && (<span>Ticket <span className="text-white">{block.details.ticketId}</span> returned by {block.details.prevOwner}</span>)}
                {block.type === 'GENESIS' && <span>System Initialized</span>}
              </div>
              <div className="w-40 text-right text-slate-500 text-xs">{new Date(block.timestamp).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
