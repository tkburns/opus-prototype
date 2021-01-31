import type { Prepend, Last } from '../tuple.types';
import type { UFn } from '../helper.types';


export interface Module<A, B> {
  run: (a: A) => B;
};

export interface System<A, B> {
  run: (a: A) => B;
}


type Modules<A, Ts extends unknown[]> = {
  [K in keyof Ts]: K extends keyof Prepend<Ts, A>
      ? Module<Prepend<Ts, A>[K], Ts[K]>
      : never;
};

type FirstArg<A> = [Module<A, unknown>, ...unknown[]];


export const system = <A, Ts extends unknown[]>(...modules: FirstArg<A> & Modules<A, Ts>): System<A, Last<Ts>> => {
  const castModules = modules as Module<A | Ts[number], Ts[number]>[];

  const run = castModules.reduce(
      (piped, m) => (a) => m.run(piped(a)),
      ((a: A | Ts[number]) => a)
  ) as UFn<A, Last<Ts>>;

  return {
    run
  };
};

