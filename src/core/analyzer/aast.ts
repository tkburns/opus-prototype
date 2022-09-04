/* AAST - annotated abstract syntax tree */

import { Typed } from '&/utils/nodes';
import type * as RS from '&/utils/recursion-scheme';
import type * as CoreAST from '../ast';
import type { BindingsM } from './bindings';

export type AnnotatedRM = BindingsM;

export type AST = CoreAST.ASTF<AnnotatedRM>;
export type Node = CoreAST.NodeF<AnnotatedRM>;

export type Get<Pat extends CoreAST.NodeF> = RS.Get<Pat, AnnotatedRM>;
export type GetT<Tp extends CoreAST.NodeF['type']> = RS.GetT<Tp, AnnotatedRM>;
