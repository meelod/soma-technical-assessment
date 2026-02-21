import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface TodoNode {
  id: number;
  title: string;
  duration: number;
  dependsOnIds: number[];
  earliestStart: number;
  earliestFinish: number;
  onCriticalPath: boolean;
}

export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      include: {
        dependsOn: { select: { dependencyId: true } },
      },
    });

    // Build node map
    const nodes = new Map<number, TodoNode>();
    for (const todo of todos) {
      nodes.set(todo.id, {
        id: todo.id,
        title: todo.title,
        duration: todo.duration,
        dependsOnIds: todo.dependsOn.map((d) => d.dependencyId),
        earliestStart: 0,
        earliestFinish: 0,
        onCriticalPath: false,
      });
    }

    // Topological sort (Kahn's algorithm)
    const inDegree = new Map<number, number>();
    for (const [id, node] of nodes) {
      inDegree.set(id, node.dependsOnIds.length);
    }

    const queue: number[] = [];
    for (const [id, degree] of inDegree) {
      if (degree === 0) queue.push(id);
    }

    const sorted: number[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      sorted.push(current);

      // Find nodes that depend on current
      for (const [id, node] of nodes) {
        if (node.dependsOnIds.includes(current)) {
          inDegree.set(id, (inDegree.get(id) || 1) - 1);
          if (inDegree.get(id) === 0) {
            queue.push(id);
          }
        }
      }
    }

    // Forward pass: calculate earliest start/finish
    for (const id of sorted) {
      const node = nodes.get(id)!;
      let maxPredFinish = 0;
      for (const depId of node.dependsOnIds) {
        const depNode = nodes.get(depId);
        if (depNode) {
          maxPredFinish = Math.max(maxPredFinish, depNode.earliestFinish);
        }
      }
      node.earliestStart = maxPredFinish;
      node.earliestFinish = maxPredFinish + node.duration;
    }

    // Find the overall project finish time
    let projectFinish = 0;
    for (const node of nodes.values()) {
      projectFinish = Math.max(projectFinish, node.earliestFinish);
    }

    // Backward pass: find critical path using latest start/finish
    const latestFinish = new Map<number, number>();
    const latestStart = new Map<number, number>();

    // Initialize all latest finishes to project finish
    for (const id of nodes.keys()) {
      latestFinish.set(id, projectFinish);
    }

    // Process in reverse topological order
    for (let i = sorted.length - 1; i >= 0; i--) {
      const id = sorted[i];
      const node = nodes.get(id)!;

      // Find minimum latest start of successors
      let minSuccLatestStart = projectFinish;
      for (const [succId, succNode] of nodes) {
        if (succNode.dependsOnIds.includes(id)) {
          minSuccLatestStart = Math.min(minSuccLatestStart, latestStart.get(succId) ?? projectFinish);
        }
      }

      latestFinish.set(id, minSuccLatestStart);
      latestStart.set(id, minSuccLatestStart - node.duration);
    }

    // A node is on the critical path if its slack (latest start - earliest start) is 0
    const criticalPath: number[] = [];
    for (const [id, node] of nodes) {
      const slack = (latestStart.get(id) || 0) - node.earliestStart;
      if (slack === 0 && node.duration > 0) {
        node.onCriticalPath = true;
        criticalPath.push(id);
      }
    }

    return NextResponse.json({
      nodes: Array.from(nodes.values()),
      criticalPath,
      projectFinish,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error calculating critical path' }, { status: 500 });
  }
}
