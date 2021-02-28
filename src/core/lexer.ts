import { createLexer, LexerModuleToken } from '&/utils/system/lexer';
import { createTokenFilter, FilterModuleToken } from '&/utils/system/token-filter';

export const lexer = createLexer({
  '(': '(',
  ')': ')',

  '=': '=',

  ',': ',',

  '=>': '=>',
  '.': '.',

  name: [/[a-zA-Z][a-zA-Z0-9]*/, s => s],
  number: [/[0-9]+/, s => parseInt(s, 10)],

  space: /\s+/,
});

export type Token = LexerModuleToken<typeof lexer>;

export const tokenFilter = createTokenFilter(['space']).reify<Token>();

export type FilteredToken = FilterModuleToken<typeof tokenFilter>;
