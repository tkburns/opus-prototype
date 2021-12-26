import { a, b, c, d, tokenIterator } from './common';
import { createRDParser } from '../index';
import { attempt, choice, optional, repeated, repeatedRequired } from '../combinators';
import { CompositeParseError, TokenMismatch, UnexpectedEOI } from '../errors';


describe('attempt', () => {
  const start = (handle, ctx) => {
    let node;
    try {
      node = attempt(handle, ctx, aa);
    } catch (e) {
      node = attempt(handle, ctx, ab);
    }

    handle.consumeEOI();

    return { type: 'start', children: [node] };
  };

  const aa = (handle, ctx) => {
    const token1 = a(handle, ctx);
    const token2 = a(handle, ctx);
    return { type: 'aa', tokens: [token1, token2] };
  };

  const ab = (handle, ctx) => {
    const token1 = a(handle, ctx);
    const token2 = b(handle, ctx);
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

  it('passes context through', () => {
    const aaSpy = jest.fn(aa);
    const start = (handle, ctx) => {
      let node;
      try {
        node = attempt(handle, { ...ctx, parent: 'start' }, aaSpy);
      } catch (e) {}

      handle.consumeEOI();

      return { type: 'start', children: [node] };
    };

    const parser = createRDParser(start);

    const input1 = tokenIterator([]);
    const result1 = parser.run(input1);

    expect(result1).toEqual({
      type: 'start',
      children: [undefined]
    });
    expect(aaSpy).toHaveBeenCalledWith(expect.anything(), { parent: 'start' });
  });
});

describe('choice', () => {
  it('parses with multiple choices', () => {
    const start = (handle, ctx) => {
      const node1 = choice(handle, ctx, [a, b]);
      handle.consume('.');
      const node2 = choice(handle, ctx, [a, b]);

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
    const start = (handle, ctx) => {
      const node = choice(handle, ctx, [
        a,
        () => {
          const node = b(handle, ctx);
          handle.consume('.');
          return { type: '', node };
        },
        () => {
          const first = choice(handle, ctx, [c, d]);
          handle.consume('.');
          const last = choice(handle, ctx, [a, b]);

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

  it('passes context through', () => {
    const bSpy = jest.fn(b);

    const start = (handle, ctx) => {
      const node = choice(handle, { ...ctx, parent: 'start' }, [a, bSpy]);

      handle.consumeEOI();

      return { type: 'start', node };
    };

    const parser = createRDParser(start);

    const input = tokenIterator(['b']);
    const result = parser.run(input);

    expect(result).toEqual({
      type: 'start',
      node: { type: 'b', token: input.tokens[0] },
    });
    expect(bSpy).toHaveBeenCalledWith(expect.anything(), { parent: 'start' });
  });
});

describe('repeated', () => {
  it('parses with repeatable rules', () => {
    const start = (handle, ctx) => {
      const nodeA = a(handle, ctx);

      const [nodeBs] = repeated(handle, ctx, () => {
        handle.consume('.');
        return b(handle, ctx);
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
    const start = (handle, ctx) => {
      a(handle, ctx);

      const [_nodeBs, latestError] = repeated(handle, ctx, () => {
        handle.consume('.');
        return b(handle, ctx);
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

  it('passes context through', () => {
    const aSpy = jest.fn(a);

    const start = (handle, ctx) => {
      const [nodes] = repeated(handle, { ...ctx, parent: 'start' }, aSpy);

      handle.consumeEOI();

      return { type: 'start', children: nodes };
    };

    const parser = createRDParser(start);

    const input = tokenIterator(['a', 'a']);
    const result = parser.run(input);

    expect(result).toEqual({
      type: 'start',
      children: [
        { type: 'a', token: input.tokens[0] },
        { type: 'a', token: input.tokens[1] },
      ]
    });
    expect(aSpy).toHaveBeenCalledWith(expect.anything(), { parent: 'start' });
  });
});

describe('repeatedRequired', () => {
  const saveCtx = (parser) => (handle, ctx) => {
    return { ...parser(handle, ctx), ctx };
  };

  const start = (handle, ctx) => {
    const aParser = ctx.save
      ? saveCtx(a)
      : a;

    const [nodes, lastError] = repeatedRequired(2, handle, ctx, () => {
      const node = aParser(handle, ctx);
      handle.consume('.');
      return node;
    });

    handle.consumeEOI();

    return { type: 'start', nodes, lastError };
  };

  it('parses rules repeatedly', () => {
    const parser = createRDParser(start);

    const input1 = tokenIterator(['a', '.', 'a', '.']);
    const result1 = parser.run(input1);

    expect(result1).toEqual({
      type: 'start',
      nodes: [
        { type: 'a', token: input1.tokens[0] },
        { type: 'a', token: input1.tokens[2] },
      ],
      lastError: new UnexpectedEOI()
    });

    const input2 = tokenIterator(['a', '.', 'a', '.', 'a', '.', 'a', '.']);
    const result2 = parser.run(input2);

    expect(result2).toEqual({
      type: 'start',
      nodes: [
        { type: 'a', token: input2.tokens[0] },
        { type: 'a', token: input2.tokens[2] },
        { type: 'a', token: input2.tokens[4] },
        { type: 'a', token: input2.tokens[6] },
      ],
      lastError: new UnexpectedEOI()
    });
  });

  it('throws if required number is not fulfilled', () => {
    const parser = createRDParser(start);

    const input = tokenIterator(['a', '.']);
    expect(() => {
      parser.run(input);
    }).toThrow(new UnexpectedEOI());
  });

  it('passes context through', () => {
    const ctx = { save: true, foo: 'bar' };

    const parser = createRDParser(start, ctx);

    const input = tokenIterator(['a', '.', 'a', '.']);
    const result = parser.run(input);

    expect(result).toEqual({
      type: 'start',
      nodes: [
        { type: 'a', token: input.tokens[0], ctx },
        { type: 'a', token: input.tokens[2], ctx },
      ],
      lastError: new UnexpectedEOI()
    });
  });
});

describe('optional', () => {
  it('parses with optional rules', () => {
    const start = (handle, ctx) => {
      const nodeA = a(handle, ctx);
      const [nodeB] = optional(handle, ctx, () => {
        handle.consume('.');
        return b(handle, ctx);
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
    const start = (handle, ctx) => {
      a(handle, ctx);
      const [_nodeB, latestError] = optional(handle, ctx, () => {
        handle.consume('.');
        return b(handle, ctx);
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

  it('passes context through', () => {
    const aSpy = jest.fn(a);

    const start = (handle, ctx) => {
      const [node] = optional(handle, { ...ctx, parent: 'start' }, aSpy);

      handle.consumeEOI();

      return { type: 'start', node };
    };

    const parser = createRDParser(start);

    const input = tokenIterator([]);
    const result = parser.run(input);

    expect(result).toEqual({
      type: 'start',
      node: undefined
    });
    expect(aSpy).toHaveBeenCalledWith(expect.anything(), { parent: 'start' });
  });
});

