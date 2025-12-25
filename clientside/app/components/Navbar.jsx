import { Wallet, ShieldCheck } from "lucide-react";

export function Navbar({ view, setView }) {
  return (
    <nav className="bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 border-b border-slate-700">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setView("marketplace")}
      >
        <ShieldCheck className="text-emerald-400" size={26} />
        <span className="font-bold text-lg">
          Satya<span className="text-emerald-400">Ticketing</span>
        </span>
      </div>

      <div className="flex gap-2 text-sm">
        <button
          onClick={() => setView("marketplace")}
          className={`px-3 py-1 rounded-full ${
            view === "marketplace"
              ? "bg-slate-700"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Events
        </button>

        <button
          onClick={() => setView("wallet")}
          className={`px-3 py-1 rounded-full ${
            view === "wallet"
              ? "bg-slate-700"
              : "text-slate-400 hover:text-white"
          }`}
        >
          My Tickets
        </button>

        <button
          onClick={() => setView("balance")}
          className={`px-3 py-1 rounded-full flex items-center gap-1 ${
            view === "balance"
              ? "bg-emerald-600 text-white"
              : "bg-slate-800 text-emerald-400"
          }`}
        >
          <Wallet size={14} />
          Balance
        </button>

        <button
          onClick={() => setView("dashboard")}
          className={`px-3 py-1 rounded-full ${
            view === "dashboard"
              ? "bg-slate-700"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Ledger
        </button>
      </div>
    </nav>
  );
}
