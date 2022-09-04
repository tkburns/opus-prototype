import type * as RS from '&/utils/recursion-scheme';
import { TokenMap } from '../lexer';
import type { Declaration } from './program.types';
import type { Pattern } from './pattern.types';
import type { Name } from './base.types';

export type ExpressionNode<RM extends RS.Map = RS.Map> = (
  BlockExpression<RM> |

  FuncApplication<RM> |
  ThunkForce<RM> |

  Match<RM> |
  MatchClause<RM> |

  Literal<RM>
);


export type Expression<RM extends RS.Map = RS.Map> = (
  BlockExpression<RM> |
  FuncApplication<RM> |
  ThunkForce<RM> |
  Match<RM> |
  Name<RM> |
  Literal<RM>
);


export type BlockExpression<RM extends RS.Map = RS.Map> = {
  type: 'block-expression';
  entries: (RS.Get<Declaration, RM> | RS.Get<Expression, RM>)[];
};

export type FuncApplication<RM extends RS.Map = RS.Map> = {
  type: 'function-application';
  func: RS.Get<Expression, RM>;
  arg: RS.Get<Expression, RM>;
};

export type ThunkForce<RM extends RS.Map = RS.Map> = {
  type: 'thunk-force';
  thunk: RS.Get<Expression, RM>;
};

export type Match<RM extends RS.Map = RS.Map> = {
  type: 'match';
  principal: RS.Get<Expression, RM>;
  clauses: RS.Get<MatchClause, RM>[];
};

export type MatchClause<RM extends RS.Map = RS.Map> = {
  type: 'match-clause';
  pattern: RS.Get<Pattern, RM>;
  body: RS.Get<Expression, RM>;
};



export type Literal<RM extends RS.Map = RS.Map> = (
  Func<RM> |
  Thunk<RM> |
  Tuple<RM> |
  Particle<RM>
);

export type Particle<RM extends RS.Map = RS.Map> = (
  Atom<RM> |
  Bool<RM> |
  Numeral<RM> |
  Text<RM>
);

export type Func<RM extends RS.Map = RS.Map> = {
  type: 'function';
  arg: RS.Get<Name, RM>;
  body: RS.Get<Expression, RM>;
};

export type Thunk<RM extends RS.Map = RS.Map> = {
  type: 'thunk';
  body: RS.Get<Expression, RM>;
};

export type Tuple<RM extends RS.Map = RS.Map> = {
  type: 'tuple';
  members: RS.Get<Expression, RM>[];
};


export type Atom<_RM extends RS.Map = RS.Map> = {
  type: 'atom';
  value: string;
  token: TokenMap['atom'];
};

export type Bool<_RM extends RS.Map = RS.Map> = {
  type: 'bool';
  value: boolean;
  token: TokenMap['bool'];
};

export type Numeral<_RM extends RS.Map = RS.Map> = {
  type: 'number';
  value: number;
  token: TokenMap['number'];
};

export type Text<_RM extends RS.Map = RS.Map> = {
  type: 'text';
  value: string;
  token: TokenMap['text'];
};
