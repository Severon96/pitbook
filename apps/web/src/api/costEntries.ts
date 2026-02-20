import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

export type CostCategory = 'FUEL' | 'SERVICE' | 'REPAIR' | 'INSURANCE' | 'TAX' | 'PARTS' | 'OTHER';
export type CostSource = 'MANUAL' | 'SPRITMONITOR';

export interface CostEntry {
  id: string;
  vehicleId: string;
  seasonId?: string;
  category: CostCategory;
  title: string;
  date: string;
  totalAmount: string;
  notes?: string;
  receiptUrl?: string;
  source: CostSource;
  createdAt: string;
  updatedAt: string;
  items?: CostEntryItem[];
}

export interface CostEntryItem {
  id: string;
  costEntryId: string;
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
}

export interface CreateCostEntryDto {
  vehicleId: string;
  seasonId?: string;
  category: CostCategory;
  title: string;
  date: string;
  totalAmount?: number;
  notes?: string;
  receiptUrl?: string;
  source?: CostSource;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
}

// Get cost entries for a vehicle
export const useCostEntries = (vehicleId: string, seasonId?: string) => {
  return useQuery<CostEntry[]>({
    queryKey: ['costEntries', vehicleId, seasonId],
    queryFn: async () => {
      const params = new URLSearchParams({ vehicleId });
      if (seasonId) params.append('seasonId', seasonId);
      const { data } = await apiClient.get(`/cost-entries?${params}`);
      return data;
    },
    enabled: !!vehicleId,
  });
};

// Get single cost entry
export const useCostEntry = (id: string) => {
  return useQuery<CostEntry>({
    queryKey: ['costEntries', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/cost-entries/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

// Create cost entry
export const useCreateCostEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: CreateCostEntryDto) => {
      const { data } = await apiClient.post('/cost-entries', entry);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['costEntries', variables.vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['vehicles', variables.vehicleId, 'summary'] });
    },
  });
};

// Delete cost entry
export const useDeleteCostEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/cost-entries/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costEntries'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
};
