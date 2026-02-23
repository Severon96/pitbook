import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

export type VehicleTodoStatus = 'OPEN' | 'DONE';

export interface VehicleTodoPart {
  id: string;
  todoId: string;
  name: string;
  link?: string | null;
  price?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface VehicleTodo {
  id: string;
  vehicleId: string;
  title: string;
  status: VehicleTodoStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  parts: VehicleTodoPart[];
}

export interface CreateTodoPartDto {
  name: string;
  link?: string;
  price?: number;
  notes?: string;
}

export interface CreateTodoItemDto {
  vehicleId: string;
  title: string;
  notes?: string;
  parts?: CreateTodoPartDto[];
}

export interface UpdateTodoItemDto {
  title?: string;
  status?: VehicleTodoStatus;
  notes?: string;
  parts?: CreateTodoPartDto[];
}

export const useTodoItems = (vehicleId: string) => {
  return useQuery<VehicleTodo[]>({
    queryKey: ['todoItems', vehicleId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/todo-items?vehicleId=${vehicleId}`);
      return data;
    },
    enabled: !!vehicleId,
  });
};

export const useCreateTodoItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateTodoItemDto) => {
      const { data } = await apiClient.post('/todo-items', dto);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['todoItems', variables.vehicleId] });
    },
  });
};

export const useUpdateTodoItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateTodoItemDto; vehicleId: string }) => {
      const { data } = await apiClient.patch(`/todo-items/${id}`, dto);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['todoItems', variables.vehicleId] });
    },
  });
};

export const useDeleteTodoItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; vehicleId: string }) => {
      const { data } = await apiClient.delete(`/todo-items/${id}`);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['todoItems', variables.vehicleId] });
    },
  });
};
