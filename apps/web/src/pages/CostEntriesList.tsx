import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useVehicle } from '../api/vehicles';
import { useCostEntries, useCreateCostEntry, useDeleteCostEntry, CostCategory } from '../api/costEntries';
import Card from '../components/Card';
import { format } from 'date-fns';

const CATEGORIES: CostCategory[] = ['FUEL', 'SERVICE', 'REPAIR', 'INSURANCE', 'TAX', 'PARTS', 'OTHER'];

export default function CostEntriesList() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const { data: vehicle } = useVehicle(vehicleId!);
  const { data: costEntries, isLoading } = useCostEntries(vehicleId!);
  const createCostEntry = useCreateCostEntry();
  const deleteCostEntry = useDeleteCostEntry();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: 'FUEL' as CostCategory,
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    totalAmount: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCostEntry.mutateAsync({
        vehicleId: vehicleId!,
        category: formData.category,
        title: formData.title,
        date: new Date(formData.date).toISOString(),
        totalAmount: parseFloat(formData.totalAmount),
        notes: formData.notes || undefined,
      });
      setShowForm(false);
      setFormData({
        category: 'FUEL',
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        totalAmount: '',
        notes: '',
      });
    } catch (error) {
      console.error('Failed to create cost entry:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cost entry?')) {
      return;
    }
    try {
      await deleteCostEntry.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete cost entry:', error);
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const getCategoryColor = (category: CostCategory) => {
    const colors: Record<CostCategory, string> = {
      FUEL: 'bg-blue-100 text-blue-800',
      SERVICE: 'bg-green-100 text-green-800',
      REPAIR: 'bg-red-100 text-red-800',
      INSURANCE: 'bg-purple-100 text-purple-800',
      TAX: 'bg-yellow-100 text-yellow-800',
      PARTS: 'bg-orange-100 text-orange-800',
      OTHER: 'bg-gray-100 text-gray-800',
    };
    return colors[category];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const totalCosts = costEntries?.reduce((sum, entry) => sum + parseFloat(entry.totalAmount), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to={`/vehicles/${vehicleId}`}
            className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Back to Vehicle
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Cost Entries</h1>
          {vehicle && (
            <p className="mt-1 text-gray-600">
              {vehicle.name} - {vehicle.brand} {vehicle.model}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Cost Entry'}
        </button>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Costs</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalCosts)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Entries</p>
            <p className="text-3xl font-bold text-gray-900">{costEntries?.length || 0}</p>
          </div>
        </div>
      </Card>

      {showForm && (
        <Card title="Add Cost Entry">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as CostCategory })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Oil change, Fuel fillup"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional details..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createCostEntry.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {createCostEntry.isPending ? 'Creating...' : 'Add Entry'}
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card title="Cost History">
        {costEntries && costEntries.length > 0 ? (
          <div className="space-y-3">
            {costEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(entry.category)}`}>
                      {entry.category}
                    </span>
                    <h3 className="font-medium text-gray-900">{entry.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    {format(new Date(entry.date), 'MMM d, yyyy')}
                  </p>
                  {entry.notes && (
                    <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(entry.totalAmount)}
                    </p>
                    <p className="text-xs text-gray-500">{entry.source}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No cost entries yet
            </h3>
            <p className="text-gray-600 mb-4">
              Add your first cost entry to start tracking expenses
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Cost Entry
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
