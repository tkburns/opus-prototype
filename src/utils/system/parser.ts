import { TokenBase } from './lexer';
import { Module } from './system';

type Matching<T extends TokenBase, N extends T['type']> = T & { type: N };
interface Consume<T extends TokenBase> {
  <N extends T['type']>(t: N): Matching<T, N>;
  (t?: string): T;
}

export type LexerHandle<T extends TokenBase> = {
  checkpoint: () => void;
  backtrack: () => void;
  commit: () => void;

  consume: Consume<T>;
  peek: () => T;
  atEOI: () => boolean;
  consumeEOI: () => void;

  recursionFlag: (flag: unknown) => void;
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
      return parse(handle);
    }
  };
};

type Checkpoint = { current: number; recFlags: unknown[] };

const createLexerHandle = <T extends TokenBase>(iterator: Iterator<T, undefined>):
  LexerHandle<T> =>
{
  let cache: T[] = [];
  let current = 0;
  let recFlags: unknown[] = [];
  let checkpoints: Checkpoint[] = [];

  const getNext = (): T => {
    if (cache[current] == undefined) {
      const result = iterator.next();
      if (result.done) {
        throw new UnexpectedEOI();
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
      checkpoints = [...checkpoints, { current, recFlags }];
    },
    backtrack: () => {
      if (checkpoints.length === 0) {
        throw new Error('unable to rewind lexer handle; there are no saved checkpoints');
      }

      const checkpoint = checkpoints[checkpoints.length - 1];
      current = checkpoint.current;
      recFlags = checkpoint.recFlags;
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
        throw new TokenMismatch(expected, token);
      }

      current = current + 1;
      recFlags = [];
      return token as Matching<T, N>;
    },
    peek: () => getNext(),
    atEOI,
    consumeEOI: () => {
      if (!atEOI()) {
        const token = getNext();
        throw new TokenMismatch('EOI', token);
      }
    },
    recursionFlag: (flag) => {
      if (recFlags.includes(flag)) {
        throw new UnrestrainedLeftRecursion(flag);
      }

      recFlags = [...recFlags, flag];
    }
  };
};


/* ----- foundational patterns ----- */

type RDParserish<T extends TokenBase, R> = (handle: LexerHandle<T>) => R;

export const oneOf = <T extends TokenBase, Ps extends RDParserish<T, unknown>[]>(
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


export const repeated = <T extends TokenBase, R>(handle: LexerHandle<T>, parser: RDParserish<T, R>): [R[], Error]  => {
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


export const optional = <T extends TokenBase, R>(handle: LexerHandle<T>, parser: RDParserish<T, R>): [R, undefined] | [undefined, Error] => {
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


/* ----- errors ----- */

export class UnrestrainedLeftRecursion extends Error {
  constructor(
    readonly flag: unknown
  ) {
    super('Unrestrained left recursion in parser');
  }
}

export class TokenMismatch extends Error {
  constructor(
    readonly expected: string,
    readonly token: TokenBase
  ) {
    super(`token mismatch as ${token.location.line}:${token.location.column}; expected ${expected}, but recieved ${token.type}`);
    this.name = this.constructor.name;
  }
}

export class UnexpectedEOI extends Error {
  constructor(
    readonly expected?: string,
  ) {
    super(`EOI reached unexpectedly${expected ? `; expected token ${expected}` : ''}`);
    this.name = this.constructor.name;
  }
}

const flattenErrors = (errors: ParseError[]): Exclude<ParseError, CompositeParseError>[] =>
  errors.reduce((acc, error) =>
    error instanceof CompositeParseError
      ? [...acc, ...error.errors]
      : [...acc, error],
    [] as Exclude<ParseError, CompositeParseError>[]
  );

export class CompositeParseError extends Error {
  readonly errors: Exclude<ParseError, CompositeParseError>[];

  constructor(
    errors: ParseError[]
  ) {
    const flattenedErrors = flattenErrors(errors);

    super(CompositeParseError.createMessage(flattenedErrors));
    this.name = this.constructor.name;

    this.errors = flattenedErrors;
  }

  static createMessage(errors: Exclude<ParseError, CompositeParseError>[]): string {
    const errorMessages = errors.map(e => `[${e.name}] ${e.message}`);
    return `multiple parse errors:\n  ${errorMessages.join('\n  ')}`;
  }
}

type ParseError =
  TokenMismatch |
  UnexpectedEOI |
  CompositeParseError;

const isParseError = (e: unknown): e is ParseError =>
  e instanceof TokenMismatch ||
  e instanceof UnexpectedEOI ||
  e instanceof CompositeParseError;
