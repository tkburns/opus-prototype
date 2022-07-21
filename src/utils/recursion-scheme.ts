
// TODO - rename?
// TODO - should defualt to `any`?? be careful of contra-variant uses of Map (if R is used as fn arg)
//          type Foo<RS extends Map = Map> = { type: 'foo', fn: (x: R) => void }
//          does that ever make sense for a recursion scheme parameter...?
// TODO - should R be RecSafe<R> ??
export type Map<Pat = unknown, R = unknown> = [Pat, R];

// TODO - rename?
export type Get<Pat, RM extends Map> =
  RM extends unknown
  ? RM[0] extends Pat ? RM[1] : never
  : never;
  // RM extends unknown
  // ? Pat extends RM[0] ? RM[1] : never
  // : never;

// // type _f = [1, '1'] | [2, '2'];
// type _f = [1, { t: '1', x: _f }] | [2, '2'];
// // type _f2 = [1, 'one'] | (([1, never] | [2, unknown]) & _f);
// // type _m<T> = ([T, never] | [Exclude<_f[0], T>, unknown]) & _f;
// type _m<T, f extends Map> = ([T, never] | [Exclude<f[0], T>, unknown]) & f;
// type _f2 = [1, 'one'] | _m<1, _f>;

// type _x = Get<_f2, 1>;
// type _y = Get<_f2, 2>;

export type Ex<Pat, Node, RM extends Map> =
  Node extends Pat ? never : RM;

// TODO - use { _t: X } instead of tuple?
// TODO - rename ?? make shorter ??
export type RecSafe<T = unknown> = [T];
export type RecExtract<T extends RecSafe> =
  T extends RecSafe<infer U> ? U : never;

