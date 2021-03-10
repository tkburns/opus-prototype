import { TokenMap } from './lexer';

export type AST = Program;
export type Node = (
  Program |
  Declaration |
  Func |
  Tuple |
  Name |
  Numeral
);


export type Program = {
  type: 'program';
  declarations: Declaration[];
  topExpression: Expression;
};

export type Declaration = {
  type: 'declaration';
  name: Name;
  expression: Expression;
};

export type Expression = (
  Func |
  Tuple |
  Name |
  Numeral
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

export type Numeral = {
  type: 'number';
  value: number;
  token: TokenMap['number'];
};
