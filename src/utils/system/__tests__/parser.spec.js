import { createRDParser } from '../parser';
import { catchError } from '&test/utils/error';

const tokens = (words) => words
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

const tokenIterator = (words) => {
  const tokenList = tokens(words);
  const iterator = tokenList[Symbol.iterator]();
  iterator.tokens = tokenList;
  return iterator;
};


const a = (handle) => {
  const token = handle.consume('a');
  return { type: 'a', token };
};

const c = (handle) => {
  const token = handle.consume('c');
  return { type: 'c', token };
};


it('parses with rd parser', () => {
  const start = (handle) => {
    const nodeA = a(handle);
    handle.consume('.');
    const nodeC = c(handle);

    if (!handle.atEOI()) throw new Error('not at EOI');

    return { type: 'start', children: [nodeA, nodeC] };
  };

  const parser = createRDParser(start);

  const input = tokenIterator(['a', '.', 'c']);
  const result = parser.run(input);

  expect(result).toEqual({
    type: 'start',
    children: [
      { type: 'a', token: input.tokens[0] },
      { type: 'c', token: input.tokens[2] },
    ]
  });
});

it('throws errors on unparseable input', () => {
  const start = (handle) => {
    const nodeA = a(handle);
    handle.consume('.');
    const nodeC = c(handle);

    if (!handle.atEOI()) throw new Error('not at EOI');

    return { type: 'start', children: [nodeA, nodeC] };
  };

  const parser = createRDParser(start);

  expect(() => {
    parser.run(tokenIterator(['a', '.', 'wrong']));
  }).toThrow();

  expect(() => {
    parser.run(tokenIterator(['a', '.']));
  }).toThrow();

  expect(() => {
    parser.run(tokenIterator(['a', '.', 'b', '.']));
  }).toThrow();
});
