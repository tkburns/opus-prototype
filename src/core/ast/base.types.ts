import type * as RS from '&/utils/recursion-scheme';
import type { TokenMap } from '../lexer';

export type BaseNode<RM extends RS.Map = RS.Map> = (
  Name<RM>
);

export type BaseNodeRM<S extends RS.RecSafe<RS.Map>> =
  [Name, Name<RS.RecExtract<S>>];

// TODO - can flip around (derive BaseNode from BaseNodeRM)
// export type BaseNode<RM extends RS.Map = RS.Map> =
//   BaseNodeRM<[RM]>[1];

export type Name<_RM extends RS.Map = RS.Map> = {
  type: 'name';
  value: string;
  token: TokenMap['name'];
};
