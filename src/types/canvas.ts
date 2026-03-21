/**
 * Canvas element positioning for spatial mode (4.1).
 */

export interface CanvasPosition {
  id: string;
  x: number;
  y: number;
  width?: number;
}

export interface CanvasConnection {
  from: string;
  to: string;
  label?: string;
}
