import { ParseError } from '.';
import { Source } from '../input';
import { Mark } from './handles';

export type CacheEntry<R> =
  { node: R; end: Mark } |
  { error: ParseError };

type CacheKey = string & { __brand: 'parse-cache-key' };

export class ParseCache<T> extends Map<CacheKey, CacheEntry<T>> {
  static key(source: Source, mark: Mark): CacheKey {
    return `${source}:${mark.position}` as CacheKey;
  }
}
