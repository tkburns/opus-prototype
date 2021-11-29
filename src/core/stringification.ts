import { indentChild, lines, stringifyToken } from '&/utils/system/stringification';
import { Module } from '&/utils/system/system';
import { Walkers, createWalkerModule, Walk } from '&/utils/system/tree-walker';
import type * as AST from './ast.types';
import { Token } from './lexer';

/* ---------- Token ---------- */

export const tokenStringifier: Module<Token[], string> = {
  run: (ts) => ts.map(stringifyToken).join('\n')
};

/* ---------- AST ---------- */

const stringifyBranch = (process: Walk<AST.Node, string>, nodeType: string, children: AST.Node[]) =>
  lines(
    nodeType,
    ...children.map(process)
      .map((child, index) => indentChild(child, index === children.length - 1))
  );

type Stringable = string | number;

interface StringifyLeaf {
  <N extends Exclude<AST.Node, { value: unknown }>>(node: N): string;
  <N extends Extract<AST.Node, { value: Stringable }>>(node: N): string;
  <N extends Extract<AST.Node, { value: unknown }>>(node: N, transform: (v: N['value']) => Stringable): string;
}

type ValueOf<N extends AST.Node> = N extends { value: unknown }
  ? N['value']
  : never;

const stringifyLeaf: StringifyLeaf = <N extends AST.Node>(
  node: N,
  transform: (value: ValueOf<N>) => Stringable = (v => v as Stringable)
) => {
  if ('value' in node) {
    return `${node.type} :: ${transform(node.value as ValueOf<N>)}`;
  } else {
    return node.type;
  }
};


const walkers: Walkers<AST.Node, string> = {
  'program': (node, process) => stringifyBranch(
    process,
    node.type,
    node.entries,
  ),
  'declaration': (node, process) => stringifyBranch(
    process,
    node.type,
    [
      node.name,
      node.expression
    ]
  ),
  'function-application': (node, process) => stringifyBranch(
    process,
    node.type,
    [
      node.func,
      node.arg
    ]
  ),
  'match': (node, process) => stringifyBranch(
    process,
    node.type,
    [
      node.principal,
      ...node.clauses
    ]
  ),
  'match-clause': (node, process) => stringifyBranch(
    process,
    node.type,
    [
      node.pattern,
      node.body
    ]
  ),
  'value-pattern': (node, process) => stringifyBranch(
    process,
    node.type,
    [node.value]
  ),
  'wildcard-pattern': (node) => stringifyLeaf(node),
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
  'bool': (node) => stringifyLeaf(node, v => v.toString()),
  'number': (node) => stringifyLeaf(node),
  'text': (node) => stringifyLeaf(node, v => `"${v}"`),
};

export const astStringifier = createWalkerModule(walkers);
