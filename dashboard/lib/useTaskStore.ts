import { create } from 'zustand';
import { ToolCallData } from '@/components/ToolNodeCard';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'FAILED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Task {
    id: string;
    title: string;
    description?: string;
    agentId: string;
    status: TaskStatus;
    priority: TaskPriority;
    logs?: string[];
    toolCalls?: ToolCallData[];
    topP?: number;
    temp?: number;
    tokens?: number;
    updatedAt: number;
    timestamp: string;
}

interface TaskState {
    tasks: Task[];

    // Actions
    addTask: (task: Task) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    updateTaskStatus: (id: string, status: TaskStatus) => void;
    removeTask: (id: string) => void;
    clearTasks: () => void;
}

export const useTaskStore = create<TaskState>((set) => ({
    tasks: [],

    addTask: (task) => set((state) => {
        if (state.tasks.some(t => t.id === task.id)) return state;
        return { tasks: [task, ...state.tasks] };
    }),

    updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: Date.now(), timestamp: new Date().toLocaleTimeString() } : t)
    })),

    updateTaskStatus: (id, status) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, status, updatedAt: Date.now(), timestamp: new Date().toLocaleTimeString() } : t)
    })),

    removeTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
    })),

    clearTasks: () => set({ tasks: [] }),
}));
