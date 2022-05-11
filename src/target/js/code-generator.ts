import type * as AST from '&/core/ast';
import { Module } from '&/utils/system/system';
import { includes } from '&/utils/list';

import * as translator from './translator';
import * as stringifier from './stringifier';

const generate = (node: translator.Translatable) => stringifier.stringify(translator.translate(node));

export const codeGenerator: Module<AST.Node, string> = {
  run: (node) => {
    if (includes(translator.translatableTypes, node.type)) {
      return generate(node as translator.Translatable);
    } else {
      const translatable = translator.translatableTypes.map(t => `  ${t}`).join('\n');
      throw new Error(`cannot generate code directly for a ${node.type};\nsupported nodes are:\n${translatable}`);
    }
  }
};
