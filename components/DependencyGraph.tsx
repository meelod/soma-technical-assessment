"use client"
import { useRef, useEffect, useCallback } from 'react';
import { CriticalPathData } from '@/hooks/useTodos';

interface DependencyGraphProps {
  data: CriticalPathData | null;
}

interface NodePosition {
  id: number;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  earliestStart: number;
  earliestFinish: number;
  onCriticalPath: boolean;
  dependsOnIds: number[];
}

export default function DependencyGraph({ data }: DependencyGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    if (!data || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { nodes } = data;
    if (nodes.length === 0) return;

    // Layout config
    const nodeWidth = 150;
    const nodeHeight = 56;
    const layerGapX = 180;
    const nodeGapY = 24;
    const padding = 30;

    // Build dependency map
    const depMap = new Map<number, number[]>();
    for (const node of nodes) {
      depMap.set(node.id, node.dependsOnIds);
    }

    // Assign layers: layer = longest path from any root to this node
    const layers = new Map<number, number>();

    function getLayer(id: number, visited: Set<number>): number {
      if (layers.has(id)) return layers.get(id)!;
      if (visited.has(id)) return 0;
      visited.add(id);
      const deps = depMap.get(id) || [];
      if (deps.length === 0) {
        layers.set(id, 0);
        return 0;
      }
      const maxDepLayer = Math.max(...deps.map((d) => getLayer(d, new Set(visited))));
      const layer = maxDepLayer + 1;
      layers.set(id, layer);
      return layer;
    }

    for (const node of nodes) {
      getLayer(node.id, new Set());
    }

    // Group by layer
    const layerGroups = new Map<number, typeof nodes>();
    for (const node of nodes) {
      const layer = layers.get(node.id) ?? 0;
      if (!layerGroups.has(layer)) layerGroups.set(layer, []);
      layerGroups.get(layer)!.push(node);
    }

    const maxLayer = Math.max(...Array.from(layers.values()), 0);
    let maxNodesInLayer = 0;
    for (const group of layerGroups.values()) {
      maxNodesInLayer = Math.max(maxNodesInLayer, group.length);
    }

    // Calculate logical canvas size
    const logicalWidth = (maxLayer + 1) * layerGapX + padding * 2;
    const logicalHeight = Math.max(
      maxNodesInLayer * nodeHeight + (maxNodesInLayer - 1) * nodeGapY + padding * 2,
      180
    );

    // Handle HiDPI / Retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    canvas.style.width = `${logicalWidth}px`;
    canvas.style.height = `${logicalHeight}px`;
    ctx.scale(dpr, dpr);

    // Calculate positions
    const positions = new Map<number, NodePosition>();
    for (let layer = 0; layer <= maxLayer; layer++) {
      const group = layerGroups.get(layer) || [];
      const totalHeight = group.length * nodeHeight + (group.length - 1) * nodeGapY;
      const startY = (logicalHeight - totalHeight) / 2;

      group.forEach((node, idx) => {
        positions.set(node.id, {
          id: node.id,
          title: node.title,
          x: padding + layer * layerGapX,
          y: startY + idx * (nodeHeight + nodeGapY),
          width: nodeWidth,
          height: nodeHeight,
          earliestStart: node.earliestStart,
          earliestFinish: node.earliestFinish,
          onCriticalPath: node.onCriticalPath,
          dependsOnIds: node.dependsOnIds,
        });
      });
    }

    // Clear
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);

    // Draw edges with curved lines
    for (const pos of positions.values()) {
      for (const depId of pos.dependsOnIds) {
        const from = positions.get(depId);
        if (!from) continue;

        const fromX = from.x + from.width;
        const fromY = from.y + from.height / 2;
        const toX = pos.x;
        const toY = pos.y + pos.height / 2;
        const bothCritical = from.onCriticalPath && pos.onCriticalPath;

        const cpOffset = (toX - fromX) * 0.4;

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.bezierCurveTo(fromX + cpOffset, fromY, toX - cpOffset, toY, toX, toY);
        ctx.strokeStyle = bothCritical ? '#f97316' : '#c4c4c4';
        ctx.lineWidth = bothCritical ? 2.5 : 1.5;
        ctx.stroke();

        // Arrowhead
        // Approximate tangent at the end of the bezier
        const t = 0.95;
        const ax = 3 * (1 - t) * (1 - t) * (fromX + cpOffset - fromX)
          + 6 * (1 - t) * t * (toX - cpOffset - fromX - cpOffset)
          + 3 * t * t * (toX - toX + cpOffset);
        const ay = 3 * (1 - t) * (1 - t) * (fromY - fromY)
          + 6 * (1 - t) * t * (toY - fromY)
          + 3 * t * t * (toY - toY);
        const angle = Math.atan2(toY - fromY, toX - fromX); // simplified
        const arrowLen = 8;

        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(
          toX - arrowLen * Math.cos(angle - Math.PI / 7),
          toY - arrowLen * Math.sin(angle - Math.PI / 7)
        );
        ctx.lineTo(
          toX - arrowLen * Math.cos(angle + Math.PI / 7),
          toY - arrowLen * Math.sin(angle + Math.PI / 7)
        );
        ctx.closePath();
        ctx.fillStyle = bothCritical ? '#f97316' : '#c4c4c4';
        ctx.fill();
      }
    }

    // Draw nodes
    for (const pos of positions.values()) {
      const r = 8;

      // Shadow
      ctx.shadowColor = 'rgba(0,0,0,0.08)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      // Background
      ctx.fillStyle = pos.onCriticalPath ? '#fff7ed' : '#ffffff';
      ctx.beginPath();
      ctx.moveTo(pos.x + r, pos.y);
      ctx.lineTo(pos.x + pos.width - r, pos.y);
      ctx.quadraticCurveTo(pos.x + pos.width, pos.y, pos.x + pos.width, pos.y + r);
      ctx.lineTo(pos.x + pos.width, pos.y + pos.height - r);
      ctx.quadraticCurveTo(pos.x + pos.width, pos.y + pos.height, pos.x + pos.width - r, pos.y + pos.height);
      ctx.lineTo(pos.x + r, pos.y + pos.height);
      ctx.quadraticCurveTo(pos.x, pos.y + pos.height, pos.x, pos.y + pos.height - r);
      ctx.lineTo(pos.x, pos.y + r);
      ctx.quadraticCurveTo(pos.x, pos.y, pos.x + r, pos.y);
      ctx.closePath();
      ctx.fill();

      // Reset shadow for border
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Border
      ctx.strokeStyle = pos.onCriticalPath ? '#f97316' : '#e5e7eb';
      ctx.lineWidth = pos.onCriticalPath ? 2 : 1;
      ctx.stroke();

      // Title (vertically centered in the node)
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 12px system-ui, sans-serif';
      const maxTextWidth = pos.width - 16;
      let displayTitle = pos.title;
      while (ctx.measureText(displayTitle).width > maxTextWidth && displayTitle.length > 3) {
        displayTitle = displayTitle.slice(0, -4) + '...';
      }
      ctx.fillText(displayTitle, pos.x + 8, pos.y + pos.height / 2 + 4);
    }
  }, [data]);

  useEffect(() => {
    draw();
  }, [draw]);

  if (!data || data.nodes.length === 0) return null;

  return (
    <div ref={containerRef} className="mt-8 bg-white bg-opacity-90 rounded-lg shadow-lg p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Dependency Graph</h2>
      <div className="overflow-x-auto">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
