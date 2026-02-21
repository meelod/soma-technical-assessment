"use client"
import { useState, useEffect } from 'react';

export interface TodoWithDeps {
  id: number;
  title: string;
  dueDate: string | null;
  imageUrl: string | null;
  duration: number;
  createdAt: string;
  dependsOn: { id: number; dependencyId: number; dependency: { id: number; title: string } }[];
  dependedBy: { id: number; dependentId: number; dependent: { id: number; title: string } }[];
}

export interface CriticalPathNode {
  id: number;
  title: string;
  duration: number;
  dependsOnIds: number[];
  earliestStart: number;
  earliestFinish: number;
  onCriticalPath: boolean;
}

export interface CriticalPathData {
  nodes: CriticalPathNode[];
  criticalPath: number[];
  projectFinish: number;
}

export function useTodos() {
  const [todos, setTodos] = useState<TodoWithDeps[]>([]);
  const [criticalPathData, setCriticalPathData] = useState<CriticalPathData | null>(null);

  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/todos');
      const data = await res.json();
      setTodos(data);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    }
  };

  const fetchCriticalPath = async () => {
    try {
      const res = await fetch('/api/todos/critical-path');
      const data = await res.json();
      setCriticalPathData(data);
    } catch (error) {
      console.error('Failed to fetch critical path:', error);
    }
  };

  const addTodo = async (title: string, dueDate?: string | null, dependencyIds?: number[]) => {
    if (!title.trim()) return;
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, dueDate: dueDate || null }),
      });
      const newTodo = await res.json();

      // Add dependencies if any
      if (dependencyIds && dependencyIds.length > 0) {
        await Promise.all(
          dependencyIds.map((depId) =>
            fetch(`/api/todos/${newTodo.id}/dependencies`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dependencyId: depId }),
            })
          )
        );
      }

      fetchTodos();
      fetchCriticalPath();
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      fetchTodos();
      fetchCriticalPath();
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const addDependency = async (todoId: number, dependencyId: number) => {
    try {
      const res = await fetch(`/api/todos/${todoId}/dependencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dependencyId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to add dependency');
        return;
      }
      fetchTodos();
      fetchCriticalPath();
    } catch (error) {
      console.error('Failed to add dependency:', error);
    }
  };

  const removeDependency = async (todoId: number, dependencyId: number) => {
    try {
      await fetch(`/api/todos/${todoId}/dependencies`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dependencyId }),
      });
      fetchTodos();
      fetchCriticalPath();
    } catch (error) {
      console.error('Failed to remove dependency:', error);
    }
  };

  useEffect(() => {
    fetchTodos();
    fetchCriticalPath();
  }, []);

  return { todos, criticalPathData, addTodo, deleteTodo, addDependency, removeDependency };
}
