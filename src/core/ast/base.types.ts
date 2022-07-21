import type * as RS from '&/utils/recursion-scheme';
import type { TokenMap } from '../lexer';

export type BaseNode<RM extends RS.Map = RS.Map> = (
  Name<RM>
);

export type BaseNodeRM<S extends RS.RecSafe<RS.Map>> =
  [Name, Name<RS.RecExtract<S>>];

export type BaseNodeRMExcluding<Pat, S extends RS.RecSafe<RS.Map>> =
  RS.Ex<Pat, Name, [Name, Name<RS.RecExtract<S>>]>;

// TODO - can flip around (derive BaseNode from BaseNodeRM)
// export type BaseNode<RM extends RS.Map = RS.Map> =
//   BaseNodeRM<[RM]>[1];

// export type BaseNodeRM<S extends RS.RecSafe<RS.Map>> =
//   BaseNodeRMExcluding<never, S>;

export type Name<_RM extends RS.Map = RS.Map> = {
  type: 'name';
  value: string;
  token: TokenMap['name'];
};
