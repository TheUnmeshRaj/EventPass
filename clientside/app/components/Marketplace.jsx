'use client';

import React from 'react';
import { ShieldCheck, QrCode, MapPin, Calendar, IndianRupee, Search } from 'lucide-react';

export default function Marketplace({ events, onEventSelect, setView }) {
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
        {events.map(event => (
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
                <button onClick={() => onEventSelect(event)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
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
