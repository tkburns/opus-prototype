/* eslint-disable @typescript-eslint/ban-types */

import { UnionToIntersection } from '&/utils/helper.types';
import { Stringable } from '&/utils/system/stringification';

export enum Type {
  Program = 'program',

  Declaration = 'declaration',
  IfElse = 'if-else',
  ExpressionStatement = 'expression-statement',

  Identifier = 'identifier',

  Func = 'func',
  Return = 'return',
  FuncCall = 'func-call',

  Object = 'object',
  Symbol = 'symbol',
  Boolean = 'boolean',
  String = 'string',
  Number = 'number',

  Raw = 'raw',
}

export type Node = (
  Program |
  Statement<StatementContext.All> |
  Expression
);

export type Program = {
  type: Type.Program;
  body: Statement[];
};
export const program = (body: Statement[]): Program =>
  ({ type: Type.Program, body });


/*
  Because Statement circularly references itself (through IfElse), we
  have to use this hack instead of just a straight enum here.

  Doing it this way means the StatementContexts themselves are assignable to each other
  corresponding to how Statements with those contexts are assignable to each other.

  Eg StatementContext.None ~> StatementContext.Func, as
  Statement<StatementContext.None> ~> Statement<StatementContext.Func>
*/
/* eslint-disable @typescript-eslint/no-namespace */
export namespace StatementContext {
  export type None = unknown;

  export namespace Core {
    export type func = { func: true };
  }
  export type Core = Core.func;

  export type Func = None & Core.func;

  export type Any = None | Core;
  export type All = None & UnionToIntersection<Core>;
}
export type StatementContext = StatementContext.Any;
/* eslint-enable @typescript-eslint/no-namespace */

export type Statement<Ctx extends StatementContext = StatementContext.None> = (
  Declaration |
  IfElse<Ctx> |
  ExpressionStatement |
  Raw |
  (Ctx extends StatementContext.Func ? Return : never)
);

export type Declaration = {
  type: Type.Declaration;
  identifier: Identifier;
  body: Expression;
};
export const declaration = (identifier: Identifier, body: Expression): Declaration =>
  ({ type: Type.Declaration, identifier, body });

export type IfElse<StmtCtx extends StatementContext = StatementContext.None> = {
  type: Type.IfElse;
  clauses: IfClause<StmtCtx>[];
  else?: Statement<StmtCtx>[];
};
export type IfClause<StmtCtx extends StatementContext = StatementContext.None> = {
  condition: Expression;
  body: Statement<StmtCtx>[];
};
export const ifElse = <StmtCtx extends StatementContext>(
  clauses: IfClause<StmtCtx>[],
  elseClause?: Statement<StmtCtx>[]
): IfElse<StmtCtx> =>
    ({ type: Type.IfElse, clauses, else: elseClause });
ifElse.clause = <StmtCtx extends StatementContext>(
  condition: Expression,
  body: Statement<StmtCtx>[]
): IfClause<StmtCtx> =>
    ({ condition, body });

export type ExpressionStatement = {
  type: Type.ExpressionStatement;
  value: Expression;
};
export const expressionStatement = (value: Expression): ExpressionStatement =>
  ({ type: Type.ExpressionStatement, value });


export type Expression = (
  Identifier |
  Func |
  FuncCall |
  Object |
  Symbol |
  Boolean |
  String |
  Number |
  Raw
);


export type Identifier = {
  type: Type.Identifier;
  name: string;
};
export const identifier = (name: string): Identifier => ({ type: Type.Identifier, name });

export type Func = {
  type: Type.Func;
  args: Identifier[];
  body: Statement<StatementContext.Func>[];
};
export const func = (args: Identifier[], body: Statement<StatementContext.Func>[]): Func =>
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
type IIFEArg = { name: Identifier; value: Expression };
export const iife = (body: Statement<StatementContext.Func>[], args: IIFEArg[] = []): IIFE => {
  const argNames = args.map(arg => arg.name);
  const argValues = args.map(arg => arg.value);
  return funcCall(func(argNames, body), argValues) as IIFE;
};

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

export type RawChunk = Node | Stringable;
export type RawInterpolation = RawChunk | RawChunk[];
export type Raw = {
  type: Type.Raw;
  literals: TemplateStringsArray;
  interpolations: RawInterpolation[];
};
export const raw = (literals: TemplateStringsArray, ...interpolations: RawInterpolation[]): Raw =>
  ({ type: Type.Raw, literals, interpolations });
