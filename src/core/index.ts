import { collect } from "&/utils/system/collect";
import { system } from "&/utils/system/system";
import { lexer, Token } from './lexer';

export const core = system(
  lexer,
  collect<Token>()
);
