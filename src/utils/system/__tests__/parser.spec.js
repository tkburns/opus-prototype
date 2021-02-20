import { createRDParser, oneOf, optional, repeated } from '../parser';

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

const b = (handle) => {
  const token = handle.consume('b');
  return { type: 'b', token };
};


it('parses with rd parser', () => {
  const start = (handle) => {
    const nodeA = a(handle);
    handle.consume('.');
    const nodeB = b(handle);

    if (!handle.atEOI()) throw new Error('not at EOI');

    return { type: 'start', children: [nodeA, nodeB] };
  };

  const parser = createRDParser(start);

  const input = tokenIterator(['a', '.', 'b']);
  const result = parser.run(input);

  expect(result).toEqual({
    type: 'start',
    children: [
      { type: 'a', token: input.tokens[0] },
      { type: 'b', token: input.tokens[2] },
    ]
  });
});

it('throws errors on unparseable input', () => {
  const start = (handle) => {
    const nodeA = a(handle);
    handle.consume('.');
    const nodeB = b(handle);

    if (!handle.atEOI()) throw new Error('not at EOI');

    return { type: 'start', children: [nodeA, nodeB] };
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

it('parses with multiple choices', () => {
  const start = (handle) => {
    const node1 = oneOf(handle, [a, b]);
    handle.consume('.');
    const node2 = oneOf(handle, [a, b]);

    if (!handle.atEOI()) throw new Error('not at EOI');

    return { type: 'start', children: [node1, node2] };
  };

  const parser = createRDParser(start);

  const input1 = tokenIterator(['a', '.', 'b']);
  const result1 = parser.run(input1);

  expect(result1).toEqual({
    type: 'start',
    children: [
      { type: 'a', token: input1.tokens[0] },
      { type: 'b', token: input1.tokens[2] },
    ]
  });

  const input2 = tokenIterator(['b', '.', 'a']);
  const result2 = parser.run(input2);

  expect(result2).toEqual({
    type: 'start',
    children: [
      { type: 'b', token: input2.tokens[0] },
      { type: 'a', token: input2.tokens[2] },
    ]
  });
});

it('parses with repeatable rules', () => {
  const start = (handle) => {
    const nodeA = a(handle);

    const nodeBs = repeated(handle, () => {
      handle.consume('.');
      return b(handle);
    });

    if (!handle.atEOI()) throw new Error('not at EOI');

    return { type: 'start', children: [nodeA, ...nodeBs] };
  };

  const parser = createRDParser(start);

  const input1 = tokenIterator(['a']);
  const result1 = parser.run(input1);

  expect(result1).toEqual({
    type: 'start',
    children: [
      { type: 'a', token: input1.tokens[0] },
    ]
  });

  const input2 = tokenIterator(['a', '.', 'b']);
  const result2 = parser.run(input2);

  expect(result2).toEqual({
    type: 'start',
    children: [
      { type: 'a', token: input2.tokens[0] },
      { type: 'b', token: input2.tokens[2] },
    ]
  });

  const input3 = tokenIterator(['a', '.', 'b', '.', 'b', '.', 'b']);
  const result3 = parser.run(input3);

  expect(result3).toEqual({
    type: 'start',
    children: [
      { type: 'a', token: input3.tokens[0] },
      { type: 'b', token: input3.tokens[2] },
      { type: 'b', token: input3.tokens[4] },
      { type: 'b', token: input3.tokens[6] },
    ]
  });
});

it('parses with optional rules', () => {
  const start = (handle) => {
    const nodeA = a(handle);
    const nodeB = optional(handle, () => {
      handle.consume('.');
      return b(handle);
    });

    if (!handle.atEOI()) throw new Error('not at EOI');

    return { type: 'start', children: [nodeA, nodeB] };
  };

  const parser = createRDParser(start);

  const input1 = tokenIterator(['a', '.', 'b']);
  const result1 = parser.run(input1);

  expect(result1).toEqual({
    type: 'start',
    children: [
      { type: 'a', token: input1.tokens[0] },
      { type: 'b', token: input1.tokens[2] },
    ]
  });

  const input2 = tokenIterator(['a']);
  const result2 = parser.run(input2);

  expect(result2).toEqual({
    type: 'start',
    children: [
      { type: 'a', token: input2.tokens[0] },
      undefined
    ]
  });
});
