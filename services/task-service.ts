import type { AxiosResponse } from 'axios';
import { api } from '@/lib/api';
import type { Task, TaskEntry } from '@/types';
import { SearchParamsOptions, queryParamsMapping } from '@/lib/util/filter';

interface TaskLabelRelation {
  labelId: string;
  taskId: string;
}

export const TaskService = {
  createTask: async (task: TaskEntry): Promise<Task> => {
    const response: AxiosResponse<Task> = await api.post('/tasks', task);
    return response.data;
  },

  getTasks: async (
    params: Partial<SearchParamsOptions> = {},
  ): Promise<Task[]> => {
    const queryParams: Record<string, string | boolean | number> = {};

    Object.entries(queryParamsMapping).forEach(([param, queryParam]) => {
      const paramValue = params[param as keyof SearchParamsOptions];

      if (paramValue !== undefined) {
        queryParams[queryParam] = paramValue;
      }
    });

    const response: AxiosResponse<Task[]> = await api.get('/tasks', {
      params: queryParams,
    });

    return response.data;
  },

  getTask: async (taskId: string): Promise<Task> => {
    const response: AxiosResponse<Task> = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  updateTask: async (
    taskId: string,
    updatedTask: Partial<TaskEntry>,
  ): Promise<Task> => {
    const response: AxiosResponse<Task> = await api.patch(
      `/tasks/${taskId}`,
      updatedTask,
    );
    return response.data;
  },

  deleteTask: async (taskId: string): Promise<Task> => {
    const response: AxiosResponse<Task> = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },

  addLabel: async ({ taskId, labelId }: TaskLabelRelation): Promise<void> => {
    await api.post(`/tasks/${taskId}/labels/${labelId}`, null);
  },

  removeLabel: async ({ taskId, labelId }: TaskLabelRelation): Promise<void> => {
    await api.delete(`/tasks/${taskId}/labels/${labelId}`);
  },
};
