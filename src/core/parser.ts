import { createRDParser, LexerHandle, ParseTree, ParseNode, parseOneOf } from '&/utils/system/parser';
import { FilteredToken } from './lexer';

type RDParser = (handle: LexerHandle<FilteredToken>) => ParseTree;

const program: RDParser = (handle) => {
  let children: ParseNode[] = [];

  while (!handle.atEOI()) {
    const child = parseOneOf('program', handle, [
      declaration,
      expression,
    ]);
    children = [...children, child];
  }

  return {
    type: 'program',
    children
  };
};

const declaration: RDParser = (handle) => {
  const vrb = name(handle);
  handle.consume('=');
  const expr = expression(handle);

  return {
    type: 'declaration',
    children: [vrb, expr]
  };
};

const expression: RDParser = (handle) => {
  const expr = parseOneOf('expression', handle, [
    parenthesizedExpression,
    fieldAccess,
    func,
    tuple,
    name,
    number,
  ]);

  return {
    type: 'expression',
    children: [expr]
  };
};

const parenthesizedExpression: RDParser = (handle) => {
  handle.consume('(');
  const expr = expression(handle);
  handle.consume('(');

  return expr;
};

const fieldAccess: RDParser = (handle) => {
  const target = name(handle);
  handle.consume('.');
  const method = name(handle);

  return {
    type: 'field-access',
    children: [target, method]
  };
};

const func: RDParser = () => {
  throw new Error('func parser not implemented yet');
};

const tuple: RDParser = (handle) => {
  let members: ParseNode[] = [];

  while (handle.peek().type !== ')') {
    const member = expression(handle);
    members = [...members, member];

    const next = handle.peek();
    if (next.type === ',') {
      handle.consume(',');
    }
  }

  handle.consume(')');

  return {
    type: 'program',
    children: members
  };
};

const name: RDParser = (handle) => {
  const token = handle.consume('name');

  return {
    type: 'name',
    token
  };
};

const number: RDParser = (handle) => {
  const token = handle.consume('number');

  return {
    type: 'number',
    token
  };
};

export const parser = createRDParser(program);
