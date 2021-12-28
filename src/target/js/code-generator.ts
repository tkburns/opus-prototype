import type * as AST from '&/core/ast.types';
import { Module } from '&/utils/system/system';
import { lines, code } from '&/utils/system/stringification';
import { transformByType } from '&/utils/nodes';
import { last } from '&/utils/list';

import * as translator from './translator';
import * as stringifier from './stringifier';


const program = (node: AST.Program) => lines(
  ...node.entries
    .map(node => node.type === 'declaration' ? declaration(node) : expression(node))
    .flatMap(code => [`${code};`, '']),
);


const declaration = (node: AST.Declaration) =>
  `const ${generate(node.name)} = ${expression(node.expression)}`;

const expression = (node: AST.Expression): string => transformByType(node, {
  'block-expression': blockExpression,
  'function-application': funcApplication,
  'thunk-force': thunkForce,
  match,
  'function': func,
  thunk,
  tuple: generate,
  name: generate,
  atom: generate,
  bool: generate,
  number: generate,
  text: generate
});

const blockExpression = (node: AST.BlockExpression): string => {
  const lastEntry = last(node.entries);
  const entries = node.entries.map(node =>
    node.type === 'declaration' ? declaration(node) : expression(node)
  );

  let body;
  let ret;

  if (lastEntry && lastEntry.type !== 'declaration') {
    body = entries.slice(0, -1).map(code => `${code};`);
    ret = last(entries as [string, ...string[]]);
  } else {
    body = entries.map(code => `${code};`);
    ret = 'undefined';
  }

  return code`
    (() => {
      ${body}
      return ${ret};
    })()
  `;
};


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
  `__opus_internals__.match.name(${subject}, ${generate(node.name)})`;

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
  return `(${generate(node.arg)}) => ${funcBody(node.body)}`;
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

const generate = (node: translator.Translatable) => stringifier.stringify(translator.translate(node));


export const codeGenerator: Module<AST.Node, string> = {
  run: (node) => {
    if (node.type !== 'program') {
      throw new Error(`cannot generate code directly for a ${node.type}; only 'program' is supported`);
    }

    return program(node);
  }
};
