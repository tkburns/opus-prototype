import { TokenMap } from './lexer';

export type AST = Program;
export type Node = (
  Program |
  Declaration |

  FuncApplication |

  Match |
  MatchClause |
  ValuePattern |
  WildcardPattern |

  Func |
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

export type Expression = (
  FuncApplication |
  Match |
  Literal
);

export type FuncApplication = {
  type: 'function-application';
  func: Expression;
  arg: Expression;
}

export type Match = {
  type: 'match';
  principal: Expression;
  clauses: MatchClause[];
}

export type MatchClause = {
  type: 'match-clause';
  pattern: Pattern;
  body: Expression;
}

export type Pattern = ValuePattern | WildcardPattern;

export type ValuePattern = {
  type: 'value-pattern';
  value: Literal;
}

export type WildcardPattern = {
  type: 'wildcard-pattern';
}

export type Literal = (
  Func |
  Tuple |
  Name |
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
