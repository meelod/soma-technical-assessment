import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// Check if adding a dependency would create a cycle using DFS
async function wouldCreateCycle(dependentId: number, dependencyId: number): Promise<boolean> {
  // If dependentId === dependencyId, it's a self-loop
  if (dependentId === dependencyId) return true;

  // DFS from dependentId following "dependedBy" edges to see if we can reach dependencyId
  // i.e., check if dependencyId already transitively depends on dependentId
  const visited = new Set<number>();
  const stack = [dependentId];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);

    // Find all todos that depend on `current`
    const deps = await prisma.dependency.findMany({
      where: { dependencyId: current },
      select: { dependentId: true },
    });

    for (const dep of deps) {
      if (dep.dependentId === dependencyId) return true;
      stack.push(dep.dependentId);
    }
  }

  return false;
}

// POST: Add a dependency (todo `id` depends on `dependencyId`)
export async function POST(request: Request, { params }: Params) {
  const dependentId = parseInt(params.id);
  if (isNaN(dependentId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const { dependencyId } = await request.json();
    if (!dependencyId || isNaN(parseInt(dependencyId))) {
      return NextResponse.json({ error: 'Valid dependencyId is required' }, { status: 400 });
    }

    const depId = parseInt(dependencyId);

    // Verify both todos exist
    const [dependent, dependency] = await Promise.all([
      prisma.todo.findUnique({ where: { id: dependentId } }),
      prisma.todo.findUnique({ where: { id: depId } }),
    ]);

    if (!dependent || !dependency) {
      return NextResponse.json({ error: 'One or both todos not found' }, { status: 404 });
    }

    // Check for circular dependency
    const isCyclic = await wouldCreateCycle(dependentId, depId);
    if (isCyclic) {
      return NextResponse.json({ error: 'This would create a circular dependency' }, { status: 400 });
    }

    const dep = await prisma.dependency.create({
      data: {
        dependentId,
        dependencyId: depId,
      },
    });

    return NextResponse.json(dep, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Dependency already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error creating dependency' }, { status: 500 });
  }
}

// DELETE: Remove a dependency
export async function DELETE(request: Request, { params }: Params) {
  const dependentId = parseInt(params.id);
  if (isNaN(dependentId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const { dependencyId } = await request.json();
    if (!dependencyId) {
      return NextResponse.json({ error: 'dependencyId is required' }, { status: 400 });
    }

    await prisma.dependency.deleteMany({
      where: {
        dependentId,
        dependencyId: parseInt(dependencyId),
      },
    });

    return NextResponse.json({ message: 'Dependency removed' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error removing dependency' }, { status: 500 });
  }
}
