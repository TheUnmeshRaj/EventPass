"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/clients';

import {
  returnTicket,
  createTicket,
  subscribeToUserTickets,
  getUserTickets,
  addLedgerEntry,
  getUserBalance,
  updateUserBalance,
  updateUserProfile,
  getUserProfile,
  subscribeToUserProfile,
  uploadUserAvatar,
  getUserAvatarUrl
} from '../lib/supabase/database';

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

// Constants
const INITIAL_LEDGER = [
  {
    hash: "0x9a1...e4",
    type: "GENESIS",
    details: "Ticket Contract Deployed",
    timestamp: Date.now() - 1000000
  }
];

// Utility functions
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

// Main Page Component with Auth Check
export default function SatyaTicketingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        
        if (error || !data?.user) {
          router.push('/login');
          return;
        }
        
        if (mounted) {
          setAuthUser(data.user);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push('/login');
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  return <SatyaTicketingApp authUser={authUser} />;
}

// Main App Component
function SatyaTicketingApp({ authUser }) {
  const router = useRouter();

  // View and UI state
  const [view, setView] = useState('marketplace');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);

  // User state
  const [user, setUser] = useState({
    name: authUser?.user_metadata?.name || authUser?.email || 'User',
    verified: false,
    id: authUser.id,
    bioHash: null
  });
  const [isAdmin, setIsAdmin] = useState(false);

  // KYC/Verification state
  const [isScanningFace, setIsScanningFace] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Data state
  const [balance, setBalance] = useState(0);
  const [myTickets, setMyTickets] = useState([]);
  const [ledger, setLedger] = useState(INITIAL_LEDGER);

  // Face scan progress animation
  useEffect(() => {
    let interval;
    if (isScanningFace) {
      interval = setInterval(() => {
        setScanProgress(prev => (prev >= 100 ? 100 : prev + 5));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isScanningFace]);

  // Complete face scan verification
  useEffect(() => {
    if (isScanningFace && scanProgress >= 100) {
      const timer = setTimeout(() => {
        const bioHash = generateHash('FACE_DATA_' + authUser.id);
        setUser(prev => ({ ...prev, verified: true, bioHash }));
        setIsScanningFace(false);
        setScanProgress(0);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [scanProgress, isScanningFace, authUser.id]);


  // Load user balance
  useEffect(() => {
    if (!authUser?.id) return;

    const loadBalance = async () => {
      try {
        const bal = await getUserBalance(authUser.id);
        setBalance(Number(bal || 0));
      } catch (err) {
        console.error('Failed to load balance:', err);
      }
    };

    loadBalance();
  }, [authUser?.id]);

  // Load user tickets and subscribe to updates
  useEffect(() => {
    if (!authUser?.id) return;

    const loadTickets = async () => {
      console.log('Loading tickets for user:', authUser.id);
      const tickets = await getUserTickets(authUser.id);
      console.log('Loaded tickets:', tickets);
      setMyTickets(tickets || []);
    };

    loadTickets();

    // Subscribe to real-time ticket updates
    const subscription = subscribeToUserTickets(authUser.id, (payload) => {
      console.log('Ticket update received:', payload);
      
      if (payload.eventType === 'INSERT') {
        const newTicket = payload.new;
        setMyTickets(prev => {
          const exists = prev.find(t => t.ticket_id === newTicket.ticket_id);
          return exists ? prev : [...prev, newTicket];
        });
      } else if (payload.eventType === 'UPDATE') {
        const updatedTicket = payload.new;
        setMyTickets(prev => 
          prev.map(t => t.ticket_id === updatedTicket.ticket_id ? { ...t, ...updatedTicket } : t)
        );
      } else if (payload.eventType === 'DELETE') {
        setMyTickets(prev => prev.filter(t => t.ticket_id !== payload.old.ticket_id));
      }
    });

    return () => subscription?.unsubscribe?.();
  }, [authUser?.id]);

  // Ledger functions
  const addToLedger = (type, details) => {
    const newBlock = {
      hash: generateHash(JSON.stringify(details) + Date.now()),
      type,
      details,
      timestamp: Date.now()
    };
    setLedger(prev => [newBlock, ...prev]);
    return newBlock.hash;
  };

  // Identity verification handler
  const handleVerifyIdentity = () => {
    setScanProgress(0);
    setIsScanningFace(true);
  };

  // Buy ticket handler
  const buyTicket = async (event) => {
    if (!user.verified) {
      alert('Please verify your identity (KYC) before purchasing.');
      return;
    }

    if (balance < event.price) {
      alert('Insufficient balance. Please add money.');
      return;
    }

    setProcessing(true);

    try {
      const ticketId = generateTicketId();
      console.log('Creating ticket with data:', {
        ticket_id: ticketId,
        event_id: event.id,
        owner_id: authUser.id,
        bio_hash: user.bioHash,
        status: 'ACTIVE',
      });

      // Save to Supabase database
      const savedTicket = await createTicket({
        ticket_id: ticketId,
        event_id: event.id,
        owner_id: authUser.id,
        bio_hash: user.bioHash,
        status: 'ACTIVE',
      });

      console.log('Ticket saved:', savedTicket);

      if (!savedTicket) {
        throw new Error('No data returned from ticket creation');
      }

      // Update user balance
      await updateUserBalance(
        authUser.id,
        -event.price,
        `TICKET_PURCHASE:${event.id}`
      );

      setBalance(prev => prev - event.price);

      // Attempt blockchain mint (optional)
      try {
        const apiBase = process.env.NEXT_PUBLIC_BLOCKCHAIN_API || 'http://localhost:3001';
        const resp = await fetch(`${apiBase}/mint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId, recipient: null })
        });

        if (!resp.ok) {
          const errorData = await resp.json();
          console.error('On-chain mint failed:', errorData);
          throw new Error(errorData.error || 'On-chain mint failed');
        }

        const data = await resp.json();

        // Persist on-chain TX to ledger
        await addLedgerEntry('ONCHAIN_MINT', {
          ticketId,
          txHash: data.txHash,
          eventId: event.id,
          buyerId: authUser.id
        });

        addToLedger('MINT', {
          action: 'PURCHASE',
          eventId: event.id,
          buyer: user.name,
          buyerId: authUser.id,
          price: event.price,
          ticketId,
          txHash: data.txHash
        });
      } catch (onchainErr) {
        console.warn('Warning: on-chain mint failed, but ticket exists in DB. Error:', onchainErr.message);
        addToLedger('MINT', {
          action: 'PURCHASE',
          eventId: event.id,
          buyer: user.name,
          buyerId: authUser.id,
          price: event.price,
          ticketId,
          txHash: null
        });
      }

      // Fetch all user tickets with complete data
      const allTickets = await getUserTickets(authUser.id);
      console.log('All user tickets after purchase:', allTickets);
      setMyTickets(allTickets || []);

      setSelectedEvent(null);
      setView('wallet');
      alert('Ticket purchased successfully!');
    } catch (err) {
      console.error('Purchase failed:', err);
      alert(`Failed to purchase ticket: ${err.message || 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  // Resell ticket handler
  const resellTicket = async (ticket) => {
    // Validation
    if (!ticket || !ticket.id || !ticket.ticket_id) {
      alert('Invalid ticket data');
      return;
    }

    if (ticket.owner_id !== authUser.id) {
      alert('You can only resell your own tickets');
      return;
    }

    const price = ticket.events?.price;
    if (price == null) {
      alert('Ticket price missing. Cannot resell.');
      return;
    }

    // User confirmation
    const confirmed = window.confirm(
      `Confirm resale of ${ticket.ticket_id}?\nThis will be sold at face value (₹${price}) back to the pool.`
    );

    if (!confirmed) return;

    setProcessing(true);

    try {
      // Update ticket status in database
      const updatedTicket = await returnTicket(ticket.id);

      if (!updatedTicket) {
        throw new Error('Failed to mark ticket as returned in DB');
      }

      // Refund user
      await updateUserBalance(
        authUser.id,
        price,
        `TICKET_RESALE:${ticket.ticket_id}`
      );

      setBalance(prev => prev + price);

      // Add ledger entry
      await addLedgerEntry('TICKET_RESALE', {
        ticketId: ticket.ticket_id,
        userId: authUser.id,
        amount: price,
        reason: 'User initiated resale',
      });

      // Update UI
      setMyTickets(prev => prev.filter(t => t.id !== ticket.id));

      alert('Ticket returned to pool. Refund processed successfully.');
    } catch (err) {
      console.error('Resale failed:', err);
      alert(err.message || 'Resale failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Venue scanner simulation
  const simulateScan = (ticket) => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      if (ticket.status !== 'ACTIVE') {
        setScanResult('invalid');
      } else if (ticket.bioHash === user.bioHash) {
        setScanResult('valid');
      } else {
        setScanResult('mismatch');
      }
    }, 1500);
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <Navbar
        view={view}
        setView={setView}
        authUser={authUser}
        setAccountOpen={setAccountOpen}
        accountOpen={accountOpen}
        handleSignOut={handleSignOut}
        isAdmin={isAdmin}
      />

      <div className="grow">
        {view === 'marketplace' && (
          <EventsMarketplace setSelectedEvent={setSelectedEvent} />
        )}
        
        {view === 'wallet' && (
          <MyTickets
            myTickets={myTickets}
            resellTicket={resellTicket}
            setView={setView}
            userId={authUser?.id}
          />
        )}
        
        {view === 'dashboard' && <Ledger ledger={ledger} />}
        
        {view === 'scanner' && (
          <VenueScanner
            processing={processing}
            scanResult={scanResult}
            myTickets={myTickets}
            simulateScan={simulateScan}
            setProcessing={setProcessing}
            setScanResult={setScanResult}
          />
        )}
        
        {view === 'user-profile' && <UserDashboard authUser={authUser} />}
        
        {view === 'balance' && (
          <Balance
            balance={balance}
            setBalance={setBalance}
            userId={authUser?.id}
          />
        )}
        
        {view === 'admin-events' && isAdmin && <AdminDashboard />}
        
        {view === 'admin-events' && !isAdmin && (
          <div className="p-8 text-center text-red-600">
            <p>Access denied. Admin privileges required.</p>
          </div>
        )}
      </div>

      {/* Identity Verification Modal */}
      {selectedEvent && !user.verified && (
        <IdentityVerification
          isScanningFace={isScanningFace}
          user={user}
          scanProgress={scanProgress}
          handleVerifyIdentity={handleVerifyIdentity}
          selectedEvent={selectedEvent}
          buyTicket={buyTicket}
          processing={processing}
        />
      )}

      {/* Purchase Confirmation Modal */}
      {selectedEvent && user.verified && view !== 'scanner' && (
        <div className="fixed bottom-6 right-6 z-40">
          <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl max-w-sm border border-slate-700">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-emerald-400">Confirm Purchase</h4>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <XCircle size={16} />
              </button>
            </div>
            <p className="text-sm text-slate-300 mb-3">
              Buying <strong>{selectedEvent.title}</strong> for ₹{selectedEvent.price}.
              This ticket will be permanently linked to your verified identity.
            </p>
            <button
              onClick={() => buyTicket(selectedEvent)}
              disabled={processing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed py-2 rounded-lg font-bold text-sm transition-colors"
            >
              {processing ? "Processing..." : "Confirm & Pay"}
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative w-full border-t border-slate-200 bg-white">
        <div className="w-full px-8 py-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            {/* Left side - Links */}
            <div className="flex flex-wrap gap-8 text-sm text-slate-600">
              <a
                href="https://rvce.edu.in/department/ai_ml/main_department/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-emerald-600 font-medium"
              >
                Department of Artificial Intelligence and Machine Learning
              </a>
            </div>

            {/* Right side - Names */}
            <div className="flex gap-12 text-sm text-slate-700">
              <a
                href="https://github.com/theunmeshraj"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:text-emerald-600 transition-colors"
              >
                Unmesh Raj
              </a>
              <p className="font-semibold">Aditya K</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Scan animation styles */}
      <style jsx>{`
        @keyframes scan {
          0% {
            top: 0%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
}