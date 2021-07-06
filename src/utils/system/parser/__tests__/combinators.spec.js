import { a, b, c, d, tokenIterator } from './common';
import { createRDParser } from '../index';
import { attempt, choice, optional, repeated } from '../combinators';
import { CompositeParseError, TokenMismatch, UnexpectedEOI } from '../errors';

describe('attempt', () => {
  const start = (handle) => {
    let node;
    try {
      node = attempt(handle, aa);
    } catch (e) {
      node = attempt(handle, ab);
    }

    handle.consumeEOI();

    return { type: 'start', children: [node] };
  };

  const aa = (handle) => {
    const token1 = a(handle);
    const token2 = a(handle);
    return { type: 'aa', tokens: [token1, token2] };
  };

  const ab = (handle) => {
    const token1 = a(handle);
    const token2 = b(handle);
    return { type: 'ab', tokens: [token1, token2] };
  };

  it('returns parser result', () => {
    const parser = createRDParser(start);

    const input1 = tokenIterator(['a', 'a']);
    const result1 = parser.run(input1);

    expect(result1).toEqual({
      type: 'start',
      children: [
        { type: 'aa', tokens: [
          { type: 'a', token: input1.tokens[0] },
          { type: 'a', token: input1.tokens[1] },
        ] }
      ]
    });
  });

  it('backtracks & rethrows error on failure', () => {

    const parser = createRDParser(start);

    const input1 = tokenIterator(['a', 'b']);
    const result1 = parser.run(input1);

    expect(result1).toEqual({
      type: 'start',
      children: [
        { type: 'ab', tokens: [
          { type: 'a', token: input1.tokens[0] },
          { type: 'b', token: input1.tokens[1] },
        ] }
      ]
    });
  });
});

describe('choice', () => {
  it('parses with multiple choices', () => {
    const start = (handle) => {
      const node1 = choice(handle, [a, b]);
      handle.consume('.');
      const node2 = choice(handle, [a, b]);

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
      const node = choice(handle, [
        a,
        () => {
          const node = b(handle);
          handle.consume('.');
          return { type: '', node };
        },
        () => {
          const first = choice(handle, [c, d]);
          handle.consume('.');
          const last = choice(handle, [a, b]);

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

