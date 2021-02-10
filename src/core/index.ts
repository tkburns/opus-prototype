import { collect } from '&/utils/system/collect';
import { system } from '&/utils/system/system';
import { FilteredToken, lexer, tokenFilter } from './lexer';

export const core = system(
  lexer,
  tokenFilter,
  collect<FilteredToken>()
);
