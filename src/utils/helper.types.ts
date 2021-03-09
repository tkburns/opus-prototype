
export type UFn<A, B> = (a: A) => B;

export type MapByType<Ts extends { type: string }> = {
  [K in Ts['type']]: Extract<Ts, { type: K }>;
};
