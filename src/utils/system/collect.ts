import { Module } from "./system";

export const collect = <T>(): Module<Iterator<T, undefined>, T[]> => ({
  run: (iterator: Iterator<T, undefined>) => {
    let collected = [];
    let result = iterator.next();

    while (!result.done) {
      collected.push(result.value);
      result = iterator.next();
    }

    return collected;
  }
});
