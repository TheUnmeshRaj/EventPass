import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  QrCode, 
  Fingerprint, 
  Ticket, 
  RefreshCcw, 
  Search, 
  Lock, 
  Activity, 
  UserCheck, 
  CheckCircle, 
  XCircle,
  MapPin,
  Calendar,
  IndianRupee
} from 'lucide-react';

// --- MOCK DATA & UTILS ---

const EVENTS = [
  {
    id: 1,
    title: "IPL Final 2025: CSK vs MI",
    location: "Wankhede Stadium, Mumbai",
    date: "2025-05-28",
    price: 3500,
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800",
    category: "Sports",
    available: 120
  },
  {
    id: 2,
    title: "Arijit Singh: Soulful Night",
    location: "JLN Stadium, Delhi",
    date: "2025-06-15",
    price: 2500,
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800",
    category: "Music",
    available: 45
  },
  {
    id: 3,
    title: "Sunburn Arena: Martin Garrix",
    location: "Vagator Beach, Goa",
    date: "2025-12-29",
    price: 4000,
    image: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&q=80&w=800",
    category: "Festival",
    available: 10
  }
];

const INITIAL_LEDGER = [
  { hash: "0x9a1...e4", type: "GENESIS", details: "Ticket Contract Deployed", timestamp: Date.now() - 1000000 }
];

// Simple pseudo-hash generator for demo
const generateHash = (data) => {
  let hash = 0, i, chr;
  if (data.length === 0) return hash;
  for (i = 0; i < data.length; i++) {
    chr = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; 
  }
  return "0x" + Math.abs(hash).toString(16) + Math.random().toString(16).substr(2, 8);
};



function Marketplace({ setSelectedEvent }) {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Upcoming Events</h2>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
          <Search size={18} className="text-slate-400" />
          <input type="text" placeholder="Search events..." className="outline-none text-sm w-48" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {EVENTS.map(event => (
          <div key={event.id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-slate-100">
            <div className="h-48 overflow-hidden relative">
              <img src={event.image} alt={event.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-3 right-3 bg-slate-900/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                {event.category}
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-lg mb-1">{event.title}</h3>
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <MapPin size={14} /> {event.location}
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
                <Calendar size={14} /> {event.date}
              </div>
              <div className="flex justify-between items-center border-t pt-4">
                <div className="font-bold text-lg text-emerald-700 flex items-center">
                  <IndianRupee size={16} /> {event.price}
                </div>
                <button 
                  onClick={() => setSelectedEvent(event)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IdentityVerification({ isScanningFace, user, scanProgress, handleVerifyIdentity, selectedEvent, buyTicket, processing }) {
  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
        {!isScanningFace && !user.verified ? (
          <>
            <div className="text-center mb-6">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Fingerprint size={32} className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">One-Time Verification</h3>
              <p className="text-slate-500 text-sm mt-2">
                To prevent fraud, tickets are linked to your biometrics. We only store a secure hash, never your image.
              </p>
            </div>
          
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Government ID (Aadhaar/PAN)</label>
                <div className="flex items-center gap-2 mt-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <ShieldCheck size={18} className="text-slate-400" />
                  <span className="font-mono text-slate-700">{user.id}</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded ml-auto">Linked</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleVerifyIdentity}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Fingerprint size={20} /> Scan Biometrics to Verify
            </button>
          </>
        ) : isScanningFace ? (
          <div className="text-center py-8">
            <div className="relative w-32 h-32 mx-auto mb-6 rounded-full border-4 border-slate-100 overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-b from-emerald-500/20 to-transparent animate-pulse"></div>
              <div 
                className="absolute left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] transition-all duration-200"
                style={{ top: `${scanProgress}%` }}
              ></div>
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="face" className="w-full h-full object-cover opacity-50" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 animate-pulse">Generating Biometric Hash...</h3>
            <p className="text-sm text-slate-500 mt-2">Mapping facial landmarks to blockchain identity</p>
          </div>
        ) : (
          <div className="text-center py-6">
            <CheckCircle size={64} className="text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900">Identity Verified</h3>
            <p className="text-sm text-slate-500 mb-6">Your biometric hash: <span className="font-mono text-xs bg-slate-100 p-1 rounded">{user.bioHash?.substring(0, 16)}...</span></p>
            <button 
              onClick={() => {
                if (selectedEvent) buyTicket(selectedEvent);
              }}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold"
            >
              {processing ? "Minting Ticket..." : `Confirm Purchase (₹${selectedEvent?.price})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Wallet({ myTickets, resellTicket, setView }) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">My Secure Tickets</h2>
      {myTickets.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <Ticket size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">You haven't purchased any tickets yet.</p>
          <button onClick={() => setView('marketplace')} className="mt-4 text-emerald-600 font-medium hover:underline">Browse Events</button>
        </div>
      ) : (
        <div className="space-y-6">
          {myTickets.map(ticket => (
            <div key={ticket.id} className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden flex flex-col md:flex-row">
              {/* Ticket Left: Visuals */}
              <div className="md:w-1/3 bg-slate-900 p-6 text-white relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/20 rounded-full blur-xl"></div>
                <div className="relative z-10">
                  <h3 className="font-bold text-xl mb-1">{ticket.event.title}</h3>
                  <p className="text-slate-400 text-sm mb-4">{ticket.event.date}</p>
                  <div className="mt-8 border-t border-slate-700 pt-4">
                     <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Owner</div>
                     <div className="font-medium flex items-center gap-2">
                       {ticket.owner} 
                       <ShieldCheck size={14} className="text-emerald-400" />
                     </div>
                  </div>
                </div>
              </div>
            
              {/* Ticket Right: QR & Actions */}
              <div className="md:w-2/3 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col items-center">
                  <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-inner">
                    <QrCode size={120} className="text-slate-900" />
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-2">{ticket.id}</div>
                </div>
              
                <div className="flex-1 space-y-3 w-full">
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <div className="flex items-center gap-2 text-emerald-800 font-medium text-sm mb-1">
                      <Lock size={14} /> Anti-Scalp Lock Active
                    </div>
                    <p className="text-xs text-emerald-600">
                      This ticket is bound to your biometric hash. Resale is only permitted at face value (₹{ticket.event.price}) through this platform.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                      <Activity size={16} /> View History
                    </button>
                    <button 
                      onClick={() => resellTicket(ticket)}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <RefreshCcw size={16} /> Resell Ticket
                    </button>
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

function Dashboard({ ledger }) {
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
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  block.type === 'MINT' ? 'bg-emerald-900 text-emerald-400' : 
                  block.type === 'BURN' ? 'bg-red-900 text-red-400' : 'bg-blue-900 text-blue-400'
                }`}>
                  {block.type}
                </span>
              </div>
              <div className="w-48 text-slate-500 truncate pr-4">{block.hash}</div>
              <div className="flex-1">
                {block.type === 'MINT' && (
                  <span>
                    Minted <span className="text-white">{block.details.ticketId}</span> for <span className="text-emerald-400">₹{block.details.price}</span> to {block.details.buyer}
                  </span>
                )}
                {block.type === 'BURN' && (
                   <span>
                   Ticket <span className="text-white">{block.details.ticketId}</span> returned by {block.details.prevOwner}
                 </span>
                )}
                {block.type === 'GENESIS' && <span>System Initialized</span>}
              </div>
              <div className="w-40 text-right text-slate-500 text-xs">
                {new Date(block.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VenueScanner({ processing, scanResult, myTickets, simulateScan, setProcessing, setScanResult }) {
  return (
    <div className="flex flex-col h-[calc(100vh-70px)] bg-black">
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Camera UI Overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border-2 border-emerald-500 rounded-3xl relative bg-white/5 backdrop-blur-sm">
            <div className="absolute inset-0 border-t-4 border-emerald-500 animate-scan opacity-50"></div>
          
            {/* Simulated Result UI */}
            {scanResult === 'valid' && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-500/90 text-white rounded-2xl animate-in zoom-in duration-200">
                 <CheckCircle size={64} className="mb-2" />
                 <h2 className="text-2xl font-bold">ACCESS GRANTED</h2>
                 <p className="text-sm opacity-90">Biometric Match Confirmed</p>
               </div>
            )}
             {scanResult === 'mismatch' && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-orange-500/90 text-white rounded-2xl animate-in zoom-in duration-200">
                 <UserCheck size={64} className="mb-2" />
                 <h2 className="text-2xl font-bold">ID MISMATCH</h2>
                 <p className="text-sm opacity-90">Biometrics do not match ticket owner</p>
               </div>
            )}
             {scanResult === 'invalid' && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/90 text-white rounded-2xl animate-in zoom-in duration-200">
                 <XCircle size={64} className="mb-2" />
                 <h2 className="text-2xl font-bold">INVALID TICKET</h2>
                 <p className="text-sm opacity-90">Ticket inactive or fake</p>
               </div>
            )}
          </div>
          <p className="text-slate-400 mt-8 font-mono text-sm animate-pulse">
            {processing ? "Verifying Blockchain Proof..." : "Align QR Code & Face"}
          </p>
        </div>

        {/* Background Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-slate-800 via-black to-black"></div>
      </div>

      {/* Control Panel for Simulation */}
      <div className="h-1/3 bg-slate-900 border-t border-slate-800 p-6">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Lock size={16} className="text-emerald-500" /> Security Control Panel
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <p className="text-slate-400 text-xs mb-2">
            In a real deployment, this is automated via camera. For this demo, select a scenario:
          </p>
          <div className="flex gap-4">
            {myTickets.length > 0 ? (
              <>
                <button 
                  onClick={() => simulateScan(myTickets[0])}
                  disabled={processing}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium text-sm"
                >
                  Scan Valid User Ticket
                </button>
                 <button 
                  onClick={() => {
                    setProcessing(true);
                    setTimeout(() => { setScanResult('mismatch'); setProcessing(false); }, 1500);
                  }}
                  disabled={processing}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium text-sm"
                >
                  Simulate ID Mismatch (Scalper)
                </button>
              </>
            ) : (
              <div className="w-full text-center text-slate-500 py-4 bg-slate-800 rounded-lg border border-dashed border-slate-700">
                Purchase a ticket in the Marketplace to test the scanner.
              </div>
            )}
          </div>
        
          {scanResult && (
            <button onClick={() => setScanResult(null)} className="text-slate-400 hover:text-white text-sm mt-2 underline">
              Reset Scanner
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Ticketing() {
  // --- STATE ---
  const [view, setView] = useState('marketplace'); // marketplace, wallet, scanner, dashboard
  const [user, setUser] = useState({ name: "Aditya Kumar", verified: false, id: "IND-9876", bioHash: null });
  const [ledger, setLedger] = useState(INITIAL_LEDGER);
  const [myTickets, setMyTickets] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState(null); // 'valid', 'invalid', 'mismatch'
  
  // Mock Biometric Capture State
  const [isScanningFace, setIsScanningFace] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // --- EFFECTS for Animation/Simulation ---

  // Handle Face Scan Animation
  useEffect(() => {
    let interval;
    if (isScanningFace) {
      interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) return 100;
          return prev + 5; // Slower increment for smoother animation
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isScanningFace]);

  // Handle Scan Completion
  useEffect(() => {
    if (isScanningFace && scanProgress >= 100) {
      const timer = setTimeout(() => {
        const bioHash = generateHash("FACE_DATA_" + user.id);
        setUser(prev => ({ ...prev, verified: true, bioHash }));
        setIsScanningFace(false);
        setScanProgress(0);
      }, 500); // Small delay at 100%
      return () => clearTimeout(timer);
    }
  }, [scanProgress, isScanningFace, user.id]);

  // --- ACTIONS 
  // Hooked ledger appender (keeps impure calls out of render scope)
  const addToLedger = useMemo(() => createAddToLedger(setLedger), [setLedger]);

  const handleVerifyIdentity = () => {
    setScanProgress(0);
    setIsScanningFace(true);
  };

  const buyTicket = async (event) => {
    if (!user.verified) {
      alert("Please verify your identity (KYC) before purchasing.");
      return;
    }

    setProcessing(true);
    
    await new Promise(r => setTimeout(r, 1500));

    const ticketId = generateTicketId();
    // const ownershipHash = generateHash(user.bioHash + ticketId); 

    const txHash = addToLedger("MINT", {
      action: "PURCHASE",
      eventId: event.id,
      buyer: user.name,
      buyerId: user.id,
      price: event.price,
      ticketId: ticketId
    });

    const newTicket = {
      id: ticketId,
      event: event,
      owner: user.name,
      ownerId: user.id,
      bioHash: user.bioHash, // Linked to biometric
      txHash: txHash,
      status: 'ACTIVE',
      purchaseDate: new Date().toISOString()
    };

    setMyTickets(prev => [...prev, newTicket]);
    setProcessing(false);
    setSelectedEvent(null);
    setView('wallet');
  };

  const resellTicket = async (ticket) => {
    if (!window.confirm(`Confirm resale of ${ticket.id}? This will be sold at face value (₹${ticket.event.price}) back to the pool.`)) return;

    setProcessing(true);
    await new Promise(r => setTimeout(r, 1500));

    addToLedger("BURN", {
      action: "RESALE_RETURN",
      ticketId: ticket.id,
      prevOwner: user.name,
      reason: "User Initiated Return"
    });

    setMyTickets(prev => prev.filter(t => t.id !== ticket.id));
    setProcessing(false);
    alert("Ticket returned to pool. Refund processed to source.");
  };

  const simulateScan = (ticket) => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      // Logic: Verification happens by comparing the Ticket's stored BioHash with the Present Person's BioHash
      // In this simulation, we assume the 'present person' is the logged in user.
      
      if (ticket.status !== 'ACTIVE') {
        setScanResult('invalid');
      } else if (ticket.bioHash === user.bioHash) {
        setScanResult('valid');
      } else {
        setScanResult('mismatch'); // Biometric mismatch
      }
    }, 1500);
  };

  // (subcomponents declared at top-level above)

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar view={view} setView={setView} />
      
      {view === 'marketplace' && <Marketplace setSelectedEvent={setSelectedEvent} />}
      {view === 'wallet' && <Wallet myTickets={myTickets} resellTicket={resellTicket} setView={setView} />}
      {view === 'dashboard' && <Dashboard ledger={ledger} />}
      {view === 'scanner' && <VenueScanner processing={processing} scanResult={scanResult} myTickets={myTickets} simulateScan={simulateScan} setProcessing={setProcessing} setScanResult={setScanResult} />}

      {selectedEvent && !user.verified && (
        <IdentityVerification isScanningFace={isScanningFace} user={user} scanProgress={scanProgress} handleVerifyIdentity={handleVerifyIdentity} selectedEvent={selectedEvent} buyTicket={buyTicket} processing={processing} />
      )}

      {selectedEvent && user.verified && view !== 'scanner' && (
        <div className="fixed bottom-6 right-6 z-40">
           <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl max-w-sm border border-slate-700">
             <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-emerald-400">Confirm Purchase</h4>
                <button onClick={() => setSelectedEvent(null)} className="text-slate-500 hover:text-white"><XCircle size={16}/></button>
             </div>
             <p className="text-sm text-slate-300 mb-3">
               Buying <strong>{selectedEvent.title}</strong> for ₹{selectedEvent.price}. 
               This ticket will be permanently linked to ID <strong>{user.id}</strong>.
             </p>
             <button 
                onClick={() => buyTicket(selectedEvent)}
                disabled={processing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 py-2 rounded-lg font-bold text-sm transition-colors"
             >
               {processing ? "Minting on Chain..." : "Confirm & Pay"}
             </button>
           </div>
        </div>
      )}
      
      {/* Use dangerouslySetInnerHTML for global styles in this sandbox env */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}} />
    </div>
  );
}