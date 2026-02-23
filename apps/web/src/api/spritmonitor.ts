import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export interface SpritmonitorStats {
  consumption: string;
  consumptionunit: string;
}

export interface SpritmonitorVehicle {
  id: string;
  make: string;
  model: string;
}

export const useSpritmonitorStats = (vehicleId: string) => {
  return useQuery<SpritmonitorStats | null>({
    queryKey: ['spritmonitor', 'stats', vehicleId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/spritmonitor/stats/${vehicleId}`);
      return data;
    },
    enabled: !!vehicleId,
  });
};

export const useSpritmonitorVehicles = (apiKey: string | null) => {
  return useQuery<SpritmonitorVehicle[]>({
    queryKey: ['spritmonitor', 'vehicles', apiKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/spritmonitor/vehicles', {
        params: { apiKey },
      });
      return data;
    },
    enabled: !!apiKey,
    retry: false,
  });
};
