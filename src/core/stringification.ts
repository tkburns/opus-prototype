import { indentChild, lines } from '&/utils/system/stringification';
import { Walkers, createWalkerModule, Walk } from '&/utils/system/tree-walker';
import type * as AST from './ast.types';

const stringifyBranch = (process: Walk<AST.Node, string>, nodeType: string, children: AST.Node[]) =>
  lines(
    nodeType,
    ...children.map(process)
      .map((child, index) => indentChild(child, index === children.length - 1))
  );

const stringifyLeaf = (node: Extract<AST.Node, { value: unknown }>) =>
  `${node.type} :: ${node.value}`;


const walkers: Walkers<AST.Node, string> = {
  'program': (node, process) => stringifyBranch(
    process,
    node.type,
    [
      ...node.declarations,
      node.topExpression
    ]
  ),
  'declaration': (node, process) => stringifyBranch(
    process,
    node.type,
    [
      node.name,
      node.expression
    ]
  ),
  'function-call': (node, process) => stringifyBranch(
    process,
    node.type,
    [
      node.func,
      node.arg
    ]
  ),
  'function': (node, process) => stringifyBranch(
    process,
    node.type,
    [
      node.arg,
      node.body
    ]
  ),
  'tuple': (node, process) => stringifyBranch(
    process,
    node.type,
    node.members,
  ),
  'name': stringifyLeaf,
  'number': stringifyLeaf,
};

export const astStringifier = createWalkerModule(walkers);
