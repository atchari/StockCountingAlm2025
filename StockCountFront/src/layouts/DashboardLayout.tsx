import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { logout } from '@/redux/authSlice';
import { Button } from '@/components/ui/button';
import { authAPI } from '@/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

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
  
  // Helper function to check if route is active
  const isActive = (path: string) => location.pathname === path;
  const getMenuClass = (path: string, isSubmenu = false) => 
    `block px-4 py-2 ${isSubmenu ? 'pl-8' : ''} rounded transition-colors ${
      isActive(path) 
        ? 'bg-white/20 font-medium' 
        : 'hover:bg-white/10'
    }`;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - ALUMET Orange Theme */}
      <aside className="w-64 bg-linear-to-b from-primary to-alumet-orange-dark shadow-lg text-white flex flex-col">
        <div className="p-4 border-b border-alumet-orange-light flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Stock Count</h2>
          <p className="text-sm text-orange-100">{user?.fullName}</p>
          <p className="text-xs text-orange-200 uppercase">{user?.role}</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <Link to="/" className={getMenuClass('/')}>
            Dashboard
          </Link>
          
          <Link to="/scan-count" className={getMenuClass('/scan-count')}>
            Scan ใบนับ
          </Link>

          <div className="pt-3">
            <p className="px-4 py-2 text-sm font-semibold text-orange-200">Master Data</p>
            <Link to="/master/warehouse" className={getMenuClass('/master/warehouse', true)}>
              Warehouse
            </Link>
            <Link to="/master/bin-location" className={getMenuClass('/master/bin-location', true)}>
              Bin Location
            </Link>
            <Link to="/master/bin-mapping" className={getMenuClass('/master/bin-mapping', true)}>
              Bin Mapping
            </Link>
            <Link to="/master/count-person" className={getMenuClass('/master/count-person', true)}>
              ผู้นับ Stock
            </Link>
            <Link to="/master/freeze-data" className={getMenuClass('/master/freeze-data', true)}>
              ข้อมูลต้นฉบับ
            </Link>
          </div>

          <Link to="/scan-bin-mapping" className={getMenuClass('/scan-bin-mapping')}>
            Scan Bin Mapping
          </Link>

          {isAdmin && (
            <div className="pt-3">
              <p className="px-4 py-2 text-sm font-semibold text-orange-200">Admin</p>
              <Link to="/admin/users" className={getMenuClass('/admin/users', true)}>
                User Management
              </Link>
            </div>
          )}

          <div className="pt-6">
            <Button 
              onClick={handleLogout} 
              className="w-full bg-white text-primary hover:bg-gray-100 font-medium"
            >
              Logout
            </Button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
