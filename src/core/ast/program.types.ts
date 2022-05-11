import type { Name } from './base.types';
import type { Expression } from './expression.types';

export type ProgramNode = (
  Program |
  Declaration
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
