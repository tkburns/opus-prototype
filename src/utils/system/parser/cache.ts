import type { RDParser } from './common.types';
import { ParseError } from './errors';
import { ConsumeHandle, Mark } from './handles';
import { ParseCache } from './parse-cache';

export type CacheEntry<R> =
  { node: R; end: Mark } |
  { error: ParseError };

export interface CacheContext {
  cache?: {
    reevaluate?: boolean;
  };
}

export const cached = <H extends ConsumeHandle, C, R>(parser: RDParser<H, C, R>): RDParser<H, C, R> => {
  const cache = new ParseCache<R>();

  return (handle, context: C & CacheContext) => {
    const start = handle.mark();
    const cacheKey = ParseCache.key(handle.source, start);

    if (!context?.cache?.reevaluate) {
      const entry = cache.get(cacheKey);
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
      cache.set(cacheKey, { node, end });

      return node;
    } catch (error) {
      if (error instanceof ParseError) {
        cache.set(cacheKey, { error });
      }

      throw error;
    }
  };
};
