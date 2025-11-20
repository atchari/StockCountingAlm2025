import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ScanBinMappingPage from './pages/ScanBinMappingPage';
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
            <Route path="/master/warehouse" element={<DashboardLayout><div>Warehouse Master (TODO)</div></DashboardLayout>} />
            <Route path="/master/bin-location" element={<DashboardLayout><div>Bin Location Master (TODO)</div></DashboardLayout>} />
            <Route path="/master/bin-mapping" element={<DashboardLayout><div>Bin Mapping Master (TODO)</div></DashboardLayout>} />
            <Route path="/admin/users" element={<DashboardLayout><div>User Management (TODO)</div></DashboardLayout>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;