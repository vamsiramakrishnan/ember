/**
 * Canvas Repository — spatial layout state per session.
 * Stores positions and connections for canvas mode (4.1).
 */
import { Store } from '../schema';
import { get, put, getByIndex } from '../engine';
import { createId } from '../ids';
import type { CanvasRecord } from '../records';
import type { CanvasPosition, CanvasConnection } from '@/types/canvas';

export async function saveCanvasState(params: {
  sessionId: string;
  positions: CanvasPosition[];
  connections: CanvasConnection[];
}): Promise<CanvasRecord> {
  const existing = await getCanvasBySession(params.sessionId);
  const now = Date.now();

  if (existing) {
    const updated = { ...existing, ...params, updatedAt: now };
    await put(Store.Canvas, updated);
    return updated;
  }

  const record: CanvasRecord = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    ...params,
  };
  await put(Store.Canvas, record);
  return record;
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
