import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVehicle } from '../api/vehicles';
import {
  useTodoItems,
  useCreateTodoItem,
  useUpdateTodoItem,
  useDeleteTodoItem,
  VehicleTodo,
  CreateTodoPartDto,
} from '../api/todoItems';
import Card from '../components/Card';

interface PartFormData {
  name: string;
  link: string;
  price: string;
  notes: string;
}

const emptyPart = (): PartFormData => ({ name: '', link: '', price: '', notes: '' });

export default function TodoList() {
  const { t } = useTranslation();
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const { data: vehicle } = useVehicle(vehicleId!);
  const { data: todos, isLoading } = useTodoItems(vehicleId!);
  const createTodo = useCreateTodoItem();
  const updateTodo = useUpdateTodoItem();
  const deleteTodo = useDeleteTodoItem();

  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formParts, setFormParts] = useState<PartFormData[]>([]);

  const resetForm = () => {
    setFormTitle('');
    setFormNotes('');
    setFormParts([]);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parts: CreateTodoPartDto[] = formParts
        .filter((p) => p.name.trim())
        .map((p) => ({
          name: p.name.trim(),
          link: p.link.trim() || undefined,
          price: p.price ? parseFloat(p.price) : undefined,
          notes: p.notes.trim() || undefined,
        }));

      await createTodo.mutateAsync({
        vehicleId: vehicleId!,
        title: formTitle,
        notes: formNotes || undefined,
        parts,
      });
      resetForm();
    } catch (error) {
      console.error('Failed to create todo:', error);
    }
  };

  const handleToggleStatus = async (todo: VehicleTodo) => {
    try {
      await updateTodo.mutateAsync({
        id: todo.id,
        vehicleId: vehicleId!,
        dto: { status: todo.status === 'OPEN' ? 'DONE' : 'OPEN' },
      });
    } catch (error) {
      console.error('Failed to update todo status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('todo.deleteTodoConfirm'))) return;
    try {
      await deleteTodo.mutateAsync({ id, vehicleId: vehicleId! });
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const addPart = () => setFormParts([...formParts, emptyPart()]);

  const removePart = (index: number) =>
    setFormParts(formParts.filter((_, i) => i !== index));

  const updatePart = (index: number, field: keyof PartFormData, value: string) => {
    const updated = [...formParts];
    updated[index] = { ...updated[index], [field]: value };
    setFormParts(updated);
  };

  const calcTotalPrice = (todo: VehicleTodo) => {
    if (!todo.parts || todo.parts.length === 0) return null;
    const total = todo.parts.reduce((sum, p) => {
      if (p.price == null) return sum;
      return sum + parseFloat(p.price);
    }, 0);
    return total > 0 ? total : null;
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  const openCount = todos?.filter((t) => t.status === 'OPEN').length || 0;
  const doneCount = todos?.filter((t) => t.status === 'DONE').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to={`/vehicles/${vehicleId}`}
            className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← {t('cost.backToVehicle')}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{t('todo.todoList')}</h1>
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
          {showForm ? t('common.cancel') : `+ ${t('todo.addTodo')}`}
        </button>
      </div>

      {/* Summary */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{t('todo.status.OPEN')}</p>
            <p className="text-3xl font-bold text-gray-900">{openCount}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">{t('todo.status.DONE')}</p>
            <p className="text-3xl font-bold text-gray-900">{doneCount}</p>
          </div>
        </div>
      </Card>

      {/* Add Form */}
      {showForm && (
        <Card title={t('todo.addTodo')}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('todo.title')} *
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('todo.title')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('vehicle.notes')}
              </label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('placeholders.additionalDetails')}
              />
            </div>

            {/* Parts */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('todo.parts')}
                </label>
                <button
                  type="button"
                  onClick={addPart}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + {t('todo.addPart')}
                </button>
              </div>

              {formParts.map((part, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2 p-3 border border-gray-200 rounded-lg"
                >
                  <input
                    type="text"
                    required
                    placeholder={t('todo.partName') + ' *'}
                    value={part.name}
                    onChange={(e) => updatePart(index, 'name', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <input
                    type="url"
                    placeholder={t('todo.partLink')}
                    value={part.link}
                    onChange={(e) => updatePart(index, 'link', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={t('todo.partPrice')}
                    value={part.price}
                    onChange={(e) => updatePart(index, 'price', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={t('todo.partNotes')}
                      value={part.notes}
                      onChange={(e) => updatePart(index, 'notes', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removePart(index)}
                      className="text-red-600 hover:text-red-700 px-2"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createTodo.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {createTodo.isPending ? t('vehicle.creating') : t('todo.addTodo')}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Todo List */}
      <Card title={t('todo.todos')}>
        {todos && todos.length > 0 ? (
          <div className="space-y-3">
            {todos.map((todo) => {
              const totalPrice = calcTotalPrice(todo);
              const isExpanded = expandedId === todo.id;

              return (
                <div
                  key={todo.id}
                  className={`border rounded-lg transition-colors ${
                    todo.status === 'DONE'
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 p-4">
                    {/* Status toggle */}
                    <button
                      onClick={() => handleToggleStatus(todo)}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        todo.status === 'DONE'
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                      title={todo.status === 'DONE' ? t('todo.status.DONE') : t('todo.status.OPEN')}
                    >
                      {todo.status === 'DONE' && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>

                    {/* Title + info */}
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : todo.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            todo.status === 'DONE' ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}
                        >
                          {todo.title}
                        </span>
                        {todo.parts.length > 0 && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {todo.parts.length} {t('todo.parts')}
                          </span>
                        )}
                      </div>
                      {todo.notes && (
                        <p className="text-sm text-gray-500 mt-0.5">{todo.notes}</p>
                      )}
                    </div>

                    {/* Price + delete */}
                    <div className="flex items-center gap-4">
                      {totalPrice !== null && (
                        <span className="text-sm font-medium text-gray-700">
                          {formatCurrency(totalPrice)}
                        </span>
                      )}
                      <button
                        onClick={() => handleDelete(todo.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>

                  {/* Expanded parts */}
                  {isExpanded && todo.parts.length > 0 && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-3 mb-2">
                        {t('todo.parts')}
                      </p>
                      <div className="space-y-2">
                        {todo.parts.map((part) => (
                          <div
                            key={part.id}
                            className="flex items-start justify-between bg-white border border-gray-100 rounded p-2"
                          >
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">{part.name}</span>
                              {part.notes && (
                                <p className="text-xs text-gray-500 mt-0.5">{part.notes}</p>
                              )}
                              {part.link && (
                                <a
                                  href={part.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline mt-0.5 block truncate max-w-xs"
                                >
                                  {part.link}
                                </a>
                              )}
                            </div>
                            {part.price && (
                              <span className="text-sm font-medium text-gray-700 ml-4">
                                {formatCurrency(parseFloat(part.price))}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      {totalPrice !== null && (
                        <div className="flex justify-end mt-2 pt-2 border-t border-gray-100">
                          <span className="text-sm font-semibold text-gray-900">
                            {t('todo.totalPrice')}: {formatCurrency(totalPrice)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('todo.noTodosYet')}
            </h3>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('todo.addTodo')}
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
