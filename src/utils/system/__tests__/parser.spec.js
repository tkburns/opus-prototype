import { CompositeParseError, createRDParser, oneOf, optional, repeated, TokenMismatch, UnexpectedEOI } from '../parser';

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

const c = (handle) => {
  const token = handle.consume('c');
  return { type: 'c', token };
};

const d = (handle) => {
  const token = handle.consume('d');
  return { type: 'd', token };
};


describe('parser', () => {
  it('parses with rd parser', () => {
    const start = (handle) => {
      const nodeA = a(handle);
      handle.consume('.');
      const nodeB = b(handle);

      handle.consumeEOI();

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

  it('throws TokenMismatch errors', () => {
    const start = (handle) => {
      const nodeA = a(handle);
      handle.consume('.');
      const nodeB = b(handle);

      handle.consumeEOI();

      return { type: 'start', children: [nodeA, nodeB] };
    };

    const parser = createRDParser(start);

    const input1 = tokenIterator(['a', '.', 'wrong']);
    expect(() => {
      parser.run(input1);
    }).toThrow(new TokenMismatch('b', input1.tokens[2]));

    const input2 = tokenIterator(['a', '.', 'b', '.']);
    expect(() => {
      parser.run(input2);
    }).toThrow(new TokenMismatch('EOI', input2.tokens[3]));
  });

  it('throws UnexpectedEOI errors', () => {
    const start = (handle) => {
      const nodeA = a(handle);
      handle.consume('.');
      const nodeB = b(handle);

      handle.consumeEOI();

      return { type: 'start', children: [nodeA, nodeB] };
    };

    const parser = createRDParser(start);

    expect(() => {
      parser.run(tokenIterator(['a', '.']));
    }).toThrow(new UnexpectedEOI());
  });
});

describe('oneOf', () => {
  it('parses with multiple choices', () => {
    const start = (handle) => {
      const node1 = oneOf(handle, [a, b]);
      handle.consume('.');
      const node2 = oneOf(handle, [a, b]);

      handle.consumeEOI();

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

  it('collects errors from all branches if none match', () => {
    const start = (handle) => {
      const node = oneOf(handle, [
        a,
        () => {
          const node = b(handle);
          handle.consume('.');
          return { type: '', node };
        },
        () => {
          const first = oneOf(handle, [c, d]);
          handle.consume('.');
          const last = oneOf(handle, [a, b]);

          return { type: 'c/d', first, last };
        }
      ]);

      handle.consumeEOI();

      return { type: 'start', node };
    };

    const parser = createRDParser(start);

    const input = tokenIterator(['b', '?']);

    expect(() => {
      parser.run(input);
    }).toThrow(new CompositeParseError([
      new TokenMismatch('a', input.tokens[0]),
      new TokenMismatch('.', input.tokens[1]),
      new CompositeParseError([
        new TokenMismatch('c', input.tokens[0]),
        new TokenMismatch('d', input.tokens[0]),
      ])
    ]));
  });

  it('handles left recursion', () => {
    // ((a b) b) b
    const word = (handle) => {
      handle.recursionFlag('word');
      const head = oneOf(handle, [word, a]);

      const [bs, _] = repeated(handle, b);

      return bs.reduce(
        (prevHead, _nextB) => ({
          type: 'word',
          head: prevHead
        }),
        head
      );
    };

    const start = (handle) => {
      const node = word(handle);

      handle.consumeEOI();

      return { type: 'start', children: [node] };
    };

    const parser = createRDParser(start);

    const input = tokenIterator(['a', 'b', 'b', 'b']);
    const result = parser.run(input);

    expect(result).toEqual({
      type: 'start',
      children: [{
        type: 'word',
        head: {
          type: 'word',
          head: {
            type: 'word',
            head: {
              type: 'a',
              token: input.tokens[0]
            }
          }
        }
      }]
    });
  });
});

describe('repeated', () => {
  it('parses with repeatable rules', () => {
    const start = (handle) => {
      const nodeA = a(handle);

      const [nodeBs] = repeated(handle, () => {
        handle.consume('.');
        return b(handle);
      });

      handle.consumeEOI();

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

  it('captures latest error on repeated rules', () => {
    const start = (handle) => {
      a(handle);

      const [_nodeBs, latestError] = repeated(handle, () => {
        handle.consume('.');
        return b(handle);
      });

      return { type: 'error-capture', error: latestError };
    };

    const parser = createRDParser(start);

    const input = tokenIterator(['a', '.', 'b']);
    const result = parser.run(input);

    expect(result).toEqual({
      type: 'error-capture',
      error: new UnexpectedEOI()
    });
  });

});

describe('optional', () => {
  it('parses with optional rules', () => {
    const start = (handle) => {
      const nodeA = a(handle);
      const [nodeB] = optional(handle, () => {
        handle.consume('.');
        return b(handle);
      });

      handle.consumeEOI();

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

  it('captures latest error on optional rules', () => {
    const start = (handle) => {
      a(handle);
      const [_nodeB, latestError] = optional(handle, () => {
        handle.consume('.');
        return b(handle);
      });

      return { type: 'error-capture', error: latestError };
    };

    const parser = createRDParser(start);

    const input = tokenIterator(['a', '.', 'c']);
    const result = parser.run(input);

    expect(result).toEqual({
      type: 'error-capture',
      error: new TokenMismatch('b', input.tokens[2])
    });
  });
});
