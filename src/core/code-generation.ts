import { Module } from '&/utils/system/system';
import { lines, code } from '&/utils/system/stringification';
import type * as AST from './ast.types';
import { transformByType } from '&/utils/system/tree-walker';


const program = (node: AST.Program) => lines(
  ...node.entries
    .map(node => node.type === 'declaration' ? declaration(node) : expression(node))
    .flatMap(code => [`${code};`, '']),
);


const declaration = (node: AST.Declaration) =>
  `const ${name(node.name)} = ${expression(node.expression)}`;

const expression = (node: AST.Expression): string => transformByType(node, {
  'function-application': funcApplication,
  match,
  'function': func,
  tuple,
  name,
  atom,
  number,
  text
});


const funcApplication = (node: AST.FuncApplication) =>{
  const fn = expression(node.func);
  const arg = expression(node.arg);

  return ['name', 'function-application'].includes(node.func.type)
    ? `${fn}(${arg})`
    : `(${fn})(${arg})`;
};


const match = (node: AST.Match) => code`
  runMatch(${expression(node.principal)}, [
    ${node.clauses.map(matchClause).map(item => `${item},`)}
  ])
`;

const matchClause = (node: AST.MatchClause) =>
  `[${pattern(node.pattern)}, () => ${expression(node.body)}]`;

const pattern = (node: AST.Pattern) => transformByType(node, {
  'value-pattern': valuePattern,
  'wildcard-pattern': wildcardPattern
});

const valuePattern = (node: AST.ValuePattern) =>
  `{ type: 'value', value: ${expression(node.value)} }`;

const wildcardPattern = (node: AST.WildcardPattern) =>
  '{ type: \'wildcard\' }';


const func = (node: AST.Func) =>
  `(${name(node.arg)}) => ${expression(node.body)}`;

const tuple = (node: AST.Tuple) =>
  `[${node.members.map(expression).join(', ')}]`;

const name = (node: AST.Name) => node.value;

const atom = (node: AST.Atom) => `Symbol.for('${node.value}')`;

const number = (node: AST.Numeral) => node.token.source;

const text = (node: AST.Text) => `"${node.value}"`;


export const codeGenerator: Module<AST.Node, string> = {
  run: (node) => {
    if (node.type !== 'program') {
      throw new Error(`cannot generate code directly for a ${node.type}; only 'program' is supported`);
    }

    return program(node);
  }
};
