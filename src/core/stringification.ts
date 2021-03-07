import { indentChild, lines } from '&/utils/system/stringification';
import type * as AST from './ast.types';

export const stringifyAST = (ast: AST.AST): string => stringifyASTNode(ast);

const stringifyASTNode = (node: AST.Node): string => {
  if (node.type === 'program') {
    return lines(
      node.type,
      ...stringifyASTChildren(
        ...node.declarations,
        node.topExpression
      )
    );
  } else if (node.type === 'declaration') {
    return lines(
      node.type,
      ...stringifyASTChildren(
        node.name,
        node.expression
      )
    );
  } else if (node.type === 'field-access') {
    return lines(
      node.type,
      ...stringifyASTChildren(
        node.target,
        node.method
      )
    );
  } else if (node.type === 'function') {
    return lines(
      node.type,
      ...stringifyASTChildren(
        node.arg,
        node.body
      )
    );
  } else if (node.type === 'tuple') {
    return lines(
      node.type,
      ...stringifyASTChildren(
        ...node.members,
      )
    );
  } else if (node.type === 'name') {
    return `${node.type} :: ${node.value}`;
  } else if (node.type === 'number') {
    return `${node.type} :: ${node.value}`;
  } else {
    throw new Error('unexpected node type');
  }
};

const stringifyASTChildren = (...children: AST.Node[]): string[] =>
  children
    .map(stringifyASTNode)
    .map((child, index) => indentChild(child, index === children.length - 1));
