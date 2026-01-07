import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, IndianRupee } from 'lucide-react';
import { getAllEvents, subscribeToEvents } from '../../lib/supabase/database';

export function EventsMarketplace({ setSelectedEvent }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="px-4 py-6 sm:px-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Upcoming Events</h2>
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
