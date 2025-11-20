import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { warehouseAPI } from '@/api';
import type { Warehouse } from '@/api';
import { useAppSelector } from '@/redux/hooks';

export default function WarehouseManagementPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ whsName: '' });
  const [isCreating, setIsCreating] = useState(false);
  
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const data = await warehouseAPI.getAll();
      setWarehouses(data);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลคลังได้');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.whsName.trim()) {
      setError('กรุณากรอกชื่อคลัง');
      return;
    }

    try {
      await warehouseAPI.create(formData.whsName);
      setFormData({ whsName: '' });
      setIsCreating(false);
      await loadWarehouses();
    } catch (err: any) {
      setError(err.response?.data?.error || 'ไม่สามารถสร้างคลังได้');
    }
  };

  const handleUpdate = async (id: number) => {
    if (!formData.whsName.trim()) {
      setError('กรุณากรอกชื่อคลัง');
      return;
    }

    try {
      await warehouseAPI.update(id, formData.whsName);
      setEditingId(null);
      setFormData({ whsName: '' });
      await loadWarehouses();
    } catch (err: any) {
      setError(err.response?.data?.error || 'ไม่สามารถแก้ไขคลังได้');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('คุณต้องการลบคลังนี้หรือไม่?')) return;

    try {
      await warehouseAPI.delete(id);
      await loadWarehouses();
    } catch (err: any) {
      setError(err.response?.data?.error || 'ไม่สามารถลบคลังได้');
    }
  };

  const startEdit = (warehouse: Warehouse) => {
    setEditingId(warehouse.id);
    setFormData({ whsName: warehouse.whsName });
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({ whsName: '' });
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Warehouse Management</h1>
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (เฉพาะ Admin)
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Warehouse Management</h1>
        {!isCreating && !editingId && (
          <Button onClick={() => setIsCreating(true)}>
            + เพิ่มคลังใหม่
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      {isCreating && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">เพิ่มคลังใหม่</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.whsName}
              onChange={(e) => setFormData({ whsName: e.target.value })}
              placeholder="ชื่อคลัง เช่น WH_MILL"
              className="flex-1 px-3 py-2 border rounded-md"
              autoFocus
            />
            <Button onClick={handleCreate}>บันทึก</Button>
            <Button variant="outline" onClick={cancelEdit}>ยกเลิก</Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">กำลังโหลด...</div>
        ) : warehouses.length === 0 ? (
          <div className="p-6 text-center text-gray-500">ไม่มีข้อมูลคลัง</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">ID</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">ชื่อคลัง</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">วันที่สร้าง</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {warehouses.map((wh) => (
                <tr key={wh.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{wh.id}</td>
                  <td className="px-6 py-4">
                    {editingId === wh.id ? (
                      <input
                        type="text"
                        value={formData.whsName}
                        onChange={(e) => setFormData({ whsName: e.target.value })}
                        className="px-3 py-1 border rounded-md"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium">{wh.whsName}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {wh.createdAt ? new Date(wh.createdAt).toLocaleString('th-TH') : '-'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {editingId === wh.id ? (
                      <>
                        <Button size="sm" onClick={() => handleUpdate(wh.id)}>
                          บันทึก
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          ยกเลิก
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => startEdit(wh)}>
                          แก้ไข
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDelete(wh.id)}
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
