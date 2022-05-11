import { repeated, optional, choice, repeatedRequired } from '&/utils/system/parser';
import { lrec } from '&/utils/system/parser/lrec';
import { ConsumeHandle } from '&/utils/system/parser/handles';
import type * as Base from '&/utils/system/parser/common.types';
import { cached } from '&/utils/system/parser/cache';
import { precedented } from '&/utils/system/parser/precedence';

import { FilteredToken } from '../lexer';
import type * as AST from '../ast';

import { name, RDParser } from './base';
import { pattern } from './match';
import { particle } from './particles';


type TopPrecedenceParser<Node, C = object> =
  Base.ExtendedRDParser<ConsumeHandle<FilteredToken>, C, [precedence?: number], Node>;
type PrecedenceParser<Node, C = object> =
  Base.ExtendedRDParser<ConsumeHandle<FilteredToken>, C, [precedence: number], Node>;

export const declaration: RDParser<AST.Declaration> = cached((handle, ctx) => {
  const vrb = name(handle, ctx);
  handle.consume('=');
  const expr = expression(handle, ctx);

  return {
    type: 'declaration',
    name: vrb,
    expression: expr,
  };
});

const precedenceCacheKey = (ctx: object, precedence: number) => `prec=${precedence}`;
const topPrecedenceCacheKey = (ctx: object, precedence = 0) =>
  precedenceCacheKey(ctx, precedence);

export const expression: TopPrecedenceParser<AST.Expression> = lrec.cached(
  topPrecedenceCacheKey,
  (handle, ctx, precedence = 0) => {
    return precedented(handle, ctx, { precedence, rec: expression }, [
      [match, funcApplication],
      [thunkForce],
      [parens, literal, name]
    ]);
  }
);


export const blockExpression: RDParser<AST.BlockExpression | AST.Expression> = cached((handle, ctx) => {
  const [entries] = repeatedRequired(1, handle, ctx, () => {
    const entry = choice(handle, ctx, [
      // need to import
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


export const parens: RDParser<AST.Expression> = cached((handle, ctx) => {
  handle.consume('(');
  const expr = blockExpression(handle, ctx);
  handle.consume(')');

  return expr;
});


export const funcApplication: PrecedenceParser<AST.FuncApplication> = cached(
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

export const thunkForce: PrecedenceParser<AST.ThunkForce> = cached(
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


export const match: PrecedenceParser<AST.Match> = cached(
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


export const literal: RDParser<AST.Literal> = (handle, ctx) => {
  return choice(handle, ctx, [
    func,
    thunk,
    tuple,
    particle
  ]);
};


export const func: RDParser<AST.Func> = cached((handle, ctx) => {
  const arg = name(handle, ctx);
  handle.consume('=>');
  const expr = expression(handle, ctx);

  return {
    type: 'function',
    arg,
    body: expr,
  };
});

export const thunk: RDParser<AST.Thunk> = cached((handle, ctx) => {
  handle.consume('{');
  const body = blockExpression(handle, ctx);
  handle.consume('}');

  return {
    type: 'thunk',
    body,
  };
});

export const tuple: RDParser<AST.Tuple> = cached((handle, ctx) => {
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
