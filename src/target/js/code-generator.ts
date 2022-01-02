import type * as AST from '&/core/ast.types';
import { Module } from '&/utils/system/system';
import { lines } from '&/utils/system/stringification';

import * as translator from './translator';
import * as stringifier from './stringifier';


const program = (node: AST.Program) => lines(
  ...node.entries
    .map(generate)
    .flatMap(code => [`${code};`, '']),
);


const generate = (node: translator.Translatable) => stringifier.stringify(translator.translate(node));


export const codeGenerator: Module<AST.Node, string> = {
  run: (node) => {
    if (node.type !== 'program') {
      throw new Error(`cannot generate code directly for a ${node.type}; only 'program' is supported`);
    }

    return program(node);
  }
};
