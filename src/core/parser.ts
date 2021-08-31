import { createRDParser, repeated, optional, choice } from '&/utils/system/parser';
import { FilteredToken } from './lexer';
import type * as AST from './ast.types';
import { lrec } from '&/utils/system/parser/lrec';
import { ConsumeHandle } from '&/utils/system/parser/handles';
import { cached } from '&/utils/system/parser/cache';

type RDParser<Node, C = object> = (handle: ConsumeHandle<FilteredToken>, context: C) => Node;

const program: RDParser<AST.Program> = (handle, ctx) => {
  const [entries, error] = repeated(handle, ctx, () =>
    choice(handle, ctx, [declaration, expression])
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

const declaration: RDParser<AST.Declaration> = cached((handle, ctx) => {
  const vrb = name(handle, ctx);
  handle.consume('=');
  const expr = expression(handle, ctx);

  return {
    type: 'declaration',
    name: vrb,
    expression: expr,
  };
});

const expression: RDParser<AST.Expression> = cached((handle, ctx) => {
  return choice(handle, ctx, [
    parenthesizedExpression,
    funcCall,
    func,
    tuple,
    name,
    atom,
    number,
    text,
  ]);
});

const parenthesizedExpression: RDParser<AST.Expression> = (handle, ctx) => {
  handle.consume('(');
  const expr = expression(handle, ctx);
  handle.consume(')');

  return expr;
};

const funcCall: RDParser<AST.FuncCall> = lrec((handle, ctx) => {
  const func = expression(handle, ctx);

  // require at least one instance
  const [args, argError] = repeated(handle, ctx, () => {
    handle.consume('(');
    const arg = expression(handle, ctx);
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

const func: RDParser<AST.Func> = (handle, ctx) => {
  const arg = name(handle, ctx);
  handle.consume('=>');
  const expr = expression(handle, ctx);

  return {
    type: 'function',
    arg,
    body: expr,
  };
};

const tuple: RDParser<AST.Tuple> = (handle, ctx) => {
  handle.consume('(');

  const [members] = repeated(handle, ctx, () => {
    const member = expression(handle, ctx);
    optional(handle, ctx, () => {
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
