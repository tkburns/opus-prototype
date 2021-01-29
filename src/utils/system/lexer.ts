import type { Module } from "./system";

type Pattern = string | RegExp;

type Mapper = (s: string) => unknown;

export type LexerRulesBase = {
  [key: string]: Pattern | [Pattern, Mapper];
};

type TokenValue<R extends LexerRulesBase[string]> = 
  R extends [Pattern, Mapper]
    ? ReturnType<R[1]>
    : void;

export type LexerToken<Rules extends LexerRulesBase> = {
  [T in keyof Rules]: {
    type: T;
    value: TokenValue<Rules[T]>;
  };
}[keyof Rules];

type LexerModule<T extends LexerRulesBase> =
  Module<string, Iterator<LexerToken<T>, undefined>>;

type RuleMatch = {
  rule: {
    type: string;
    pattern: Pattern;
    mapper: Mapper;
  };
  match: string;
};


export const createLexer = <Rules extends LexerRulesBase>(rules: Rules):
  LexerModule<Rules> =>
{
  const ruleList = Object.entries(rules)
    .map(([t, patternMapper]) => {
      const [pattern, mapper] = Array.isArray(patternMapper)
        ? patternMapper
        : [patternMapper, () => undefined];
      return { type: t, pattern, mapper }
    });

  return {
    run: (input) => {
      const source = input;
      let start = 0;

      return {
        next: () => {
          const unprocessed = source.slice(start);
          if (unprocessed === '') {
            return { value: undefined, done: true };
          }

          const matches = ruleList
            .map(rule => ({ rule, match: checkMatch(unprocessed, rule.pattern) }))
            .filter((result): result is RuleMatch => result.match != null);

          const bestMatch = matches.reduce(
            (best, match) => {
              if (best == null) {
                return match;
              } else {
                return match.match.length > best.match.length
                  ? match
                  : best;
              }
            },
            undefined as RuleMatch | undefined
          );

          if (bestMatch == null) {
            const unprocessedSlice = unprocessed.length > 15
              ? `${unprocessed.slice(0, 15)}...`
              : unprocessed.slice(0, 15);
            throw new Error(`unable to find a token for '${unprocessedSlice}'`);
          }

          start = start + bestMatch.match.length;

          const tokenValue = bestMatch.rule.mapper(bestMatch.match);

          return {
            value: { type: bestMatch.rule.type, value: tokenValue } as LexerToken<Rules>,
            done: false
          };
        }
      };
    }
  };
};

const checkMatch = (input: string, pattern: Pattern) => {
  if (typeof pattern === 'string') {
    return input.startsWith(pattern)
      ? pattern
      : undefined;
  } else {
    const match = pattern.exec(input);
    return match?.index === 0
      ? match[0]
      : undefined;
  }
};