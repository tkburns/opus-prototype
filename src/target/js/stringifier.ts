import { mapByType } from '&/utils/nodes';
import { code } from '&/utils/system/stringification';
import * as js from './nodes';

export const program = (node: js.Program): string => {
  const body = node.body.map(stringifyNode).join('\n\n');
  return `${body}\n`;
};

const statements = (nodes: js.Statement<js.StatementContext.Func>[]): string => {
  return nodes
    .map(stringifyNode)
    .join('\n');
};

export const declaration = (node: js.Declaration): string =>
  `const ${stringifyNode(node.identifier)} = ${stringifyNode(node.body)};`;

export const ifElse = (node: js.IfElse<js.StatementContext.Func>): string => {
  const ifClauses = node.clauses.map(clause => code`
    if (${stringify(clause.condition)}) {
      ${statements(clause.body)}
    }
  `);

  if (ifClauses.length === 0 && node.else) {
    return statements(node.else);
  }

  let clauses = ifClauses;
  if (node.else) {
    const elseClause = code`
      {
        ${statements(node.else)}
      }
    `;

    clauses = [...ifClauses, elseClause];
  }

  return clauses.join(' else ');
};

export const expressionStatement = (node: js.ExpressionStatement): string =>
  `${stringify(node.value)};`;

export const identifier = (node: js.Identifier): string => node.name;

export const func = (node: js.Func): string => {
  const args = `(${node.args.map(identifier).join(', ')})`;

  let body: string;
  if (node.body.length === 1 && node.body[0].type == js.Type.Return) {
    const ret = node.body[0].value;

    body = ret.type === js.Type.Object
      ? `(${stringifyNode(ret)})`
      : stringifyNode(ret);
  } else {
    body = code`
      {
        ${statements(node.body)}
      }
    `;
  }

  return code`
    ${args} => ${body}
  `;
};

const retn = (node: js.Return): string =>
  `return ${stringifyNode(node.value)};`;

export const funcCall = (node: js.FuncCall): string => {
  const callee = stringifyNode(node.callee);
  const args = node.args.map(stringifyNode).join(', ');

  if (node.callee.type === 'identifier' || node.callee.type === 'func-call') {
    return `${callee}(${args})`;
  } else {
    return `(${callee})(${args})`;
  }
};

/* eslint-disable indent */
export const object = (node: js.Object): string => code`
  {
    ${Object.entries(node.fields).map(([name, value]) =>
      `${name}: ${stringifyNode(value)},`
    )}
  }
`;
/* eslint-enable indent */

export const symbol = (node: js.Symbol): string => {
  if (node.name != null) {
    return `Symbol.for('${node.name}')`;
  } else {
    return 'Symbol()';
  }
};

export const boolean = (node: js.Boolean): string => node.value.toString();
export const number = (node: js.Number): string => node.value;
export const string = (node: js.String): string => `'${node.value}'`;

const stringifyInterpolation = (node: js.RawChunk) => {
  if (typeof node === 'object' && 'type' in node) {
    return stringifyNode(node);
  } else {
    return node;
  }
};
export const raw = (node: js.Raw): string => {
  const stringifiedInterpolations = node.interpolations
    .map(interp => Array.isArray(interp) ? interp : [interp])
    .map(interp => interp.map(stringifyInterpolation));

  return code(node.literals, ...stringifiedInterpolations);
};


const standaloneStringifiers = {
  [js.Type.Program]: program,
  [js.Type.Declaration]: declaration,
  [js.Type.IfElse]: ifElse,
  [js.Type.ExpressionStatement]: expressionStatement,
  [js.Type.Identifier]: identifier,
  [js.Type.Func]: func,
  [js.Type.Return]: retn,
  [js.Type.FuncCall]: funcCall,
  [js.Type.Object]: object,
  [js.Type.Symbol]: symbol,
  [js.Type.Boolean]: boolean,
  [js.Type.Number]: number,
  [js.Type.String]: string,
  [js.Type.Raw]: raw,
};

const stringifyNode = mapByType({
  ...standaloneStringifiers,
});
const stringifyStandalone = mapByType(standaloneStringifiers);

export const stringify = stringifyStandalone;
