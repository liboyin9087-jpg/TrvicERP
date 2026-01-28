import React, { useState } from 'react';
import type { Widget } from '@/core/types/dashboard';

interface Task {
  id: string;
  title: string;
  due: string;
  done: boolean;
}

interface PendingTasksWidgetConfig {
  initialTasks: Task[];
}

interface PendingTasksWidgetProps extends Widget, PendingTasksWidgetConfig {}

export default function PendingTasksWidget({ title, initialTasks }: PendingTasksWidgetProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 drag-handle">
        <h3 className="text-lg font-semibold text-gray-900">{title || 'Pending Tasks'}</h3>
      </div>

      <div className="flex-grow overflow-y-auto space-y-3">
        {tasks.map((task) => (
          <label key={task.id} className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => toggleTask(task.id)}
              className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <div className={`text-sm ${task.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                {task.title}
              </div>
              <div className="text-sm text-gray-500">Due {task.due}</div>
            </div>
          </label>
        ))}
        {tasks.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No pending tasks.</p>
        )}
      </div>
    </div>
  );
}