import type * as RS from '&/utils/recursion-scheme';
import type { Typed } from '&/utils/nodes';
import type { ProgramNode, Program } from './program.types';
import type { ExpressionNode } from './expression.types';
import type { PatternNode } from './pattern.types';
import type { BaseNode } from './base.types';

export * from './program.types';
export * from './pattern.types';
export * from './expression.types';
export * from './base.types';

/*
  legend:
    _F - the "unbound" node types
    _RM - the "unbound" map type
    _M - the "bound" map type
    _ - the "bound" node types
*/

export type ASTF<RM extends RS.Map = RS.Map> = Program<RM>;
export type NodeF<RM extends RS.Map = RS.Map> = (
  ProgramNode<RM> |
  ExpressionNode<RM> |
  PatternNode<RM> |
  BaseNode<RM>
);


export type NodeRM<R extends RS.RecSafe<RS.Map> = RS.RecSafe<RS.Map>> = {
  [T in NodeF['type']]: Extract<NodeF<R[0]>, Typed<T>>;
}

export type ASTM = NodeRM<[ASTM]>;


export type AST = ASTF<ASTM>;
export type Node = NodeF<ASTM>;

// TODO - rename? NodeOf/NodeOfT?
export type Get<Pat extends NodeF, RM extends RS.Map = NodeRM> = RS.Get<Pat, RM>;
export type GetT<Tp extends NodeF['type'], RM extends RS.Map = NodeRM> = RS.GetT<Tp, RM>;

