import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { userAPI } from '@/api';
import type { User } from '@/api';
import { useAppSelector } from '@/redux/hooks';

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    userName: '',
    password: '',
    fullName: '',
    role: 'staff' as 'admin' | 'staff'
  });
  const [isCreating, setIsCreating] = useState(false);
  
  const currentUser = useAppSelector((state) => state.auth.user);
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userAPI.getAll();
      setUsers(data);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.userName.trim() || !formData.password.trim() || !formData.fullName.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      await userAPI.create(formData.userName, formData.password, formData.fullName, formData.role);
      setFormData({ userName: '', password: '', fullName: '', role: 'staff' });
      setIsCreating(false);
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'ไม่สามารถสร้างผู้ใช้ได้');
    }
  };

  const handleUpdate = async (id: number) => {
    if (!formData.fullName.trim()) {
      setError('กรุณากรอกชื่อ-นามสกุล');
      return;
    }

    try {
      await userAPI.update(id, formData.fullName, formData.role);
      setEditingId(null);
      setFormData({ userName: '', password: '', fullName: '', role: 'staff' });
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'ไม่สามารถแก้ไขผู้ใช้ได้');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('คุณต้องการลบผู้ใช้นี้หรือไม่?')) return;

    try {
      await userAPI.delete(id);
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'ไม่สามารถลบผู้ใช้ได้');
    }
  };

  const handleResetPassword = async (id: number) => {
    const newPassword = prompt('กรุณากรอกรหัสผ่านใหม่:');
    if (!newPassword) return;

    try {
      await userAPI.resetPassword(id, newPassword);
      alert('รีเซ็ตรหัสผ่านสำเร็จ');
    } catch (err: any) {
      setError(err.response?.data?.error || 'ไม่สามารถรีเซ็ตรหัสผ่านได้');
    }
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setFormData({
      userName: user.userName || '',
      password: '',
      fullName: user.fullName || '',
      role: (user.role as 'admin' | 'staff') || 'staff'
    });
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({ userName: '', password: '', fullName: '', role: 'staff' });
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">User Management</h1>
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (เฉพาะ Admin)
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        {!isCreating && !editingId && (
          <Button onClick={() => setIsCreating(true)}>
            + เพิ่มผู้ใช้ใหม่
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
          <h2 className="text-xl font-semibold mb-4">เพิ่มผู้ใช้ใหม่</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                placeholder="ชื่อผู้ใช้"
                className="w-full px-3 py-2 border rounded-md"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="รหัสผ่าน"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ชื่อ-นามสกุล</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="ชื่อเต็ม"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'staff' })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
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
        ) : users.length === 0 ? (
          <div className="p-6 text-center text-gray-500">ไม่มีข้อมูลผู้ใช้</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">ID</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Username</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">ชื่อ-นามสกุล</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Role</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">วันที่สร้าง</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{user.id}</td>
                  <td className="px-6 py-4">
                    <span className="font-medium">{user.userName}</span>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === user.id ? (
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="px-3 py-1 border rounded-md"
                        autoFocus
                      />
                    ) : (
                      <span>{user.fullName}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === user.id ? (
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'staff' })}
                        className="px-3 py-1 border rounded-md"
                      >
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.createdAt ? new Date(user.createdAt).toLocaleString('th-TH') : '-'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {editingId === user.id ? (
                      <>
                        <Button size="sm" onClick={() => handleUpdate(user.id)}>
                          บันทึก
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          ยกเลิก
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => startEdit(user)}>
                          แก้ไข
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleResetPassword(user.id)}
                        >
                          รีเซ็ตรหัสผ่าน
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDelete(user.id)}
                          disabled={user.userName === 'admin'}
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
