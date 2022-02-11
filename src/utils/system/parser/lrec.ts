import { Comparison } from '&/utils/comparison';
import { CacheContext, cached } from './cache';
import { ExtendedRDParser, RDParser } from './common.types';
import { UnrestrainedLeftRecursion } from './errors';
import { ConsumeHandle } from './handles';
import { compareMarks } from './mark';
import { ParseCache } from './parse-cache';

/*
  requires that all parsers be *pure* & *referentially transparent*
  stops when the parser stops consuming additional input (end position <= prev end position)
  essentially calculates the fixpoint of the parser given the input (not exactly... only compares the position/mark, not the result)
*/

type KeySuffix<C, As extends unknown[]> =
  (ctx: C, ...args: As) => string | undefined;

type LRec = {
  <H extends ConsumeHandle, C, R>(parser: RDParser<H, C, R>): RDParser<H, C, R>;
  <H extends ConsumeHandle, C, As extends unknown[], R>(
    keySuffix: KeySuffix<C, As>,
    parser: ExtendedRDParser<H, C, As, R>
  ): ExtendedRDParser<H, C, As, R>;
};

type LRecWithCached = LRec & { cached: LRec };

export const lrec: LRecWithCached = <H extends ConsumeHandle, C, As extends unknown[], R>(
  _keySuffix: KeySuffix<C, As> | ExtendedRDParser<H, C, As, R>,
  _parser?: ExtendedRDParser<H, C, As, R>
): ExtendedRDParser<H, C, As, R> => {
  let keySuffix: KeySuffix<C, As>;
  let parser: ExtendedRDParser<H, C, As, R>;

  if (_parser === undefined) {
    keySuffix = () => undefined;
    parser = _keySuffix as ExtendedRDParser<H, C, As, R>;
  } else {
    keySuffix = _keySuffix as KeySuffix<C, As>;
    parser = _parser;
  }

  const cache = new ParseCache<R>();

  return (handle, context: C & CacheContext, ...args) => {

    const start = handle.mark();
    const cacheKey = ParseCache.key(start, keySuffix(context, ...args));

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

    let base: R;
    try {
      base = parser(handle, context, ...args);
    } catch (e: unknown) {
      cache.delete(cacheKey);
      throw e;
    }
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
        if (compareMarks(end, prev.end) === Comparison.GREATER) {
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

lrec.cached = <H extends ConsumeHandle, C, As extends unknown[], R>(
  _keySuffix: KeySuffix<C, As> | RDParser<H, C, R>,
  _parser?: ExtendedRDParser<H, C, As, R>
) => {
  if (_parser === undefined) {
    const parser = _keySuffix as RDParser<H, C, R>;
    return cached(lrec(parser));
  } else {
    const keySuffix = _keySuffix as KeySuffix<C, As>;
    const parser = _parser;
    return cached(keySuffix, lrec(keySuffix, parser));
  }
};
