import type { Module } from './system';
import util from 'util';

type Pattern = string | RegExp;

type Mapper = (s: string) => unknown;

export type LexerRulesBase = {
  [key: string]: Pattern | [Pattern, Mapper];
};

export type LexerModule<T extends LexerRulesBase = LexerRulesBase> =
  Module<string, Iterator<LexerToken<T>, undefined>>;


type Location = {
  line: number;
  column: number;
};

export type TokenBase = {
  type: string;
  value?: unknown;
  location: Location;
};

type TokenValue<R extends LexerRulesBase[string]> =
  R extends [Pattern, Mapper]
    ? ReturnType<R[1]>
    : undefined;

export type LexerToken<Rules extends LexerRulesBase> = {
  [T in keyof Rules]: {
    type: T;
    value: TokenValue<Rules[T]>;
    location: Location;
  };
}[keyof Rules];

export type LexerModuleToken<M extends LexerModule> =
  M extends LexerModule<infer Rs>
    ? LexerToken<Rs>
    : never;



type Rule = {
  type: string;
  pattern: Pattern;
  mapper?: Mapper;
};

type RuleMatch = {
  rule: Rule;
  match: string;
};

type LocationHandler = {
  accept: (source: string) => Location;
};


export const createLexer = <Rules extends LexerRulesBase>(rules: Rules):
  LexerModule<Rules> =>
{
  const ruleList = processRules(rules);

  return {
    run: (input) => {
      let unprocessed = input;
      const lHandler = createLocationHandler();

      return {
        next: () => {
          if (unprocessed === '') {
            return { value: undefined, done: true };
          }

          const [token, nextUnprocessed] = extractToken(unprocessed, ruleList, lHandler);
          unprocessed = nextUnprocessed;

          return {
            value: token as LexerToken<Rules>,
            done: false
          };
        }
      };
    }
  };
};


const processRules = (rules: LexerRulesBase): Rule[] =>
  Object.entries(rules)
    .map(([t, patternMapper]) => {
      const [pattern, mapper] = Array.isArray(patternMapper)
        ? patternMapper
        : [patternMapper, undefined];
      return { type: t, pattern, mapper } as Rule;
    });

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

const extractToken = (input: string, rules: Rule[], lHandler: LocationHandler): [TokenBase, string] => {
  const matches = rules
    .map(rule => ({ rule, match: checkMatch(input, rule.pattern) }))
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
    const unprocessedSlice = input.length > 15
      ? `${input.slice(0, 15)}...`
      : input.slice(0, 15);
    throw new Error(`unable to find a token for '${unprocessedSlice}'`);
  }

  const location = lHandler.accept(bestMatch.match);
  const unprocessed = input.slice(bestMatch.match.length);

  const token = bestMatch.rule.mapper
    ? { type: bestMatch.rule.type, value: bestMatch.rule.mapper(bestMatch.match), location }
    : { type: bestMatch.rule.type, location };

  return [token, unprocessed];
};


export const stringifyToken = (token: TokenBase): string => {
  if ('value' in token) {
    return `${token.type}(${util.inspect(token.value)})`;
  } else {
    return token.type;
  }
};


const createLocationHandler = (): LocationHandler => {
  let location = {
    line: 1,
    column: 1,
  };

  return {
    accept: (source: string) => {
      const currentLocation = location;
      location = advancedLocation(location, source);
      return currentLocation;
    },
  };
};

const advancedLocation = (prevLocation: Location, source: string): Location => {
  const segments = source.split(/\r\n|\r|\n/);

  const numLines = segments.length - 1;
  const lastLine = segments[segments.length - 1] ?? '';

  return {
    line: prevLocation.line + numLines,
    column: numLines <= 1
      ? prevLocation.column + lastLine.length
      : lastLine.length
  };
};
