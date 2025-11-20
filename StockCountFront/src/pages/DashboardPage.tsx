export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Warehouses</h3>
          <p className="text-3xl font-bold text-blue-600">-</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Locations</h3>
          <p className="text-3xl font-bold text-green-600">-</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Mappings</h3>
          <p className="text-3xl font-bold text-purple-600">-</p>
        </div>
      </div>
    </div>
  );
}
