
type Last = {
  <T>(list: [T, ...T[]]): T;
  <T>(list: T[]): T | undefined;
};

export const last: Last = <T>(list: T[]): T | undefined => list[list.length - 1];

/*
  a type-guard version of array.includes
*/
export const includes = <T>(list: readonly T[], target: unknown): target is T =>
  (list as unknown[]).includes(target);
