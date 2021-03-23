import { indentChild, lines } from '&/utils/system/stringification';
import { Walkers, createWalkerModule, Walk } from '&/utils/system/tree-walker';
import type * as AST from './ast.types';

const stringifyBranch = (process: Walk<AST.Node, string>, nodeType: string, children: AST.Node[]) =>
  lines(
    nodeType,
    ...children.map(process)
      .map((child, index) => indentChild(child, index === children.length - 1))
  );

type Stringable = string | number;

interface StringifyLeaf {
  <N extends Extract<AST.Node, { value: Stringable }>>(node: N): string;
  <N extends Extract<AST.Node, { value: unknown }>>(node: N, transform: (v: N['value']) => Stringable): string;
}

const stringifyLeaf: StringifyLeaf = <N extends Extract<AST.Node, { value: unknown }>>(
  node: N,
  transform: (value: N['value']) => Stringable = (v => v as Stringable)
) =>
    `${node.type} :: ${transform(node.value)}`;


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
  'name': (node) => stringifyLeaf(node),
  'atom': (node) => stringifyLeaf(node, v => `:${v}`),
  'number': (node) => stringifyLeaf(node),
  'text': (node) => stringifyLeaf(node, v => `"${v}"`),
};

export const astStringifier = createWalkerModule(walkers);
