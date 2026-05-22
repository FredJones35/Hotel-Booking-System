import { useNavigate } from 'react-router-dom';

interface Room {
  id: number;
  roomType: string;
  capacity: number;
  pricePerNight: number;
  discountedPrice: number;
}

interface HotelCardProps {
  hotel: {
    hotelId: number;
    hotelName: string;
    destination: string;
    address?: string;
    starRating?: number;
    description?: string;
    imageUrl?: string;
    availableRooms: Room[];
    minPrice: number;
    minDiscountedPrice: number;
    discountApplied: boolean;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
}

export default function HotelCard({ hotel, checkIn, checkOut, guests }: HotelCardProps) {
  const navigate = useNavigate();

  const stars = '★'.repeat(hotel.starRating || 0) + '☆'.repeat(5 - (hotel.starRating || 0));

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {hotel.imageUrl ? (
        <img src={hotel.imageUrl} alt={hotel.hotelName} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
          <span className="text-6xl">🏨</span>
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{hotel.hotelName}</h3>
            <p className="text-sm text-gray-500">{hotel.destination}</p>
            <p className="text-yellow-500 text-sm">{stars}</p>
          </div>
          <div className="text-right">
            {hotel.discountApplied && hotel.minPrice !== hotel.minDiscountedPrice ? (
              <>
                <p className="text-xs text-gray-400 line-through">₺{hotel.minPrice.toFixed(0)}</p>
                <p className="text-xl font-bold text-green-600">₺{hotel.minDiscountedPrice.toFixed(0)}</p>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">15% OFF</span>
              </>
            ) : (
              <p className="text-xl font-bold text-gray-900">₺{hotel.minPrice.toFixed(0)}</p>
            )}
            <p className="text-xs text-gray-500">per night</p>
          </div>
        </div>
        {hotel.description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{hotel.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">{hotel.availableRooms.length} room(s) available</span>
          <button
            onClick={() => navigate(`/hotels/${hotel.hotelId}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            View Hotel
          </button>
        </div>
      </div>
    </div>
  );
}
