import { Module } from './system';

type Typed = {
  type: string;
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

