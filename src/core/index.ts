import { system } from '&/utils/system/system';
import { lexer, tokenFilter } from './lexer';
import { parser } from './parser';
import { astStringifier } from './stringification';

export const core = system(
  lexer,
  tokenFilter,
  parser,
  astStringifier
);
