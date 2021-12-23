import { createLexer, LexerModuleToken } from '&/utils/system/lexer';
import { createTokenFilter, FilterModuleToken } from '&/utils/system/token-filter';
import type { MapByType } from '&/utils/helper.types';

export const lexer = createLexer({
  comment: /\(\*([^*]|\*(?!\)))*\*\)/,

  '(': '(',
  ')': ')',

  '{': '{',
  '}': '}',

  '=': '=',

  ',': ',',
  ';': ';',

  '=>': '=>',
  '.': '.',

  '_': '_',

  match: 'match',

  name: [/[a-zA-Z][a-zA-Z0-9]*/, s => s],
  atom: [/:[a-zA-Z]+/, s => s.slice(1)],
  bool: [/true|false/, s => s === 'true'],
  number: [/[0-9]+/, s => parseInt(s, 10)],
  text: [/"[^"]*"/, s => s.slice(1, -1)],

  space: /\s+/,
});


export type Token = LexerModuleToken<typeof lexer>;
export type TokenMap = MapByType<Token>;

export const tokenFilter = createTokenFilter(['space', 'comment']).reify<Token>();

export type FilteredToken = FilterModuleToken<typeof tokenFilter>;
