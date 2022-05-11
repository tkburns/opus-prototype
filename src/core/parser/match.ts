import { repeated, optional, choice } from '&/utils/system/parser';

import type * as AST from '../ast';

import { name, RDParser } from './base';
import { simpleLiteral } from './simple-literals';

export const pattern: RDParser<AST.Pattern> = (handle, ctx) => {
  return choice(handle, ctx, [
    wildcardPattern,
    simpleLiteralPattern,
    namePattern,
    tuplePattern
  ]);
};

const namePattern: RDParser<AST.NamePattern> = (handle, ctx) => {
  const nm = name(handle, ctx);
  return {
    type: 'name-pattern',
    name: nm
  };
};

const tuplePattern: RDParser<AST.TuplePattern> = (handle, ctx) => {
  handle.consume('(');

  const [members] = repeated(handle, ctx, () => {
    const member = pattern(handle, ctx);
    optional(handle, ctx, () => {
      handle.consume(',');
    });

    return member;
  });

  handle.consume(')');

  return {
    type: 'tuple-pattern',
    members
  };
};

const simpleLiteralPattern: RDParser<AST.SimpleLiteralPattern> = (handle, ctx) => {
  const value = simpleLiteral(handle, ctx);
  return {
    type: 'simple-literal-pattern',
    value
  };
};

const wildcardPattern: RDParser<AST.WildcardPattern> = (handle) => {
  handle.consume('_');
  return { type: 'wildcard-pattern' };
};
