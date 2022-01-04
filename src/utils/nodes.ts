import { UnionToIntersection } from './helper.types';
import { Tail } from './tuple.types';

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


type BaseTypeMap<Ts extends string = string> = {
  [T in Ts]: (node: never, ...args: never[]) => unknown
};
type ValidatedTypeMap<TM extends BaseTypeMap> = {
  [T in keyof TM]: ValidatedTMF<T, TM[T]>;
};
type ValidatedTMF<T, F extends BaseTypeMap[keyof BaseTypeMap]> =
  F extends (n: infer N, ...args: infer Args) => infer R
    ? (n: Typed<T> & Omit<N, 'type'>, ...args: Args) => R
    : never;

type Nodes<TM extends BaseTypeMap> = Parameters<TM[keyof TM]>[0];
type ArgsFor<TM extends BaseTypeMap, N extends Nodes<TM>> = Tail<Parameters<TM[N['type']]>>;
type Return<TM extends BaseTypeMap, N extends Nodes<TM>> = ReturnType<TM[N['type']]>;

type Mapped<TM extends BaseTypeMap> =
  UnionToIntersection<FnToCallable<TM[keyof TM]>> & {
    <N extends Nodes<TM>>(node: N, ...args: ArgsFor<TM, N>): Return<TM, N>;
    (...args: Parameters<TM[keyof TM]>): ReturnType<TM[keyof TM]>;
  };
type FnToCallable<T> = T extends (...args: infer Args) => infer R ? { (...args: Args): R } : unknown;

export const mapByType = <TM extends BaseTypeMap>(typeMap: TM & ValidatedTypeMap<TM>): Mapped<TM> => {
  const mapped = <N extends Nodes<TM>>(node: N, ...args: ArgsFor<TM, N>): Return<TM, N> => {
    const matching = typeMap[(node as Typed<keyof TM>).type];
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-return */
    return matching(node, ...args) as Return<TM, N>;
  };

  return mapped as Mapped<TM>;
};
