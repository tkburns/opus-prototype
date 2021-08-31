import { a, b, c, tokenIterator } from './common';
import { createRDParser } from '../index';
import { choice, repeated } from '../combinators';
import { lrec } from '../lrec';
import { cached } from '../cache';

it('handles left recursion', () => {
  const start = (handle, ctx) => {
    const node = r(handle, ctx);
    return {
      type: 'start',
      node
    };
  };

  const r = lrec((handle, ctx) => {
    return choice(handle, ctx, [ar, c]);
  });

  const ar = (handle, ctx) => {
    const base = r(handle, ctx);
    const node = a(handle, ctx);

    return {
      type: 'ar',
      base,
      node
    };
  };

  const parser = createRDParser(start);

  const input = tokenIterator(['c', 'a', 'a', 'a']);
  const result = parser.run(input);

  expect(result).toEqual({
    type: 'start',
    node: {
      type: 'ar',
      base: {
        type: 'ar',
        base: {
          type: 'ar',
          base: { type: 'c', token: input.tokens[0] },
          node: { type: 'a', token: input.tokens[1] }
        },
        node: { type: 'a', token: input.tokens[2] }
      },
      node: { type: 'a', token: input.tokens[3] }
    }
  });
});

it('parses rules in order', () => {
  const start = (handle, ctx) => {
    const node = r(handle, ctx);
    const [leftovers, _] = repeated(handle, ctx, a);
    handle.consumeEOI();

    return {
      type: 'start',
      node,
      leftovers
    };
  };

  // base (c) also matches recursive case (ca)
  const r = lrec((handle, ctx) => {
    return choice(handle, ctx, [c, ca, ra]);
  });

  const ca = (handle, ctx) => {
    const nodeC = c(handle, ctx);
    const nodeA = a(handle, ctx);

    return {
      type: 'ca',
      nodeC,
      nodeA
    };
  };

  const ra = (handle, ctx) => {
    const base = r(handle, ctx);
    const nodeA = a(handle, ctx);

    return {
      type: 'ra',
      base,
      nodeA,
    };
  };

  const parser = createRDParser(start);

  const input = tokenIterator(['c', 'a', 'a']);
  const result = parser.run(input);

  expect(result).toEqual({
    type: 'start',
    node: { type: 'c', token: input.tokens[0] },
    leftovers: [
      { type: 'a', token: input.tokens[1] },
      { type: 'a', token: input.tokens[2] },
    ],
  });
});

it('handles left recursion with cached intermediary rules', () => {
  const start = (handle, ctx) => {
    const node = r(handle, ctx);
    return {
      type: 'start',
      node
    };
  };

  const r = lrec((handle, ctx) => {
    return choice(handle, ctx, [int, c]);
  });

  const int = cached((handle, ctx) => {
    return ar(handle, ctx);
  });

  const ar = (handle, ctx) => {
    const base = r(handle, ctx);
    const node = a(handle, ctx);

    return {
      type: 'ar',
      base,
      node
    };
  };

  const parser = createRDParser(start);

  const input = tokenIterator(['c', 'a', 'a', 'a']);
  const result = parser.run(input);

  expect(result).toEqual({
    type: 'start',
    node: {
      type: 'ar',
      base: {
        type: 'ar',
        base: {
          type: 'ar',
          base: { type: 'c', token: input.tokens[0] },
          node: { type: 'a', token: input.tokens[1] }
        },
        node: { type: 'a', token: input.tokens[2] }
      },
      node: { type: 'a', token: input.tokens[3] }
    }
  });
});

describe('nested', () => {
  const n = (type, node) => ({ type, node });
  const nrec = (type, rec, node) => ({ type, rec, node });
  const ntoken = (type, index, input) => ({ type, token: input.tokens[index] });

  const nChain = (...args) => {
    const [node] = args.slice(-1);
    const types = args.slice(0, -1);

    return types.reduceRight((prev, type) => n(type, prev), node);
  };

  it('handles nested left recursion', () => {
    const start = (handle, ctx) => {
      const node = r1(handle, ctx);
      handle.consume('!');

      return {
        type: 'start',
        node
      };
    };

    const r1 = lrec((handle, ctx) => {
      const node = r2(handle, ctx);
      handle.consume('.');

      return {
        type: 'r1',
        node
      };
    });

    const r2 = lrec((handle, ctx) => {
      const node = choice(handle, ctx, [rb, ra, c]);

      return {
        type: 'r2',
        node
      };
    });

    const ra = (handle, ctx) => {
      const rec = r1(handle, ctx);
      const node = a(handle, ctx);

      return {
        type: 'ra',
        rec,
        node
      };
    };

    const rb = (handle, ctx) => {
      const rec = r2(handle, ctx);
      const node = b(handle, ctx);

      return {
        type: 'rb',
        rec,
        node
      };
    };

    const parser = createRDParser(start);

    const input = tokenIterator(['c', '.', 'a', '.', 'a', 'b', 'b', '.', 'a', '.', '!']);
    const result = parser.run(input);

    expect(result).toEqual(
      nChain('start', 'r1', 'r2',
        nrec('ra',
          nChain('r1', 'r2',
            nrec('rb',
              n('r2',
                nrec('rb',
                  n('r2',
                    nrec('ra',
                      nChain('r1', 'r2',
                        nrec('ra',
                          nChain('r1', 'r2', ntoken('c', 0, input)),
                          ntoken('a', 2, input)
                        )
                      ),
                      ntoken('a', 4, input)
                    )
                  ),
                  ntoken('b', 5, input)
                ),
              ),
              ntoken('b', 6, input)
            )
          ),
          ntoken('a', 8, input)
        )
      )
    );
  });

  it('handles caching left recursive rules', () => {
    const start = (handle, ctx) => {
      const node = choice(handle, ctx, [
        () => {
          const n = r1(handle, ctx);
          handle.consume('!');
          return n;
        },
        () => {
          const n = r1(handle, ctx);
          handle.consume('?');
          return n;
        },
      ]);

      return {
        type: 'start',
        node
      };
    };

    const r1 = cached(lrec((handle, ctx) => {
      const node = choice(handle, ctx, [
        () => {
          const n = r2(handle, ctx);
          handle.consume('.');
          return n;
        },
        () => {
          const n = r2(handle, ctx);
          handle.consume(',');
          return n;
        },
      ]);

      return {
        type: 'r1',
        node
      };
    }));

    const r2 = cached(lrec((handle, ctx) => {
      const node = choice(handle, ctx, [rb, ra, c]);

      return {
        type: 'r2',
        node
      };
    }));

    const ra = (handle, ctx) => {
      const rec = r1(handle, ctx);
      const node = a(handle, ctx);

      return {
        type: 'ra',
        rec,
        node
      };
    };

    const rb = (handle, ctx) => {
      const rec = r2(handle, ctx);
      const node = b(handle, ctx);

      return {
        type: 'rb',
        rec,
        node
      };
    };

    const parser = createRDParser(start);

    const input = tokenIterator(['c', 'b', ',', 'a', 'b', ',', '?']);
    const result = parser.run(input);

    expect(result).toEqual(
      nChain('start', 'r1', 'r2',
        nrec('rb',
          n('r2',
            nrec('ra',
              nChain('r1', 'r2',
                nrec('rb',
                  n('r2', ntoken('c', 0, input)),
                  ntoken('b', 1, input)
                )
              ),
              ntoken('a', 3, input)
            )
          ),
          ntoken('b', 4, input)
        )
      )
    );
  });
});
