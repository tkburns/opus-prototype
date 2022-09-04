import type * as RS from '&/utils/recursion-scheme';
import type { Name } from './base.types';
import type { Expression } from './expression.types';

export type ProgramNode<RM extends RS.Map = RS.Map> = (
  Program<RM> |
  Declaration<RM>
);

// TODO - add types for Get<> wrappers - eg
// TODO - autogenerate wrappers ??
// type ProgramT<RM extends RS.Map = RS.Map> = RS.Get<Program, RM>;
// can even rename X to XF and make XT be X

export type Program<RM extends RS.Map = RS.Map> = {
  type: 'program';
  entries: (RS.Get<Declaration, RM> | RS.Get<Expression, RM>)[];
};

export type Declaration<RM extends RS.Map = RS.Map> = {
  type: 'declaration';
  name: RS.Get<Name, RM>;
  expression: RS.Get<Expression, RM>;
};
