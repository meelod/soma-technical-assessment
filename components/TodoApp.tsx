"use client"
import { useTodos } from '@/hooks/useTodos';
import TodoForm from '@/components/TodoForm';
import TodoItem from '@/components/TodoItem';

export default function TodoApp() {
  const { todos, addTodo, deleteTodo } = useTodos();

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 flex flex-col items-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-white mb-8">Things To Do App</h1>
        <TodoForm onAdd={addTodo} />
        <ul>
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} onDelete={deleteTodo} />
          ))}
        </ul>
      </div>
    </div>
  );
}
