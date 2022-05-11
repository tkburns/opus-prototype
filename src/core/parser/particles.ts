import { choice } from '&/utils/system/parser';

import type * as AST from '../ast';

import { RDParser } from './base';

/**
 * "particles" are simple literals that are made up of a single value
 * in contrast to composite literals (eg tuples) that are made up of
 * multiple values composed together
 *
 * I couldn't think of a better name, so for now I'm going with "particles"
 * (fits with the codebase better than "simple literal")
 */

export const particle: RDParser<AST.Particle> = (handle, ctx) => {
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

