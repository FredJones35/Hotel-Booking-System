import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { hotelApi } from '../services/api';
import CommentStats from '../components/CommentStats';
import { authService } from '../services/auth';

interface Room {
  id: number;
  roomType: string;
  roomNumber: string;
  capacity: number;
  pricePerNight: number;
  discountedPrice: number;
  status: string;
  availableFrom: string;
  availableTo: string;
}

interface Hotel {
  id: number;
  name: string;
  destination: string;
  address: string;
  starRating?: number;
  amenities?: string;
  description?: string;
  imageUrl?: string;
}

interface Comment {
  id: string;
  userName: string;
  overallRating: number;
  comment: string;
  stayDuration: string;
  createdAt: string;
}

export default function HotelDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || today);
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || tomorrow);
  const [guests, setGuests] = useState(Number(searchParams.get('guests')) || 1);

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [stats, setStats] = useState<Parameters<typeof CommentStats>[0]['stats'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingRoom, setBookingRoom] = useState<number | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMsg, setBookingMsg] = useState('');
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    authService.isAuthenticated().then(setIsAuth);
    const load = async () => {
      try {
        const [hotelRes, roomsRes, commentsRes, statsRes] = await Promise.all([
          hotelApi.getById(Number(id)),
          hotelApi.getRooms(Number(id), checkIn || undefined, checkOut || undefined, guests || 1),
          hotelApi.getComments(id!, 0, 5),
          hotelApi.getCommentStats(id!),
        ]);
        setHotel(hotelRes.data);
        setRooms(roomsRes.data || []);
        setComments(commentsRes.data.data || []);
        setStats(statsRes.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleBook = async (roomId: number) => {
    if (!isAuth) { navigate('/login'); return; }
    setBookingLoading(true);
    setBookingMsg('');
    try {
      await hotelApi.createBooking({
        hotelId: Number(id),
        roomId,
        checkIn,
        checkOut,
        guestCount: guests,
      });
      setBookingMsg('Booking confirmed! Check "My Bookings" for details.');
      setBookingRoom(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Booking failed';
      setBookingMsg(msg);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20 text-gray-500">Loading...</div>;
  if (!hotel) return <div className="text-center p-20 text-gray-500">Hotel not found</div>;

  const stars = '★'.repeat(hotel.starRating || 0) + '☆'.repeat(5 - (hotel.starRating || 0));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {hotel.imageUrl ? (
        <img src={hotel.imageUrl} alt={hotel.name} className="w-full h-72 object-cover rounded-2xl mb-6" />
      ) : (
        <div className="w-full h-72 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl mb-6 flex items-center justify-center">
          <span className="text-8xl">🏨</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold text-gray-900">{hotel.name}</h1>
          <p className="text-yellow-500 text-lg mt-1">{stars}</p>
          <p className="text-gray-600 mt-1">📍 {hotel.address || hotel.destination}</p>
          {hotel.description && <p className="text-gray-700 mt-4">{hotel.description}</p>}
          {hotel.amenities && (
            <div className="mt-4">
              <h3 className="font-semibold text-gray-900 mb-2">Amenities</h3>
              <p className="text-gray-600 text-sm">{hotel.amenities}</p>
            </div>
          )}

          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Available Rooms</h3>

            {/* Date / guest picker */}
            <div className="flex flex-wrap gap-3 mb-4 p-4 bg-gray-50 rounded-xl border">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Check-in</label>
                <input type="date" value={checkIn} min={today}
                  onChange={e => setCheckIn(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Check-out</label>
                <input type="date" value={checkOut} min={checkIn}
                  onChange={e => setCheckOut(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Guests</label>
                <input type="number" min={1} max={10} value={guests}
                  onChange={e => setGuests(Number(e.target.value))}
                  className="border rounded-lg px-3 py-2 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {bookingMsg && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${bookingMsg.includes('confirmed') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {bookingMsg}
              </div>
            )}
            {rooms.length === 0 ? (
              <p className="text-gray-500">No rooms available for the selected dates.</p>
            ) : (
              <div className="space-y-4">
                {rooms.map(room => (
                  <div key={room.id} className="border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{room.roomType} {room.roomNumber && `#${room.roomNumber}`}</p>
                      <p className="text-sm text-gray-500">Up to {room.capacity} guests</p>
                      {room.availableFrom && (
                        <p className="text-xs text-gray-400">{room.availableFrom} → {room.availableTo}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {isAuth && room.discountedPrice < room.pricePerNight ? (
                        <>
                          <p className="text-xs text-gray-400 line-through">₺{room.pricePerNight}</p>
                          <p className="text-lg font-bold text-green-600">₺{room.discountedPrice.toFixed(0)}/night</p>
                        </>
                      ) : (
                        <p className="text-lg font-bold text-gray-900">₺{room.pricePerNight}/night</p>
                      )}
                      {bookingRoom === room.id ? (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleBook(room.id)}
                            disabled={bookingLoading}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                          >
                            {bookingLoading ? 'Booking...' : 'Confirm'}
                          </button>
                          <button onClick={() => setBookingRoom(null)} className="border px-3 py-1 rounded text-sm">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setBookingRoom(room.id)}
                          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                        >
                          Book
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Guest Comments</h3>
            {comments.length === 0 ? (
              <p className="text-gray-500">No comments yet.</p>
            ) : (
              <div className="space-y-4">
                {comments.map(c => (
                  <div key={c.id} className="border rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-gray-900">{c.userName}</p>
                      <span className="bg-blue-600 text-white text-sm px-2 py-0.5 rounded">
                        {c.overallRating}/10
                      </span>
                    </div>
                    {c.comment && <p className="text-gray-700 mt-2 text-sm">{c.comment}</p>}
                    {c.stayDuration && <p className="text-xs text-gray-400 mt-1">Stay: {c.stayDuration}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          {stats && <CommentStats stats={stats} />}
        </div>
      </div>
    </div>
  );
}
