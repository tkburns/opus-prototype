
export type UFn<A, B> = (a: A) => B;

type Extract<T, K> =
  T extends K ? T : never;

export type MapByType<Ts extends { type: string }> = {
  [K in Ts['type']]: Extract<Ts, { type: K }>;
};
