import { TokenBase } from '../lexer';
import { Module } from '../system';
import { createBacktrackingHandle, createConsumeHandle, LexerHandle } from './handles';

export type { LexerHandle };
export * from './errors';
export * from './combinators';

type RDParser<T extends TokenBase, R> =
  (handle: LexerHandle<T>) => R;

export const createRDParser = <T extends TokenBase, R>(parse: RDParser<T, R>):
  Module<Iterator<T, undefined>, R> =>
{
  return {
    run: (iterator) => {
      const cHandle = createConsumeHandle(iterator);
      const btHandle = createBacktrackingHandle(cHandle);

      return parse(btHandle);
    }
  };
};