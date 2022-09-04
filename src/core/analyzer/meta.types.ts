import type * as RS from '&/utils/recursion-scheme';
import * as AST from '../ast';

export type Meta<T> = { meta: T };

export type AnnotatedM<X extends RS.Map> =
    AST.NodeRM<[AnnotatedM<X>]> & X;