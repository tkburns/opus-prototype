import { stringifyToken, TokenBase } from './lexer';
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

export type ParseNode = ParseNodeNT | ParseNodeT;
export type ParseTree = ParseNode;

type RDParser<T extends TokenBase> = (handle: LexerHandle<T>) => ParseTree;

export const createRDParser = <T extends TokenBase>(parse: RDParser<T>):
  Module<Iterator<T, undefined>, ParseTree> =>
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
  let next: T | undefined = undefined;

  const getNext = (): T => {
    if (next == null) {
      const result = iterator.next();
      if (result.done) {
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
        throw new Error(`token mismatch as ${token.location.line}:${token.location.column}; expected ${expected}, but recieved ${token.type}`);
      }

      next = undefined;
      return token;
    },
    peek: () => getNext(),
    atEOI: () => {
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


export const parseOneOf = <T extends TokenBase>(name: string, handle: LexerHandle<T>, parsers: RDParser<T>[]): ParseTree => {
  for (const parser of parsers) {
    try {
      return parser(handle);
    } catch { }
  }

  const token = handle.peek();
  throw new Error(`token ${token.type} (at ${token.location.line}:${token.location.column}) did not match any rules for '${name}'`);
};

export const stringifyTree = (node: ParseNode): string => {
  const nodeS = node.type;

  if ('token' in node) {
    return nodeS + ' :: ' + stringifyToken(node.token);
  } else if (node.children.length === 0) {
    return nodeS + ' (ε)';
  } else {
    const childrenS = node.children
      .map(stringifyTree)
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

