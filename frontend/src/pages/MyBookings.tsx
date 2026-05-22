import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hotelApi } from '../services/api';
import { authService } from '../services/auth';

interface Booking {
  id: number;
  hotelName: string;
  roomId: number;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  totalPrice: number;
  status: string;
  createdAt: string;
}

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    authService.isAuthenticated().then(auth => {
      if (!auth) { navigate('/login'); return; }
      hotelApi.getMyBookings().then(res => {
        setBookings(res.data.data || []);
      }).catch(() => {}).finally(() => setLoading(false));
    });
  }, [navigate]);

  if (loading) return <div className="flex justify-center p-20 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>
      {bookings.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-4">📋</p>
          <p className="text-lg">No bookings yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => (
            <div key={b.id} className="bg-white border rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{b.hotelName}</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {b.checkIn} → {b.checkOut} · {b.guestCount} guests
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {b.status}
                  </span>
                  <p className="text-lg font-bold text-gray-900 mt-2">₺{b.totalPrice.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Booking #{b.id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
