import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { warehouseAPI, locationAPI } from '@/api';
import type { Warehouse, Location } from '@/api';
import { useAppSelector } from '@/redux/hooks';

export default function LocationManagementPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ whsId: 0, binLocation: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [filterWhsId, setFilterWhsId] = useState<number | null>(null);
  
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadWarehouses();
    loadLocations();
  }, [filterWhsId]);

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
      setLoading(true);
      const data = await locationAPI.getAll(filterWhsId || undefined);
      setLocations(data);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูล Location ได้');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.whsId || !formData.binLocation.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      await locationAPI.create(formData.whsId, formData.binLocation);
      setFormData({ whsId: 0, binLocation: '' });
      setIsCreating(false);
      await loadLocations();
    } catch (err: any) {
      setError(err.response?.data?.error || 'ไม่สามารถสร้าง Location ได้');
    }
  };

  const handleUpdate = async (id: number) => {
    if (!formData.whsId || !formData.binLocation.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      await locationAPI.update(id, formData.whsId, formData.binLocation);
      setEditingId(null);
      setFormData({ whsId: 0, binLocation: '' });
      await loadLocations();
    } catch (err: any) {
      setError(err.response?.data?.error || 'ไม่สามารถแก้ไข Location ได้');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('คุณต้องการลบ Location นี้หรือไม่?')) return;

    try {
      await locationAPI.delete(id);
      await loadLocations();
    } catch (err: any) {
      setError(err.response?.data?.error || 'ไม่สามารถลบ Location ได้');
    }
  };

  const startEdit = (location: Location) => {
    setEditingId(location.id);
    setFormData({ whsId: location.whsId, binLocation: location.binLocation });
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({ whsId: 0, binLocation: '' });
  };

  const getWarehouseName = (whsId: number) => {
    return warehouses.find(w => w.id === whsId)?.whsName || `ID: ${whsId}`;
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Bin Location Management</h1>
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (เฉพาะ Admin)
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Bin Location Management</h1>
        {!isCreating && !editingId && (
          <Button onClick={() => setIsCreating(true)}>
            + เพิ่ม Location ใหม่
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      {/* Filter */}
      <div className="mb-4 bg-white p-4 rounded-lg shadow">
        <label className="block text-sm font-medium mb-2">กรองตามคลัง:</label>
        <select
          value={filterWhsId || ''}
          onChange={(e) => setFilterWhsId(Number(e.target.value) || null)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">ทั้งหมด</option>
          {warehouses.map((wh) => (
            <option key={wh.id} value={wh.id}>
              {wh.whsName}
            </option>
          ))}
        </select>
      </div>

      {isCreating && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">เพิ่ม Location ใหม่</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">คลัง</label>
              <select
                value={formData.whsId}
                onChange={(e) => setFormData({ ...formData, whsId: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">เลือกคลัง</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.whsName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bin Location</label>
              <input
                type="text"
                value={formData.binLocation}
                onChange={(e) => setFormData({ ...formData, binLocation: e.target.value })}
                placeholder="เช่น A1, A2, B1"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate}>บันทึก</Button>
            <Button variant="outline" onClick={cancelEdit}>ยกเลิก</Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">กำลังโหลด...</div>
        ) : locations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">ไม่มีข้อมูล Location</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">ID</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">คลัง</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Bin Location</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">วันที่สร้าง</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {locations.map((loc) => (
                <tr key={loc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{loc.id}</td>
                  <td className="px-6 py-4">
                    {editingId === loc.id ? (
                      <select
                        value={formData.whsId}
                        onChange={(e) => setFormData({ ...formData, whsId: Number(e.target.value) })}
                        className="px-3 py-1 border rounded-md"
                      >
                        <option value="">เลือกคลัง</option>
                        {warehouses.map((wh) => (
                          <option key={wh.id} value={wh.id}>
                            {wh.whsName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-medium">{getWarehouseName(loc.whsId)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === loc.id ? (
                      <input
                        type="text"
                        value={formData.binLocation}
                        onChange={(e) => setFormData({ ...formData, binLocation: e.target.value })}
                        className="px-3 py-1 border rounded-md"
                      />
                    ) : (
                      <span className="font-medium">{loc.binLocation}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {loc.createdAt ? new Date(loc.createdAt).toLocaleString('th-TH') : '-'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {editingId === loc.id ? (
                      <>
                        <Button size="sm" onClick={() => handleUpdate(loc.id)}>
                          บันทึก
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          ยกเลิก
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => startEdit(loc)}>
                          แก้ไข
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDelete(loc.id)}
                        >
                          ลบ
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
