import { TokenBase } from './lexer';
import { Module } from './system';

export type LexerHandle<T extends TokenBase> = {
  consume: (t?: T['type']) => T;
  peek: () => T;
  atEOI: () => boolean;
};

export type ParseNodeNT = {
  type: string;
  children: ParseNode[];
};

export type ParseNodeT = {
  type: string;
  token: TokenBase;
};

class TokenMismatchError extends Error {
  constructor(
    public readonly expected: string,
    public readonly token: TokenBase
  ) {
    super(`token mismatch; expected ${expected}, but recieved ${token.type}`);
  }
}

type TokenMismatch = {
  rule: string;
  expected: string;
  recieved: TokenBase;
};

class ParseError extends Error {
  constructor(
    public readonly rule: string,
    
  ) {
    super(message);
  }
}

export type ParseNode = ParseNodeNT | ParseNodeT | ParseNodeError;
export type ParseTree = ParseNode;

export type ParseNodeError = {
  type: string;
  children: ParseNode | TokenMismatch[];
};
export type ParseErrorTree = ParseNodeError;

type RDParser<T extends TokenBase> = (handle: LexerHandle<T>) => ParseTree;

// TODO - return AST not parse tree...?
export const createRDParser = <T extends TokenBase>(parse: RDParser<T>):
  Module<Iterator<T, undefined>, ParseTree> =>
{
  return {
    run: (iterator) => {
      const handle = createLexerHandle(iterator);
      // TODO - wrap in try?
      return parse(handle);
    }
  };
};

const createLexerHandle = <T extends TokenBase>(iterator: Iterator<T, undefined>):
  LexerHandle<T> =>
{
  let next: T | undefined = undefined;

  const getNext = (): T => {
    if (next == null) {
      const result = iterator.next();
      if (result.done) {
        // TODO - RETURN ERROR NODE ??
        throw new Error('cannot get next token; EOI reached');
      }

      next = result.value;
      return result.value;
    } else {
      return next;
    }
  };

  return {
    consume: (expected) => {
      const token = getNext();

      if (expected != null && token.type !== expected) {
        throw new TokenMismatchError( 
          `token mismatch; expected ${expected}, but recieved ${token.type}`,
          expected,
          token
        );
      }

      // TODO - refactor
      next = undefined;
      return token;
    },
    peek: () => getNext(),
    atEOI: () => {
      // TODO - refactor
      // TODO - should EOI be a token..?
      if (next != null) {
        return false;
      } else {
        const result = iterator.next();
        if (result.done) {
          return true;
        } else {
          next = result.value;
          return false;
        }
      }
    }
  };
};

export type PRule<T extends TokenBase> = {
  name: string;
  parse: RDParser<T>;
};

export const prule = <T extends TokenBase>(name: string, parser: RDParser<T>): PRule<T> => {
  return {
    name,
    parse: (handle) => {
      try {
        return parser(handle);
      } catch (e: unknown) {
        if (e instanceof TokenMismatchError) {

        } else {
          throw e;
        }
      }
    }
  };
};

export const parseOneOf = <T extends TokenBase>(name: string, handle: LexerHandle<T>, parsers: RDParser<T>[]): ParseTree => {
  for (const parser of parsers) {
    try {
      return parser(handle);
    } catch {}
  }

  const token = handle.peek();
  throw new Error(`token ${token.type} did not match any rules for '${name}'`);
  // TODO - RETURN ERROR NODE
};
