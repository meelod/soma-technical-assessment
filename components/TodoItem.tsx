"use client"
import { Todo } from '@prisma/client';

interface TodoItemProps {
  todo: Todo;
  onDelete: (id: number) => void;
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function TodoItem({ todo, onDelete }: TodoItemProps) {
  const dueDateStr = todo.dueDate as unknown as string | null;

  return (
    <li className="flex justify-between items-center bg-white bg-opacity-90 p-4 mb-4 rounded-lg shadow-lg">
      <div>
        <span className="text-gray-800">{todo.title}</span>
        {dueDateStr && (
          <p
            className={`text-sm mt-1 ${
              isOverdue(dueDateStr) ? 'text-red-500 font-semibold' : 'text-gray-500'
            }`}
          >
            Due: {formatDate(dueDateStr)}
          </p>
        )}
      </div>
      <button
        onClick={() => onDelete(todo.id)}
        className="text-red-500 hover:text-red-700 transition duration-300"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </li>
  );
}
