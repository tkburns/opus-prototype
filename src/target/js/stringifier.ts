import { mapByType } from '&/utils/nodes';
import { code } from '&/utils/system/stringification';
import * as js from './nodes';

export const declaration = (node: js.Declaration): string =>
  `const ${stringifyNode(node.identifier)} = ${stringifyNode(node.body)}`;

export const identifier = (node: js.Identifier): string => node.name;

export const func = (node: js.Func): string => {
  if (node.body.length === 1 && node.body[0].type == js.Type.Return) {
    const ret = node.body[0].value;

    const body = ret.type === js.Type.Object
      ? `(${stringifyNode(ret)})`
      : stringifyNode(ret);

    return code`
      (${node.args.map(identifier).join(', ')}) => ${body}
    `;
  } else {
    return code`
      (${node.args.map(identifier).join(', ')}) => {
        ${node.body.map(statement => `${stringifyNode(statement)};`)}
      }
    `;
  }
};

const retn = (node: js.Return): string =>
  `return ${stringifyNode(node.value)}`;

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


const standaloneStringifiers = {
  [js.Type.Declaration]: declaration,
  [js.Type.Identifier]: identifier,
  [js.Type.Func]: func,
  [js.Type.Return]: retn,
  [js.Type.FuncCall]: funcCall,
  [js.Type.Object]: object,
  [js.Type.Symbol]: symbol,
  [js.Type.Boolean]: boolean,
  [js.Type.Number]: number,
  [js.Type.String]: string,
};

const stringifyNode = mapByType({
  ...standaloneStringifiers,
});
const stringifyStandalone = mapByType(standaloneStringifiers);

export const stringify = stringifyStandalone;
