
export const range = (from: number, to: number): number[] =>
  new Array(to - from + 1).fill(0)
    .map((_, num) => num + from);

export const runIterator = <T>(iterator: Iterator<T, unknown>, maxIterations = 100): T[] => {
  const collectedResults = range(1, maxIterations).reduce(
    (collected, _) => {
      if (collected.done) {
        return collected;
      }

      const iteratorResult = iterator.next();
      if (iteratorResult.done) {
        return { ...collected, done: true };
      } else {
        return {
          results: [...collected.results, iteratorResult.value],
          done: collected.done
        };
      }
    },
    { results: [] as T[], done: false }
  );

  if (!collectedResults.done) {
    throw new Error(`iterator did not complete within ${maxIterations} iterations`);
  }

  return collectedResults.results;
};
