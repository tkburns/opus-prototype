import { Module } from './system';

type Typed<Ts extends string = string> = {
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


export type Walk<T extends Typed, R> = (x: T) => R;
export type Walker<T extends Typed, N extends T, R> = (x: N, walk: Walk<T, R>) => R;

export type Walkers<T extends Typed, R> = {
  [t in T['type']]: Walker<T, Extract<T, { type: t }>, R>;
}

export const createWalker = <T extends Typed, R>(walkers: Walkers<T, R>): Walk<T, R> => {
  const walk: Walk<T, R> = (node) => {
    const walker = walkers[node.type as T['type']];

    if (walker == null) {
      throw new Error(`missing walker for node type ${node.type}`);
    }

    return walker(node as Extract<T, { type: typeof node.type }>, walk);
  };

  return walk;
};

export const createWalkerModule = <T extends Typed, R>(walkers: Walkers<T, R>): Module<T, R> =>
  ({
    run: createWalker(walkers)
  });

