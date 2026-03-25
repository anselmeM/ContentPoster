import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { tasksService } from '../../services/firebase';
import clsx from 'clsx';

const TasksView = ({ searchQuery }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = tasksService.subscribe(user.uid, (tasksData) => {
      setTasks(tasksData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Filter tasks based on search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;
    const query = searchQuery.toLowerCase();
    return tasks.filter(t => t.text?.toLowerCase().includes(query));
  }, [tasks, searchQuery]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    await tasksService.create(user.uid, {
      text: newTask.trim(),
      completed: false
    });
    setNewTask('');
  };

  const handleToggleTask = async (task) => {
    await tasksService.update(user.uid, task.id, { completed: !task.completed });
  };

  const handleDeleteTask = async (taskId) => {
    await tasksService.delete(user.uid, taskId);
  };

  return (
    <div className="p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <form onSubmit={handleAddTask} className="flex items-center mb-6">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task..."
            className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white flex-1 mr-4"
            aria-label="New task"
          />
          <button
            type="submit"
            className="btn-primary whitespace-nowrap"
          >
            Add Task
          </button>
        </form>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            {searchQuery ? 'No tasks match your search.' : 'No tasks yet. Add one above!'}
          </p>
        ) : (
          <div className="space-y-4" role="list" aria-label="Task list">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="task-item flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
                role="listitem"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task)}
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 mr-4"
                    aria-label={task.completed ? 'Mark task as incomplete' : 'Mark task as complete'}
                  />
                  <span className={clsx(
                    'dark:text-white',
                    task.completed && 'line-through text-gray-400'
                  )}>
                    {task.text}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-2"
                  aria-label={`Delete task: ${task.text}`}
                >
                  <i className="fas fa-trash-alt" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksView;