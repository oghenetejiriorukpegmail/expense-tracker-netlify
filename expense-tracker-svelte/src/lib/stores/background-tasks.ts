import { writable } from 'svelte/store';

export interface BackgroundTask {
  id: number;
  type: 'ocr' | 'export' | 'import';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TaskStore {
  tasks: Record<number, BackgroundTask>;
}

function createBackgroundTaskStore() {
  const { subscribe, update } = writable<TaskStore>({ tasks: {} });

  return {
    subscribe,
    
    addTask: (taskId: number, type: BackgroundTask['type']) => {
      update(store => {
        store.tasks[taskId] = {
          id: taskId,
          type,
          status: 'pending',
          progress: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return store;
      });
    },

    updateTask: (taskId: number, updates: Partial<BackgroundTask>) => {
      update(store => {
        if (store.tasks[taskId]) {
          store.tasks[taskId] = {
            ...store.tasks[taskId],
            ...updates,
            updatedAt: new Date()
          };
        }
        return store;
      });
    },

    removeTask: (taskId: number) => {
      update(store => {
        delete store.tasks[taskId];
        return store;
      });
    },

    getTask: (taskId: number) => {
      let task: BackgroundTask | undefined;
      update(store => {
        task = store.tasks[taskId];
        return store;
      });
      return task;
    }
  };
}

export const backgroundTasks = createBackgroundTaskStore();

// Poll for task status updates
export async function pollTaskStatus(taskId: number) {
  const pollInterval = 2000; // Poll every 2 seconds
  const maxAttempts = 30; // Maximum 1 minute of polling
  let attempts = 0;

  const poll = async () => {
    try {
      const response = await fetch(`/api/ocr/task/${taskId}`);
      if (!response.ok) throw new Error('Failed to fetch task status');
      
      const data = await response.json();
      
      backgroundTasks.updateTask(taskId, {
        status: data.status,
        progress: data.progress,
        result: data.results,
        error: data.error
      });

      if (data.status === 'completed' || data.status === 'failed') {
        return true;
      }
    } catch (error) {
      console.error('Error polling task status:', error);
      backgroundTasks.updateTask(taskId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to fetch task status'
      });
      return true;
    }

    attempts++;
    if (attempts >= maxAttempts) {
      backgroundTasks.updateTask(taskId, {
        status: 'failed',
        error: 'Task timed out'
      });
      return true;
    }

    return false;
  };

  const doPoll = async () => {
    const shouldStop = await poll();
    if (!shouldStop) {
      setTimeout(doPoll, pollInterval);
    }
  };

  doPoll();
}