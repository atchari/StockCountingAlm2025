import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { warehouseAPI, locationAPI, binMappingAPI } from '@/api';
import type { Warehouse, Location } from '@/api';

export default function ScanBinMappingPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [scannedData, setScannedData] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const scanInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    if (selectedWarehouse) {
      loadLocations(selectedWarehouse);
    }
  }, [selectedWarehouse]);

  const loadWarehouses = async () => {
    try {
      const data = await warehouseAPI.getAll();
      setWarehouses(data);
    } catch (err) {
      console.error('Failed to load warehouses', err);
    }
  };

  const loadLocations = async (whsId: number) => {
    try {
      const data = await locationAPI.getAll(whsId);
      setLocations(data);
    } catch (err) {
      console.error('Failed to load locations', err);
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!selectedLocation) {
      setError('กรุณาเลือก Bin Location');
      return;
    }

    // Validate that scanned data starts with |
    if (!scannedData.startsWith('|')) {
      setError('ตรวจสอบ sticker หรือ ภาษาของ keyboard');
      setScannedData('');
      scanInputRef.current?.focus();
      return;
    }

    try {
      await binMappingAPI.scan(selectedLocation, scannedData);
      setMessage('บันทึกสำเร็จ!');
      setScannedData('');
      // Focus back to scan input for next scan
      scanInputRef.current?.focus();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('SKU และ Batch Number นี้ถูกบันทึกไว้แล้ว');
      } else {
        setError(err.response?.data?.error || 'บันทึกไม่สำเร็จ');
      }
      setScannedData('');
      scanInputRef.current?.focus();
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Scan Bin Mapping</h1>

      <div className="max-w-2xl bg-white p-6 rounded-lg shadow">
        <form onSubmit={handleScan} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Warehouse</label>
            <select
              value={selectedWarehouse || ''}
              onChange={(e) => setSelectedWarehouse(Number(e.target.value) || null)}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">เลือก Warehouse</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.whsName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bin Location</label>
            <Combobox
              options={locations.map((loc) => ({
                value: String(loc.id),
                label: loc.binLocation,
              }))}
              value={selectedLocation ? String(selectedLocation) : undefined}
              onValueChange={(value) => setSelectedLocation(Number(value))}
              placeholder="เลือก Bin Location"
              searchPlaceholder="ค้นหา location..."
              emptyText="ไม่พบ location"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Scan Label (รูปแบบ: |SKU|batchNumber|)
            </label>
            <input
              ref={scanInputRef}
              type="text"
              value={scannedData}
              onChange={(e) => setScannedData(e.target.value)}
              className="w-full px-3 py-2 border rounded-md font-mono"
              placeholder="|3012-001_AN_6063/T5_MILL|E7-01-00001|"
              required
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              ตัวอย่าง: |3012-001_AN_6063/T5_MILL|E7-01-00001|
            </p>
          </div>

          {message && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
              {message}
            </div>
          )}

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full">
            บันทึก
          </Button>
        </form>
      </div>
    </div>
  );
}
