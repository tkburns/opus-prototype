import type { RDParser } from './common.types';
import { ParseError } from './errors';
import { ConsumeHandle, Mark } from './handles';

export type CacheEntry<R> =
  { node: R; end: Mark } |
  { error: ParseError };

export const cached = <H extends ConsumeHandle, R>(parser: RDParser<H, R>): RDParser<H, R> => {
  const cache = new Map<number, CacheEntry<R>>();

  return (handle) => {
    const start = handle.mark();

    const entry = cache.get(start.position);
    if (entry) {
      if ('error' in entry) {
        throw entry.error;
      } else {
        handle.reset(entry.end);
        return entry.node;
      }
    }

    try {
      const node = parser(handle);
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
