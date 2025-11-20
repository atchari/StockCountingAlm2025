import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { freezeDataAPI, warehouseAPI, type FreezeData, type Warehouse } from '@/api';
import { useAppSelector } from '@/redux/hooks';

export default function FreezeDataManagementPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin';

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWhsId, setSelectedWhsId] = useState<number | null>(null);
  const [data, setData] = useState<FreezeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importing, setImporting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      const whsList = await warehouseAPI.getAll();
      setWarehouses(whsList);
    } catch (err) {
      console.error('Failed to load warehouses', err);
    }
  };

  const loadData = async () => {
    if (!selectedWhsId) return;

    try {
      setLoading(true);
      const freezeData = await freezeDataAPI.getAll(selectedWhsId);
      setData(freezeData);
    } catch (err) {
      setError('Failed to load freeze data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedWhsId) {
      setError('กรุณาเลือกคลังก่อน');
      return;
    }

    // Validate file type
    if (!file.name.endsWith('.tsv') && !file.name.endsWith('.txt')) {
      setError('กรุณาเลือกไฟล์ .tsv หรือ .txt เท่านั้น');
      return;
    }

    try {
      setImporting(true);
      setError('');
      setSuccess('');

      const content = await file.text();
      
      const result = await freezeDataAPI.import(selectedWhsId, content);
      
      setSuccess(
        `นำเข้าสำเร็จ ${result.importedCount} รายการ ` +
        `(ลบข้อมูลเก่า ${result.deletedCount} รายการ)` +
        (result.errors ? `\nมีข้อผิดพลาด ${result.errors.length} รายการ` : '')
      );

      if (result.errors && result.errors.length > 0) {
        console.warn('Import errors:', result.errors);
      }

      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'นำเข้าข้อมูลไม่สำเร็จ');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAll = async () => {
    if (!selectedWhsId) return;

    const warehouse = warehouses.find(w => w.id === selectedWhsId);
    if (!confirm(`ต้องการลบข้อมูลทั้งหมดของคลัง "${warehouse?.whsName}" หรือไม่?`)) return;

    try {
      await freezeDataAPI.deleteByWarehouse(selectedWhsId);
      setSuccess('ลบข้อมูลสำเร็จ');
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'ลบข้อมูลไม่สำเร็จ');
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

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">จัดการข้อมูลต้นฉบับ (Freeze Data)</h1>

      <p className="text-gray-600 mb-6">
        ใช้สำหรับนำเข้าข้อมูล Stock ก่อนนับ เพื่อใช้เปรียบเทียบหลังนับเสร็จ
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md border border-green-200 whitespace-pre-line">
          {success}
        </div>
      )}

      {/* Warehouse Selection & Import */}
      <div className="mb-6 p-6 bg-white rounded-lg shadow space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">เลือกคลัง</label>
          <select
            value={selectedWhsId || ''}
            onChange={(e) => setSelectedWhsId(Number(e.target.value) || null)}
            className="w-full max-w-md px-3 py-2 border rounded-md"
          >
            <option value="">-- เลือกคลัง --</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.whsName}
              </option>
            ))}
          </select>
        </div>

        {selectedWhsId && (
          <div className="flex gap-3 items-center pt-4 border-t">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                นำเข้าไฟล์ TSV (Tab-Separated Values)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".tsv,.txt"
                onChange={handleFileSelect}
                disabled={importing}
                className="w-full text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                รูปแบบ: SKU [TAB] BatchNo [TAB] Qty [TAB] Uom [TAB] UnitPrice
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={loadData}
                disabled={loading}
                variant="outline"
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                {loading ? 'กำลังโหลด...' : 'โหลดข้อมูล'}
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="bg-primary hover:bg-alumet-orange-dark"
              >
                {importing ? 'กำลังนำเข้า...' : 'เลือกไฟล์'}
              </Button>
              <Button
                onClick={handleDeleteAll}
                disabled={importing || data.length === 0}
                variant="outline"
                className="text-red-600 hover:bg-red-50"
              >
                ลบทั้งหมด
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      {selectedWhsId && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="font-semibold">
              ข้อมูลคลัง: {warehouses.find(w => w.id === selectedWhsId)?.whsName}
              <span className="ml-2 text-sm font-normal text-gray-600">
                ({data.length} รายการ)
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12">กำลังโหลด...</div>
          ) : data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">SKU</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Batch No</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Qty</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Uom</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Unit Price</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">วันที่สร้าง</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{item.id}</td>
                      <td className="px-4 py-3 text-sm font-mono">{item.sku}</td>
                      <td className="px-4 py-3 text-sm font-mono">{item.batchNo}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {item.qty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {item.uom}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString('th-TH') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              ยังไม่มีข้อมูล - กรุณานำเข้าไฟล์ TSV
            </div>
          )}
        </div>
      )}
    </div>
  );
}
