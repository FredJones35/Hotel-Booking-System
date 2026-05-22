import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hotelApi } from '../services/api';
import { fetchAuthSession } from 'aws-amplify/auth';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'hotel' | 'room'>('hotel');
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [hotelForm, setHotelForm] = useState({
    name: '', destination: '', address: '',
    latitude: '', longitude: '', starRating: 5,
    amenities: '', description: '', imageUrl: '', adminEmail: '',
  });
  const [roomForm, setRoomForm] = useState({
    hotelId: '', roomType: 'STANDARD', roomNumber: '',
    capacity: 2, pricePerNight: '', availableFrom: '', availableTo: '',
  });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAuthSession()
      .then(session => {
        const groups = (session.tokens?.idToken?.payload?.['cognito:groups'] as string[]) || [];
        if (groups.includes('ADMIN')) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
          navigate('/');
        }
      })
      .catch(() => { setAuthorized(false); navigate('/'); });
  }, [navigate]);

  if (authorized === null) return <div className="flex justify-center p-20 text-gray-500">Checking permissions...</div>;
  if (!authorized) return null;

  const handleCreateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      const res = await hotelApi.createHotel({
        ...hotelForm,
        latitude: hotelForm.latitude ? Number(hotelForm.latitude) : undefined,
        longitude: hotelForm.longitude ? Number(hotelForm.longitude) : undefined,
      });
      setMsg(`Hotel created! ID: ${res.data.id}`);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Failed to create hotel');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      await hotelApi.addRoom(Number(roomForm.hotelId), {
        roomType: roomForm.roomType,
        roomNumber: roomForm.roomNumber,
        capacity: roomForm.capacity,
        pricePerNight: Number(roomForm.pricePerNight),
        availableFrom: roomForm.availableFrom || undefined,
        availableTo: roomForm.availableTo || undefined,
      });
      setMsg('Room added successfully!');
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Failed to add room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab('hotel')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${tab === 'hotel' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700'}`}
        >
          Add Hotel
        </button>
        <button
          onClick={() => setTab('room')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${tab === 'room' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700'}`}
        >
          Add Room
        </button>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${msg.includes('created') || msg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg}
        </div>
      )}

      {tab === 'hotel' ? (
        <form onSubmit={handleCreateHotel} className="bg-white rounded-xl p-6 shadow-sm border space-y-4">
          <h2 className="font-bold text-lg text-gray-900">Create New Hotel</h2>
          <div className="grid grid-cols-2 gap-4">
            <input value={hotelForm.name} onChange={e => setHotelForm({...hotelForm, name: e.target.value})} placeholder="Hotel Name *" required className="border rounded-lg px-3 py-2 col-span-2" />
            <input value={hotelForm.destination} onChange={e => setHotelForm({...hotelForm, destination: e.target.value})} placeholder="Destination *" required className="border rounded-lg px-3 py-2" />
            <input value={hotelForm.address} onChange={e => setHotelForm({...hotelForm, address: e.target.value})} placeholder="Address" className="border rounded-lg px-3 py-2" />
            <input type="number" value={hotelForm.latitude} onChange={e => setHotelForm({...hotelForm, latitude: e.target.value})} placeholder="Latitude" className="border rounded-lg px-3 py-2" step="any" />
            <input type="number" value={hotelForm.longitude} onChange={e => setHotelForm({...hotelForm, longitude: e.target.value})} placeholder="Longitude" className="border rounded-lg px-3 py-2" step="any" />
            <select value={hotelForm.starRating} onChange={e => setHotelForm({...hotelForm, starRating: Number(e.target.value)})} className="border rounded-lg px-3 py-2">
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Stars</option>)}
            </select>
            <input value={hotelForm.adminEmail} onChange={e => setHotelForm({...hotelForm, adminEmail: e.target.value})} placeholder="Admin Email" type="email" className="border rounded-lg px-3 py-2" />
            <textarea value={hotelForm.amenities} onChange={e => setHotelForm({...hotelForm, amenities: e.target.value})} placeholder="Amenities (WiFi, Pool, Gym...)" className="border rounded-lg px-3 py-2 col-span-2" rows={2} />
            <textarea value={hotelForm.description} onChange={e => setHotelForm({...hotelForm, description: e.target.value})} placeholder="Description" className="border rounded-lg px-3 py-2 col-span-2" rows={3} />
            <input value={hotelForm.imageUrl} onChange={e => setHotelForm({...hotelForm, imageUrl: e.target.value})} placeholder="Image URL" className="border rounded-lg px-3 py-2 col-span-2" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Hotel'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleAddRoom} className="bg-white rounded-xl p-6 shadow-sm border space-y-4">
          <h2 className="font-bold text-lg text-gray-900">Add Room to Hotel</h2>
          <div className="grid grid-cols-2 gap-4">
            <input value={roomForm.hotelId} onChange={e => setRoomForm({...roomForm, hotelId: e.target.value})} placeholder="Hotel ID *" required className="border rounded-lg px-3 py-2" />
            <select value={roomForm.roomType} onChange={e => setRoomForm({...roomForm, roomType: e.target.value})} className="border rounded-lg px-3 py-2">
              {['STANDARD','FAMILY','SUITE','DELUXE'].map(t => <option key={t}>{t}</option>)}
            </select>
            <input value={roomForm.roomNumber} onChange={e => setRoomForm({...roomForm, roomNumber: e.target.value})} placeholder="Room Number" className="border rounded-lg px-3 py-2" />
            <input type="number" value={roomForm.capacity} onChange={e => setRoomForm({...roomForm, capacity: Number(e.target.value)})} placeholder="Capacity" min={1} className="border rounded-lg px-3 py-2" />
            <input type="number" value={roomForm.pricePerNight} onChange={e => setRoomForm({...roomForm, pricePerNight: e.target.value})} placeholder="Price Per Night *" required min={1} step="0.01" className="border rounded-lg px-3 py-2" />
            <div></div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Available From</label>
              <input type="date" value={roomForm.availableFrom} onChange={e => setRoomForm({...roomForm, availableFrom: e.target.value})} className="border rounded-lg px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Available To</label>
              <input type="date" value={roomForm.availableTo} onChange={e => setRoomForm({...roomForm, availableTo: e.target.value})} className="border rounded-lg px-3 py-2 w-full" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium disabled:opacity-50">
            {loading ? 'Adding...' : 'Add Room'}
          </button>
        </form>
      )}
    </div>
  );
}
