"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/clients';
import { XCircle } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { EventsMarketplace } from './components/EventsMarketplace';
import { MyTickets } from './components/MyTickets';
import { Ledger } from './components/Ledger';
import { VenueScanner } from './components/VenueScanner';
import { IdentityVerification } from './components/IdentityVerification';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { createTicket, addLedgerEntry, getUserTickets } from '../lib/supabase/database';

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
  const [user, setUser] = useState({ name: 'Aditya Kumar', verified: false, id: 'IND-9876', bioHash: null });
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

    supabase.auth.getSession().then(({ data }) => { if (!mounted) return; setAuthUser(data?.session?.user ?? null); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { setAuthUser(session?.user ?? null); });

    return () => { mounted = false; listener?.subscription?.unsubscribe?.(); };
  }, []);

  useEffect(() => {
  if (!authUser?.id) return;
  
  const loadTickets = async () => {
    const supabase = createClient();
    try {
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
          *,
          events (*)
        `)
        .eq('owner_id', authUser.id);
      
      if (error) throw error;
      
      const formattedTickets = tickets.map(ticket => ({
        ...ticket,
        event: ticket.events || {}
      }));
      
      setMyTickets(formattedTickets);
    } catch (err) {
      console.error('Error loading tickets:', err);
    }
  };
  
  loadTickets();
}, [authUser?.id]);

  const addToLocalLedger = (type, details) => {
    const newBlock = { hash: generateHash(JSON.stringify(details) + Date.now()), type, details, timestamp: Date.now() };
    setLedger(prev => [newBlock, ...prev]);
    return newBlock.hash;
  };

  const handleVerifyIdentity = () => { setScanProgress(0); setIsScanningFace(true); };

const buyTicket = async (event) => {
  if (!user.verified) { alert('Please verify your identity (KYC) before purchasing.'); return; }
  if (!authUser?.id) { alert('Not authenticated'); return; }

  setProcessing(true);
  try {
    const ticketId = generateTicketId();

    // 1) Add ledger entry to Supabase
    await addLedgerEntry('MINT', {
      action: 'PURCHASE',
      eventId: event.id,
      buyer: user.name,
      buyerId: user.id,
      price: event.price,
      ticketId,
    });

    // 2) Create ticket in Supabase
    const ticketData = {
      ticket_id: ticketId,
      event_id: event.id,
      owner_id: authUser.id,
      bio_hash: user.bioHash,
      status: 'ACTIVE',
      purchase_date: new Date().toISOString(),
    };
    await createTicket(ticketData);

    // 3) Refresh local tickets
    const userTickets = await getUserTickets(authUser.id);
    setMyTickets(userTickets);

    setSelectedEvent(null);
    setView('wallet');
  } catch (err) {
    console.error('Purchase failed:', err);
    alert('Failed to create ticket. Try again.');
  } finally {
    setProcessing(false);
  }
};

  const resellTicket = async (ticket) => {
  if (!window.confirm(`Confirm resale of ${ticket.id}? This will be sold at face value (₹${ticket.event?.price || 'N/A'}) back to the pool.`)) return;
  
  setProcessing(true); 
  try {
    await new Promise(r => setTimeout(r, 1500)); 
    addToLocalLedger('BURN', { 
      action: 'RESALE_RETURN', 
      ticketId: ticket.id, 
      prevOwner: user.name, 
      reason: 'User Initiated Return' 
    }); 
    
    const supabase = createClient();
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('ticket_id', ticket.id);
      
    if (error) throw error;
    
    setMyTickets(prev => prev.filter(t => t.id !== ticket.id)); 
    alert('Ticket returned to pool. Refund processed to source.');
  } catch (err) {
    console.error('Error returning ticket:', err);
    alert('Failed to return ticket. Please try again.');
  } finally {
    setProcessing(false);
  }
};

  const simulateScan = (ticket) => { setProcessing(true); setTimeout(() => { setProcessing(false); if (ticket.status !== 'ACTIVE') setScanResult('invalid'); else if (ticket.bioHash === user.bioHash) setScanResult('valid'); else setScanResult('mismatch'); }, 1500); };

  const handleSignOut = async () => { try { const supabase = createClient(); await supabase.auth.signOut(); setAuthUser(null); router.push('/login'); } catch (err) { console.error('Sign out failed', err); } };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar view={view} setView={setView} authUser={authUser} setAccountOpen={setAccountOpen} accountOpen={accountOpen} handleSignOut={handleSignOut} />
      {view === 'marketplace' && <EventsMarketplace setSelectedEvent={setSelectedEvent} />}
      {view === 'wallet' && <MyTickets myTickets={myTickets} resellTicket={resellTicket} setView={setView} userId={authUser?.id} />}
      {view === 'dashboard' && <Ledger ledger={ledger} />}
      {view === 'scanner' && <VenueScanner processing={processing} scanResult={scanResult} myTickets={myTickets} simulateScan={simulateScan} setProcessing={setProcessing} setScanResult={setScanResult} />}
      {view === 'user-profile' && <UserDashboard authUser={authUser} />}
      {view === 'admin-events' && <AdminDashboard />}

      {selectedEvent && !user.verified && <IdentityVerification isScanningFace={isScanningFace} user={user} scanProgress={scanProgress} handleVerifyIdentity={handleVerifyIdentity} selectedEvent={selectedEvent} buyTicket={buyTicket} processing={processing} />}

      {selectedEvent && user.verified && view !== 'scanner' && (
        <div className="fixed bottom-6 right-6 z-40"><div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl max-w-sm border border-slate-700"><div className="flex justify-between items-start mb-2"><h4 className="font-bold text-emerald-400">Confirm Purchase</h4><button onClick={() => setSelectedEvent(null)} className="text-slate-500 hover:text-white"><XCircle size={16}/></button></div><p className="text-sm text-slate-300 mb-3">Buying <strong>{selectedEvent.title}</strong> for ₹{selectedEvent.price}. This ticket will be permanently linked to ID <strong>{user.id}</strong>.</p><button onClick={() => buyTicket(selectedEvent)} disabled={processing} className="w-full bg-emerald-600 hover:bg-emerald-700 py-2 rounded-lg font-bold text-sm transition-colors">{processing ? "Minting on Chain..." : "Confirm & Pay"}</button></div></div>
      )}

      <style dangerouslySetInnerHTML={{__html: `@keyframes scan { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } } .animate-scan { animation: scan 2s linear infinite; }`}} />
    </div>
  );
}

