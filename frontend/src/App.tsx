import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import HotelDetail from './pages/HotelDetail';
import AdminPanel from './pages/AdminPanel';
import LoginPage from './pages/LoginPage';
import MyBookings from './pages/MyBookings';
import AIChatWindow from './components/AIChatWindow';
import Navbar from './components/Navbar';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/hotels/:id" element={<HotelDetail />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <AIChatWindow />
      </div>
    </BrowserRouter>
  );
}

export default App;
