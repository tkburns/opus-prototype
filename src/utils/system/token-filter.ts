import type { TokenBase } from './lexer';
import { Module } from './system';

type _RemoveTypes<Token extends TokenBase, Ignored extends string> =
  Token['type'] extends Ignored
    ? never
    : Token;

type RemoveTypes<Token extends TokenBase, Ignored extends string> =
  Token extends unknown ? _RemoveTypes<Token, Ignored> : never;


type _FilterModule<Token extends TokenBase = never, Filtered extends TokenBase = TokenBase> =
  Module<Iterator<Token, undefined>, Iterator<Filtered, undefined>>;

export type FilterModuleToken<M extends _FilterModule> =
  M extends _FilterModule<never, infer Filtered>
    ? Filtered
    : never;


export type TokenFilterModule<Token extends TokenBase, Ignored extends string> =
  Module<Iterator<Token, undefined>, Iterator<RemoveTypes<Token, Ignored>, undefined>>;


export const createTokenFilter = <Ignored extends string>(ignoredTokens: Ignored[]) => {
  const unreified = {
    run: <Token extends TokenBase>(iterator: Iterator<Token, undefined>): Iterator<RemoveTypes<Token, Ignored>, undefined> => {
      return {
        next: () => nextValueableToken(iterator, ignoredTokens)
      };
    },
  };

  return {
    ...unreified,
    reify: <Token extends TokenBase>(): TokenFilterModule<Token, Ignored> => unreified
  };
};

const nextValueableToken = <Token extends TokenBase, Ignored extends string>(
  iterator: Iterator<Token, undefined>,
  ignoredTokens: Ignored[]
): IteratorResult<RemoveTypes<Token, Ignored>, undefined> => {
  const next = iterator.next();

  if (next.done) {
    return next;
  } else if ((ignoredTokens as string[]).includes(next.value.type)) {
    return nextValueableToken(iterator, ignoredTokens);
  } else {
    return next as IteratorResult<RemoveTypes<Token, Ignored>, undefined>;
  }
};
