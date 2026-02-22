import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVehicle, useVehicleSummary, useDeleteVehicle } from '../api/vehicles';
import Card from '../components/Card';
import { format } from 'date-fns';
import { translateVehicleType, translateCostCategory, translateSeasonStatus } from '../utils/translations';

export default function VehicleDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: vehicle, isLoading } = useVehicle(id!);
  const { data: summary } = useVehicleSummary(id!);
  const deleteVehicle = useDeleteVehicle();

  const handleDelete = async () => {
    if (!confirm(t('vehicle.deleteConfirm'))) {
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
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">{t('vehicle.vehicleNotFound')}</h2>
        <Link to="/vehicles" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
          {t('vehicle.backToVehicles')}
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

  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return '-';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return '-';
      return format(dateObj, 'MMM d, yyyy');
    } catch {
      return '-';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/vehicles"
            className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← {t('vehicle.backToVehicles')}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{vehicle.name}</h1>
          <p className="mt-1 text-gray-600">
            {vehicle.brand} {vehicle.model} ({vehicle.year})
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/vehicles/${id}/costs`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('vehicle.manageCosts')}
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleteVehicle.isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleteVehicle.isPending ? t('vehicle.deleting') : t('common.delete')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{t('cost.totalCosts')}</p>
            <p className="text-2xl font-bold text-gray-900">
              {summary ? formatCurrency(summary.totalAmount) : '€0.00'}
            </p>
          </div>
        </Card>

        <Card>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{t('vehicle.costEntries')}</p>
            <p className="text-2xl font-bold text-gray-900">
              {summary?.entryCount || 0}
            </p>
          </div>
        </Card>

        <Card>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{t('vehicle.type')}</p>
            <span
              className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                vehicle.type === 'DAILY'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-purple-100 text-purple-800'
              }`}
            >
              {translateVehicleType(vehicle.type, t)}
            </span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={t('vehicle.vehicleInformation')}>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">{t('vehicle.brand')}</dt>
              <dd className="text-sm font-medium text-gray-900">{vehicle.brand}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">{t('vehicle.model')}</dt>
              <dd className="text-sm font-medium text-gray-900">{vehicle.model}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">{t('vehicle.buildYear')}</dt>
              <dd className="text-sm font-medium text-gray-900">{vehicle.year}</dd>
            </div>
            {vehicle.licensePlate && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">{t('vehicle.licensePlate')}</dt>
                <dd className="text-sm font-medium text-gray-900">{vehicle.licensePlate}</dd>
              </div>
            )}
            {vehicle.vin && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">{t('vehicle.vin')}</dt>
                <dd className="text-sm font-medium text-gray-900">{vehicle.vin}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">{t('vehicle.created')}</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formatDate(vehicle.createdAt)}
              </dd>
            </div>
          </dl>
          {vehicle.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-1">{t('vehicle.notes')}</p>
              <p className="text-sm text-gray-900">{vehicle.notes}</p>
            </div>
          )}
        </Card>

        {summary && summary.byCategory && summary.byCategory.length > 0 && (
          <Card title={t('cost.costsByCategory')}>
            <div className="space-y-3">
              {summary.byCategory.map((category) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-sm text-gray-900">{translateCostCategory(category.category, t)}</span>
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
          <Card title={t('season.seasons')}>
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
                      {translateSeasonStatus(season.status, t)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatDate(season.startDate)}
                    {season.endDate && ` - ${formatDate(season.endDate)}`}
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
