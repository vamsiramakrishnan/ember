/**
 * useCanvasPositions — spatial positions for canvas mode elements.
 */
import { useState, useCallback } from 'react';
import type { CanvasPosition } from '@/types/canvas';

export function useCanvasPositions(initial: CanvasPosition[]) {
  const [positions, setPositions] = useState(initial);

  const updatePosition = useCallback(
    (id: string, x: number, y: number) => {
      setPositions((prev) =>
        prev.map((p) => (p.id === id ? { ...p, x, y } : p)),
      );
    },
    [],
  );

  return { positions, updatePosition };
}
