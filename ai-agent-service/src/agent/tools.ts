import Anthropic from '@anthropic-ai/sdk';

export const tools: Anthropic.Tool[] = [
  {
    name: 'searchHotels',
    description: 'Search available hotels by destination, check-in/out dates, and guest count. Returns a list of hotels with available rooms and pricing.',
    input_schema: {
      type: 'object' as const,
      properties: {
        destination: { type: 'string', description: 'City or region name to search in' },
        checkIn: { type: 'string', description: 'Check-in date in YYYY-MM-DD format' },
        checkOut: { type: 'string', description: 'Check-out date in YYYY-MM-DD format' },
        guests: { type: 'integer', description: 'Number of guests' },
        page: { type: 'integer', description: 'Page number (0-based)', default: 0 },
        size: { type: 'integer', description: 'Page size', default: 5 }
      },
      required: ['destination', 'checkIn', 'checkOut', 'guests']
    }
  },
  {
    name: 'bookHotel',
    description: 'Book a specific hotel room for the authenticated user. The user must be logged in. Always confirm details with the user before calling this tool.',
    input_schema: {
      type: 'object' as const,
      properties: {
        hotelId: { type: 'string', description: 'ID of the hotel' },
        roomId: { type: 'string', description: 'ID of the room to book' },
        checkIn: { type: 'string', description: 'Check-in date in YYYY-MM-DD format' },
        checkOut: { type: 'string', description: 'Check-out date in YYYY-MM-DD format' },
        guestCount: { type: 'integer', description: 'Number of guests' }
      },
      required: ['hotelId', 'roomId', 'checkIn', 'checkOut', 'guestCount']
    }
  },
  {
    name: 'getHotelDetails',
    description: 'Get detailed information about a specific hotel.',
    input_schema: {
      type: 'object' as const,
      properties: {
        hotelId: { type: 'string', description: 'ID of the hotel' }
      },
      required: ['hotelId']
    }
  },
  {
    name: 'getUserBookings',
    description: 'Get the list of bookings for the currently authenticated user.',
    input_schema: {
      type: 'object' as const,
      properties: {
        page: { type: 'integer', description: 'Page number (0-based)', default: 0 },
        size: { type: 'integer', description: 'Page size', default: 10 }
      },
      required: []
    }
  }
];
