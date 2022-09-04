/* AAST - annotated abstract syntax tree */

import { Typed } from '&/utils/nodes';
import type * as RS from '&/utils/recursion-scheme';
import type * as CoreAST from '../ast';
import type { BindingsMeta } from './bindings';
import { AnnotatedM } from './meta.types';

export type ASTM = AnnotatedM<BindingsMeta>;

export type AST = CoreAST.ASTF<ASTM>;
export type Node = CoreAST.NodeF<ASTM>;

export type Get<Pat extends CoreAST.NodeF> = RS.Get<Pat, ASTM>;
export type GetT<Tp extends CoreAST.NodeF['type']> = RS.GetT<Tp, ASTM>;
