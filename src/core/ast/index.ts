import type * as RS from '&/utils/recursion-scheme';
import type { ProgramNode, Program, ProgramNodeRM } from './program.types';
import type { ExpressionNode, ExpressionNodeRM } from './expression.types';
import type { PatternNode, PatternNodeRM } from './pattern.types';
import type { BaseNode, BaseNodeRM } from './base.types';

export * from './program.types';
export * from './pattern.types';
export * from './expression.types';
export * from './base.types';

// TODO - rename all RM nodes to FooR, create new pre-bound Foo nodes ?

export type ASTF<RM extends RS.Map = RS.Map> = Program<RM>;
export type NodeF<RM extends RS.Map = RS.Map> = (
  ProgramNode<RM> |
  ExpressionNode<RM> |
  PatternNode<RM> |
  BaseNode<RM>
);

// TODO - rename?
// TODO should RM extend RS.Map ..? doesn't need to (because of the &) but should?
// export type NodeM<RM extends RS.Map = RS.Map> = RM & (
//   ProgramNodeM<[NodeM<RM>]> |
//   ExpressionNodeM<[NodeM<RM>]> |
//   PatternNodeM<[NodeM<RM>]> |
//   BaseNodeM<[NodeM<RM>]>
// );
// export type NodeM<RM extends RS.Map = RS.Map> =
//   RS.Ext<[ProgramNodeM<[NodeM<RM>]>], RM> |
//   RS.Ext<[ExpressionNodeM<[NodeM<RM>]>], RM> |
//   RS.Ext<[PatternNodeM<[NodeM<RM>]>], RM> |
//   RS.Ext<[BaseNodeM<[NodeM<RM>]>], RM>;

export type NodeRM =
  ProgramNodeRM<[NodeRM]> |
  ExpressionNodeRM<[NodeRM]> |
  PatternNodeRM<[NodeRM]> |
  BaseNodeRM<[NodeRM]>;

// TODO - need to be able to combine two patterns to & the matching results??

// TODO - drop the extensible NodeM stuff - just export the base Map
// build other variants through Exclude/Extract & filling out whole node patterns

export type AST = ASTF<NodeRM>;
export type Node = NodeF<NodeRM>;

export type NodeOf<T extends Node['type'], RM extends RS.Map = NodeRM> =
  Extract<NodeF<RM>, { type: T }>;

