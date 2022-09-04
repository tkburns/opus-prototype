
// TODO - rename?
// TODO - should defualt to `any`?? be careful of contra-variant uses of Map (if R is used as fn arg)
//          type Foo<RS extends Map = Map> = { type: 'foo', fn: (x: R) => void }
//          does that ever make sense for a recursion scheme parameter...?

import { Typed } from "./nodes";

// TODO - add tvar for keys??
export type Map<R = unknown> = Record<string, R>;

// TODO - rename?
export type GetT<Tp extends string, RM extends Map> =
  Tp extends keyof RM
    ? RM[Tp]
    : never;

export type Get<Pat extends Typed, RM extends Map> =
  GetT<Pat['type'], RM>;

// TODO - use { _t: X } instead of tuple?
// TODO - rename ?? make shorter ??
export type RecSafe<T = unknown> = [T];
export type RecExtract<T extends RecSafe> =
  T extends RecSafe<infer U> ? U : never;

