/**
 * useGraphInteraction — pan, zoom, and node drag state for GraphSVG.
 * Uses refs for interaction state to avoid re-renders during drag/zoom.
 */
import { useRef, useCallback, useState } from 'react';
import type { GraphNode } from './graph-layout';

interface DragState {
  type: 'pan' | 'node';
  nodeId?: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

export function useGraphInteraction(
  width: number,
  height: number,
  nodes: GraphNode[],
  onNodeDrag: (id: string, x: number, y: number) => void,
) {
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const dragRef = useRef<DragState | null>(null);
  const [viewBox, setViewBox] = useState(`0 0 ${width} ${height}`);

  const updateViewBox = useCallback(() => {
    const z = zoomRef.current;
    const p = panRef.current;
    setViewBox(`${-p.x / z} ${-p.y / z} ${width / z} ${height / z}`);
  }, [width, height]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    zoomRef.current = Math.min(3, Math.max(0.3, zoomRef.current * factor));
    updateViewBox();
  }, [updateViewBox]);

  const onBgMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    dragRef.current = {
      type: 'pan', startX: e.clientX, startY: e.clientY,
      originX: panRef.current.x, originY: panRef.current.y,
    };
  }, []);

  const onNodeMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === id);
    if (!node) return;
    dragRef.current = {
      type: 'node', nodeId: id, startX: e.clientX, startY: e.clientY,
      originX: node.x, originY: node.y,
    };
  }, [nodes]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (d.type === 'pan') {
      panRef.current = { x: d.originX + dx, y: d.originY + dy };
      updateViewBox();
    } else if (d.type === 'node' && d.nodeId) {
      const z = zoomRef.current;
      onNodeDrag(d.nodeId, d.originX + dx / z, d.originY + dy / z);
    }
  }, [onNodeDrag, updateViewBox]);

  const onMouseUp = useCallback(() => { dragRef.current = null; }, []);

  return { viewBox, onWheel, onBgMouseDown, onNodeMouseDown, onMouseMove, onMouseUp };
}
