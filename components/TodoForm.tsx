"use client"
import { useState } from 'react';
import { TodoWithDeps } from '@/hooks/useTodos';

interface TodoFormProps {
  onAdd: (title: string, dueDate?: string | null, dependencyIds?: number[]) => void;
  todos: TodoWithDeps[];
}

export default function TodoForm({ onAdd, todos }: TodoFormProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedDeps, setSelectedDeps] = useState<number[]>([]);
  const [showDepPicker, setShowDepPicker] = useState(false);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd(title, dueDate || null, selectedDeps.length > 0 ? selectedDeps : undefined);
    setTitle('');
    setDueDate('');
    setSelectedDeps([]);
    setShowDepPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const toggleDep = (id: number) => {
    setSelectedDeps((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  return (
    <div className="mb-6">
      <div className="flex">
        <input
          type="text"
          className="flex-grow p-3 rounded-l-full focus:outline-none text-gray-700"
          placeholder="Add a new todo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <input
          type="date"
          className="p-3 border-l border-gray-200 focus:outline-none text-gray-700 bg-white"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <button
          onClick={() => setShowDepPicker(!showDepPicker)}
          className={`p-3 border-l border-gray-200 bg-white text-gray-600 hover:bg-gray-100 transition duration-300 text-sm ${
            selectedDeps.length > 0 ? 'text-indigo-600 font-semibold' : ''
          }`}
          title="Select dependencies"
        >
          Deps{selectedDeps.length > 0 ? ` (${selectedDeps.length})` : ''}
        </button>
        <button
          onClick={handleSubmit}
          className="bg-white text-indigo-600 p-3 rounded-r-full hover:bg-gray-100 transition duration-300"
        >
          Add
        </button>
      </div>
      {showDepPicker && todos.length > 0 && (
        <div className="mt-2 bg-white rounded-lg p-3 shadow-lg max-h-40 overflow-y-auto">
          <p className="text-xs text-gray-500 mb-2">Select tasks this depends on:</p>
          {todos.map((todo) => (
            <label
              key={todo.id}
              className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 px-1 rounded"
            >
              <input
                type="checkbox"
                checked={selectedDeps.includes(todo.id)}
                onChange={() => toggleDep(todo.id)}
                className="rounded"
              />
              <span className="text-sm text-gray-700 truncate">{todo.title}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
