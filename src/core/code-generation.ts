import { lines } from '&/utils/system/stringification';
import { Walkers, createWalkerModule } from '&/utils/system/tree-walker';
import type * as AST from './ast.types';


const walkers: Walkers<AST.Node, string> = {
  'program': (node, process) => lines(
    ...node.entries
      .map(process)
      .flatMap(code => [code, '']),
  ),

  'declaration': (node, process) =>
    `const ${process(node.name)} = ${process(node.expression)}`,

  'function-application': (node, process) =>
    `${process(node.func)}(${process(node.arg)})`,

  'match': () => { throw new Error('not implemented'); },
  'match-clause': () => { throw new Error('not implemented'); },
  'value-pattern': () => { throw new Error('not implemented'); },
  'wildcard-pattern': () => { throw new Error('not implemented'); },

  'function': (node, process) =>
    `(${process(node.arg)}) => ${process(node.body)}`,
  'tuple': (node, process) =>
    `[${node.members.map(process).join(', ')}]`,

  'name': (node) => node.value,
  'atom': (node) => `Symbol.for('${node.value}')`,
  'number': (node) => node.token.source,
  'text': (node) => `"${node.value}"`,
};

export const codeGenerator = createWalkerModule(walkers);
