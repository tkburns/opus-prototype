import type { Declaration } from './program.types';
import type { Pattern } from './pattern.types';
import type { Name } from './base.types';
import { TokenMap } from '../lexer';

export type ExpressionNode = (
  BlockExpression |

  FuncApplication |
  ThunkForce |

  Match |
  MatchClause |

  Literal
);

export type Expression = (
  BlockExpression |
  FuncApplication |
  ThunkForce |
  Match |
  Name |
  Literal
);

export type BlockExpression = {
  type: 'block-expression';
  entries: (Declaration | Expression)[];
};

export type FuncApplication = {
  type: 'function-application';
  func: Expression;
  arg: Expression;
};

export type ThunkForce = {
  type: 'thunk-force';
  thunk: Expression;
};

export type Match = {
  type: 'match';
  principal: Expression;
  clauses: MatchClause[];
};

export type MatchClause = {
  type: 'match-clause';
  pattern: Pattern;
  body: Expression;
};



export type Literal = (
  Func |
  Thunk |
  Tuple |
  Particle
);

export type Particle = (
  Atom |
  Bool |
  Numeral |
  Text
);

export type Func = {
  type: 'function';
  arg: Name;
  body: Expression;
};

export type Thunk = {
  type: 'thunk';
  body: Expression;
};

export type Tuple = {
  type: 'tuple';
  members: Expression[];
};


export type Atom = {
  type: 'atom';
  value: string;
  token: TokenMap['atom'];
};

export type Bool = {
  type: 'bool';
  value: boolean;
  token: TokenMap['bool'];
};

export type Numeral = {
  type: 'number';
  value: number;
  token: TokenMap['number'];
};

export type Text = {
  type: 'text';
  value: string;
  token: TokenMap['text'];
};
