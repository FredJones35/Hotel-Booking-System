import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [form, setForm] = useState({
    destination: '',
    checkIn: today,
    checkOut: tomorrow,
    guests: 2,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      destination: form.destination,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      guests: String(form.guests),
    });
    navigate(`/search?${params}`);
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-blue-600 to-indigo-700 flex flex-col items-center justify-center px-4">
      <h1 className="text-5xl font-bold text-white mb-2">Find Your Perfect Stay</h1>
      <p className="text-blue-100 text-xl mb-10">Search hotels, compare prices, book instantly</p>

      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
            <input
              type="text"
              value={form.destination}
              onChange={e => setForm({ ...form, destination: e.target.value })}
              placeholder="Istanbul, Ankara, Izmir..."
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
              <input
                type="date"
                value={form.checkIn}
                min={today}
                onChange={e => setForm({ ...form, checkIn: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
              <input
                type="date"
                value={form.checkOut}
                min={form.checkIn}
                onChange={e => setForm({ ...form, checkOut: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
              <input
                type="number"
                min={1}
                max={20}
                value={form.guests}
                onChange={e => setForm({ ...form, guests: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors text-lg"
          >
            Search Hotels
          </button>
        </form>
      </div>
    </div>
  );
}
