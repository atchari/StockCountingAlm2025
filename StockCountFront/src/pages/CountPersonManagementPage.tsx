import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { countPersonAPI, type CountPerson } from '@/api';
import { useAppSelector } from '@/redux/hooks';

export default function CountPersonManagementPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin';

  const [persons, setPersons] = useState<CountPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadPersons();
  }, []);

  const loadPersons = async () => {
    try {
      setLoading(true);
      const data = await countPersonAPI.getAll();
      setPersons(data);
    } catch (err) {
      setError('Failed to load count persons');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      await countPersonAPI.create(newName.trim());
      setNewName('');
      await loadPersons();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create count person');
    }
  };

  const handleEdit = (person: CountPerson) => {
    setEditingId(person.id);
    setEditName(person.fullName);
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;

    try {
      await countPersonAPI.update(id, editName.trim());
      setEditingId(null);
      await loadPersons();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update count person');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`ต้องการลบผู้นับ "${name}" หรือไม่?`)) return;

    try {
      await countPersonAPI.delete(id);
      await loadPersons();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete count person');
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
        <p className="text-gray-600 mt-2">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (Admin only)</p>
      </div>
    );
  }

  if (loading) return <div className="text-center py-12">กำลังโหลด...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">จัดการผู้นับ Stock</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      {/* Create Form */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">เพิ่มผู้นับใหม่</h2>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="ชื่อ-นามสกุล"
            className="flex-1 px-3 py-2 border rounded-md"
            required
          />
          <Button type="submit" className="bg-secondary hover:bg-alumet-green-dark">
            เพิ่ม
          </Button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">ชื่อ-นามสกุล</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">วันที่สร้าง</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {persons.map((person) => (
              <tr key={person.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{person.id}</td>
                <td className="px-4 py-3">
                  {editingId === person.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="px-2 py-1 border rounded w-full"
                      autoFocus
                    />
                  ) : (
                    <span className="font-medium">{person.fullName}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {person.createdAt ? new Date(person.createdAt).toLocaleString('th-TH') : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  {editingId === person.id ? (
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(person.id)}
                        className="bg-secondary hover:bg-alumet-green-dark"
                      >
                        บันทึก
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        ยกเลิก
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(person)}
                      >
                        แก้ไข
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(person.id, person.fullName)}
                      >
                        ลบ
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {persons.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            ยังไม่มีข้อมูลผู้นับ
          </div>
        )}
      </div>
    </div>
  );
}
