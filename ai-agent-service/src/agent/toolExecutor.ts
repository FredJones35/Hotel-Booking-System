import axios from 'axios';
import { config } from '../config';

const HOTEL_SERVICE_URL = config.hotelServiceUrl;

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  userToken: string
): Promise<unknown> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (userToken) {
    headers['Authorization'] = `Bearer ${userToken}`;
  }

  try {
    switch (toolName) {
      case 'searchHotels': {
        const { data } = await axios.get(`${HOTEL_SERVICE_URL}/api/v1/hotels/search`, {
          params: {
            destination: input.destination,
            checkIn: input.checkIn,
            checkOut: input.checkOut,
            guests: input.guests,
            page: input.page ?? 0,
            size: input.size ?? 5
          },
          headers
        });
        return data;
      }

      case 'bookHotel': {
        if (!userToken) {
          throw new Error('Authentication required to make a booking. Please log in first.');
        }
        const { data } = await axios.post(
          `${HOTEL_SERVICE_URL}/api/v1/bookings`,
          {
            hotelId: parseInt(input.hotelId as string),
            roomId: parseInt(input.roomId as string),
            checkIn: input.checkIn,
            checkOut: input.checkOut,
            guestCount: input.guestCount
          },
          { headers }
        );
        return data;
      }

      case 'getHotelDetails': {
        const { data } = await axios.get(
          `${HOTEL_SERVICE_URL}/api/v1/hotels/${input.hotelId}`,
          { headers }
        );
        return data;
      }

      case 'getUserBookings': {
        if (!userToken) {
          throw new Error('Authentication required to view bookings. Please log in first.');
        }
        const { data } = await axios.get(`${HOTEL_SERVICE_URL}/api/v1/bookings/my`, {
          params: { page: input.page ?? 0, size: input.size ?? 10 },
          headers
        });
        return data;
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.message || error.response?.data?.error || error.message;
      throw new Error(`API call failed (${toolName}): ${msg}`);
    }
    throw error;
  }
}
