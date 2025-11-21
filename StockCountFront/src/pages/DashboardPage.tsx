import { useEffect, useState } from 'react';
import type { DashboardStatistics, WarehouseDetail } from '../api';
import { dashboardAPI } from '../api';
import { Button } from '../components/ui/button';
import { ChevronLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock, Package } from 'lucide-react';

type ViewMode = 'overview' | 'warehouse';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null);
  const [warehouseDetail, setWarehouseDetail] = useState<WarehouseDetail | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedWhsId, setSelectedWhsId] = useState<number | null>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await dashboardAPI.getStatistics();
      setStatistics(data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWarehouseDetail = async (whsId: number) => {
    try {
      setLoading(true);
      const data = await dashboardAPI.getWarehouseDetail(whsId);
      setWarehouseDetail(data);
      setSelectedWhsId(whsId);
      setViewMode('warehouse');
    } catch (error) {
      console.error('Failed to load warehouse detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const backToOverview = () => {
    setViewMode('overview');
    setWarehouseDetail(null);
    setSelectedWhsId(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'เสร็จสมบูรณ์':
      case 'นับครบแล้ว':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'กำลังดำเนินการ':
      case 'กำลังนับ':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'ยังไม่เริ่ม':
        return <Package className="w-5 h-5 text-gray-400" />;
      case 'ไม่มีข้อมูลตั้งต้น':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-600';
    if (percentage >= 75) return 'bg-blue-600';
    if (percentage >= 50) return 'bg-orange-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  if (loading && !statistics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">ไม่สามารถโหลดข้อมูลได้</div>
      </div>
    );
  }

  // Overview Mode
  if (viewMode === 'overview') {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">📊 Dashboard - ภาพรวมการนับ Stock</h1>

        {/* Overall Company Statistics */}
        <div className="mb-8 p-6 bg-gradient-to-r from-orange-50 to-green-50 rounded-lg shadow-lg border-2 border-orange-200">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            🏢 สถานะภาพรวมทั้งบริษัท
            {getStatusIcon(statistics.overall.status)}
          </h2>
          
          {/* Top Level Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">จำนวนรายการทั้งหมด</h3>
              <p className="text-3xl font-bold text-gray-800">{statistics.overall.totalFreezeItems.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">รายการจาก Freeze Data</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">นับแล้ว</h3>
              <p className="text-3xl font-bold text-green-600">{statistics.overall.totalCountedItems.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">รายการที่มีการนับ</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">ความคืบหน้า</h3>
              <p className="text-3xl font-bold text-orange-600">{statistics.overall.progressPercentage}%</p>
              <div className="mt-2 bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full ${getProgressColor(statistics.overall.progressPercentage)} transition-all duration-500`}
                  style={{ width: `${statistics.overall.progressPercentage}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">สถานะ</h3>
              <p className="text-xl font-bold text-gray-800 flex items-center gap-2 mt-2">
                {getStatusIcon(statistics.overall.status)}
                {statistics.overall.status}
              </p>
            </div>
          </div>

          {/* Warehouse & Location Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
                🏭 สถานะคลัง
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-xs text-gray-600">คลังทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-800">{statistics.warehouses.length}</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-xs text-gray-600">เริ่มนับแล้ว</p>
                  <p className="text-2xl font-bold text-green-600">
                    {statistics.warehouses.filter(w => w.countedItems > 0).length}
                  </p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-xs text-gray-600">นับครบแล้ว</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {statistics.warehouses.filter(w => w.status === 'นับครบแล้ว').length}
                  </p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-xs text-gray-600">ยังไม่เริ่ม</p>
                  <p className="text-2xl font-bold text-gray-400">
                    {statistics.warehouses.filter(w => w.countedItems === 0 && w.totalItems > 0).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
              <h3 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
                📍 สถานะ Locations
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-xs text-gray-600">Locations ทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {statistics.warehouses.reduce((sum, w) => sum + w.totalLocations, 0)}
                  </p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-xs text-gray-600">นับแล้ว</p>
                  <p className="text-2xl font-bold text-green-600">
                    {statistics.warehouses.reduce((sum, w) => sum + w.countedLocations, 0)}
                  </p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-xs text-gray-600">% ความคืบหน้า</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {(() => {
                      const total = statistics.warehouses.reduce((sum, w) => sum + w.totalLocations, 0);
                      const counted = statistics.warehouses.reduce((sum, w) => sum + w.countedLocations, 0);
                      return total > 0 ? Math.round((counted / total) * 100) : 0;
                    })()}%
                  </p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-xs text-gray-600">ยังไม่นับ</p>
                  <p className="text-2xl font-bold text-gray-400">
                    {statistics.warehouses.reduce((sum, w) => sum + (w.totalLocations - w.countedLocations), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Warehouse Level Statistics */}
        <div>
          <h2 className="text-2xl font-bold mb-4">🏭 สถานะแยกตามคลัง</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statistics.warehouses.map((whs) => (
              <div
                key={whs.whsId}
                className="bg-white rounded-lg shadow-lg border-2 border-gray-200 hover:border-orange-400 hover:shadow-xl transition-all duration-200 cursor-pointer"
                onClick={() => loadWarehouseDetail(whs.whsId)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{whs.whsName}</h3>
                    {getStatusIcon(whs.status)}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold">ความคืบหน้า</span>
                      <span className="font-bold text-orange-600">{whs.progressPercentage}%</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div 
                        className={`h-full ${getProgressColor(whs.progressPercentage)} transition-all duration-500`}
                        style={{ width: `${whs.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Statistics Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-gray-600 text-xs">รายการทั้งหมด</p>
                      <p className="text-xl font-bold text-gray-800">{whs.totalItems.toLocaleString()}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <p className="text-gray-600 text-xs">นับแล้ว</p>
                      <p className="text-xl font-bold text-green-600">{whs.countedItems.toLocaleString()}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-gray-600 text-xs">Locations</p>
                      <p className="text-lg font-bold text-blue-600">{whs.countedLocations}/{whs.totalLocations}</p>
                    </div>
                    <div className={`${whs.varianceItems > 0 ? 'bg-red-50' : 'bg-gray-50'} p-3 rounded`}>
                      <p className="text-gray-600 text-xs flex items-center gap-1">
                        {whs.varianceItems > 0 && <AlertTriangle className="w-3 h-3 text-red-500" />}
                        ยอดไม่ตรง
                      </p>
                      <p className={`text-lg font-bold ${whs.varianceItems > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {whs.varianceItems.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      สถานะ: <span className="font-semibold text-gray-800">{whs.status}</span>
                    </p>
                  </div>

                  <Button className="w-full mt-3 bg-orange-600 hover:bg-orange-700">
                    ดูรายละเอียด →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Management Recommendations */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            💡 ข้อเสนอแนะสำหรับผู้บริหาร
          </h2>
          <ul className="space-y-2 text-sm text-gray-700">
            {statistics.overall.progressPercentage < 50 && (
              <li className="flex items-start gap-2">
                <TrendingDown className="w-4 h-4 text-orange-500 mt-0.5" />
                <span>ความคืบหน้าต่ำกว่า 50% ควรเร่งการดำเนินงาน</span>
              </li>
            )}
            {statistics.warehouses.some(w => w.status === 'ไม่มีข้อมูลตั้งต้น') && (
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                <span>พบคลังที่ยังไม่มีข้อมูล Freeze Data ควรนำเข้าข้อมูลก่อนเริ่มนับ</span>
              </li>
            )}
            {statistics.warehouses.some(w => w.varianceItems > 0) && (
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                <span>พบรายการที่มียอดไม่ตรงกับ Freeze Data ควรให้ Auditor ตรวจสอบ (คลิกที่คลังเพื่อดูรายละเอียด)</span>
              </li>
            )}
            {statistics.overall.progressPercentage >= 90 && (
              <li className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />
                <span>ความคืบหน้าใกล้เสร็จสมบูรณ์ ควรเตรียมการรายงานและวิเคราะห์ผลต่างระหว่างนับกับ Freeze</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    );
  }

  // Warehouse Detail Mode
  if (viewMode === 'warehouse' && warehouseDetail) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <Button onClick={backToOverview} variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4 mr-1" />
            กลับ
          </Button>
          <h1 className="text-3xl font-bold">📦 {warehouseDetail.warehouse.whsName}</h1>
        </div>

        {/* Location Statistics */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">📍 สถานะแยกตาม Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouseDetail.locations.map((loc) => (
              <div key={loc.binId} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg">{loc.binLocation}</h3>
                  {getStatusIcon(loc.status)}
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>ความคืบหน้า</span>
                    <span className="font-bold">{loc.progressPercentage}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full ${getProgressColor(loc.progressPercentage)}`}
                      style={{ width: `${loc.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500">ทั้งหมด</p>
                    <p className="font-bold text-gray-800">{loc.totalItems}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">นับแล้ว</p>
                    <p className="font-bold text-green-600">{loc.countedItems}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">ไม่ตรง</p>
                    <p className={`font-bold ${loc.varianceItems > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {loc.varianceItems}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-600 mt-2 pt-2 border-t">
                  {loc.status}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Variance Details */}
        {warehouseDetail.variances.length > 0 && (
          <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-6 h-6" />
              รายการที่มียอดไม่ตรง (ต้องตรวจสอบ)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              รายการที่ยอดนับไม่ตรงกับข้อมูล Freeze - ควรให้ Auditor ตรวจสอบและแก้ไข
            </p>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Batch No</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Freeze Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Count Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">ผลต่าง</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {warehouseDetail.variances.map((variance, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{variance.binLocation}</td>
                        <td className="px-4 py-3 text-sm font-mono">{variance.sku}</td>
                        <td className="px-4 py-3 text-sm font-mono">{variance.batchNo || '-'}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">{variance.freezeQty.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">{variance.countQty.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-red-600">
                          {variance.countQty > variance.freezeQty ? '+' : ''}{(variance.countQty - variance.freezeQty).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-red-600">
                          {variance.variancePercentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {warehouseDetail.variances.length === 0 && (
          <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="text-xl font-bold text-green-700">ไม่พบรายการที่มียอดไม่ตรง</h3>
                <p className="text-sm text-gray-600">ยอดนับตรงกับข้อมูล Freeze ทั้งหมด</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
