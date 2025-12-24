import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { countingAPI, countPersonAPI, warehouseAPI, locationAPI } from '@/api';
import type { Counting, CountPerson, Warehouse } from '@/api';
import { toast } from 'sonner';

export default function ScanCountPage() {
  // State for warehouse & location
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWhsId, setSelectedWhsId] = useState<number | null>(null);
  const [selectedWhsName, setSelectedWhsName] = useState<string>('');
  const [selectedBinId, setSelectedBinId] = useState<number | null>(null);
  const [selectedBinLocation, setSelectedBinLocation] = useState<string>('');
  
  // State for count person
  const [countPersons, setCountPersons] = useState<CountPerson[]>([]);
  const [selectedCountPersonId, setSelectedCountPersonId] = useState<number | null>(null);
  
  // State for SKU scanning
  const [sku, setSku] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [qty, setQty] = useState('');
  
  // State for counting records
  const [countingRecords, setCountingRecords] = useState<Counting[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState('');
  
  // Refs for auto-focus
  const whLocationInputRef = useRef<HTMLInputElement>(null);
  const skuInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadWarehouses();
    loadCountPersons();
    // Focus on warehouse/location input on mount
    setTimeout(() => whLocationInputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    // Load counting records when warehouse/location changes and count person is selected
    if (selectedWhsId && selectedCountPersonId) {
      loadCountingRecords();
    }
  }, [selectedWhsId, selectedBinId, selectedCountPersonId]);

  const loadWarehouses = async () => {
    try {
      const data = await warehouseAPI.getAll();
      setWarehouses(data);
    } catch (err) {
      console.error('Failed to load warehouses', err);
    }
  };

  const loadCountPersons = async () => {
    try {
      const data = await countPersonAPI.getAll();
      setCountPersons(data);
    } catch (err) {
      console.error('Failed to load count persons', err);
    }
  };

  const loadCountingRecords = async () => {
    if (!selectedWhsId) return;
    
    try {
      const data = await countingAPI.getAll(selectedWhsId, selectedBinId || undefined);
      setCountingRecords(data);
    } catch (err) {
      console.error('Failed to load counting records', err);
    }
  };

  const handleScanWhLocation = (scannedData: string) => {
    // Validate format |Warehouse|Location|
    if (!scannedData.startsWith('|')) {
      toast.error('รูปแบบไม่ถูกต้อง ต้องเริ่มด้วย |');
      setTimeout(() => whLocationInputRef.current?.focus(), 100);
      return;
    }

    const parts = scannedData.split('|').filter(p => p.trim());
    if (parts.length < 1) {
      toast.error('ไม่พบข้อมูล Warehouse');
      setTimeout(() => whLocationInputRef.current?.focus(), 100);
      return;
    }

    const whsName = parts[0].trim();
    const binLocation = parts.length > 1 ? parts[1].trim() : '';

    // Find warehouse
    const warehouse = warehouses.find(w => w.whsName === whsName);
    if (!warehouse) {
      toast.error(`ไม่พบคลัง: ${whsName}`);
      setTimeout(() => whLocationInputRef.current?.focus(), 100);
      return;
    }

    setSelectedWhsId(warehouse.id);
    setSelectedWhsName(warehouse.whsName);

    // Find location (optional)
    if (binLocation) {
      locationAPI.getAll(warehouse.id).then(locs => {
        const location = locs.find(l => l.binLocation === binLocation);
        if (location) {
          setSelectedBinId(location.id);
          setSelectedBinLocation(location.binLocation);
          toast.success(`✓ Scan: ${whsName} - ${binLocation}`);
          // Success: no focus needed, user will select count person
        } else {
          toast.error(`ไม่พบ Location: ${binLocation} ในคลัง ${whsName}`);
          setSelectedBinId(null);
          setSelectedBinLocation('');
          setTimeout(() => whLocationInputRef.current?.focus(), 100);
        }
      });
    } else {
      setSelectedBinId(null);
      setSelectedBinLocation('');
      toast.success(`✓ Scan: ${whsName} (ไม่มี Location)`);
      // Success: no focus needed, user will select count person
    }
  };

  const handleScanSku = (scannedData: string) => {
    // Validate format |SKU|Batch|
    if (!scannedData.startsWith('|')) {
      toast.error('รูปแบบ SKU ไม่ถูกต้อง ต้องเริ่มด้วย |');
      setSku('');
      setBatchNo('');
      setTimeout(() => skuInputRef.current?.focus(), 100);
      return;
    }

    const parts = scannedData.split('|').filter(p => p.trim());
    if (parts.length < 1) {
      toast.error('ไม่พบข้อมูล SKU');
      setSku('');
      setBatchNo('');
      setTimeout(() => skuInputRef.current?.focus(), 100);
      return;
    }

    const scannedSku = parts[0].trim();
    const scannedBatch = parts.length > 1 ? parts[1].trim() : '';

    // Check duplicate before setting
    const duplicate = countingRecords.find(
      r => r.sku === scannedSku && (r.batchNo || '') === (scannedBatch || '')
    );
    if (duplicate) {
      toast.error(`❌ ซ้ำ! SKU: ${scannedSku}${scannedBatch ? ` Batch: ${scannedBatch}` : ''} มีในระบบแล้ว (ID: ${duplicate.id})`);
      setSku('');
      setBatchNo('');
      setTimeout(() => skuInputRef.current?.focus(), 100);
      return;
    }

    setSku(scannedSku);
    setBatchNo(scannedBatch);
    toast.success(`✓ SKU: ${scannedSku}${scannedBatch ? ` | Batch: ${scannedBatch}` : ''}`);

    // Focus to quantity input
    setTimeout(() => qtyInputRef.current?.focus(), 100);
  };

  const handleSubmit = async () => {
    if (!selectedWhsId) {
      toast.error('กรุณา Scan Warehouse/Location ก่อน');
      whLocationInputRef.current?.focus();
      return;
    }

    if (!selectedCountPersonId) {
      toast.error('กรุณาเลือกผู้นับ');
      return;
    }

    if (!sku) {
      toast.error('กรุณา Scan SKU');
      skuInputRef.current?.focus();
      return;
    }

    if (!qty || parseFloat(qty) < 0) {
      toast.error('กรุณากรอกจำนวน (ใส่ 0 ได้ถ้าหาไม่เจอ)');
      qtyInputRef.current?.focus();
      return;
    }

    try {
      await countingAPI.create(
        selectedWhsId,
        selectedBinId,
        sku,
        batchNo || null,
        parseFloat(qty),
        selectedCountPersonId
      );

      toast.success(`✅ บันทึกสำเร็จ! SKU: ${sku}${batchNo ? ` | Batch: ${batchNo}` : ''} | จำนวน: ${qty}`);
      
      // Reset SKU fields
      setSku('');
      setBatchNo('');
      setQty('');
      
      // Reload records
      await loadCountingRecords();
      
      // Focus back to SKU input for next item
      setTimeout(() => {
        skuInputRef.current?.focus();
      }, 100);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'บันทึกไม่สำเร็จ';
      toast.error(`❌ ${errorMsg}`);
      // Focus back to SKU input to retry
      setTimeout(() => skuInputRef.current?.focus(), 100);
      console.error('Save error:', err);
    }
  };

  const handleReset = () => {
    setSelectedWhsId(null);
    setSelectedWhsName('');
    setSelectedBinId(null);
    setSelectedBinLocation('');
    setSelectedCountPersonId(null);
    setSku('');
    setBatchNo('');
    setQty('');
    setCountingRecords([]);
    setTimeout(() => whLocationInputRef.current?.focus(), 100);
  };

  const handleEdit = (record: Counting) => {
    setEditingId(record.id);
    setEditQty(record.qty.toString());
  };

  const handleSaveEdit = async (id: number) => {
    if (!editQty || parseFloat(editQty) < 0) {
      toast.error('กรุณากรอกจำนวนที่ถูกต้อง (ใส่ 0 ได้ถ้าหาไม่เจอ)');
      return;
    }

    try {
      await countingAPI.update(id, parseFloat(editQty));
      setEditingId(null);
      toast.success('✓ แก้ไขเรียบร้อย');
      await loadCountingRecords();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'แก้ไขไม่สำเร็จ');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditQty('');
  };

  const getCountPersonName = (id: number) => {
    const person = countPersons.find(p => p.id === id);
    return person?.fullName || `ID: ${id}`;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Scan ใบนับ Stock</h1>
        <Button onClick={handleReset} variant="outline" className="text-red-600">
          Reset ใบใหม่
        </Button>
      </div>

      {/* Scan WH/Location Section */}
      <div className="mb-6 p-6 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">1. Scan Warehouse & Location (มุมขวาบน)</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Scan รหัส QR มุมขวาบน</label>
          <div className="flex gap-2">
            <input
              ref={whLocationInputRef}
              type="text"
              placeholder="Scan |WH_MILL|D1B-02|"
              className="flex-1 px-3 py-2 border rounded-md font-mono"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
            />
            <Button
              onClick={() => {
                const value = whLocationInputRef.current?.value || '';
                if (value) {
                  handleScanWhLocation(value);
                  if (whLocationInputRef.current) {
                    whLocationInputRef.current.value = '';
                  }
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              ยืนยันคลัง
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            รูปแบบ: |Warehouse|Location| (Location ไม่บังคับ)
          </p>
        </div>
        {selectedWhsId && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="font-semibold text-blue-900">
              ✓ คลัง: {selectedWhsName} {selectedBinLocation && `- Location: ${selectedBinLocation}`}
            </p>
          </div>
        )}
      </div>

      {/* Count Person Selection */}
      {selectedWhsId && (
        <div className="mb-6 p-6 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">2. เลือกผู้นับ</h2>
          <select
            value={selectedCountPersonId || ''}
            onChange={(e) => setSelectedCountPersonId(Number(e.target.value) || null)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">-- เลือกผู้นับ --</option>
            {countPersons.map((person) => (
              <option key={person.id} value={person.id}>
                {person.fullName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* SKU Scanning Form */}
      {selectedWhsId && selectedCountPersonId && (
        <div className="mb-6 p-6 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">3. Scan SKU & กรอกจำนวน</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Scan SKU</label>
              <div className="flex gap-2">
                <input
                  ref={skuInputRef}
                  type="text"
                  placeholder="Scan |SKU|Batch|"
                  className="flex-1 px-3 py-2 border rounded-md font-mono"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    const value = skuInputRef.current?.value || '';
                    if (value) {
                      handleScanSku(value);
                      if (skuInputRef.current) {
                        skuInputRef.current.value = '';
                      }
                    }
                  }}
                  className="bg-primary hover:bg-alumet-orange-dark text-white"
                >
                  Scan
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">รูปแบบ: |SKU|Batch|</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <label className="block text-sm font-medium mb-2 text-gray-600">SKU (อ่านจาก Scan)</label>
              <p className="font-mono text-sm">{sku || '-'}</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <label className="block text-sm font-medium mb-2 text-gray-600">Batch No (อ่านจาก Scan)</label>
              <p className="font-mono text-sm">{batchNo || '-'}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">จำนวน *</label>
              <input
                ref={qtyInputRef}
                type="number"
                step="0.01"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="0.00"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleSubmit}
                className="bg-alumet-green hover:bg-alumet-green-dark text-white px-8"
              >
                บันทึก
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Counting Records Table */}
      {selectedWhsId && countingRecords.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="font-semibold">
              รายการที่นับแล้ว: {selectedWhsName} {selectedBinLocation && `- ${selectedBinLocation}`}
              <span className="ml-2 text-sm font-normal text-gray-600">
                ({countingRecords.length} รายการ)
              </span>
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">SKU</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Batch No</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">จำนวน</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ผู้นับ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ผู้ Scan</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">วันที่</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {countingRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{record.id}</td>
                    <td className="px-4 py-3 text-sm font-mono">{record.sku}</td>
                    <td className="px-4 py-3 text-sm font-mono">{record.batchNo || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      {editingId === record.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editQty}
                          onChange={(e) => setEditQty(e.target.value)}
                          className="w-24 px-2 py-1 border rounded text-right"
                          autoFocus
                        />
                      ) : (
                        <span className="font-mono">
                          {record.qty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">{getCountPersonName(record.countPersonId)}</td>
                    <td className="px-4 py-3 text-sm">{record.scanPersonName || `User ID: ${record.scanPersonId}`}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {record.createdAt ? (
                        <div>
                          <div>{new Date(record.createdAt).toLocaleDateString('th-TH')}</div>
                          <div>{new Date(record.createdAt).toLocaleTimeString('th-TH')}</div>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingId === record.id ? (
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" onClick={() => handleSaveEdit(record.id)}>
                            บันทึก
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            ยกเลิก
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEdit(record)}
                        >
                          แก้ไข
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedWhsId && countingRecords.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          ยังไม่มีรายการนับ - เริ่ม Scan SKU เพื่อบันทึกข้อมูล
        </div>
      )}
    </div>
  );
}
