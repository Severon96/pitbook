import { useParams, Link, useNavigate } from 'react-router-dom';
import { useVehicle, useVehicleSummary, useDeleteVehicle } from '../api/vehicles';
import Card from '../components/Card';
import BrandLogo from '../components/BrandLogo';
import { format } from 'date-fns';

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: vehicle, isLoading } = useVehicle(id!);
  const { data: summary } = useVehicleSummary(id!);
  const deleteVehicle = useDeleteVehicle();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteVehicle.mutateAsync(id!);
      navigate('/vehicles');
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Vehicle not found</h2>
        <Link to="/vehicles" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
          Back to Vehicles
        </Link>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/vehicles"
            className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Back to Vehicles
          </Link>
          <div className="flex items-center gap-4 mt-2">
            <BrandLogo brand={vehicle.brand} size="xl" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{vehicle.name}</h1>
              <p className="mt-1 text-gray-600">
                {vehicle.brand} {vehicle.model} ({vehicle.year})
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/vehicles/${id}/costs`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Manage Costs
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleteVehicle.isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleteVehicle.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Total Costs</p>
            <p className="text-2xl font-bold text-gray-900">
              {summary ? formatCurrency(summary.totalAmount) : '€0.00'}
            </p>
          </div>
        </Card>

        <Card>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Cost Entries</p>
            <p className="text-2xl font-bold text-gray-900">
              {summary?.entryCount || 0}
            </p>
          </div>
        </Card>

        <Card>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Vehicle Type</p>
            <span
              className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                vehicle.type === 'DAILY'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-purple-100 text-purple-800'
              }`}
            >
              {vehicle.type}
            </span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Vehicle Information">
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Brand</dt>
              <dd className="text-sm font-medium text-gray-900">{vehicle.brand}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Model</dt>
              <dd className="text-sm font-medium text-gray-900">{vehicle.model}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Year</dt>
              <dd className="text-sm font-medium text-gray-900">{vehicle.year}</dd>
            </div>
            {vehicle.licensePlate && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">License Plate</dt>
                <dd className="text-sm font-medium text-gray-900">{vehicle.licensePlate}</dd>
              </div>
            )}
            {vehicle.vin && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">VIN</dt>
                <dd className="text-sm font-medium text-gray-900">{vehicle.vin}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Created</dt>
              <dd className="text-sm font-medium text-gray-900">
                {format(new Date(vehicle.createdAt), 'MMM d, yyyy')}
              </dd>
            </div>
          </dl>
          {vehicle.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Notes</p>
              <p className="text-sm text-gray-900">{vehicle.notes}</p>
            </div>
          )}
        </Card>

        {summary && summary.byCategory.length > 0 && (
          <Card title="Costs by Category">
            <div className="space-y-3">
              {summary.byCategory.map((category) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-sm text-gray-900">{category.category}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(category.amount)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {vehicle.type === 'SEASONAL' && vehicle.seasons && vehicle.seasons.length > 0 && (
          <Card title="Seasons">
            <div className="space-y-3">
              {vehicle.seasons.map((season) => (
                <div key={season.id} className="p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{season.name}</h4>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        season.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {season.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {format(new Date(season.startDate), 'MMM d, yyyy')}
                    {season.endDate && ` - ${format(new Date(season.endDate), 'MMM d, yyyy')}`}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
