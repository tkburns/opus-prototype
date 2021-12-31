/* eslint-disable @typescript-eslint/ban-types */

export enum Type {
  Declaration = 'declaration',

  Identifier = 'identifier',

  Func = 'func',
  Return = 'return',
  FuncCall = 'func-call',

  Object = 'object',
  Symbol = 'symbol',
  Boolean = 'boolean',
  String = 'string',
  Number = 'number',
}

export type Node = (
  Statement
);

export type StandaloneNode = (
  Statement
);

export type Statement = (
  Declaration |
  Expression |
  Return
);

export type Declaration = {
  type: Type.Declaration;
  identifier: Identifier;
  body: Expression;
};
export const declaration = (identifier: Identifier, body: Expression): Declaration =>
  ({ type: Type.Declaration, identifier, body });

export type Expression = (
  Identifier |
  Func |
  FuncCall |
  Object |
  Symbol |
  Boolean |
  String |
  Number
);


export type Identifier = {
  type: Type.Identifier;
  name: string;
};
export const identifier = (name: string): Identifier => ({ type: Type.Identifier, name });

export type Func = {
  type: Type.Func;
  args: Identifier[];
  body: Statement[];
};
export const func = (args: Identifier[], body: Statement[]): Func =>
  ({ type: Type.Func, args, body });

export type Return = {
  type: Type.Return;
  value: Expression;
};
export const retrn = (value: Expression): Return => ({ type: Type.Return, value });

export type FuncCall = {
  type: Type.FuncCall;
  callee: Expression;
  args: Expression[];
};
export const funcCall = (callee: Expression, args: Expression[]): FuncCall =>
  ({ type: Type.FuncCall, callee, args });

export type IIFE = FuncCall & { callee: Func };
export const iife = (body: Statement[]): IIFE =>
  funcCall(func([], body), []) as IIFE;

export type Object = {
  type: Type.Object;
  fields: {
    [name: string]: Expression;
  };
};
export const object = (fields: Object['fields']): Object =>
  ({ type: Type.Object, fields });

export type Symbol = {
  type: Type.Symbol;
  name?: string | undefined;
};
export const symbol = (name?: string): Symbol => ({ type: Type.Symbol, name });

export type Boolean = {
  type: Type.Boolean;
  value: boolean;
};
export const boolean = (value: boolean): Boolean => ({ type: Type.Boolean, value });

export type String = {
  type: Type.String;
  value: string;
};
export const string = (value: string): String => ({ type: Type.String, value });

export type Number = {
  type: Type.Number;
  value: string;
};
export const number = (value: string): Number => ({ type: Type.Number, value });

