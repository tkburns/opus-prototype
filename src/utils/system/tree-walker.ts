import { Module } from './system';

type Typed = {
  type: string;
};

type Walker<T extends Typed, N extends T, R> = (x: N, walk: (x2: T) => R) => R;

type Walkers<T extends Typed, R> = {
  [t in T['type']]: Walker<T, Extract<T, { type: t }>, R>;
}

export const createWalker = <T extends Typed, R>(walkers: Walkers<T, R>): ((node: T) => R) => {
  const walk = (node: T): R => {
    const walker = walkers[node.type as T['type']];

    if (walker == null) {
      throw new Error(`missing walker for node type ${node.type}`);
    }

    return walker(node as Extract<T, { type: typeof node.type }>, walk);
  };

  return walk as (node: T) => R;
};

export const createWalkerModule = <T extends Typed, R>(walkers: Walkers<T, R>): Module<T, R> =>
  ({
    run: createWalker(walkers)
  });

