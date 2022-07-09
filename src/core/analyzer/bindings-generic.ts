import { Typed } from '&/utils/nodes';
import * as AST from '../ast';

// TODO - won't work - need to also have state across nodes

type TypeMap<Ts extends Typed = Typed> = {
  [t in Ts['type']]: unknown;
};

type GetDefaultedTM<TM extends TypeMap, N extends Typed> =
  N['type'] extends keyof TM
    ? TM[N['type']]
    : N;

export type Walk<Ns extends Typed, TM extends TypeMap> =
  <N extends Ns>(x: N) => GetDefaultedTM<TM, N>;

export type Walker<Ns extends Typed, TM extends TypeMap, N extends Ns> =
  (x: N, walk: Walk<Ns, TM>) => GetDefaultedTM<TM, N>;

export type Walkers<Ns extends Typed, TM extends TypeMap> = {
  [t in keyof TM]: Walker<Ns, TM, Extract<Ns, { type: t }>>;
}


type WalkerConstructor<Ns extends Typed> = {
  create: <TM extends TypeMap>(walkers: Walkers<Ns, TM>) => Walk<Ns, TM>;
};

export const defaultedWalker = <Ns extends Typed>(): WalkerConstructor<Ns> => ({
  create: <TM extends TypeMap>(walkers: Walkers<Ns, TM>): Walk<Ns, TM> => {
    const walk = ((node) => {
      const walker = walkers[node.type];

      if (walker == null) {
        return node;
      }

      // TODO - remove unknown..?
      return walker(node as unknown as Extract<Ns, { type: string }>, walk);
    }) as Walk<Ns, TM>;

    return walk;
  }
});


// --------------


type Meta<T> = { meta: T };

export type DecoratedAST = AST.ASTF<AST.NodeM<
  [AST.NamePattern, Meta<{ bound: string[] }>]
>>;

// TODO - need to preserve state across processing *sibling* nodes
export const analyzeBindings = defaultedWalker<AST.Node>().create({
});

