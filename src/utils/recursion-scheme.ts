
// type Rec<T = unknown> = T & { __rec: true };
// type IsRec<T, K extends keyof T> = T[K] extends Rec ? K : never;

// type RSMap<T = unknown, def = unknown> = T extends unknown
//     ? [T, def]
//     : never;


// // sample AST for a simple arithmetic language

// type Node = Program | Declaration | Block | Op | Number | Var;

// type Program = {
//     type: 'program';
//     body: Rec<Block>;
// };

// type Statement =
//     Declaration | Expression;

// type Declaration = {
//     type: 'declaration';
//     name: string;
//     body: Rec<Expression>;
// };

// type Expression =
//     | Block
//     | Op
//     | Number
//     | Var;

// type Block = Rec<Statement>[];

// type Op = {
//     type: 'op';
//     op: string;
//     left: Rec<Expression>;
//     right: Rec<Expression>;
// }

// type Number = { type: 'number'; value: number };
// type Var = { type: 'var'; name: string };


// type GetRSMap<T> = T extends unknown
//     // if not in any rec fields, don't include in list???
//     ? [T, T]
//     : never;


// // type _InjectRS<T, R extends RSMap<T>> = T extends R[0]
// //     ? {
// //         // for each key, if key is rec
// //         [K in keyof T]: T[K] extends Rec
// //             // if K in RS, replace with RS field
// //             ? K extends keyof R[1]
// //                 ? R[1][K]
// //                 : T[K]
// //             : T[K];
// //     }
// //     : never;

// // type InjectRS<T, R extends RSMap<T>> = 
// //     R extends unknown
// //         // if no entry in RS, return as is
// //         ? _InjectRS<T, R> extends never ? T : _InjectRS<T, R>
// //         : never;

// type _GetRFromMap<T, RM extends RSMap> =
//     // distribute over RM and T
//     RM extends unknown ? T extends unknown
//         ? T extends RM[0] ? RM[1] : never
//         : never : never;

// type InjectRS<T, RM extends RSMap> = {
//     [K in keyof T]: T[K] extends Rec<infer TR>
//         ? _GetRFromMap<TR, RM>   // this marks types not in RM as never
//         : T[K]
// }

// type NodeF<R extends RSMap<Node>> = InjectRS<Node, R>;
// type ProgramF<R extends RSMap<Node>> = InjectRS<Program, R>;
// type StatementF<R extends RSMap<Node>> = InjectRS<Statement, R>;
// type DeclarationF<R extends RSMap<Node>> = InjectRS<Declaration, R>;
// type ExpressionF<R extends RSMap<Node>> = InjectRS<Expression, R>;


// // TODO build RS type arg into main nodes, but default to id map ..? not sure if it's possible, wasn't with field based RS

// // PROBLEM only rolls up one level...
// type RollUpNumber = Exclude<GetRSMap<Node>, [Number, any]> | [Number, number];

// let dn: DeclarationF<RollUpNumber> = { type: 'declaration', name: 'foo', body: 123 };
// let prg: NodeF<GetRSMap<Node>> = {
//     type: 'program',
//     body: [
//         {
//             type: 'declaration',
//             name: 'x',
//             body: { type: 'var', name: 'gblX' }
//         }
//     ]
// };



// -------------------
// multi rs

// TODO - try putting making Map = [Pat, [R]] for recursion reasons?

// TODO - rename?
// TODO - should defualt to `any`?? be careful of contra-variant uses of Map (if R is used as fn arg)
//          type Foo<RS extends Map = Map> = { type: 'foo', fn: (x: R) => void }
//          does that ever make sense for a recursion scheme parameter...?
export type Map<Pat = unknown, R = unknown> = [Pat, R];

// TODO - rename?
export type Get<RM extends Map, Pat> =
  RM extends unknown
  ? Pat extends RM[0] ? RM[1] : never
  : never;

// type x = Get<[1 | '1', '1'] | [2, '2'], '1' | 2>;

// TODO - rename?
// a recursive type must be wrapped the entire way until it is unpacked within a subfield
// TODO - don't use extract..? use & instead?
export type MakeRM<T, U extends RecSafe> = T extends unknown
  ? [T, Extract<RecExtract<U>, T>]
  : never;

// THIS DOESN'T WORK - see the gist; circular reference
// export type Ext<Pattern extends Map, Extention extends Map> =
//     Pattern[0] extends Extention[0] ? [Pattern[0], Extention[1] & Pattern[1]] : Pattern;
// export type Ext<Pattern extends RecSafe<Map>, Extention extends Map> =
//     RecExtract<Pattern>[0] extends Extention[0] ? [RecExtract<Pattern>[0], Extention[1] & RecExtract<Pattern>[1]] : Pattern;
// semantically the same as the following, but produces slightly more readable types
// type Ext<Pattern extends Map, Extention extends Map> =
//     Pattern[0] extends Extention[0] ? Extention & Pattern : Pattern;

export type Ext<Pat, X extends Map> =
  Pat extends X[0] ? [Pat, X[1]] : unknown;
// semantically the same as the following, but produces slightly more readable types
// export type Match<Pat, X extends PMap> =
//   Pat extends X[0] ? X : unknown;

// TODO - use { _t: X } instead of tuple?
export type RecSafe<T = unknown> = [T];
export type RecExtract<T extends RecSafe> =
  T extends RecSafe<infer U> ? U : never;


// // -------------------------------------
// // example single

// // wrapping R in [] enables recursive reference below
// type ListF<T, R extends [unknown]> = (
//   | { value: T; next: R[0] }
//   | null
// );

// // [List<T>] is the key
// type List<T> = ListF<T, [List<T>]>;
// const _l: List<number> = { value: 1, next: { value: 2, next: null } };



// // ------------
// // example multi

// // -> the second arg to Get can be whatever (as long as it matches RM) -> doesn't need to be nodes (can type name map be auto-generated?)

// type ExprF<RM extends Map = Map> = VarF<RM> | AddF<RM>;
// type VarF<_RM extends Map = Map> = { type: 'var' };
// type AddF<RM extends Map = Map> = { type: 'add'; left: Get<RM, ExprF>; right: Get<RM, ExprF> };

// // extend expr (& preserve recursively) - ExprM<unknown> = Expr
// type ExprM<RM> = RM & ([VarF, VarF<ExprM<RM>>] | [AddF, AddF<ExprM<RM>>]);
// // type ExprRM = [VarF, VarF<ExprRM>] | [AddF, AddF<ExprRM>];
// type ExprRM = ExprM<unknown>;
// // type BaseRM<??> <- cannot get unapplied nodes

// type Expr = ExprF<ExprRM>;
// const _e1: Expr = { type: 'add', left: { type: 'var' }, right: { type: 'add', left: { type: 'var' }, right: { type: 'var' } } };

// type Ext = [VarF, VarF<Ext> & { _var: true }] | [AddF, AddF<Ext> & { _add: true }];
// // type Ext = ExprM<[VarF, { _var: true }] | [AddF, { _add: true }]>;
// const _e2: ExprF<Ext> = {
//   // type: 'add', _add: true,
//   type: 'add',    // RM only affects recursed nodes - eg AddF<number> ~ ListF<number> -> both are still a node; children are number
//   left: { type: 'var', _var: true },
//   right: {
//     type: 'add', _add: true,
//     left: { type: 'var', _var: true },
//     right: { type: 'var', _var: true }
//   }
// };

// const _e3: Get<Ext, AddF> = {
//   type: 'add', _add: true,
//   left: { type: 'var', _var: true },
//   right: {
//     type: 'add', _add: true,
//     left: { type: 'var', _var: true },
//     right: { type: 'var', _var: true }
//   }
// };

// type Ext2 = ([VarF, VarF<Ext2>] | [AddF, AddF<Ext2>]) & [unknown, { _expr: true }];
// // type Ext2 = ExprM<[unknown, { _expr: true }]>;

// const _e4: Get<Ext2, ExprF> = {
//   type: 'add', _expr: true,
//   left: { type: 'var', _expr: true },
//   right: {
//     type: 'add', _expr: true,
//     left: { type: 'var', _expr: true },
//     right: { type: 'var', _expr: true }
//   }
// };

// type ExprReformatted = [VarF, ['var']] | [AddF, ['add', Get<ExprReformatted, ExprF>, Get<ExprReformatted, ExprF>]];
// const _addrf: Get<ExprReformatted, AddF> = ['add', ['var'], ['var']];