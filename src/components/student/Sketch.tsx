/**
 * Sketch (1.4)
 * Freeform drawing by the student. Minimal canvas — just a pencil.
 * Drawing colour: ink-soft (pencil). Stroke weight: 2px default.
 * See: 06-component-inventory.md, Family 1.
 */
import { useRef, useCallback, useState } from 'react';
import { colors } from '@/tokens/colors';
import styles from './Sketch.module.css';

interface SketchProps {
  height?: number;
}

interface Point {
  x: number;
  y: number;
}

export function Sketch({ height = 160 }: SketchProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const lastPoint = useRef<Point | null>(null);

  const getPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent): Point => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const clientX =
        'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
      const clientY =
        'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    },
    [],
  );

  const startDraw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      setDrawing(true);
      lastPoint.current = getPos(e);
    },
    [getPos],
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!drawing || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx || !lastPoint.current) return;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = colors.inkSoft;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();
      lastPoint.current = pos;
    },
    [drawing, getPos],
  );

  const endDraw = useCallback(() => {
    setDrawing(false);
    lastPoint.current = null;
  }, []);

  return (
    <div className={styles.canvas} style={{ minHeight: height }}>
      <canvas
        ref={canvasRef}
        width={560}
        height={height}
        style={{ display: 'block', width: '100%', height: '100%' }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
    </div>
  );
}
