import { createLexer, LexerModuleToken } from "&/utils/system/lexer";

export const lexer = createLexer({
  '(': '(',
  ')': ')',

  '=': '=',

  ',': ',',

  '=>': '=>',
  '.': '.',

  name: [/[a-zA-Z][a-zA-Z0-9]*/, s => s],
  number: [/[0-9]+/, s => parseInt(s, 10)],
});


export type Token = LexerModuleToken<typeof lexer>;
