"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/clients';
import { returnTicket, createTicket, subscribeToUserTickets, getUserTickets, addLedgerEntry } from '../lib/supabase/database';
import { XCircle } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { EventsMarketplace } from './components/EventsMarketplace';
import { MyTickets } from './components/MyTickets';
import { Ledger } from './components/Ledger';
import { VenueScanner } from './components/VenueScanner';
import { IdentityVerification } from './components/IdentityVerification';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { Balance } from './components/Balance';
import { getUserBalance, updateUserBalance } from '../lib/supabase/database';



// --- MOCK DATA & UTILS ---

const INITIAL_LEDGER = [ { hash: "0x9a1...e4", type: "GENESIS", details: "Ticket Contract Deployed", timestamp: Date.now() - 1000000 } ];

const generateHash = (data) => {
  let hash = 0, i, chr;
  if (!data) return "0x0";
  for (i = 0; i < data.length; i++) {
    chr = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return "0x" + Math.abs(hash).toString(16) + Math.random().toString(16).substr(2, 8);
};

const generateTicketId = () => `TKT-${Math.floor(Math.random() * 100000)}`;

// --- Page wrapper (auth check) ---
export default function SatyaTicketingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data?.session) {
          router.push('/login');
          return;
        }
      } catch (err) {
        console.error(err);
        router.push('/login');
        return;
      } finally {
        if (mounted) setChecking(false);
      }
    })();

    return () => { mounted = false; };
  }, [router]);

  if (checking) return <div className="p-8">Checking authentication...</div>;

  return <SatyaTicketingApp />;
}

// --- Main app component (merged) ---
function SatyaTicketingApp() {
  const router = useRouter();

  const [view, setView] = useState('marketplace');
  const [balance, setBalance] = useState(0);

  const [user, setUser] = useState({ name: 'Aditya Kumar', verified: false, id: 'b99f148f-72f8-4fbd-9272-7f8a73c40f39', bioHash: null });
  const [ledger, setLedger] = useState(INITIAL_LEDGER);
  const [myTickets, setMyTickets] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const [isScanningFace, setIsScanningFace] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Auth
  const [authUser, setAuthUser] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let interval;
    if (isScanningFace) {
      interval = setInterval(() => setScanProgress(prev => prev >= 100 ? 100 : prev + 5), 100);
    }
    return () => clearInterval(interval);
  }, [isScanningFace]);

  useEffect(() => {
    if (isScanningFace && scanProgress >= 100) {
      const timer = setTimeout(() => { const bioHash = generateHash('FACE_DATA_' + user.id); setUser(prev => ({ ...prev, verified: true, bioHash })); setIsScanningFace(false); setScanProgress(0); }, 500);
      return () => clearTimeout(timer);
    }
  }, [scanProgress, isScanningFace, user.id]);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => { if (!mounted) return; const user = data?.session?.user ?? null; setAuthUser(user); setIsAdmin(user?.user_metadata?.role === 'admin' || user?.email?.includes('admin')); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { const user = session?.user ?? null; setAuthUser(user); setIsAdmin(user?.user_metadata?.role === 'admin' || user?.email?.includes('admin')); });

    return () => { mounted = false; listener?.subscription?.unsubscribe?.(); };
  }, []);

  // Load user tickets on auth
  useEffect(() => {
    if (!authUser?.id) return;

    const loadTickets = async () => {
      console.log('Loading tickets for user:', authUser.id);
      const tickets = await getUserTickets(authUser.id);
      console.log('Loaded tickets:', tickets);
      setMyTickets(tickets || []);
    };

    loadTickets();

    // Subscribe to real-time ticket updates for logged-in user
    const subscription = subscribeToUserTickets(authUser.id, (payload) => {
      console.log('Ticket update received:', payload);
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const updatedTicket = payload.new;
        setMyTickets(prev => {
          // Match on ticket_id since that's the unique identifier we use
          const exists = prev.find(t => t.ticket_id === updatedTicket.ticket_id);
          if (exists && payload.eventType === 'UPDATE') {
            return prev.map(t => t.ticket_id === updatedTicket.ticket_id ? { ...t, ...updatedTicket } : t);
          }
          if (!exists && payload.eventType === 'INSERT') {
            return [...prev, updatedTicket];
          }
          return prev;
        });
      } else if (payload.eventType === 'DELETE') {
        setMyTickets(prev => prev.filter(t => t.ticket_id !== payload.old.ticket_id));
      }
    });

    return () => subscription?.unsubscribe?.();
  }, [authUser?.id]);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => { if (!mounted) return; const user = data?.session?.user ?? null; setAuthUser(user); setIsAdmin(user?.user_metadata?.role === 'admin' || user?.email?.includes('admin')); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { const user = session?.user ?? null; setAuthUser(user); setIsAdmin(user?.user_metadata?.role === 'admin' || user?.email?.includes('admin')); });

    return () => { mounted = false; listener?.subscription?.unsubscribe?.(); };
  }, []);

  useEffect(() => {
  if (!authUser?.id) return;

  const loadBalance = async () => {
    try {
      const bal = await getUserBalance(authUser.id);
      setBalance(Number(bal || 0));
    } catch (err) {
      console.error('Failed to load balance', err);
    }
  };

  loadBalance();
}, [authUser?.id]);


  const addToLedger = (type, details) => {
    const newBlock = { hash: generateHash(JSON.stringify(details) + Date.now()), type, details, timestamp: Date.now() };
    setLedger(prev => [newBlock, ...prev]);
    return newBlock.hash;
  };

  const handleVerifyIdentity = () => { setScanProgress(0); setIsScanningFace(true); };

  const buyTicket = async (event) => {
    if (!user.verified) { alert('Please verify your identity (KYC) before purchasing.'); return; }
    setProcessing(true);
    if (balance < event.price) {
  alert('Insufficient balance. Please add money.');
  setProcessing(false);
  return;
}

    try {
      const ticketId = generateTicketId();
      console.log('Creating ticket with data:', {
        ticket_id: ticketId,
        event_id: event.id,
        owner_id: authUser?.id || user.id,
        bio_hash: user.bioHash,
        status: 'ACTIVE',
      });
      
      // Save to Supabase database first
      const savedTicket = await createTicket({
        ticket_id: ticketId,
        event_id: event.id,
        owner_id: authUser?.id || user.id,
        bio_hash: user.bioHash,
        status: 'ACTIVE',
      });

      console.log('Ticket saved:', savedTicket);
await updateUserBalance(
  authUser.id,
  -event.price,
  `TICKET_PURCHASE:${event.id}`
);

setBalance(prev => prev - event.price);


      if (!savedTicket) {
        throw new Error('No data returned from ticket creation');
      }

      // Attempt to mint on-chain via local blockchain API
      try {
        const apiBase = process.env.NEXT_PUBLIC_BLOCKCHAIN_API || 'http://localhost:3001';
        const resp = await fetch(`${apiBase}/mint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId, recipient: null })
        });
        const data = await resp.json();
        if (!resp.ok) {
          console.error('On-chain mint failed:', data);
          throw new Error(data.error || 'On-chain mint failed');
        }

        // persist on-chain TX to ledger table
        await addLedgerEntry('ONCHAIN_MINT', { ticketId, txHash: data.txHash, eventId: event.id, buyerId: user.id });
        // also add to local UI ledger for immediate feedback
        addToLedger('MINT', { action: 'PURCHASE', eventId: event.id, buyer: user.name, buyerId: user.id, price: event.price, ticketId, txHash: data.txHash });
      } catch (onchainErr) {
        console.warn('Warning: on-chain mint failed, but ticket exists in DB. Error:', onchainErr.message || onchainErr);
        addToLedger('MINT', { action: 'PURCHASE', eventId: event.id, buyer: user.name, buyerId: user.id, price: event.price, ticketId, txHash: null });
      }

      // Fetch all user tickets to get complete data with events
      const allTickets = await getUserTickets(authUser?.id || user.id);
      console.log('All user tickets after purchase:', allTickets);
      setMyTickets(allTickets || []);

      setSelectedEvent(null);
      setView('wallet');
      alert('Ticket purchased successfully!');
    } catch (err) {
      console.error('Purchase failed:', err.message || err);
      alert(`Failed to purchase ticket: ${err.message || 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

const resellTicket = async (ticket) => {
  // --- Basic safety checks ---
  if (!ticket || !ticket.id || !ticket.ticket_id) {
    alert('Invalid ticket data');
    return;
  }

  if (ticket.owner_id !== user.id) {
    alert('Unauthorized ticket resale attempt');
    return;
  }

  const price = ticket.events?.price;
  if (price == null) {
    alert('Ticket price missing. Cannot resell.');
    return;
  }

  // --- User confirmation ---
  const confirmed = window.confirm(
    `Confirm resale of ${ticket.ticket_id}?\nThis will be sold at face value (₹${price}) back to the pool.`
  );

  if (!confirmed) return;

  setProcessing(true);

  try {
    // ===============================
    // 1️⃣ BLOCKCHAIN BURN (OPTIONAL)
    // ===============================
    let txHash = null;



    // ===============================
    // 2️⃣ UPDATE TICKET STATUS (DB)
    // ===============================
    const updatedTicket = await returnTicket(ticket.id);

    if (!updatedTicket) {
      throw new Error('Failed to mark ticket as returned in DB');
    }

    // ===============================
    // 3️⃣ REFUND USER (WALLET / BALANCE)
    // ===============================
    await updateUserBalance(
      user.id,
      price,
      'Ticket resale refund'
    );

    // ===============================
    // 4️⃣ LEDGER ENTRY (BUSINESS)
    // ===============================
    await addLedgerEntry('TICKET_RESALE', {
      ticketId: ticket.ticket_id,
      userId: user.id,
      amount: price,
      txHash,
      reason: 'User initiated resale',
    });

    // ===============================
    // 5️⃣ UPDATE UI STATE
    // ===============================
    setMyTickets((prev) => prev.filter((t) => t.id !== ticket.id));

    alert('Ticket returned to pool. Refund processed successfully.');
  } catch (err) {
    console.error('Resale failed:', err);
    alert(err.message || 'Resale failed. Please try again.');
  } finally {
    setProcessing(false);
  }
};

  const simulateScan = (ticket) => { setProcessing(true); setTimeout(() => { setProcessing(false); if (ticket.status !== 'ACTIVE') setScanResult('invalid'); else if (ticket.bioHash === user.bioHash) setScanResult('valid'); else setScanResult('mismatch'); }, 1500); };

  const handleSignOut = async () => { try { const supabase = createClient(); await supabase.auth.signOut(); setAuthUser(null); router.push('/login'); } catch (err) { console.error('Sign out failed', err); } };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <Navbar view={view} setView={setView} authUser={authUser} setAccountOpen={setAccountOpen} accountOpen={accountOpen} handleSignOut={handleSignOut} isAdmin={isAdmin} />
      <div className="grow">
        {view === 'marketplace' && <EventsMarketplace setSelectedEvent={setSelectedEvent} />}
        {view === 'wallet' && <MyTickets myTickets={myTickets} resellTicket={resellTicket} setView={setView} userId={authUser?.id} />}
        {view === 'dashboard' && <Ledger ledger={ledger} />}
        {view === 'scanner' && <VenueScanner processing={processing} scanResult={scanResult} myTickets={myTickets} simulateScan={simulateScan} setProcessing={setProcessing} setScanResult={setScanResult} />}
        {view === 'user-profile' && <UserDashboard authUser={authUser} />}
        {view === 'admin-events' && isAdmin && <AdminDashboard />}
{view === 'balance' && (
  <Balance
    balance={balance}
    setBalance={setBalance}
    userId={authUser?.id}
  />
)}

        {view === 'admin-events' && !isAdmin && <div className="p-8 text-center text-red-600"><p>Access denied. Admin privileges required.</p></div>}
      </div>

      {selectedEvent && !user.verified && <IdentityVerification isScanningFace={isScanningFace} user={user} scanProgress={scanProgress} handleVerifyIdentity={handleVerifyIdentity} selectedEvent={selectedEvent} buyTicket={buyTicket} processing={processing} />}

      {selectedEvent && user.verified && view !== 'scanner' && (
        <div className="fixed bottom-6 right-6 z-40"><div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl max-w-sm border border-slate-700"><div className="flex justify-between items-start mb-2"><h4 className="font-bold text-emerald-400">Confirm Purchase</h4><button onClick={() => setSelectedEvent(null)} className="text-slate-500 hover:text-white"><XCircle size={16}/></button></div><p className="text-sm text-slate-300 mb-3">Buying <strong>{selectedEvent.title}</strong> for ₹{selectedEvent.price}. This ticket will be permanently linked to ID <strong>{user.id}</strong>.</p><button onClick={() => buyTicket(selectedEvent)} disabled={processing} className="w-full bg-emerald-600 hover:bg-emerald-700 py-2 rounded-lg font-bold text-sm transition-colors">{processing ? "Minting on Chain..." : "Confirm & Pay"}</button></div></div>
      )}

      {/* Footer */}
      <footer className="relative w-full border-t border-white/10 bg-linear-to-r from-slate-950 via-slate-950/95 to-slate-950 backdrop-blur-sm">
        <div className="w-full px-8 py-4">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            {/* Left side - Links */}
            <div className="flex flex-wrap gap-8 text-sm text-slate-400/90">
              <a href="https://rvce.edu.in/department/ai_ml/main_department/" className="transition hover:text-emerald-300/80 font-medium">
                Department of Artificial Intelligence and Machine Learning
              </a>
            </div>

            {/* Right side - Names */}
            <div className="flex gap-12 text-sm text-slate-300">
              <a href="https://github.com/theunmeshraj"><p className="font-semibold">Unmesh Raj</p></a>
              <p className="font-semibold">Aditya K</p>
            </div>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `@keyframes scan { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } } .animate-scan { animation: scan 2s linear infinite; }`}} />
    </div>
  );
}

