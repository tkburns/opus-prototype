import { TokenMap } from './lexer';

export type AST = Program;
export type Node = (
  Program |
  Declaration |
  BlockExpression |

  FuncApplication |
  ThunkForce |

  Match |
  MatchClause |
  NamePattern |
  TuplePattern |
  SimpleLiteralPattern |
  WildcardPattern |

  Func |
  Thunk |
  Tuple |

  Name |
  Atom |
  Bool |
  Numeral |
  Text
);


export type Program = {
  type: 'program';
  entries: (Declaration | Expression)[];
};

export type Declaration = {
  type: 'declaration';
  name: Name;
  expression: Expression;
};

export type BlockExpression = {
  type: 'block-expression';
  entries: (Declaration | Expression)[];
};

export type Expression = (
  BlockExpression |
  FuncApplication |
  ThunkForce |
  Match |
  Name |
  Literal
);

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

export type Pattern = (
  NamePattern |
  TuplePattern |
  SimpleLiteralPattern |
  WildcardPattern
);

export type NamePattern = {
  type: 'name-pattern';
  name: Name;
};

export type TuplePattern = {
  type: 'tuple-pattern';
  members: Pattern[];
};

export type SimpleLiteralPattern = {
  type: 'simple-literal-pattern';
  value: SimpleLiteral;
};

export type WildcardPattern = {
  type: 'wildcard-pattern';
};

export type Literal = (
  Func |
  Thunk |
  Tuple |
  SimpleLiteral
);

export type SimpleLiteral = (
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

export type Name = {
  type: 'name';
  value: string;
  token: TokenMap['name'];
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
