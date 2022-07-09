import type * as RS from '&/utils/recursion-scheme';
import type { Name } from './base.types';
import type { Expression } from './expression.types';

export type ProgramNode<RM extends RS.Map = RS.Map> = (
  Program<RM> |
  Declaration<RM>
);

// can this be combined with above..?
// export type ProgramNodeM<S extends RS.RecSafe<RS.Map>> = (
//   [Program, Program<RS.RecExtract<S>>] |
//   [Declaration, Declaration<RS.RecExtract<S>>]
// );

// export type ProgramNodeM<S extends RS.RecSafe<RS.Map>> =
//   RS.MakeRM<ProgramNode, [ProgramNode<RS.RecExtract<S>>]>;

// type MakeRM<T, U extends [unknown]> = T extends unknown
//   ? [T, T & U[0]]
//   : never;

// export type ProgramNodeRM<S extends RS.RecSafe<RS.Map>> =
//   MakeRM<ProgramNode, [ProgramNode<RS.RecExtract<S>>]>;
export type ProgramNodeRM<S extends RS.RecSafe<RS.Map>> = (
  [Program, Program<RS.RecExtract<S>>] |
  [Declaration, Declaration<RS.RecExtract<S>>]
);

export type Program<RM extends RS.Map = RS.Map> = {
  type: 'program';
  entries: (Declaration<RM> | Expression<RM>)[];
};

export type Declaration<RM extends RS.Map = RS.Map> = {
  type: 'declaration';
  name: RS.Get<RM, Name>;
  expression: RS.Get<RM, Expression>;
};
