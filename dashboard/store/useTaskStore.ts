import { create } from 'zustand';
import { useGamificationStore } from './useGamificationStore';

export interface Task {
    id: string;
    title: string;
    description?: string;
    agentId: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'FAILED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    logs: string[];
    updatedAt: number;
}

interface TaskState {
    tasks: Record<string, Task>;
    addTask: (task: Task) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    appendLog: (taskId: string, log: string) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
    tasks: {},
    addTask: (task) => set((state) => ({
        tasks: { ...state.tasks, [task.id]: task }
    })),
    updateTask: (id, updates) => set((state) => {
        const task = state.tasks[id];

        // Trigger gamification if status changes to DONE
        if (task && updates.status === 'DONE' && task.status !== 'DONE') {
            useGamificationStore.getState().awardXP(task.agentId, 25, 'task_completed', id);
            useGamificationStore.getState().updateMissionProgress('task_count', 1);
        }

        return {
            tasks: {
                ...state.tasks,
                [id]: { ...task, ...updates, updatedAt: Date.now() }
            }
        };
    }),
    appendLog: (taskId, log) => set((state) => {
        const task = state.tasks[taskId];
        if (!task) return state;
        return {
            tasks: {
                ...state.tasks,
                [taskId]: {
                    ...task,
                    logs: [...task.logs, log],
                    updatedAt: Date.now()
                }
            }
        };
    })
}));
