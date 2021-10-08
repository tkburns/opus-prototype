import { createSource } from '&test/utils/input';

export const tokens = (words) => words
  .reduce(
    ({ list, nextLoc: loc }, text) => {
      const token = { type: text, location: loc };
      const nextColumn = loc.column + text.length + 1;

      return ({
        list: [...list, token],
        nextLoc: nextColumn > 20
          ? { line: loc.line + 1, column: 1 }
          : { line: loc.line, column: nextColumn }
      });
    },
    { list: [], nextLoc: { line: 1, column: 1 } }
  ).list;

export const tokenIterator = (words) => {
  const tokenList = tokens(words);
  const iterator = tokenList[Symbol.iterator]();

  iterator.tokens = tokenList;
  iterator.source = createSource();

  return iterator;
};


export const a = (handle) => {
  const token = handle.consume('a');
  return { type: 'a', token };
};

export const b = (handle) => {
  const token = handle.consume('b');
  return { type: 'b', token };
};

export const c = (handle) => {
  const token = handle.consume('c');
  return { type: 'c', token };
};

export const d = (handle) => {
  const token = handle.consume('d');
  return { type: 'd', token };
};
