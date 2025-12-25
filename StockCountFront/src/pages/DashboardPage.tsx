import { useEffect, useState, useMemo } from 'react';
import type { DashboardStatistics, WarehouseDetail, VarianceDetail, HourlyLocationResponse } from '../api';
import { dashboardAPI } from '../api';
import { Button } from '../components/ui/button';
import { ChevronLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock, Package, X, Filter, ListFilter, ArrowUp, Calendar } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from '@tanstack/react-table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type ViewMode = 'overview' | 'warehouse';
type DisplayMode = 'all' | 'variance';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null);
  const [warehouseDetail, setWarehouseDetail] = useState<WarehouseDetail | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [, setSelectedWhsId] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('all');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [badgeView, setBadgeView] = useState(false);
  const [hourlyData, setHourlyData] = useState<HourlyLocationResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [warehouseHourlyData, setWarehouseHourlyData] = useState<HourlyLocationResponse | null>(null);
  const [warehouseSelectedDate, setWarehouseSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // ✨ Cache for hourly data to avoid re-fetching
  const [hourlyDataCache, setHourlyDataCache] = useState<Record<string, HourlyLocationResponse>>({});

  useEffect(() => {
    loadStatistics();
    // Only load hourly data on demand, not on initial load
  }, []);

  useEffect(() => {
    // Check cache first before fetching
    if (hourlyDataCache[selectedDate]) {
      setHourlyData(hourlyDataCache[selectedDate]);
    } else {
      loadHourlyData(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (warehouseDetail) {
      const cacheKey = `${warehouseDetail.warehouse.whsId}-${warehouseSelectedDate}`;
      if (hourlyDataCache[cacheKey]) {
        setWarehouseHourlyData(hourlyDataCache[cacheKey]);
      } else {
        loadWarehouseHourlyData(warehouseDetail.warehouse.whsId, warehouseSelectedDate);
      }
    }
  }, [warehouseSelectedDate]);

  useEffect(() => {
    const handleScroll = () => {
      const mainContent = document.querySelector('main');
      if (mainContent) {
        setShowBackToTop(mainContent.scrollTop > 300);
      }
    };

    const mainContent = document.querySelector('main');
    mainContent?.addEventListener('scroll', handleScroll);
    return () => mainContent?.removeEventListener('scroll', handleScroll);
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

  const loadHourlyData = async (date: string) => {
    try {
      const data = await dashboardAPI.getHourlyLocations(date);
      setHourlyData(data);
      // Cache the result
      setHourlyDataCache(prev => ({ ...prev, [date]: data }));
    } catch (error) {
      console.error('Failed to load hourly data:', error);
    }
  };

  const loadWarehouseHourlyData = async (whsId: number, date: string) => {
    try {
      const data = await dashboardAPI.getWarehouseHourlyLocations(whsId, date);
      setWarehouseHourlyData(data);
      // Cache the result with warehouse-specific key
      const cacheKey = `${whsId}-${date}`;
      setHourlyDataCache(prev => ({ ...prev, [cacheKey]: data }));
    } catch (error) {
      console.error('Failed to load warehouse hourly data:', error);
    }
  };

  const loadWarehouseDetail = async (whsId: number) => {
    try {
      setLoading(true);
      const data = await dashboardAPI.getWarehouseDetail(whsId);
      setWarehouseDetail(data);
      setSelectedWhsId(whsId);
      setSelectedLocation(null); // Reset filter
      setDisplayMode('variance'); // Reset to variance mode
      setViewMode('warehouse');
      
      // Load hourly data for this warehouse
      await loadWarehouseHourlyData(whsId, warehouseSelectedDate);
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
    setSelectedLocation(null);
    setDisplayMode('variance');
  };

  const scrollToTop = () => {
    const mainContent = document.querySelector('main');
    mainContent?.scrollTo({ top: 0, behavior: 'smooth' });
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

  // TanStack Table columns definition
  const columns = useMemo<ColumnDef<VarianceDetail>[]>(
    () => [
      {
        accessorKey: 'binLocation',
        header: 'Location',
        cell: (info) => <span className="font-medium">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'sku',
        header: 'SKU',
        cell: (info) => <span className="font-mono text-sm">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'batchNo',
        header: 'Batch No',
        cell: (info) => <span className="font-mono text-sm">{(info.getValue() as string) || '-'}</span>,
      },
      {
        accessorKey: 'freezeQty',
        header: 'Freeze Qty',
        cell: (info) => (
          <span className="font-semibold">{(info.getValue() as number).toLocaleString()}</span>
        ),
      },
      {
        accessorKey: 'countQty',
        header: 'Count Qty',
        cell: (info) => (
          <span className="font-semibold text-blue-600">{(info.getValue() as number).toLocaleString()}</span>
        ),
      },
      {
        accessorKey: 'variance',
        header: 'ผลต่าง',
        cell: (info) => {
          const row = info.row.original;
          const diff = row.countQty - row.freezeQty;
          return (
            <span className="font-bold text-red-600">
              {diff > 0 ? '+' : ''}{diff.toLocaleString()}
            </span>
          );
        },
      },
      {
        accessorKey: 'variancePercentage',
        header: '%',
        cell: (info) => (
          <span className="font-bold text-red-600">{info.getValue() as number}%</span>
        ),
      },
    ],
    []
  );

  // Filtered variances based on selected location and display mode
  const filteredVariances = useMemo(() => {
    if (!warehouseDetail) return [];
    
    const sourceData = displayMode === 'all' 
      ? warehouseDetail.allCountedItems 
      : warehouseDetail.variances;
    
    if (!selectedLocation) return sourceData;
    return sourceData.filter(v => v.binLocation === selectedLocation);
  }, [warehouseDetail, selectedLocation, displayMode]);

  // TanStack Table instance
  const table = useReactTable({
    data: filteredVariances,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

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

        {/* Hourly Location Count Chart */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-lg border-2 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              📈 จำนวน Location ที่นับในแต่ละชั่วโมง
            </h2>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          
          {hourlyData ? (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData.data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hour" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: 'จำนวน Location', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                    formatter={(value) => [`${value} locations`, 'จำนวน']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="locationCount" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 5 }}
                    activeDot={{ r: 8 }}
                    label={{ 
                      position: 'top', 
                      fill: '#059669',
                      fontSize: 12,
                      fontWeight: 'bold'
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-500">
              กำลังโหลดข้อมูล...
            </div>
          )}
          
          <div className="mt-0 text-sm text-gray-600 text-center">
            แสดงจำนวน Location ที่มีการนับในแต่ละชั่วโมง สำหรับวันที่ {selectedDate}
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
          
          {/* Toggle View Buttons - Show only for warehouses with locations */}
          {warehouseDetail.locations.length > 0 && (
            <div className="ml-auto flex gap-2">
              <Button 
                onClick={() => setBadgeView(false)} 
                variant={!badgeView ? 'default' : 'outline'}
                size="sm"
              >
                <ListFilter className="w-4 h-4 mr-1" />
                ดูแบบเต็ม
              </Button>
              <Button 
                onClick={() => setBadgeView(true)} 
                variant={badgeView ? 'default' : 'outline'}
                size="sm"
              >
                <Package className="w-4 h-4 mr-1" />
                ดู Badge
              </Button>
            </div>
          )}
        </div>

        {/* Warehouse Summary - Show in badge view */}
        {badgeView && (() => {
          const totalItems = warehouseDetail.locations.reduce((sum, loc) => sum + loc.totalItems, 0);
          const countedItems = warehouseDetail.locations.reduce((sum, loc) => sum + loc.countedItems, 0);
          const varianceItems = warehouseDetail.locations.reduce((sum, loc) => sum + loc.varianceItems, 0);
          const progressPercentage = totalItems > 0 ? Math.round((countedItems / totalItems) * 100) : 0;
          
          return (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                <p className="text-sm text-gray-600 mb-1">ทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-800">{totalItems}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                <p className="text-sm text-gray-600 mb-1">นับแล้ว</p>
                <p className="text-2xl font-bold text-green-600">{countedItems}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
                <p className="text-sm text-gray-600 mb-1">ไม่ตรง</p>
                <p className="text-2xl font-bold text-red-600">{varianceItems}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
                <p className="text-sm text-gray-600 mb-1">ความคืบหน้า</p>
                <p className="text-2xl font-bold text-purple-600">{progressPercentage}%</p>
              </div>
            </div>
          );
        })()}

        {/* Warehouse Hourly Location Count Chart */}
        <div className="mb-6 p-6 bg-white rounded-lg shadow-lg border-2 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              📈 จำนวน Location ที่นับในแต่ละชั่วโมง - {warehouseDetail.warehouse.whsName}
            </h2>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <input
                type="date"
                value={warehouseSelectedDate}
                onChange={(e) => setWarehouseSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          
          {warehouseHourlyData ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={warehouseHourlyData.data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hour" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: 'จำนวน Location', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                    formatter={(value) => [`${value} locations`, 'จำนวน']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="locationCount" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 5 }}
                    activeDot={{ r: 8 }}
                    label={{ 
                      position: 'top', 
                      fill: '#059669',
                      fontSize: 12,
                      fontWeight: 'bold'
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              กำลังโหลดข้อมูล...
            </div>
          )}
          
          <div className="mt-0 text-sm text-gray-600 text-center">
            แสดงจำนวน Location ที่มีการนับในแต่ละชั่วโมงของคลังนี้ สำหรับวันที่ {warehouseSelectedDate}
          </div>
        </div>

        {/* Location Badges Overview */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">📍 Location ทั้งหมด</h2>
          <div className="flex flex-wrap gap-2">
            {warehouseDetail.locations.map((loc) => {
              const isComplete = loc.progressPercentage === 100;
              const badgeColor = isComplete 
                ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' 
                : 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200';
              
              return (
                <button
                  key={loc.binId}
                  onClick={() => setSelectedLocation(loc.binLocation)}
                  className={`px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all ${badgeColor} ${
                    selectedLocation === loc.binLocation 
                      ? 'ring-2 ring-blue-400 scale-105' 
                      : 'hover:scale-105'
                  }`}
                >
                  {loc.binLocation} ({loc.progressPercentage}%)
                </button>
              );
            })}
          </div>
        </div>

        {/* Location Statistics - Hide in badge view */}
        {!badgeView && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">📍 สถานะแยกตาม Location</h2>
            {selectedLocation && (
              <Button 
                onClick={() => setSelectedLocation(null)} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                ล้างตัวกรอง
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouseDetail.locations.map((loc) => (
              <div 
                key={loc.binId} 
                className={`bg-white p-4 rounded-lg shadow border-2 transition-all cursor-pointer hover:shadow-lg ${
                  selectedLocation === loc.binLocation 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setSelectedLocation(loc.binLocation)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{loc.binLocation}</h3>
                    {selectedLocation === loc.binLocation && (
                      <Filter className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
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
        )}

        {/* Counting Details - Show when there are counted items and not in badge view */}
        {!badgeView && warehouseDetail.allCountedItems.length > 0 && (
          <div className={`p-6 rounded-lg border-2 ${displayMode === 'variance' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-2xl font-bold flex items-center gap-2 ${displayMode === 'variance' ? 'text-red-700' : 'text-blue-700'}`}>
                {displayMode === 'variance' ? (
                  <>
                    <AlertTriangle className="w-6 h-6" />
                    รายการที่มียอดไม่ตรง (ต้องตรวจสอบ)
                  </>
                ) : (
                  <>
                    <ListFilter className="w-6 h-6" />
                    รายการที่นับแล้วทั้งหมด
                  </>
                )}
                {selectedLocation && (
                  <span className="text-sm font-normal text-gray-600">
                    - {selectedLocation}
                  </span>
                )}
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => setDisplayMode('variance')}
                  variant={displayMode === 'variance' ? 'default' : 'outline'}
                  size="sm"
                >
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  เฉพาะที่ไม่ตรง ({warehouseDetail.variances.length})
                </Button>
                <Button
                  onClick={() => setDisplayMode('all')}
                  variant={displayMode === 'all' ? 'default' : 'outline'}
                  size="sm"
                >
                  <ListFilter className="w-4 h-4 mr-1" />
                  ทั้งหมด ({warehouseDetail.allCountedItems.length})
                </Button>
              </div>
            </div>
            {selectedLocation && (
              <p className="text-sm text-gray-600 mb-4">
                แสดง {filteredVariances.length} รายการจาก {displayMode === 'all' ? warehouseDetail.allCountedItems.length : warehouseDetail.variances.length} รายการทั้งหมด
              </p>
            )}
            {!selectedLocation && displayMode === 'variance' && (
              <p className="text-sm text-gray-600 mb-4">
                รายการที่ยอดนับไม่ตรงกับข้อมูล Freeze - ควรให้ Auditor ตรวจสอบและแก้ไข
              </p>
            )}
            
            {filteredVariances.length > 0 ? (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              className={`px-4 py-3 text-xs font-semibold text-gray-700 uppercase ${
                                ['freezeQty', 'countQty', 'variance', 'variancePercentage'].includes(header.id)
                                  ? 'text-right'
                                  : 'text-left'
                              } ${header.column.getCanSort() ? 'cursor-pointer select-none hover:bg-gray-100' : ''}`}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              <div className="flex items-center gap-1">
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {{
                                  asc: ' 🔼',
                                  desc: ' 🔽',
                                }[header.column.getIsSorted() as string] ?? null}
                            </div>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className={`px-4 py-3 text-sm ${
                              ['freezeQty', 'countQty', 'variance', 'variancePercentage'].includes(cell.column.id)
                                ? 'text-right'
                                : ''
                            }`}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            ) : (
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                <div className="flex items-center gap-3 justify-center text-gray-500">
                  <CheckCircle2 className="w-8 h-8" />
                  <div>
                    <h3 className="text-lg font-bold">
                      {displayMode === 'variance' 
                        ? 'ไม่พบรายการที่มียอดไม่ตรง' 
                        : selectedLocation 
                          ? `ไม่พบรายการที่นับแล้วใน ${selectedLocation}`
                          : 'ไม่พบรายการที่นับแล้ว'}
                    </h3>
                    <p className="text-sm">
                      {displayMode === 'variance' 
                        ? 'ยอดนับตรงกับข้อมูล Freeze ทั้งหมด' 
                        : 'กรุณาเลือก Location อื่นหรือคลิกล้างตัวกรอง'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No counted items at all */}
        {warehouseDetail.allCountedItems.length === 0 && (
          <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
            <div className="flex items-center gap-3 justify-center">
              <Package className="w-8 h-8 text-gray-400" />
              <div>
                <h3 className="text-xl font-bold text-gray-700">ยังไม่มีรายการนับ</h3>
                <p className="text-sm text-gray-600">เริ่มนับ Stock ในคลังนี้เพื่อดูข้อมูล</p>
              </div>
            </div>
          </div>
        )}

        {/* Back to Top Button */}
        {showBackToTop && (
          <Button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 rounded-full w-12 h-12 p-0 shadow-lg bg-primary hover:bg-primary/90 z-50"
            size="icon"
          >
            <ArrowUp className="w-6 h-6" />
          </Button>
        )}
      </div>
    );
  }

  return null;
}
