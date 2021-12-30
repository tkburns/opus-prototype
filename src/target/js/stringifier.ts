import { mapByType } from '&/utils/nodes';
import { code } from '&/utils/system/stringification';
import * as js from './nodes';

export const declaration = (node: js.Declaration): string =>
  `const ${stringify(node.identifier)} = ${stringify(node.body)}`;

export const identifier = (node: js.Identifier): string => node.name;

export const func = (node: js.Func): string => {
  if (node.body.length === 0 && node.ret != null) {
    const body = node.ret.type === 'object'
      ? `(${stringify(node.ret)})`
      : stringify(node.ret);

    return code`
      (${node.args.map(identifier).join(', ')}) => ${body}
    `;
  } else {
    return code`
      (${node.args.map(identifier).join(', ')}) => {
        ${node.body.map(statement => `${stringify(statement)};`)}
        ${node.ret ? `return ${stringify(node.ret)};` : '/* no return */'}
      }
    `;
  }
};

export const funcCall = (node: js.FuncCall): string => {
  const callee = stringify(node.callee);
  const args = node.args.map(stringify).join(', ');

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
      `${name}: ${stringify(value)},`
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


export const stringify = mapByType({
  [js.Type.Declaration]: declaration,
  [js.Type.Identifier]: identifier,
  [js.Type.Func]: func,
  [js.Type.FuncCall]: funcCall,
  [js.Type.Object]: object,
  [js.Type.Symbol]: symbol,
  [js.Type.Boolean]: boolean,
  [js.Type.Number]: number,
  [js.Type.String]: string
});
