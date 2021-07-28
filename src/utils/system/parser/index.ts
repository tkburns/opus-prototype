import { TokenBase } from '../lexer';
import { Module } from '../system';
import { LexerHandle, RDParser } from './common.types';
import { ConsumeHandle } from './handles';

export * from './errors';
export * from './combinators';

export const createRDParser = <T extends TokenBase, R>(parse: RDParser<LexerHandle<T>, R>):
  Module<Iterator<T, undefined>, R> =>
{
  return {
    run: (iterator) => {
      const handle = ConsumeHandle.create(iterator);

      return parse(handle);
    }
  };
};
