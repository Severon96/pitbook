import { apiClient } from './client';

export interface ExportOptions {
  vehicleId: string;
  seasonId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Export vehicle costs as CSV
 */
export const exportVehicleCostsCsv = async (options: ExportOptions): Promise<void> => {
  const params = new URLSearchParams();
  if (options.seasonId) params.append('seasonId', options.seasonId);
  if (options.dateFrom) params.append('dateFrom', options.dateFrom);
  if (options.dateTo) params.append('dateTo', options.dateTo);

  const queryString = params.toString();
  const url = `/reports/vehicle/${options.vehicleId}/csv${queryString ? `?${queryString}` : ''}`;

  const { data } = await apiClient.get(url, {
    responseType: 'blob',
  });

  // Create download link
  const blob = new Blob([data], { type: 'text/csv' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `cost-report-${options.vehicleId}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};
