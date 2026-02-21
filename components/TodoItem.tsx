"use client"
import { useState } from 'react';
import { TodoWithDeps, CriticalPathNode } from '@/hooks/useTodos';

interface TodoItemProps {
  todo: TodoWithDeps;
  allTodos: TodoWithDeps[];
  criticalPathNode?: CriticalPathNode;
  onDelete: (id: number) => void;
  onAddDependency: (todoId: number, dependencyId: number) => void;
  onRemoveDependency: (todoId: number, dependencyId: number) => void;
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

export default function TodoItem({
  todo,
  allTodos,
  criticalPathNode,
  onDelete,
  onAddDependency,
  onRemoveDependency,
}: TodoItemProps) {
  const [showDepEditor, setShowDepEditor] = useState(false);

  const dueDateStr = todo.dueDate;
  const imageUrl = todo.imageUrl;
  const isCritical = criticalPathNode?.onCriticalPath ?? false;
  const currentDepIds = todo.dependsOn.map((d) => d.dependencyId);

  // Todos available to add as dependencies (not self, not already a dep)
  const availableDeps = allTodos.filter(
    (t) => t.id !== todo.id && !currentDepIds.includes(t.id)
  );

  return (
    <li
      className={`bg-white bg-opacity-90 mb-4 rounded-lg shadow-lg overflow-hidden ${
        isCritical ? 'ring-2 ring-orange-400' : ''
      }`}
    >
      {imageUrl && (
        <img
          src={`/api/image-proxy?url=${encodeURIComponent(imageUrl)}`}
          alt={todo.title}
          className="w-full h-32 object-cover"
        />
      )}
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <span className="text-gray-800 font-medium">{todo.title}</span>
            {isCritical && (
              <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                Critical Path
              </span>
            )}
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
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={() => setShowDepEditor(!showDepEditor)}
              className="text-gray-400 hover:text-indigo-600 transition duration-300"
              title="Edit dependencies"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(todo.id)}
              className="text-red-500 hover:text-red-700 transition duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Current dependencies */}
        {todo.dependsOn.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-500">
              Depends on:{' '}
              {todo.dependsOn.map((dep, i) => (
                <span key={dep.id}>
                  <span className="text-indigo-600">{dep.dependency.title}</span>
                  {showDepEditor && (
                    <button
                      onClick={() => onRemoveDependency(todo.id, dep.dependencyId)}
                      className="text-red-400 hover:text-red-600 ml-0.5 text-xs"
                    >
                      ×
                    </button>
                  )}
                  {i < todo.dependsOn.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
          </div>
        )}

        {/* Dependency editor */}
        {showDepEditor && availableDeps.length > 0 && (
          <div className="mt-2 border-t pt-2">
            <p className="text-xs text-gray-500 mb-1">Add dependency:</p>
            <div className="flex flex-wrap gap-1">
              {availableDeps.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onAddDependency(todo.id, t.id)}
                  className="text-xs bg-gray-100 hover:bg-indigo-100 text-gray-700 px-2 py-1 rounded"
                >
                  + {t.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
