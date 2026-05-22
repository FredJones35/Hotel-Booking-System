import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { hotelApi } from '../services/api';
import HotelCard from '../components/HotelCard';
import MapView from '../components/MapView';

interface SearchResult {
  hotelId: number;
  hotelName: string;
  destination: string;
  address: string;
  latitude?: number;
  longitude?: number;
  starRating?: number;
  description?: string;
  imageUrl?: string;
  availableRooms: {
    id: number;
    roomType: string;
    capacity: number;
    pricePerNight: number;
    discountedPrice: number;
  }[];
  minPrice: number;
  minDiscountedPrice: number;
  discountApplied: boolean;
}

export default function SearchResults() {
  const [params] = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const destination = params.get('destination') || '';
  const checkIn = params.get('checkIn') || '';
  const checkOut = params.get('checkOut') || '';
  const guests = Number(params.get('guests')) || 1;

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await hotelApi.search({ destination, checkIn, checkOut, guests, page, size: 10 });
        setResults(res.data.data || []);
        setTotalPages(res.data.totalPages || 0);
      } catch {
        setError('Failed to search hotels. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    if (destination && checkIn && checkOut) fetchResults();
  }, [destination, checkIn, checkOut, guests, page]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500 text-lg">Searching hotels...</div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Hotels in {destination}
          </h2>
          <p className="text-gray-500 text-sm">{checkIn} → {checkOut} · {guests} guest(s)</p>
        </div>
        <button
          onClick={() => setShowMap(!showMap)}
          className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm hover:bg-gray-50"
        >
          🗺️ {showMap ? 'List View' : 'Haritada Göster'}
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {showMap ? (
        <MapView hotels={results} />
      ) : (
        <>
          {results.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-lg">No hotels found for your search.</p>
              <p className="text-sm">Try a different destination or dates.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map(hotel => (
                <HotelCard
                  key={hotel.hotelId}
                  hotel={hotel}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  guests={guests}
                />
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-600">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
