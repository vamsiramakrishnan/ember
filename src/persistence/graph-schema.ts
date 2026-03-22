/**
 * GraphSchema — re-exports graph store names from the unified schema.
 *
 * @deprecated Use Store.Relations and Store.Events from './schema' directly.
 * This file exists only for backward compatibility during migration.
 */
import { Store, type StoreName } from './schema';

export const GraphStore = {
  Relations: Store.Relations as StoreName,
  Events: Store.Events as StoreName,
} as const;
