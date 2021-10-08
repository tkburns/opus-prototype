import type { TokenBase, TokenIterator } from './lexer';
import { Module } from './system';

type _RemoveTypes<Token extends TokenBase, Ignored extends string> =
  Token['type'] extends Ignored
    ? never
    : Token;

type RemoveTypes<Token extends TokenBase, Ignored extends string> =
  Token extends unknown ? _RemoveTypes<Token, Ignored> : never;


type FilterModule<Token extends TokenBase = never, Filtered extends TokenBase = TokenBase> =
  Module<TokenIterator<Token>, TokenIterator<Filtered>>;

export type FilterModuleToken<M extends FilterModule> =
  M extends FilterModule<never, infer Filtered>
    ? Filtered
    : never;


type UnreifiedTokenFilterModule<Ignored extends string> = {
  run: <Token extends TokenBase>(it: TokenIterator<Token>) => TokenIterator<RemoveTypes<Token, Ignored>>;
}

type GenericTokenFilterModule<Ignored extends string> = UnreifiedTokenFilterModule<Ignored> & {
  reify: <Token extends TokenBase>() => FilterModule<Token, RemoveTypes<Token, Ignored>>;
}

export type TokenFilterModule<Token extends TokenBase, Ignored extends string> =
  FilterModule<Token, RemoveTypes<Token, Ignored>>;


export const createTokenFilter = <Ignored extends string>(ignoredTokens: Ignored[]): GenericTokenFilterModule<Ignored> => {
  const unreified: UnreifiedTokenFilterModule<Ignored> = {
    run: (iterator) => {
      return {
        source: iterator.source,
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
