import { indentChild, lines } from '&/utils/system/stringification';
import { createWalkerModule } from '&/utils/system/tree-walker';
import type * as AST from './ast.types';


const walkers = {
  'program': (node: AST.Program, process: (node: AST.Node) => string) => lines(
    node.type,
    ...stringifyASTChildren(
      process,
      ...node.declarations,
      node.topExpression
    )
  ),
  'declaration': (node: AST.Declaration, process: (node: AST.Node) => string) => lines(
    node.type,
    ...stringifyASTChildren(
      process,
      node.name,
      node.expression
    )
  ),
  'field-access': (node: AST.FieldAccess, process: (node: AST.Node) => string) => lines(
    node.type,
    ...stringifyASTChildren(
      process,
      node.target,
      node.method
    )
  ),
  'function': (node: AST.Func, process: (node: AST.Node) => string) => lines(
    node.type,
    ...stringifyASTChildren(
      process,
      node.arg,
      node.body
    )
  ),
  'tuple': (node: AST.Tuple, process: (node: AST.Node) => string) => lines(
    node.type,
    ...stringifyASTChildren(
      process,
      ...node.members,
    )
  ),
  'name': (node: AST.Name) =>
    `${node.type} :: ${node.value}`,
  'number': (node: AST.Numeral) =>
    `${node.type} :: ${node.value}`,
};

const stringifyASTChildren = (process: (node: AST.Node) => string, ...children: AST.Node[]): string[] =>
  children
    .map(process)
    .map((child, index) => indentChild(child, index === children.length - 1));

export const astStringifier = createWalkerModule<AST.Node, string>(walkers);
