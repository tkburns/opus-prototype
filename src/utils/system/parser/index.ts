import { TokenBase, TokenIterator } from '../lexer';
import { Module } from '../system';
import { LexerHandle, RDParser } from './common.types';
import { ConsumeHandle } from './handles';

export * from './errors';
export * from './combinators';

export interface CreateRDParser {
  <T extends TokenBase, R>(parse: RDParser<LexerHandle<T>, object, R>): Module<TokenIterator<T>, R>;
  <T extends TokenBase, C, R>(parse: RDParser<LexerHandle<T>, C, R>, context: C): Module<TokenIterator<T>, R>;
}

export const createRDParser: CreateRDParser = <T extends TokenBase, C, R>(parse: RDParser<LexerHandle<T>, C, R>, context: C | object = {}):
  Module<TokenIterator<T>, R> =>
{
  return {
    run: (iterator) => {
      const handle = ConsumeHandle.create(iterator);

      return parse(handle, context as C);
    }
  };
};
