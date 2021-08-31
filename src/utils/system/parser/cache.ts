import type { RDParser } from './common.types';
import { ParseError } from './errors';
import { ConsumeHandle, Mark } from './handles';

export type CacheEntry<R> =
  { node: R; end: Mark } |
  { error: ParseError };

export interface CacheContext {
  cache?: {
    reevaluate?: boolean;
  };
}

export const cached = <H extends ConsumeHandle, C, R>(parser: RDParser<H, C, R>): RDParser<H, C, R> => {
  const cache = new Map<number, CacheEntry<R>>();

  return (handle, context: C & CacheContext) => {
    const start = handle.mark();

    if (!context?.cache?.reevaluate) {
      const entry = cache.get(start.position);
      if (entry) {
        if ('error' in entry) {
          throw entry.error;
        } else {
          handle.reset(entry.end);
          return entry.node;
        }
      }
    }

    try {
      const node = parser(handle, context);
      const end = handle.mark();
      cache.set(start.position, { node, end });

      return node;
    } catch (error) {
      if (error instanceof ParseError) {
        cache.set(start.position, { error });
      }

      throw error;
    }
  };
};
