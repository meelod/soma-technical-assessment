"use client"
import { useState } from 'react';

interface TodoFormProps {
  onAdd: (title: string, dueDate?: string | null) => void;
}

export default function TodoForm({ onAdd }: TodoFormProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd(title, dueDate || null);
    setTitle('');
    setDueDate('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="flex mb-6">
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
        onClick={handleSubmit}
        className="bg-white text-indigo-600 p-3 rounded-r-full hover:bg-gray-100 transition duration-300"
      >
        Add
      </button>
    </div>
  );
}
