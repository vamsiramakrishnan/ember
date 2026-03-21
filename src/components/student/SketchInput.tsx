/**
 * SketchInput (1.4 — input form)
 * A drawable canvas for the student to sketch in.
 * Minimal — just a pencil. Submit saves as data URL.
 * See: 06-component-inventory.md, Family 1.
 */
import { useRef, useCallback, useState } from 'react';
import { colors } from '@/tokens/colors';
import styles from './SketchInput.module.css';

interface SketchInputProps {
  onSubmit: (dataUrl: string) => void;
  onCancel: () => void;
}

interface Point { x: number; y: number }

export function SketchInput({ onSubmit, onCancel }: SketchInputProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const lastPoint = useRef<Point | null>(null);

  const getPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent): Point => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const cx = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
      const cy = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
      return { x: cx - rect.left, y: cy - rect.top };
    }, [],
  );

  const startDraw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      setDrawing(true);
      lastPoint.current = getPos(e);
    }, [getPos],
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
      ctx.lineJoin = 'round';
      ctx.stroke();
      lastPoint.current = pos;
      setHasStrokes(true);
    }, [drawing, getPos],
  );

  const endDraw = useCallback(() => {
    setDrawing(false);
    lastPoint.current = null;
  }, []);

  const handleSubmit = useCallback(() => {
    if (!canvasRef.current || !hasStrokes) return;
    onSubmit(canvasRef.current.toDataURL('image/png'));
  }, [hasStrokes, onSubmit]);

  const handleClear = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setHasStrokes(false);
    }
  }, []);

  return (
    <div className={styles.container}>
      <canvas
        ref={canvasRef}
        width={560}
        height={200}
        className={styles.canvas}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <div className={styles.toolbar}>
        <button className={styles.toolBtn} onClick={handleClear}>clear</button>
        <button className={styles.toolBtn} onClick={onCancel}>cancel</button>
        <button
          className={`${styles.toolBtn} ${hasStrokes ? styles.toolBtnReady : ''}`}
          onClick={handleSubmit}
          disabled={!hasStrokes}
        >done</button>
      </div>
    </div>
  );
}
