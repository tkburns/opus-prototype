import { createRDParser, repeated, optional, choice } from '&/utils/system/parser';

import type * as AST from '../ast';

import { RDParser } from './base';
import { declaration, expression } from './core';


export const program: RDParser<AST.Program> = (handle, ctx) => {
  const [entries, error] = repeated(handle, ctx, () => {
    const entry = choice(handle, ctx, [declaration, expression]);

    optional(handle, ctx, () => {
      handle.consume(';');
    });

    return entry;
  });

  try {
    handle.consumeEOI();
  } catch {
    throw error;
  }

  return {
    type: 'program',
    entries
  };
};


const root: RDParser<AST.AST> = program;
export const parser = createRDParser(root);
