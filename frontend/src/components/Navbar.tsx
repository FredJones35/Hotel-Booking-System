import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

export default function Navbar() {
  const [user, setUser] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    authService.getCurrentUser()
      .then(u => setUser(u.username))
      .catch(() => setUser(null));
  }, []);

  const handleSignOut = async () => {
    await authService.signOut();
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold">🏨 HotelBook</Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/my-bookings" className="hover:text-blue-200 text-sm">My Bookings</Link>
              <Link to="/admin" className="hover:text-blue-200 text-sm">Admin</Link>
              <span className="text-sm text-blue-200">{user}</span>
              <button
                onClick={handleSignOut}
                className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
