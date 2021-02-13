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
        throw new Error(`token mismatch; expected ${expected}, but recieved ${token.type}`);
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
