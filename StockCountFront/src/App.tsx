import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ScanBinMappingPage from './pages/ScanBinMappingPage';
import WarehouseManagementPage from './pages/WarehouseManagementPage';
import LocationManagementPage from './pages/LocationManagementPage';
import BinMappingManagementPage from './pages/BinMappingManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardLayout><DashboardPage /></DashboardLayout>} />
            <Route path="/scan-bin-mapping" element={<DashboardLayout><ScanBinMappingPage /></DashboardLayout>} />
            <Route path="/scan-count" element={<DashboardLayout><div>Scan Count Page (TODO)</div></DashboardLayout>} />
            <Route path="/master/warehouse" element={<DashboardLayout><WarehouseManagementPage /></DashboardLayout>} />
            <Route path="/master/bin-location" element={<DashboardLayout><LocationManagementPage /></DashboardLayout>} />
            <Route path="/master/bin-mapping" element={<DashboardLayout><BinMappingManagementPage /></DashboardLayout>} />
            <Route path="/admin/users" element={<DashboardLayout><UserManagementPage /></DashboardLayout>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;