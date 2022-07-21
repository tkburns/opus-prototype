import { indent, indentChild, lines, stringifyToken } from '&/utils/system/stringification';
import { Module } from '&/utils/system/system';
import { Walkers, createWalkerModule, Walk } from '&/utils/system/tree-walker';
import type * as AST from './ast';
import { Token } from './lexer';

/* ---------- Token ---------- */

export const tokenStringifier: Module<Token[], string> = {
  run: (ts) => ts.map(stringifyToken).join('\n')
};

/* ---------- AST ---------- */

type SNodeRM = [unknown, { meta?: object }] & AST.NodeM<[SNodeRM]>;
type SNode = AST.Get<unknown, SNodeRM>;

const stringifyMeta = (meta: object | undefined): string | undefined => {
  if (meta == null) {
    return undefined;
  }

  const metaLines = lines(
    ...Object.entries(meta)
      .map(([key, value]) => `${key}: ${stringifyMetaItem(value)}`)
  );

  return indent(metaLines, '       .');
};

const stringifyMetaItem = (item: unknown): string => {
  if (item instanceof Set) {
    const values = Array.from(item).map(value => JSON.stringify(value));
    return `Set [${values.join(', ')}]`;
  } else {
    return JSON.stringify(item);
  }
};

type StringifiableNode = { type: string; meta?: object };
const stringifyBranch = (process: Walk<SNode, string>, node: StringifiableNode, children: SNode[]) =>
  lines(
    node.type,
    stringifyMeta(node.meta),
    ...children.map(process)
      .map((child, index) => indentChild(child, index === children.length - 1))
  );

type Stringable = string | number;

interface StringifyLeaf {
  <N extends Exclude<SNode, { value: unknown }>>(node: N): string;
  <N extends Extract<SNode, { value: Stringable }>>(node: N): string;
  <N extends Extract<SNode, { value: unknown }>>(node: N, transform: (v: N['value']) => Stringable): string;
}

type ValueOf<N extends SNode> = N extends { value: unknown }
  ? N['value']
  : never;

const stringifyLeaf: StringifyLeaf = <N extends SNode>(
  node: N,
  transform: (value: ValueOf<N>) => Stringable = (v => v as Stringable)
) => {
  if ('value' in node) {
    return lines(
      `${node.type} :: ${transform(node.value as ValueOf<N>)}`,
      stringifyMeta(node.meta)
    );
  } else {
    return node.type;
  }
};


const walkers: Walkers<SNode, string> = {
  'program': (node, process) => stringifyBranch(
    process,
    node,
    node.entries,
  ),
  'declaration': (node, process) => stringifyBranch(
    process,
    node,
    [
      node.name,
      node.expression
    ]
  ),
  'block-expression': (node, process) => stringifyBranch(
    process,
    node,
    node.entries
  ),
  'function-application': (node, process) => stringifyBranch(
    process,
    node,
    [
      node.func,
      node.arg
    ]
  ),
  'thunk-force': (node, process) => stringifyBranch(
    process,
    node,
    [node.thunk]
  ),
  'match': (node, process) => stringifyBranch(
    process,
    node,
    [
      node.principal,
      ...node.clauses
    ]
  ),
  'match-clause': (node, process) => stringifyBranch(
    process,
    node,
    [
      node.pattern,
      node.body
    ]
  ),
  'name-pattern': (node, process) => stringifyBranch(
    process,
    node,
    [node.name]
  ),
  'tuple-pattern': (node, process) => stringifyBranch(
    process,
    node,
    node.members
  ),
  'particle-pattern': (node, process) => stringifyBranch(
    process,
    node,
    [node.value]
  ),
  'wildcard-pattern': (node) => stringifyLeaf(node),
  'function': (node, process) => stringifyBranch(
    process,
    node,
    [
      node.arg,
      node.body
    ]
  ),
  'thunk': (node, process) => stringifyBranch(
    process,
    node,
    [node.body]
  ),
  'tuple': (node, process) => stringifyBranch(
    process,
    node,
    node.members,
  ),
  'name': (node) => stringifyLeaf(node),
  'atom': (node) => stringifyLeaf(node, v => `:${v}`),
  'bool': (node) => stringifyLeaf(node, v => v.toString()),
  'number': (node) => stringifyLeaf(node),
  'text': (node) => stringifyLeaf(node, v => `"${v}"`),
};

export const astStringifier = createWalkerModule(walkers);
