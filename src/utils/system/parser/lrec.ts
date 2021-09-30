import { CacheContext, CacheEntry } from './cache';
import { ExtendedRDParser } from './common.types';
import { UnrestrainedLeftRecursion } from './errors';
import { ConsumeHandle } from './handles';

/*
  requires that all parsers be *pure* & *referentially transparent*
  stops when the parser stops consuming additional input (end position <= prev end position)
  essentially calculates the fixpoint of the parser given the input (not exactly... only compares the position/mark, not the result)
*/

export const lrec = <H extends ConsumeHandle, C, As extends unknown[], R>(parser: ExtendedRDParser<H, C, As, R>): ExtendedRDParser<H, C, As, R> => {
  const cache = new Map<number, CacheEntry<R>>();

  return (handle, context: C & CacheContext, ...args) => {

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

    cache.set(start.position, { error: new UnrestrainedLeftRecursion() });
    const base = parser(handle, context, ...args);
    let prev = { node: base, end: handle.mark() };

    const contextWithCache = {
      ...context,
      cache: {
        ...context?.cache,
        reevaluate: true
      }
    };

    let failed = false;
    while (!failed) {
      try {
        handle.reset(start);

        cache.set(start.position, prev);
        const node = parser(handle, contextWithCache, ...args);

        const end = handle.mark();
        if (end.position > prev.end.position) {
          prev = { node, end };
        } else {
          failed = true;
        }

      } catch (e) {
        failed = true;
      }
    }

    cache.delete(start.position);
    handle.reset(prev.end);
    return prev.node;
  };
};
