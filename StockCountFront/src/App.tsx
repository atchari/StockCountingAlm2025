import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { useAppDispatch, useAppSelector } from './redux/hooks';
import { setUser, clearAuth, setLoading } from './redux/authSlice';
import { authAPI } from './api';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ScanBinMappingPage from './pages/ScanBinMappingPage';
import WarehouseManagementPage from './pages/WarehouseManagementPage';
import LocationManagementPage from './pages/LocationManagementPage';
import BinMappingManagementPage from './pages/BinMappingManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import CountPersonManagementPage from './pages/CountPersonManagementPage';
import FreezeDataManagementPage from './pages/FreezeDataManagementPage';
import ScanCountPage from './pages/ScanCountPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const verifySession = async () => {
      // Only verify if we have a token
      if (!localStorage.getItem('token')) {
        dispatch(setLoading(false));
        return;
      }

      try {
        console.log('🔍 Verifying session with backend...');
        const user = await authAPI.getMe();
        dispatch(setUser(user));
        console.log('✅ Session verified:', user.userName);
      } catch (error) {
        console.error('❌ Session verification failed:', error);
        // Clear invalid auth data
        dispatch(clearAuth());
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        dispatch(setLoading(false));
      }
    };

    verifySession();
  }, [dispatch]);

  // Show loading screen while verifying
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardLayout><DashboardPage /></DashboardLayout>} />
            <Route path="/scan-bin-mapping" element={<DashboardLayout><ScanBinMappingPage /></DashboardLayout>} />
            <Route path="/scan-count" element={<DashboardLayout><ScanCountPage /></DashboardLayout>} />
            <Route path="/master/warehouse" element={<DashboardLayout><WarehouseManagementPage /></DashboardLayout>} />
            <Route path="/master/bin-location" element={<DashboardLayout><LocationManagementPage /></DashboardLayout>} />
            <Route path="/master/bin-mapping" element={<DashboardLayout><BinMappingManagementPage /></DashboardLayout>} />
            <Route path="/master/count-person" element={<DashboardLayout><CountPersonManagementPage /></DashboardLayout>} />
            <Route path="/master/freeze-data" element={<DashboardLayout><FreezeDataManagementPage /></DashboardLayout>} />
            <Route path="/admin/users" element={<DashboardLayout><UserManagementPage /></DashboardLayout>} />
          </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AuthInitializer>
        <AppRoutes />
      </AuthInitializer>
    </Provider>
  );
}

export default App;