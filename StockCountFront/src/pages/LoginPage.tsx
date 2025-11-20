import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { authAPI } from '@/api';
import { useAppDispatch } from '@/redux/hooks';
import { setCredentials } from '@/redux/authSlice';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ userName: username, password });
      dispatch(setCredentials({ 
        user: {
          id: response.id,
          userName: response.userName,
          fullName: response.fullName,
          role: response.role,
          createdAt: null
        }, 
        token: response.token 
      }));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-primary/10 via-white to-secondary/10">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-2xl border border-gray-100">
        <div className="text-center">
          <div className="inline-block p-3 bg-primary/10 rounded-xl mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg"></div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Stock Counting System</h1>
          <p className="text-gray-600 mt-2">เข้าสู่ระบบ</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              required
            />
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-alumet-orange-dark text-white py-2.5 text-base font-medium"
            disabled={loading}
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-500 pt-4 border-t">
          <p>ผู้ดูแลระบบ: <span className="font-mono text-primary">admin / Admin@2025</span></p>
        </div>
      </div>
    </div>
  );
}
