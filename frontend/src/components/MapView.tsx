import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Hotel {
  hotelId: number;
  hotelName: string;
  latitude?: number;
  longitude?: number;
  minPrice: number;
  minDiscountedPrice: number;
  discountApplied: boolean;
}

export default function MapView({ hotels }: { hotels: Hotel[] }) {
  const hotelsWithCoords = hotels.filter(h => h.latitude && h.longitude);
  const center: [number, number] = hotelsWithCoords.length > 0
    ? [hotelsWithCoords[0].latitude!, hotelsWithCoords[0].longitude!]
    : [41.0082, 28.9784]; // Istanbul default

  return (
    <div className="rounded-xl overflow-hidden shadow-md h-[600px]">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {hotelsWithCoords.map(hotel => (
          <Marker key={hotel.hotelId} position={[hotel.latitude!, hotel.longitude!]}>
            <Popup>
              <div className="text-sm">
                <strong>{hotel.hotelName}</strong><br />
                {hotel.discountApplied ? (
                  <span className="text-green-600 font-bold">₺{hotel.minDiscountedPrice.toFixed(0)}/night</span>
                ) : (
                  <span>₺{hotel.minPrice.toFixed(0)}/night</span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
