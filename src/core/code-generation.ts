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
  'thunk-force': thunkForce,
  match,
  'function': func,
  thunk,
  tuple,
  name,
  atom,
  bool,
  number,
  text
});


const safeFnAppTypes = [
  'name',
  'function-application',
  'thunk-application',
  'match'
];

const funcApplication = (node: AST.FuncApplication) =>{
  const fn = expression(node.func);
  const arg = expression(node.arg);

  return safeFnAppTypes.includes(node.func.type)
    ? `${fn}(${arg})`
    : `(${fn})(${arg})`;
};

const thunkForce = (node: AST.ThunkForce) =>{
  const thunk = expression(node.thunk);

  return safeFnAppTypes.includes(node.thunk.type)
    ? `${thunk}()`
    : `(${thunk})()`;
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

const pattern = (node: AST.Pattern, options: MatchOptions): string => transformByType(node, [options], {
  'name-pattern': namePattern,
  'tuple-pattern': tuplePattern,
  'simple-literal-pattern': simpleLiteralPattern,
  'wildcard-pattern': wildcardPattern
});

const namePattern = (node: AST.NamePattern, { subject }: MatchOptions) =>
  `__opus_internals__.match.name(${subject}, ${name(node.name)})`;

const tuplePattern = (node: AST.TuplePattern, { subject }: MatchOptions) => {
  const memberMatches = node.members.map((member, index) => {
    const subjectMember = `${subject}._${index}`;
    return `() => ${pattern(member, { subject: subjectMember })}`;
  });

  return code`
    __opus_internals__.match.tuple(${subject}, [
      ${memberMatches.join(',\n')}
    ])
  `;
};

const simpleLiteralPattern = (node: AST.SimpleLiteralPattern, { subject }: MatchOptions) =>
  `__opus_internals__.match.simpleLiteral(${subject}, ${expression(node.value)})`;

const wildcardPattern = (node: AST.WildcardPattern) =>
  'true /* wildcard */';


const func = (node: AST.Func) => {
  return `(${name(node.arg)}) => ${funcBody(node.body)}`;
};

const funcBody = (body: AST.Expression) => {
  const isObject = body.type === 'tuple';
  return isObject
    ? `(${expression(body)})`
    : expression(body);
};

const thunk = (node: AST.Thunk) => {
  return `() => ${funcBody(node.body)}`;
};

const tuple = (node: AST.Tuple) => {
  const memberFields = node.members.map((member, index) =>
    `_${index}: ${expression(member)}`
  );

  return code`
    {
      __opus_kind__: 'tuple',
      size: ${node.members.length},
      ${memberFields.join(',\n')}
    }
  `;
};

const name = (node: AST.Name) => node.value;

const atom = (node: AST.Atom) => `Symbol.for('${node.value}')`;

const bool = (node: AST.Bool) => node.value.toString();

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
