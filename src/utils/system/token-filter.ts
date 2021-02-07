import type { TokenBase } from './lexer';

type _RemoveTypes<Token extends TokenBase, Ignored extends string> =
  Token['type'] extends Ignored
    ? never
    : Token;

type RemoveTypes<Token extends TokenBase, Ignored extends string> =
  Token extends unknown ? _RemoveTypes<Token, Ignored> : never;


export const createTokenFilter = <Ignored extends string>(ignoredTokens: Ignored[]) => ({
  run: <Token extends TokenBase>(iterator: Iterator<Token, undefined>): Iterator<RemoveTypes<Token, Ignored>, undefined> => {
    return {
      next: () => nextValueableToken(iterator, ignoredTokens)
    };
  },
});

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
