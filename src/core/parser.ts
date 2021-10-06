import { createRDParser, repeated, optional, choice } from '&/utils/system/parser';
import { FilteredToken } from './lexer';
import type * as AST from './ast.types';
import { lrec } from '&/utils/system/parser/lrec';
import { ConsumeHandle } from '&/utils/system/parser/handles';
import type * as Base from '&/utils/system/parser/common.types';
import { cached } from '&/utils/system/parser/cache';
import { PrecedenceContext, precedented } from '&/utils/system/parser/precedence';

type RDParser<Node, C = object> = Base.RDParser<ConsumeHandle<FilteredToken>, C, Node>;
type ExtendedRDParser<Node, As extends unknown[], C = object> =
  Base.ExtendedRDParser<ConsumeHandle<FilteredToken>, C, As, Node>;

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

const expression: ExtendedRDParser<AST.Expression, [number?]> = lrec((handle, ctx, precedence = 0) => {
  return precedented(handle, ctx, precedence, [
    [func],
    [funcCall],
    [parenthesizedExpression, tuple, name, atom, number, text]
  ]);
});
const parenthesizedExpression: RDParser<AST.Expression> = cached((handle, ctx) => {
  handle.consume('(');
  const expr = expression(handle, ctx, 0);
  handle.consume(')');

  return expr;
});

const funcCall: RDParser<AST.FuncCall, PrecedenceContext> = cached((handle, ctx) => {
  const func = expression(handle, ctx, ctx.precedence);

  handle.consume('(');
  const arg = expression(handle, ctx, 0);
  handle.consume(')');

  return {
    type: 'function-call',
    func,
    arg,
  };
});

const func: RDParser<AST.Func, PrecedenceContext> = cached((handle, ctx) => {
  const arg = name(handle, ctx);
  handle.consume('=>');
  const expr = expression(handle, ctx, ctx.precedence);

  return {
    type: 'function',
    arg,
    body: expr,
  };
});

const tuple: RDParser<AST.Tuple, PrecedenceContext> = cached((handle, ctx) => {
  handle.consume('(');

  const [members] = repeated(handle, ctx, () => {
    const member = expression(handle, ctx, ctx.precedence);
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
});

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
