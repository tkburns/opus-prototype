/* eslint-disable @typescript-eslint/ban-types */

export enum Type {
  Identifier = 'identifier',
  Object = 'object',
  Symbol = 'symbol',
  Boolean = 'boolean',
  String = 'string',
  Number = 'number',
}

export type Node = (
  Expression
);

export type Expression = (
  Identifier |
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


