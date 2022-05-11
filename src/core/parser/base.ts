import { ConsumeHandle } from '&/utils/system/parser/handles';
import type * as Base from '&/utils/system/parser/common.types';

import { FilteredToken } from '../lexer';
import type * as AST from '../ast';

export type RDParser<Node, C = object> = Base.RDParser<ConsumeHandle<FilteredToken>, C, Node>;

export const name: RDParser<AST.Name> = (handle) => {
  const token = handle.consume('name');

  return {
    type: 'name',
    value: token.value,
    token
  };
};

