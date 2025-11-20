import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { binMappingAPI, locationAPI, warehouseAPI } from '@/api';
import type { BinMapping, Location, Warehouse } from '@/api';
import { useAppSelector } from '@/redux/hooks';

export default function BinMappingManagementPage() {
  const [mappings, setMappings] = useState<BinMapping[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterBinId, setFilterBinId] = useState<number | null>(null);
  const [filterWhsId, setFilterWhsId] = useState<number | null>(null);
  
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    loadLocations();
  }, [filterWhsId]);

  useEffect(() => {
    loadMappings();
  }, [filterBinId]);

  const loadWarehouses = async () => {
    try {
      const data = await warehouseAPI.getAll();
      setWarehouses(data);
    } catch (err) {
      console.error('Failed to load warehouses', err);
    }
  };

  const loadLocations = async () => {
    try {
      const data = await locationAPI.getAll(filterWhsId || undefined);
      setLocations(data);
    } catch (err) {
      console.error('Failed to load locations', err);
    }
  };

  const loadMappings = async () => {
    try {
      setLoading(true);
      const data = await binMappingAPI.getAll(filterBinId || undefined);
      setMappings(data);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูล Bin Mapping ได้');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('คุณต้องการลบ Bin Mapping นี้หรือไม่?')) return;

    try {
      await binMappingAPI.delete(id);
      await loadMappings();
    } catch (err: any) {
      setError(err.response?.data?.error || 'ไม่สามารถลบ Bin Mapping ได้');
    }
  };

  const getLocationName = (binId: number) => {
    const location = locations.find(l => l.id === binId);
    if (!location) return `ID: ${binId}`;
    
    const warehouse = warehouses.find(w => w.id === location.whsId);
    return `${warehouse?.whsName || 'N/A'} - ${location.binLocation}`;
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Bin Mapping Management</h1>
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (เฉพาะ Admin)
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Bin Mapping Management</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">กรองตามคลัง:</label>
            <select
              value={filterWhsId || ''}
              onChange={(e) => {
                setFilterWhsId(Number(e.target.value) || null);
                setFilterBinId(null); // Reset bin filter
              }}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">ทั้งหมด</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.whsName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">กรองตาม Location:</label>
            <select
              value={filterBinId || ''}
              onChange={(e) => setFilterBinId(Number(e.target.value) || null)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">ทั้งหมด</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.binLocation}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">กำลังโหลด...</div>
        ) : mappings.length === 0 ? (
          <div className="p-6 text-center text-gray-500">ไม่มีข้อมูล Bin Mapping</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Location</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">SKU</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Batch No</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">User ID</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">วันที่สร้าง</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mappings.map((mapping) => (
                  <tr key={mapping.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{mapping.id}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{getLocationName(mapping.binId)}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm">{mapping.sku}</td>
                    <td className="px-6 py-4 font-mono text-sm">{mapping.batchNo}</td>
                    <td className="px-6 py-4 text-sm">{mapping.userId}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {mapping.createdAt ? new Date(mapping.createdAt).toLocaleString('th-TH') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDelete(mapping.id)}
                      >
                        ลบ
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-md">
        <p className="text-sm">
          <strong>หมายเหตุ:</strong> หน้านี้ใช้สำหรับดูและลบข้อมูล Bin Mapping เท่านั้น 
          การเพิ่มข้อมูลใหม่ให้ใช้หน้า "Scan Bin Mapping" แทน
        </p>
      </div>
    </div>
  );
}
