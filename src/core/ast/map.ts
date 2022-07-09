import type * as RS from '&/utils/recursion-scheme';
import { NodeF } from '.';

// TODO!!!! - make nodes classes & put map fns directly on the nodes

// TODO - move Node definition to node.ts file
// reexport from index
// so that map can be exported from index

export const map = <A extends RS.Map, B extends RS.Map>(
  f: () => unknown,
  node: NodeF<A>
) => {};


