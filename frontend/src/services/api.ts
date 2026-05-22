import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(async (config) => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Not authenticated
  }
  return config;
});

export async function getToken(): Promise<string> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || '';
  } catch {
    return '';
  }
}

export const hotelApi = {
  search: (params: {
    destination: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    page?: number;
    size?: number;
  }) => api.get('/api/v1/hotels/search', { params }),

  getById: (id: number) => api.get(`/api/v1/hotels/${id}`),

  createBooking: (body: {
    hotelId: number;
    roomId: number;
    checkIn: string;
    checkOut: string;
    guestCount: number;
  }) => api.post('/api/v1/bookings', body),

  getMyBookings: (page = 0, size = 10) =>
    api.get('/api/v1/bookings/my', { params: { page, size } }),

  getBooking: (id: number) => api.get(`/api/v1/bookings/${id}`),

  getComments: (hotelId: string, page = 0, size = 10) =>
    api.get(`/api/v1/comments/hotel/${hotelId}`, { params: { page, size } }),

  getCommentStats: (hotelId: string) =>
    api.get(`/api/v1/comments/hotel/${hotelId}/stats`),

  addComment: (body: {
    hotelId: string;
    userName: string;
    overallRating: number;
    categoryRatings?: Record<string, number>;
    comment?: string;
    stayDuration?: string;
  }) => api.post('/api/v1/comments', body),

  chat: (message: string, conversationHistory: unknown[], userToken: string) =>
    api.post('/api/v1/ai/chat', { message, conversationHistory, userToken }),

  // Admin
  createHotel: (body: unknown) => api.post('/api/v1/admin/hotels', body),
  updateHotel: (id: number, body: unknown) => api.put(`/api/v1/admin/hotels/${id}`, body),
  addRoom: (hotelId: number, body: unknown) => api.post(`/api/v1/admin/hotels/${hotelId}/rooms`, body),
};

export default api;
