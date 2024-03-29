import { createRDParser, repeated, optional, choice, repeatedRequired } from '&/utils/system/parser';
import { FilteredToken } from './lexer';
import type * as AST from './ast.types';
import { lrec } from '&/utils/system/parser/lrec';
import { ConsumeHandle } from '&/utils/system/parser/handles';
import type * as Base from '&/utils/system/parser/common.types';
import { cached } from '&/utils/system/parser/cache';
import { precedented } from '&/utils/system/parser/precedence';

type RDParser<Node, C = object> = Base.RDParser<ConsumeHandle<FilteredToken>, C, Node>;

type TopPrecedenceParser<Node, C = object> =
  Base.ExtendedRDParser<ConsumeHandle<FilteredToken>, C, [precedence?: number], Node>;
type PrecedenceParser<Node, C = object> =
  Base.ExtendedRDParser<ConsumeHandle<FilteredToken>, C, [precedence: number], Node>;

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

const blockExpression: RDParser<AST.BlockExpression | AST.Expression> = cached((handle, ctx) => {
  const [entries] = repeatedRequired(1, handle, ctx, () => {
    const entry = choice(handle, ctx, [
      declaration,
      expression
    ]);

    optional(handle, ctx, () => {
      handle.consume(';');
    });

    return entry;
  });

  if (entries.length === 1 && entries[0].type !== 'declaration') {
    return entries[0];
  }

  return {
    type: 'block-expression',
    entries
  };
});

const precedenceCacheKey = (ctx: object, precedence: number) => `prec=${precedence}`;
const topPrecedenceCacheKey = (ctx: object, precedence = 0) =>
  precedenceCacheKey(ctx, precedence);

const expression: TopPrecedenceParser<AST.Expression> = lrec.cached(
  topPrecedenceCacheKey,
  (handle, ctx, precedence = 0) => {
    return precedented(handle, ctx, { precedence, rec: expression }, [
      [match, funcApplication],
      [thunkForce],
      [parens, literal, name]
    ]);
  }
);

const parens: RDParser<AST.Expression> = cached((handle, ctx) => {
  handle.consume('(');
  const expr = blockExpression(handle, ctx);
  handle.consume(')');

  return expr;
});

const funcApplication: PrecedenceParser<AST.FuncApplication> = cached(
  precedenceCacheKey,
  (handle, ctx, precedence) => {
    const func = expression(handle, ctx, precedence);
    const arg = expression(handle, ctx, precedence + 1);

    return {
      type: 'function-application',
      func,
      arg,
    };
  }
);

const thunkForce: PrecedenceParser<AST.ThunkForce> = cached(
  precedenceCacheKey,
  (handle, ctx, precedence) => {
    handle.consume('!');
    const thunk = expression(handle, ctx, precedence);

    return {
      type: 'thunk-force',
      thunk,
    };
  }
);

/* Match */

const match: PrecedenceParser<AST.Match> = cached(
  precedenceCacheKey,
  (handle, ctx, precedence) => {
    const principal = expression(handle, ctx, precedence);
    handle.consume('match');
    const clauses = matchClauses(handle, ctx);

    return {
      type: 'match',
      principal,
      clauses
    };
  }
);

const matchClauses: RDParser<AST.MatchClause[]> = (handle, ctx) => {
  handle.consume('(');

  const [clauses] = repeatedRequired(1, handle, ctx, () => {
    const clause = matchClause(handle, ctx);

    optional(handle, ctx, () => {
      handle.consume(';');
    });

    return clause;
  });

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

const pattern: RDParser<AST.Pattern> = (handle, ctx) => {
  return choice(handle, ctx, [
    wildcardPattern,
    simpleLiteralPattern,
    namePattern,
    tuplePattern
  ]);
};

const namePattern: RDParser<AST.NamePattern> = (handle, ctx) => {
  const nm = name(handle, ctx);
  return {
    type: 'name-pattern',
    name: nm
  };
};

const tuplePattern: RDParser<AST.TuplePattern> = (handle, ctx) => {
  handle.consume('(');

  const [members] = repeated(handle, ctx, () => {
    const member = pattern(handle, ctx);
    optional(handle, ctx, () => {
      handle.consume(',');
    });

    return member;
  });

  handle.consume(')');

  return {
    type: 'tuple-pattern',
    members
  };
};

const simpleLiteralPattern: RDParser<AST.SimpleLiteralPattern> = (handle, ctx) => {
  const value = simpleLiteral(handle, ctx);
  return {
    type: 'simple-literal-pattern',
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
    thunk,
    tuple,
    simpleLiteral
  ]);
};

const simpleLiteral: RDParser<AST.SimpleLiteral> = (handle, ctx) => {
  return choice(handle, ctx, [
    atom,
    bool,
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

const thunk: RDParser<AST.Thunk> = cached((handle, ctx) => {
  handle.consume('{');
  const body = blockExpression(handle, ctx);
  handle.consume('}');

  return {
    type: 'thunk',
    body,
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

const bool: RDParser<AST.Bool> = (handle) => {
  const token = handle.consume('bool');

  return {
    type: 'bool',
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
