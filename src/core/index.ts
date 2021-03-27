import { system } from '&/utils/system/system';
import { codeGenerator } from './code-generation';
import { lexer, tokenFilter } from './lexer';
import { parser } from './parser';
import { injectRuntime } from './runtime';

export const core = system(
  lexer,
  tokenFilter,
  parser,
  codeGenerator,
  injectRuntime
);
