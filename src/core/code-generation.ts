import type * as AST from './ast.types';
import { Module } from '&/utils/system/system';
import { lines, code } from '&/utils/system/stringification';
import { transformByType } from '&/utils/system/tree-walker';
import { last } from '&/utils/list';


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


type MatchOptions = { subject: string };
const match = (node: AST.Match, { subject = 'subject' }: Partial<MatchOptions> = {}) => {
  const exhaustive = last(node.clauses)?.pattern.type === 'wildcard-pattern';

  const clauses = node.clauses.map((clause, num) =>
    matchClause(clause, { subject, exhaustive, last: num === node.clauses.length - 1 })
  );

  let body;
  if (exhaustive) {
    body = clauses.join(' else ');
  } else {
    body = code`
      ${clauses.join(' else ')} else {
        throw new Error(\`no match for \${subject}\`);
      }
    `;
  }

  return code`
    ((${subject}) => {
      ${body}
    })(${expression(node.principal)})
  `;
};

type MatchClauseOptions = MatchOptions & { exhaustive: boolean; last: boolean }
const matchClause = (node: AST.MatchClause, options: MatchClauseOptions) => {
  if (options.exhaustive && options.last && node.pattern.type === 'wildcard-pattern') {
    return code`
      {
        return ${expression(node.body)};
      }
    `;
  } else {
    return code`
      if (${pattern(node.pattern, options)}) {
        return ${expression(node.body)};
      }
    `;
  }
};

const pattern = (node: AST.Pattern, options: MatchOptions) => transformByType(node, {
  'value-pattern': n => valuePattern(n, options),
  'wildcard-pattern': wildcardPattern
});

const valuePattern = (node: AST.ValuePattern, { subject }: MatchOptions) =>
  `__opus_internals__.match.value(${subject}, ${expression(node.value)})`;

const wildcardPattern = (node: AST.WildcardPattern) =>
  'true /* wildcard */';


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
