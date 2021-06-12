import { TokenBase } from '../lexer';
import { CompositeParseError, isParseError, ParseError, UnrestrainedLeftRecursion } from './errors';
import { LexerHandle } from './handles';


type RDParser<T extends TokenBase, R> = (handle: LexerHandle<T>) => R;

export const choice = <T extends TokenBase, Ps extends RDParser<T, unknown>[]>(
  handle: LexerHandle<T>,
  parsers: Ps
): ReturnType<Ps[number]> => {
  let errors: ParseError[] = [];

  for (const parser of parsers) {
    handle.checkpoint();
    try {
      return parser(handle) as ReturnType<Ps[number]>;
    } catch (e: unknown) {
      handle.backtrack();

      if (e instanceof UnrestrainedLeftRecursion) {
        /* swallow error & move onto next option */
      } else if (isParseError(e)) {
        errors = errors.concat(e);
      } else {
        throw e;
      }
    } finally {
      handle.commit();
    }
  }

  throw new CompositeParseError(errors);
};


export const repeated = <T extends TokenBase, R>(handle: LexerHandle<T>, parser: RDParser<T, R>): [R[], Error]  => {
  let error: ParseError | undefined = undefined;
  handle.checkpoint();

  try {
    const node = parser(handle);
    const [following, e] = repeated(handle, parser);
    return [[node, ...following], e];
  } catch (e) {
    handle.backtrack();
    if (isParseError(e)) {
      error = e;
    } else {
      throw e;
    }
  } finally {
    handle.commit();
  }

  return [[], error];
};


export const optional = <T extends TokenBase, R>(handle: LexerHandle<T>, parser: RDParser<T, R>): [R, undefined] | [undefined, Error] => {
  let error: Error | undefined = undefined;
  handle.checkpoint();

  try {
    return [parser(handle), undefined];
  } catch (e) {
    handle.backtrack();
    if (isParseError(e)) {
      error = e;
    } else {
      throw e;
    }
  } finally {
    handle.commit();
  }

  return [undefined, error];
};

