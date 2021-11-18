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
  const [entries, error] = repeated(handle, ctx, () => {
    const entry = choice(handle, ctx, [declaration, expression]);

    optional(handle, ctx, () => {
      handle.consume(';');
    });

    return entry;
  });

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
    [match],
    [funcApplication],
    [parenthesizedExpression, func, tuple, name, atom, number, text]
  ]);
});
const parenthesizedExpression: RDParser<AST.Expression> = cached((handle, ctx) => {
  handle.consume('(');
  const expr = expression(handle, ctx, 0);
  handle.consume(')');

  return expr;
});

const funcApplication: RDParser<AST.FuncApplication, PrecedenceContext> = cached((handle, ctx) => {
  const func = expression(handle, ctx, ctx.precedence);
  const arg = expression(handle, ctx, ctx.precedence + 1);

  return {
    type: 'function-application',
    func,
    arg,
  };
});

/* Match */

const match: RDParser<AST.Match, PrecedenceContext> = (handle, ctx) => {
  const principal = expression(handle, ctx, ctx.precedence);
  handle.consume('match');
  const clauses = matchClauses(handle, ctx);

  return {
    type: 'match',
    principal,
    clauses
  };
};

const matchClauses: RDParser<AST.MatchClause[]> = (handle, ctx) => {
  handle.consume('(');

  const [clauses, lastError] = repeated(handle, ctx, () => {
    const clause = matchClause(handle, ctx);

    optional(handle, ctx, () => {
      handle.consume(';');
    });

    return clause;
  });

  if (clauses.length < 1) {
    throw lastError;
  }

  handle.consume(')');

  return clauses;
};

const matchClause: RDParser<AST.MatchClause> = (handle, ctx) => {
  const pat = pattern(handle, ctx);
  handle.consume('=>');
  const body = expression(handle, ctx);

  return {
    type: 'match-clause',
    pattern: pat,
    body
  };
};

const pattern: RDParser<AST.Pattern> = (handle, ctx) =>
  choice(handle, ctx, [wildcardPattern, valuePattern]);

const valuePattern: RDParser<AST.ValuePattern> = (handle, ctx) => {
  const value = literal(handle, ctx);
  return {
    type: 'value-pattern',
    value
  };
};

const wildcardPattern: RDParser<AST.WildcardPattern> = (handle) => {
  handle.consume('_');
  return { type: 'wildcard-pattern' };
};

const literal: RDParser<AST.Literal> = (handle, ctx) => {
  return choice(handle, ctx, [
    func,
    tuple,
    name,
    atom,
    number,
    text,
  ]);
};

const func: RDParser<AST.Func> = cached((handle, ctx) => {
  const arg = name(handle, ctx);
  handle.consume('=>');
  const expr = expression(handle, ctx);

  return {
    type: 'function',
    arg,
    body: expr,
  };
});

const tuple: RDParser<AST.Tuple> = cached((handle, ctx) => {
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
