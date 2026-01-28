import React, { useState } from 'react';
import type { Widget } from '@/core/types/dashboard';
import { PENDING_TASKS } from '@/data/dashboardData';

export default function PendingTasksWidget(_: { widget: Widget }) {
  const [tasks, setTasks] = useState(PENDING_TASKS);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  };

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <label key={task.id} className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={task.done}
            onChange={() => toggleTask(task.id)}
            className="mt-1 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <div>
            <div className={`text-sm ${task.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {task.title}
            </div>
            <div className="text-sm text-gray-500">Due {task.due}</div>
          </div>
        </label>
      ))}
    </div>
  );
}
