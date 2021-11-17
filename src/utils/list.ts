
type Last = {
  <T>(list: [T, ...T[]]): T;
  <T>(list: T[]): T | undefined;
};

export const last: Last = <T>(list: T[]): T | undefined => list[list.length - 1];
