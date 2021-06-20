import { TokenBase } from '../lexer';
import { CompositeParseError, isParseError, LRecError, ParseError } from './errors';
import { LexerHandle } from './handles';


type RDParser<T extends TokenBase, R> = (handle: LexerHandle<T>) => R;


export const attempt = <T extends TokenBase, P extends RDParser<T, unknown>>(
  handle: LexerHandle<T>,
  parser: P
): ReturnType<P> => {
  handle.checkpoint();
  try {
    return parser(handle) as ReturnType<P>;
  } catch (e: unknown) {
    handle.backtrack();
    throw e;
  } finally {
    handle.commit();
  }
};


export const choice = <T extends TokenBase, Ps extends RDParser<T, unknown>[]>(
  handle: LexerHandle<T>,
  parsers: Ps
): ReturnType<Ps[number]> => {
  let errors: ParseError[] = [];

  for (const parser of parsers) {
    try {
      return attempt(handle, parser) as ReturnType<Ps[number]>;
    } catch (e: unknown) {
      if (e instanceof LRecError) {
        /* swallow error & move onto next option */
      } else if (isParseError(e)) {
        errors = errors.concat(e);
      } else {
        throw e;
      }
    }
  }

  throw new CompositeParseError(errors);
};


export const repeated = <T extends TokenBase, R>(handle: LexerHandle<T>, parser: RDParser<T, R>): [R[], Error]  => {
  let error: ParseError | undefined = undefined;

  try {
    const node = attempt(handle, parser);
    const [following, e] = repeated(handle, parser);
    return [[node, ...following], e];
  } catch (e) {
    if (isParseError(e)) {
      error = e;
    } else {
      throw e;
    }
  }

  return [[], error];
};


export const optional = <T extends TokenBase, R>(handle: LexerHandle<T>, parser: RDParser<T, R>): [R, undefined] | [undefined, Error] => {
  let error: Error | undefined = undefined;

  try {
    return [attempt(handle, parser), undefined];
  } catch (e) {
    if (isParseError(e)) {
      error = e;
    } else {
      throw e;
    }
  }

  return [undefined, error];
};

