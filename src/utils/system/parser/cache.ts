import { Comparison } from '&/utils/comparison';
import type { ExtendedRDParser, RDParser } from './common.types';
import { ParseError } from './errors';
import { ConsumeHandle } from './handles';
import { compareMarks, Mark } from './mark';
import { ParseCache } from './parse-cache';

export type CacheEntry<R> =
  { node: R; end: Mark } |
  { error: ParseError };

export interface CacheContext {
  cache?: {
    reevaluate?: boolean | Mark[];
  };
}

type KeySuffix<C, As extends unknown[]> =
  (ctx: C, ...args: As) => string | undefined;

const shouldReevaluate = (context: CacheContext, mark: Mark): boolean => {
  const reevaluate = context?.cache?.reevaluate;
  if (Array.isArray(reevaluate)) {
    return reevaluate.some(m => compareMarks(m, mark) === Comparison.EQUAL);
  } else {
    return !!reevaluate;
  }
};

type Cached = {
  <H extends ConsumeHandle, C, R>(parser: RDParser<H, C, R>): RDParser<H, C, R>;
  <H extends ConsumeHandle, C, As extends unknown[], R>(
    keySuffix: KeySuffix<C, As>,
    parser: ExtendedRDParser<H, C, As, R>
  ): ExtendedRDParser<H, C, As, R>;
};

export const cached: Cached = <H extends ConsumeHandle, C, As extends unknown[], R>(
  _keySuffix: KeySuffix<C, As> | ExtendedRDParser<H, C, As, R>,
  _parser?: ExtendedRDParser<H, C, As, R>
): ExtendedRDParser<H, C, As, R> => {
  let keySuffix: KeySuffix<C, As>;
  let parser: ExtendedRDParser<H, C, As, R>;

  if (_parser === undefined) {
    keySuffix = () => '';
    parser = _keySuffix as ExtendedRDParser<H, C, As, R>;
  } else {
    keySuffix = _keySuffix as KeySuffix<C, As>;
    parser = _parser;
  }

  const cache = new ParseCache<R>();

  return (handle, context: C & CacheContext, ...args) => {
    const start = handle.mark();
    const cacheKey = ParseCache.key(start, keySuffix(context, ...args));

    if (!shouldReevaluate(context, start)) {
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
      const node = parser(handle, context, ...args);
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
