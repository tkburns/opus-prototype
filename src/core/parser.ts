import { createRDParser, repeated, optional, choice } from '&/utils/system/parser';
import { FilteredToken } from './lexer';
import type * as AST from './ast.types';
import { lrec } from '&/utils/system/parser/lrec';
import { ConsumeHandle } from '&/utils/system/parser/handles';

type RDParser<Node> = (handle: ConsumeHandle<FilteredToken>) => Node;

const program: RDParser<AST.Program> = (handle) => {
  const [entries, error] = repeated(handle, () =>
    choice(handle, [declaration, expression])
  );

  try {
    handle.consumeEOI();
  } catch {
    throw error;
  }

  return {
    type: 'program',
    entries
  };
};

const declaration: RDParser<AST.Declaration> = (handle) => {
  const vrb = name(handle);
  handle.consume('=');
  const expr = expression(handle);

  return {
    type: 'declaration',
    name: vrb,
    expression: expr,
  };
};

const expression: RDParser<AST.Expression> = (handle) => {
  return choice(handle, [
    parenthesizedExpression,
    funcCall,
    func,
    tuple,
    name,
    atom,
    number,
    text,
  ]);
};

const parenthesizedExpression: RDParser<AST.Expression> = (handle) => {
  handle.consume('(');
  const expr = expression(handle);
  handle.consume(')');

  return expr;
};

const funcCall: RDParser<AST.FuncCall> = lrec('func-call', (handle) => {
  const func = expression(handle);

  // require at least one instance
  const [args, argError] = repeated(handle, () => {
    handle.consume('(');
    const arg = expression(handle);
    handle.consume(')');

    return arg;
  });

  if (args.length === 0) {
    throw argError;
  }

  const firstCall: AST.FuncCall = {
    type: 'function-call',
    func,
    arg: args[0],
  };

  return args.slice(1).reduce<AST.FuncCall>(
    (funcNode, nextArg) => ({
      type: 'function-call',
      func: funcNode,
      arg: nextArg,
    }),
    firstCall
  );
});

const func: RDParser<AST.Func> = (handle) => {
  const arg = name(handle);
  handle.consume('=>');
  const expr = expression(handle);

  return {
    type: 'function',
    arg,
    body: expr,
  };
};

const tuple: RDParser<AST.Tuple> = (handle) => {
  handle.consume('(');

  const [members] = repeated(handle, () => {
    const member = expression(handle);
    optional(handle, () => {
      handle.consume(',');
    });

    return member;
  });

  handle.consume(')');

  return {
    type: 'tuple',
    members,
  };
};

const name: RDParser<AST.Name> = (handle) => {
  const token = handle.consume('name');

  return {
    type: 'name',
    value: token.value,
    token
  };
};

const atom: RDParser<AST.Atom> = (handle) => {
  const token = handle.consume('atom');

  return {
    type: 'atom',
    value: token.value,
    token
  };
};

const number: RDParser<AST.Numeral> = (handle) => {
  const token = handle.consume('number');

  return {
    type: 'number',
    value: token.value,
    token
  };
};

const text: RDParser<AST.Text> = (handle) => {
  const token = handle.consume('text');

  return {
    type: 'text',
    value: token.value,
    token
  };
};

const root: RDParser<AST.AST> = program;
export const parser = createRDParser(root);
