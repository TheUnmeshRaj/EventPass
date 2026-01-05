import React from 'react';

const formatUnknownDetails = (details) => {
  if (!details) return 'Details unavailable';
  if (typeof details === 'string') return details;

  return Object.entries(details)
    .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
    .join(' • ');
};

const looksLikeLedgerUserId = (value) => typeof value === 'string' && value.includes('-');

const resolveLedgerUser = (value, userLookup) => {
  if (!value) return null;
  if (typeof value !== 'string') return value;
  if (!looksLikeLedgerUserId(value)) return value;
  return userLookup?.[value] || value;
};

export function Ledger({ ledger = [], loading = false, userLookup = {} }) {
  const renderDetails = (block) => {
    const details = block?.details;

    if (!details) {
      return <span className="text-slate-500">Details unavailable</span>;
    }

    if (typeof details === 'string') {
      return <span>{details}</span>;
    }

    const ticketId = details.ticketId || details.ticket_id;
    const price = details.price ?? details.amount ?? details.refundAmount;
    const buyer = details.buyer || details.buyerId;
    const seller = details.userId || details.sellerId || details.prevOwner;
    const buyerLabel = resolveLedgerUser(buyer, userLookup) || buyer;
    const sellerLabel = resolveLedgerUser(seller, userLookup) || seller;
    const balanceUserLabel = resolveLedgerUser(details.userId || details.user_id, userLookup);

    switch (block.type) {
      case 'MINT':
      case 'ONCHAIN_MINT':
        return (
          <span>
            Minted <span className="text-white">{ticketId || 'ticket'}</span>
            {buyerLabel && <> for {buyerLabel}</>}
            {price && <> at <span className="text-emerald-400">₹{price}</span></>}
            {details.txHash && <> (tx: <span className="text-slate-400">{details.txHash}</span>)</>}
          </span>
        );
      case 'BURN':
        return (
          <span>
            Ticket <span className="text-white">{ticketId || 'ticket'}</span> returned by {sellerLabel || 'user'}
          </span>
        );
      case 'TICKET_RESALE':
        return (
          <span>
            Ticket <span className="text-white">{ticketId || 'ticket'}</span> resold by {sellerLabel || 'user'} for{' '}
            <span className="text-emerald-400">₹{price}</span>
          </span>
        );
      case 'BALANCE_UPDATE':
        return (
          <span>
            Balance {details.delta >= 0 ? 'credit' : 'debit'} for {balanceUserLabel || 'user'}{' '}
            <span className="text-emerald-400">₹{Math.abs(details.delta || 0)}</span>
            {details.reason && <> ({details.reason})</>}
          </span>
        );
      case 'GENESIS':
        return <span>System initialized</span>;
      default:
        return <span className="text-slate-400">{formatUnknownDetails(details)}</span>;
    }
  };

  const renderTimestamp = (timestamp) => {
    if (!timestamp) return '--';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleString();
  };

  const renderShell = (message) => (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Blockchain Ledger</h2>
        <p className="text-slate-500">Immutable record of all ticketing events. Transparency is key.</p>
      </div>
      <div className="bg-slate-900 rounded-xl p-6 text-center text-slate-400 border border-slate-700">
        <p>{message}</p>
      </div>
    </div>
  );

  if (loading) {
    return renderShell('Loading ledger...');
  }

  if (!ledger.length) {
    return renderShell('No ledger entries available yet.');
  }

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
          <div className="w-48 text-right">Timestamp</div>
        </div>
        <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-800">
          {ledger.map((block, idx) => (
            <div key={block.id || block.hash || idx} className="flex p-4 text-slate-300 hover:bg-slate-800/50 transition-colors">
              <div className="w-32">
                <span className={`px-2 py-1 rounded text-xs font-bold ${block.type === 'MINT' || block.type === 'ONCHAIN_MINT'
                  ? 'bg-emerald-900 text-emerald-400'
                  : block.type === 'BALANCE_UPDATE'
                    ? 'bg-green-900 text-green-400'
                    : 'bg-blue-900 text-blue-400'
                }`}>{block.type}</span>
              </div>
              <div className="w-48 text-slate-500 truncate pr-4">{block.hash}</div>
              <div className="flex-1">{renderDetails(block)}</div>
              <div className="w-48 text-right text-slate-500 text-xs">{renderTimestamp(block.timestamp)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
