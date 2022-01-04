
export type UFn<A, B> = (a: A) => B;

export type skeyof<T> = Extract<keyof T, string>;

export type MapByType<Ts extends { type: string }> = {
  [K in Ts['type']]: Extract<Ts, { type: K }>;
};

export type UnionToIntersection<T> =
  (T extends unknown ? (x: T) => unknown : never) extends
  (x: infer R) => unknown ? R : never;
