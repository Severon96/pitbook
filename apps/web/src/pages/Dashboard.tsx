import { Link } from 'react-router-dom';
import { useVehicles } from '../api/vehicles';
import Card from '../components/Card';

export default function Dashboard() {
  const { data: vehicles, isLoading } = useVehicles();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const totalVehicles = vehicles?.length || 0;
  const dailyVehicles = vehicles?.filter((v) => v.type === 'DAILY').length || 0;
  const seasonalVehicles = vehicles?.filter((v) => v.type === 'SEASONAL').length || 0;
  const totalCosts = vehicles?.reduce((sum, v) => sum + (v._count?.costEntries || 0), 0) || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Track your vehicle costs and maintenance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{totalVehicles}</p>
            </div>
            <div className="text-4xl">🚗</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Daily Vehicles</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{dailyVehicles}</p>
            </div>
            <div className="text-4xl">🚙</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Seasonal Vehicles</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{seasonalVehicles}</p>
            </div>
            <div className="text-4xl">🏎️</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cost Entries</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{totalCosts}</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </Card>
      </div>

      <Card title="Recent Vehicles">
        {vehicles && vehicles.length > 0 ? (
          <div className="space-y-4">
            {vehicles.slice(0, 5).map((vehicle) => (
              <Link
                key={vehicle.id}
                to={`/vehicles/${vehicle.id}`}
                className="block p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{vehicle.name}</h3>
                    <p className="text-sm text-gray-600">
                      {vehicle.brand} {vehicle.model} ({vehicle.year})
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        vehicle.type === 'DAILY'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {vehicle.type}
                    </span>
                    <p className="mt-1 text-sm text-gray-600">
                      {vehicle._count?.costEntries || 0} cost entries
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No vehicles yet</p>
            <Link
              to="/vehicles"
              className="mt-2 inline-block text-blue-600 hover:text-blue-700"
            >
              Add your first vehicle
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
