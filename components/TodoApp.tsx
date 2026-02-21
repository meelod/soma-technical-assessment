"use client"
import { useTodos } from '@/hooks/useTodos';
import TodoForm from '@/components/TodoForm';
import TodoItem from '@/components/TodoItem';
import DependencyGraph from '@/components/DependencyGraph';

export default function TodoApp() {
  const { todos, criticalPathData, addTodo, deleteTodo, addDependency, removeDependency } = useTodos();

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 flex flex-col items-center p-4">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-center text-white mb-8">Things To Do App</h1>
        <div className="max-w-md mx-auto">
          <TodoForm onAdd={addTodo} todos={todos} />
        </div>
        <ul className="max-w-md mx-auto">
          {todos.map((todo) => {
            const cpNode = criticalPathData?.nodes.find((n) => n.id === todo.id);
            return (
              <TodoItem
                key={todo.id}
                todo={todo}
                allTodos={todos}
                criticalPathNode={cpNode}
                onDelete={deleteTodo}
                onAddDependency={addDependency}
                onRemoveDependency={removeDependency}
              />
            );
          })}
        </ul>
        <DependencyGraph data={criticalPathData} />
      </div>
    </div>
  );
}
