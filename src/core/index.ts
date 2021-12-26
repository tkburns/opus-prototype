import { collect } from '&/utils/system/collect';
import { Input } from '&/utils/system/input';
import { system, System } from '&/utils/system/system';
import { codeGenerator } from './code-generation';
import { FilteredToken, lexer, Token, tokenFilter } from './lexer';
import { parser } from './parser';
import { injectRuntime } from './runtime';
import { astStringifier, tokenStringifier } from './stringifier';

export const core = (output?: string): System<Input, string> => {
  if (output === 'all-tokens') {
    return system(
      lexer,
      collect<Token>(),
      tokenStringifier
    );
  } else if (output === 'tokens') {
    return system(
      lexer,
      tokenFilter,
      collect<FilteredToken>(),
      tokenStringifier
    );
  } else if (output === 'ast') {
    return system(
      lexer,
      tokenFilter,
      parser,
      astStringifier
    );
  } else {
    return system(
      lexer,
      tokenFilter,
      parser,
      codeGenerator,
      injectRuntime
    );
  }
};
