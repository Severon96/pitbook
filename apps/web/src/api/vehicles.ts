import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  type: 'DAILY' | 'SEASONAL';
  licensePlate?: string;
  vin?: string;
  imageUrl?: string;
  notes?: string;
  spritmonitorVehicleId?: string;
  spritmonitorApiKey?: string;
  createdAt: string;
  updatedAt: string;
  seasons?: Season[];
  _count?: {
    costEntries: number;
  };
}

export interface Season {
  id: string;
  vehicleId: string;
  name: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'CLOSED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleSummary {
  totalAmount: number;
  entryCount: number;
  byCategory: Array<{
    category: string;
    amount: number;
  }>;
}

// Get all vehicles
export const useVehicles = () => {
  return useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data } = await apiClient.get('/vehicles');
      return data;
    },
  });
};

// Get single vehicle
export const useVehicle = (id: string) => {
  return useQuery<Vehicle>({
    queryKey: ['vehicles', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/vehicles/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

// Get vehicle summary
export const useVehicleSummary = (id: string) => {
  return useQuery<VehicleSummary>({
    queryKey: ['vehicles', id, 'summary'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/vehicles/${id}/summary`);
      return data;
    },
    enabled: !!id,
  });
};

// Create vehicle
export const useCreateVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vehicle: Partial<Vehicle>) => {
      const { data } = await apiClient.post('/vehicles', vehicle);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
};

// Update vehicle
export const useUpdateVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...vehicle }: Partial<Vehicle> & { id: string }) => {
      const { data } = await apiClient.put(`/vehicles/${id}`, vehicle);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles', variables.id] });
    },
  });
};

// Delete vehicle
export const useDeleteVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/vehicles/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
};
