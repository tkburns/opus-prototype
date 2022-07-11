import type * as RS from '&/utils/recursion-scheme';
import type { ProgramNode, Program, ProgramNodeRM } from './program.types';
import type { ExpressionNode, ExpressionNodeRM } from './expression.types';
import type { PatternNode, PatternNodeRM } from './pattern.types';
import type { BaseNode, BaseNodeRM } from './base.types';

export * from './program.types';
export * from './pattern.types';
export * from './expression.types';
export * from './base.types';

export type ASTF<RM extends RS.Map = RS.Map> = Program<RM>;
export type NodeF<RM extends RS.Map = RS.Map> = (
  ProgramNode<RM> |
  ExpressionNode<RM> |
  PatternNode<RM> |
  BaseNode<RM>
);

// TODO - rename
export type NodeM<RM extends RS.RecSafe<RS.Map> = RS.RecSafe<RS.Map>> =
  ProgramNodeRM<RM> |
  ExpressionNodeRM<RM> |
  PatternNodeRM<RM> |
  BaseNodeRM<RM>;

export type BaseRM = NodeM<[BaseRM]>;


export type AST = ASTF<BaseRM>;
export type Node = NodeF<BaseRM>;

export type Get<Pat, RM extends RS.Map = BaseRM> = RS.Get<Pat, RM>;

export type NodeOf<T extends Node['type'], RM extends RS.Map = BaseRM> =
  Extract<NodeF<RM>, { type: T }>;

