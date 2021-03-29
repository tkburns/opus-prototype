import { TokenBase } from './lexer';
import { Module } from './system';

type Matching<T extends TokenBase, N extends T['type']> = T & { type: N };
interface Consume<T extends TokenBase> {
  <N extends T['type']>(t: N): Matching<T, N>;
  (t?: string): T;
}

const isErrorArray = (es: unknown): es is Error[] =>
  Array.isArray(es) && es.every(error => error instanceof Error);

export type LexerHandle<T extends TokenBase> = {
  checkpoint: () => void;
  backtrack: () => void;
  commit: () => void;

  consume: Consume<T>;
  peek: () => T;
  atEOI: () => boolean;
  consumeEOI: () => void;
};

export type ASTBase = ASTNodeBase;
export type ASTNodeBase = {
  type: string;
};

type RDParser<T extends TokenBase, A extends ASTBase> =
  (handle: LexerHandle<T>) => A;

export const createRDParser = <T extends TokenBase, A extends ASTBase>(parse: RDParser<T, A>):
  Module<Iterator<T, undefined>, A> =>
{
  return {
    run: (iterator) => {
      const handle = createLexerHandle(iterator);
      try {
        return parse(handle);
      } catch (e: unknown) {
        if (isErrorArray(e)) {
          throw new Error(`Parse Error:\n  ${e.map(error => error.message).join('\n  ')}`);
        } else if (e instanceof Error) {
          throw new Error(`Parse Error: ${e.message}`);
        } else {
          throw e;
        }
      }
    }
  };
};

const createLexerHandle = <T extends TokenBase>(iterator: Iterator<T, undefined>):
  LexerHandle<T> =>
{
  let cache: T[] = [];
  let current = 0;
  let checkpoints: number[] = [];

  const getNext = (): T => {
    if (cache[current] == undefined) {
      const result = iterator.next();
      if (result.done) {
        throw new Error('cannot get next token; EOI reached');
      }

      cache = [...cache, result.value];
      return result.value;
    } else {
      return cache[current];
    }
  };

  const atEOI = () => {
    // TODO - should EOI be a token..?
    if (current < cache.length) {
      return false;
    } else {
      const result = iterator.next();
      if (result.done) {
        return true;
      } else {
        cache = [...cache, result.value];
        return false;
      }
    }
  };

  return {
    checkpoint: () => {
      checkpoints = [...checkpoints, current];
    },
    backtrack: () => {
      if (checkpoints.length === 0) {
        throw new Error('unable to rewind lexer handle; there are no saved checkpoints');
      }

      current = checkpoints[checkpoints.length - 1];
    },
    commit: () => {
      if (checkpoints.length === 0) {
        throw new Error('unable to commit the checkpoint; there are no saved checkpoints');
      }

      checkpoints = checkpoints.slice(0, -1);
    },

    consume: <N extends T['type']>(expected?: N) => {
      const token = getNext();

      if (expected != null && token.type !== expected) {
        throw new Error(`token mismatch as ${token.location.line}:${token.location.column}; expected ${expected}, but recieved ${token.type}`);
      }

      current = current + 1;
      return token as Matching<T, N>;
    },
    peek: () => getNext(),
    atEOI,
    consumeEOI: () => {
      if (!atEOI()) {
        const token = getNext();
        throw new Error(`expected EOI but recieved token ${token.type} (at ${token.location.line}:${token.location.column})`);
      }
    }
  };
};


/* ----- foundational patterns ----- */

type RDParserish<T extends TokenBase, R> = (handle: LexerHandle<T>) => R;

export const oneOf = <T extends TokenBase, Ps extends RDParserish<T, unknown>[]>(
  handle: LexerHandle<T>,
  parsers: Ps
): ReturnType<Ps[number]> => {
  let errors: Error[] = [];

  for (const parser of parsers) {
    handle.checkpoint();
    try {
      return parser(handle) as ReturnType<Ps[number]>;
    } catch (e) {
      errors = errors.concat(e);
      handle.backtrack();
    } finally {
      handle.commit();
    }
  }

  throw errors;
};


export const repeated = <T extends TokenBase, R>(handle: LexerHandle<T>, parser: RDParserish<T, R>): [R[], Error]  => {
  let error: Error | undefined = undefined;
  handle.checkpoint();

  try {
    const node = parser(handle);
    const [following, e] = repeated(handle, parser);
    return [[node, ...following], e];
  } catch (e) {
    error = e as Error;
    handle.backtrack();
  } finally {
    handle.commit();
  }

  return [[], error];
};


export const optional = <T extends TokenBase, R>(handle: LexerHandle<T>, parser: RDParserish<T, R>): [R, undefined] | [undefined, Error] => {
  let error: Error | undefined = undefined;
  handle.checkpoint();

  try {
    return [parser(handle), undefined];
  } catch (e) {
    error = e as Error;
    handle.backtrack();
  } finally {
    handle.commit();
  }

  return [undefined, error];
};
