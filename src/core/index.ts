import { system } from '&/utils/system/system';
import { lexer, tokenFilter } from './lexer';
import { parser } from './parser';

export const core = system(
  lexer,
  tokenFilter,
  parser
);
