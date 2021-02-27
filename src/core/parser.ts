import { createRDParser, LexerHandle, repeated, oneOf, optional } from '&/utils/system/parser';
import { FilteredToken } from './lexer';

type Handle = LexerHandle<FilteredToken>;

const program = (handle: Handle) => {
  const children = repeated(handle, () =>
    oneOf(handle, [
      declaration,
      expression
    ])
  );

  if (!handle.atEOI()) {
    const token = handle.peek();
    throw new Error(`failed to parse 'program'; expected EOI but recieved token ${token.type} (at ${token.location.line}:${token.location.column})`);
  }

  return {
    type: 'program',
    children
  } as const;
};

const declaration = (handle: Handle) => {
  const vrb = name(handle);
  handle.consume('=');
  const expr = expression(handle);

  return {
    type: 'declaration',
    children: [vrb, expr],
    name: vrb,
    expression: expr
  } as const;
};

type ExpressionNode = (
  // ReturnType<typeof parenthesizedExpression> |
  // ReturnType<typeof fieldAccess> |
  // ReturnType<typeof func> |
  ReturnType<typeof tuple> |
  ReturnType<typeof name> |
  ReturnType<typeof number>
);
const expression = (handle: Handle): ExpressionNode => {
  return oneOf(handle, [
    // parenthesizedExpression,
    // fieldAccess,
    // func,
    tuple,
    name,
    number,
  ]);
};

const parenthesizedExpression = (handle: Handle) => {
  handle.consume('(');
  const expr = expression(handle);
  handle.consume(')');

  return expr;
};

const fieldAccess = (handle: Handle) => {
  const target = name(handle);
  handle.consume('.');
  const method = name(handle);

  return {
    type: 'field-access',
    target,
    method,
    children: [target, method]
  } as const;
};

const func = (handle: Handle) => {
  const arg = name(handle);
  handle.consume('=>');
  const expr = expression(handle);

  return {
    type: 'func',
    arg,
    body: expr,
    children: [arg, expr]
  } as const;
};

const tuple = (handle: Handle) => {
  handle.consume('(');

  const members = repeated(handle, () => {
    const member = expression(handle);
    optional(handle, () => {
      handle.consume(',');
    });

    return member;
  });

  handle.consume(')');

  return {
    type: 'tuple',
    members,
    children: members
  } as const;
};

const name = (handle: Handle) => {
  const token = handle.consume('name');

  return {
    type: 'name',
    value: token.value,
    token
  } as const;
};

const number = (handle: Handle) => {
  const token = handle.consume('number');

  return {
    type: 'number',
    value: token.value,
    token
  } as const;
};

export const parser = createRDParser(program);
