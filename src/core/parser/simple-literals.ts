import { choice } from '&/utils/system/parser';

import type * as AST from '../ast';

import { RDParser } from './base';

export const simpleLiteral: RDParser<AST.SimpleLiteral> = (handle, ctx) => {
  return choice(handle, ctx, [
    atom,
    bool,
    number,
    text,
  ]);
};

export const atom: RDParser<AST.Atom> = (handle) => {
  const token = handle.consume('atom');

  return {
    type: 'atom',
    value: token.value,
    token
  };
};

export const bool: RDParser<AST.Bool> = (handle) => {
  const token = handle.consume('bool');

  return {
    type: 'bool',
    value: token.value,
    token
  };
};

export const number: RDParser<AST.Numeral> = (handle) => {
  const token = handle.consume('number');

  return {
    type: 'number',
    value: token.value,
    token
  };
};

export const text: RDParser<AST.Text> = (handle) => {
  const token = handle.consume('text');

  return {
    type: 'text',
    value: token.value,
    token
  };
};

