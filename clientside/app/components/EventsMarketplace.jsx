import { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Calendar, IndianRupee } from 'lucide-react';
import { getAllEvents, subscribeToEvents } from '../../lib/supabase/database';

export function EventsMarketplace({ setSelectedEvent }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priceSort, setPriceSort] = useState('default'); 
  const [segment, setSegment] = useState('all'); 
  const [upcomingBucket, setUpcomingBucket] = useState('all'); 

  useEffect(() => {
    const fetchEvents = async () => {
      const data = await getAllEvents();
      setEvents(data || []);
      setLoading(false);
    };
    fetchEvents();

    const subscription = subscribeToEvents((payload) => {
      if (payload.eventType === 'INSERT') {
        setEvents(prev => [...prev, payload.new]);
      } else if (payload.eventType === 'UPDATE') {
        setEvents(prev => prev.map(e => e.id === payload.new.id ? payload.new : e));
      } else if (payload.eventType === 'DELETE') {
        setEvents(prev => prev.filter(e => e.id !== payload.old.id));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const matchesSearch = (e) =>
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = (e) => categoryFilter === 'All' || e.category === categoryFilter;

    const daysDiff = (date) => Math.ceil((date - startOfToday) / (1000 * 60 * 60 * 24));

    const inSegment = (e) => {
      const d = new Date(e.date);
      const diff = daysDiff(d);
      if (segment === 'all') return true;
      if (segment === 'past') return diff < 0;
      if (segment === 'current') return diff === 0;
      if (segment === 'upcoming') {
        if (diff <= 0) return false;
        if (upcomingBucket === 'all') return true;
        if (upcomingBucket === 'month') return diff <= 30;
        if (upcomingBucket === 'months') return diff > 30 && diff <= 90;
        if (upcomingBucket === 'year') return diff > 90 && diff <= 365;
        if (upcomingBucket === 'later') return diff > 365;
      }
      return true;
    };

    let list = events.filter(e => matchesSearch(e) && matchesCategory(e) && inSegment(e));

    if (priceSort === 'asc') list = list.sort((a, b) => Number(a.price) - Number(b.price));
    else if (priceSort === 'desc') list = list.sort((a, b) => Number(b.price) - Number(a.price));

    return list;
  }, [events, searchTerm, categoryFilter, priceSort, segment, upcomingBucket]);
  return (
    <div className="px-4 py-6 sm:px-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-4 md:gap-6 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Events</h2>
          <div className="flex items-center gap-2 bg-white px-3 sm:px-4 py-2 rounded-lg shadow-sm border border-slate-200 w-full md:w-auto">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="outline-none text-sm w-full md:w-56"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option>All</option>
              {[...new Set(events.map(ev => ev.category))].filter(Boolean).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <label className="text-sm text-slate-600">Sort</label>
            <select
              value={priceSort}
              onChange={(e) => setPriceSort(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="default">Default</option>
              <option value="asc">Price: Low → High</option>
              <option value="desc">Price: High → Low</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="flex items-center gap-2">
              <button onClick={() => { setSegment('all'); setUpcomingBucket('all'); }} className={`px-3 py-1 rounded ${segment==='all' ? 'bg-slate-900 text-white' : 'bg-white border'}`}>All</button>
              <button onClick={() => { setSegment('past'); setUpcomingBucket('all'); }} className={`px-3 py-1 rounded ${segment==='past' ? 'bg-slate-900 text-white' : 'bg-white border'}`}>Past</button>
              <button onClick={() => { setSegment('current'); setUpcomingBucket('all'); }} className={`px-3 py-1 rounded ${segment==='current' ? 'bg-slate-900 text-white' : 'bg-white border'}`}>Today</button>
              <button onClick={() => { setSegment('upcoming'); setUpcomingBucket('all'); }} className={`px-3 py-1 rounded ${segment==='upcoming' ? 'bg-slate-900 text-white' : 'bg-white border'}`}>Upcoming</button>
            </div>

            {segment === 'upcoming' && (
              <div className="flex items-center gap-2">
                <select value={upcomingBucket} onChange={(e) => setUpcomingBucket(e.target.value)} className="border rounded px-3 py-2 text-sm">
                  <option value="all">All upcoming</option>
                  <option value="month">Coming in 1 month</option>
                  <option value="months">Coming in a few months</option>
                  <option value="year">Coming within a year</option>
                  <option value="later">More than a year</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading events...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-500">No events found. Try adjusting your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEvents.map(event => (
            <div key={event.id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-slate-100">
              <div className="h-48 overflow-hidden relative">
                <img src={event.image} alt={event.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 right-3 bg-slate-900/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">{event.category}</div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg mb-1">{event.title}</h3>
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                  <MapPin size={14} /> {event.location}
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
                  <Calendar size={14} /> {new Date(event.date).toLocaleDateString()}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t pt-4">
                  <div className="font-bold text-lg text-emerald-700 flex items-center">
                    <IndianRupee size={16} /> {event.price}
                  </div>
                  <button
                    onClick={() => setSelectedEvent(event)}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
