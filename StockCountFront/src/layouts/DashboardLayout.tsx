import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { logout } from '@/redux/authSlice';
import { Button } from '@/components/ui/button';
import { authAPI } from '@/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Stock Count</h2>
          <p className="text-sm text-gray-600">{user?.fullName}</p>
          <p className="text-xs text-gray-500">{user?.role}</p>
        </div>

        <nav className="p-4 space-y-2">
          <Link to="/" className="block px-4 py-2 rounded hover:bg-gray-100">
            Dashboard
          </Link>
          
          <Link to="/scan-count" className="block px-4 py-2 rounded hover:bg-gray-100">
            Scan ใบนับ
          </Link>

          <div className="pt-2">
            <p className="px-4 py-2 text-sm font-semibold text-gray-600">Master Data</p>
            <Link to="/master/warehouse" className="block px-4 py-2 pl-8 rounded hover:bg-gray-100">
              Warehouse
            </Link>
            <Link to="/master/bin-location" className="block px-4 py-2 pl-8 rounded hover:bg-gray-100">
              Bin Location
            </Link>
            <Link to="/master/bin-mapping" className="block px-4 py-2 pl-8 rounded hover:bg-gray-100">
              Bin Mapping
            </Link>
          </div>

          <Link to="/scan-bin-mapping" className="block px-4 py-2 rounded hover:bg-gray-100">
            Scan Bin Mapping
          </Link>

          {isAdmin && (
            <div className="pt-2">
              <p className="px-4 py-2 text-sm font-semibold text-gray-600">Admin</p>
              <Link to="/admin/users" className="block px-4 py-2 pl-8 rounded hover:bg-gray-100">
                User Management
              </Link>
            </div>
          )}

          <div className="pt-4">
            <Button onClick={handleLogout} variant="outline" className="w-full">
              Logout
            </Button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
