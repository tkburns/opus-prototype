import { CacheContext } from './cache';
import { ExtendedRDParser } from './common.types';
import { UnrestrainedLeftRecursion } from './errors';
import { ConsumeHandle } from './handles';
import { ParseCache } from './parse-cache';

/*
  requires that all parsers be *pure* & *referentially transparent*
  stops when the parser stops consuming additional input (end position <= prev end position)
  essentially calculates the fixpoint of the parser given the input (not exactly... only compares the position/mark, not the result)
*/

export const lrec = <H extends ConsumeHandle, C, As extends unknown[], R>(parser: ExtendedRDParser<H, C, As, R>): ExtendedRDParser<H, C, As, R> => {
  const cache = new ParseCache<R>();

  return (handle, context: C & CacheContext, ...args) => {

    const start = handle.mark();
    const cacheKey = ParseCache.key(handle.source, start);

    const entry = cache.get(cacheKey);
    if (entry) {
      if ('error' in entry) {
        throw entry.error;
      } else {
        handle.reset(entry.end);
        return entry.node;
      }
    }

    cache.set(cacheKey, { error: new UnrestrainedLeftRecursion() });
    const base = parser(handle, context, ...args);
    let prev = { node: base, end: handle.mark() };

    const contextWithCache = {
      ...context,
      cache: {
        ...context?.cache,
        reevaluate: [start]
      }
    };

    let failed = false;
    while (!failed) {
      try {
        handle.reset(start);

        cache.set(cacheKey, prev);
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

    cache.delete(cacheKey);
    handle.reset(prev.end);
    return prev.node;
  };
};
