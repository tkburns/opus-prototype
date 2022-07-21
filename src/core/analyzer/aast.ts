/* AAST - annotated abstract syntax tree */

import type * as RS from '&/utils/recursion-scheme';
import type * as CoreAST from '../ast';
import type { BindingsRM } from './bindings';

export type AnnotatedRM = BindingsRM;

export type AST = CoreAST.ASTF<AnnotatedRM>;
export type Node = CoreAST.NodeF<AnnotatedRM>;

export type Get<Pat> = RS.Get<Pat, AnnotatedRM>;
