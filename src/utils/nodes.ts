export type Typed<Ts = string> = {
  type: Ts;
};

type Routes<N extends Typed, Args extends unknown[], R> = {
  [T in N['type']]: (n: Extract<N, Typed<T>>, ...args: Args) => R
};

type TransformByType = {
  <N extends Typed, Args extends [] | unknown[], R>(n: N, args: Args, routes: Routes<N, Args, R>): R;
  <N extends Typed, R>(n: N, routes: Routes<N, [], R>): R;
};

export const transformByType: TransformByType = <N extends Typed, Args extends unknown[], R>(
  n: N,
  _args: Args | Routes<N, [], R>,
  _routes?: Routes<N, Args, R>
): R => {
  const routes = (_routes == null ? _args : _routes) as Routes<N, Args, R>;
  const args = (_routes == null ? [] : _args) as Args;

  const matching = routes[n.type as N['type']];
  return matching(n as Extract<N, Typed<N['type']>>, ...args);
};

