import { stringifyToken, TokenBase } from './lexer';
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
};

export type ASTNodeNT = {
  type: string;
  children: ASTNode[];
};

export type ASTNodeT = {
  type: string;
  token: TokenBase;
};

export type ASTNode = ASTNodeNT | ASTNodeT;
export type AST = ASTNode;

type RDParser<T extends TokenBase> = (handle: LexerHandle<T>) => AST;

export const createRDParser = <T extends TokenBase>(parse: RDParser<T>):
  Module<Iterator<T, undefined>, AST> =>
{
  return {
    run: (iterator) => {
      const handle = createLexerHandle(iterator);
      return parse(handle);
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
    atEOI: () => {
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
    }
  };
};


/* ----- foundational patterns ----- */

type RDParserish<T extends TokenBase, R> = (handle: LexerHandle<T>) => R;

export const oneOf = <T extends TokenBase, R>(
  handle: LexerHandle<T>,
  parsers: RDParserish<T, R>[]
): R => {

  for (const parser of parsers) {
    handle.checkpoint();
    try {
      return parser(handle);
    } catch {
      handle.backtrack();
    } finally {
      handle.commit();
    }
  }

  const token = handle.peek();
  throw new Error(`token ${token.type} (at ${token.location.line}:${token.location.column}) could not be parsed`);
};


export const repeated = <T extends TokenBase, R>(handle: LexerHandle<T>, parser: RDParserish<T, R>): R[] => {
  handle.checkpoint();
  try {
    const node = parser(handle);
    const following = repeated(handle, parser);
    return [node, ...following];
  } catch {
    handle.backtrack();
  } finally {
    handle.commit();
  }

  return [];
};


export const optional = <T extends TokenBase, R>(handle: LexerHandle<T>, parser: RDParserish<T, R>): R | undefined => {
  handle.checkpoint();

  try {
    return parser(handle);
  } catch (e) {
    handle.backtrack();
  } finally {
    handle.commit();
  }

  return undefined;
};


/* ----- stringification ----- */

export const stringifyAST = (node: AST): string => {
  const nodeS = node.type;

  if ('token' in node) {
    return nodeS + ' :: ' + stringifyToken(node.token);
  } else if (node.children.length === 0) {
    return nodeS + ' (ε)';
  } else {
    const childrenS = node.children
      .map(stringifyAST)
      .map((childS, num) => num + 1 !== node.children.length
        ? indent(childS, ' ├─', ' │ ')
        : indent(childS, ' └─', '   ')
      );

    return lines(
      nodeS,
      ...childrenS
    );
  }
};

const lines = (...strs: string[]): string =>
  strs.join('\n');

const indent = (str: string, prefix: string, indentation: string) =>
  prefix + str.replace(/\r?\n/g, (match) => match + indentation);

