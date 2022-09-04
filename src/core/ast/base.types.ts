import type * as RS from '&/utils/recursion-scheme';
import type { TokenMap } from '../lexer';

export type BaseNode<RM extends RS.Map = RS.Map> = (
  Name<RM>
);

export type Name<_RM extends RS.Map = RS.Map> = {
  type: 'name';
  value: string;
  token: TokenMap['name'];
};
