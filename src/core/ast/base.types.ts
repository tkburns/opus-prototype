import type * as RS from '&/utils/recursion-scheme';
import type { TokenMap } from '../lexer';

export type BaseNode<RM extends RS.Map = RS.Map> = (
  Name<RM>
);

// export type BaseNodeM<S extends RS.RecSafe<RS.Map>> = [Name, Name<RS.RecExtract<S>>];
// export type BaseNodeM<S extends RS.RecSafe<RS.Map>> =
//   RS.MakeM<BaseNode, [BaseNode<RS.RecExtract<S>>]>;

export type BaseNodeRM<S extends RS.RecSafe<RS.Map>> =
  RS.MakeRM<BaseNode, [BaseNode<RS.RecExtract<S>>]>;

// TODO - can flip around (derive BaseNode from BaseNodeM)
// export type BaseNode2<RM extends RS.Map = RS.Map> =
//   BaseNodeM<[RM]>[1];

export type Name<_RM extends RS.Map = RS.Map> = {
  type: 'name';
  value: string;
  token: TokenMap['name'];
};
