import { ParseError } from '.';
import { Mark, serializeMark } from './mark';

export type CacheEntry<R> =
  { node: R; end: Mark } |
  { error: ParseError };

type CacheKey = string & { __brand: 'parse-cache-key' };

export class ParseCache<T> extends Map<CacheKey, CacheEntry<T>> {
  static key(mark: Mark): CacheKey {
    return serializeMark(mark) as CacheKey;
  }
}
