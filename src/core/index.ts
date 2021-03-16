import { system } from '&/utils/system/system';
import { codeGenerator } from './code-generation';
import { lexer, tokenFilter } from './lexer';
import { parser } from './parser';

export const core = system(
  lexer,
  tokenFilter,
  parser,
  codeGenerator
);
