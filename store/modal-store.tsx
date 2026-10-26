import { create } from 'zustand';
import { Task } from '@/types';

interface TaskStore {
  task: Task | null;
  setTask: (task: Task) => void;
  clearTask: () => void;
  setTaskForEdit: (task: Task) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  task: null,
  setTask: (newTask: Task) => set({ task: newTask }),
  clearTask: () => set({ task: null }),
  setTaskForEdit: (task: Task) => set({ task }),
}));
