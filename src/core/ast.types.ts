import { TokenMap } from './lexer';

export type AST = Program;
export type Node = (
  Program |
  Declaration |
  FuncCall |
  Func |
  Tuple |
  Name |
  Numeral |
  Text
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
  FuncCall |
  Func |
  Tuple |
  Name |
  Numeral |
  Text
);

export type FuncCall = {
  type: 'function-call';
  func: Expression;
  arg: Expression;
}

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

export type Text = {
  type: 'text';
  value: string;
  token: TokenMap['text'];
};
