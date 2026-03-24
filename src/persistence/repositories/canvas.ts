/**
 * Canvas Repository — spatial layout state per session.
 * Stores positions and connections for canvas mode (4.1).
 */
import { Store } from '../schema';
import { get, getByIndex, upsertByIndex } from '../engine';
import { createId } from '../ids';
import type { CanvasRecord } from '../records';
import type { CanvasPosition, CanvasConnection } from '@/types/canvas';

export async function saveCanvasState(params: {
  sessionId: string;
  positions: CanvasPosition[];
  connections: CanvasConnection[];
}): Promise<CanvasRecord> {
  return upsertByIndex<CanvasRecord>(
    Store.Canvas,
    'by-session',
    params.sessionId,
    (existing) => ({ ...existing, ...params, updatedAt: Date.now() }),
    () => {
      const now = Date.now();
      return {
        id: createId(),
        createdAt: now,
        updatedAt: now,
        ...params,
      };
    },
  );
}

export async function getCanvasBySession(
  sessionId: string,
): Promise<CanvasRecord | undefined> {
  const results = await getByIndex<CanvasRecord>(
    Store.Canvas, 'by-session', sessionId,
  );
  return results[0];
}

export async function getCanvasState(
  id: string,
): Promise<CanvasRecord | undefined> {
  return get<CanvasRecord>(Store.Canvas, id);
}
