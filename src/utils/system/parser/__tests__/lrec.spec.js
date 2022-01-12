import { last } from '&/utils/list';
import { a, b, c, tokenIterator } from './common';
import { createRDParser } from '../index';
import { choice, repeated } from '../combinators';
import { lrec } from '../lrec';
import { cached } from '../cache';
import { TokenMismatch } from '../errors';

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

/*
  safe to use cache key on lrec IF lrec is only called with different
  options from the outside

  if called from the inside, then not all iterations of rule are
  inside lrec - since the calling rule is inside the parent lrec (with
  a different key), so it won't be considered while repeating the rule.
  Hence the nested lrec will eat up all the input & the calling rule in
  the parent lrec will fail.

  for example, the following doesn't work -
  in `e(0)`, if `a` fails then `b` is called from within `e(0)`; `b` then calls `e(1)`
  which eats up all the `B`, and then there are no more `B` for the original `b` to consume.

      e(n) = lrec(() => {
        choices = [a, b, c];
        return choice(choices.slice(n));
      })
      a = e(0) A
      b = e(1) B

  but this does work, since b is only called from within e(1)

      e(n) = lrec(() => {
        choices = [a, b, c];
        return choice([
          choices.slice(n)[0],
          e(n + 1)
        ]);
      })
      a = e(0) A
      b = e(1) B

*/
describe('uses customized cache key', () => {
  it('customizes cache key based on context', () => {
    const start = (handle, ctx) => {
      const node = r(handle, ctx);

      handle.consumeEOI();

      return {
        type: 'start',
        node
      };
    };

    const r = lrec(
      (c) => `level=${c.level ?? 0}`,
      (handle, ctx) => {
        const choices = [ar, br, c];

        const level = Math.min(ctx.level ?? 0, choices.length - 1);

        if (level >= choices.length - 1) {
          const base = last(choices);
          return base(handle, ctx);
        } else {
          const selected = choices[level];
          const next = (h, c) => r(h, { ...c, level: level + 1 });

          return choice(handle, ctx, [selected, next]);
        }
      }
    );

    const ar = (handle, ctx) => {
      const base = r(handle, ctx);
      const node = a(handle, ctx);

      return {
        type: 'ar',
        base,
        node
      };
    };

    const br = (handle, ctx) => {
      const base = r(handle, { ...ctx, level: 1 });
      const node = b(handle, ctx);

      return {
        type: 'br',
        base,
        node
      };
    };

    const parser = createRDParser(start);

    const input1 = tokenIterator(['c', 'a', 'b']);
    expect(() => parser.run(input1))
      .toThrow(new TokenMismatch('EOI', input1.tokens[2]));

    const input2 = tokenIterator(['c', 'b', 'b', 'a', 'a']);
    const result2 = parser.run(input2);

    expect(result2).toEqual({
      type: 'start',
      node: {
        type: 'ar',
        base: {
          type: 'ar',
          base: {
            type: 'br',
            base: {
              type: 'br',
              base: { type: 'c', token: input2.tokens[0] },
              node: { type: 'b', token: input2.tokens[1] }
            },
            node: { type: 'b', token: input2.tokens[2] }
          },
          node: { type: 'a', token: input2.tokens[3] }
        },
        node: { type: 'a', token: input2.tokens[4] }
      }
    });
  });

  it('customizes cache key base on extra parameters', () => {
    const start = (handle, ctx) => {
      const node = r(handle, ctx);

      handle.consumeEOI();

      return {
        type: 'start',
        node
      };
    };

    const r = lrec(
      (_c, level = 0) => `level=${level}`,
      (handle, ctx, level = 0) => {
        const choices = [ar, br, c];

        if (level >= choices.length - 1) {
          const base = last(choices);
          return base(handle, ctx);
        } else {
          const selected = choices[level];
          const next = (h, c) => r(h, c, level + 1);

          return choice(handle, ctx, [selected, next]);
        }
      }
    );

    const ar = (handle, ctx) => {
      const base = r(handle, ctx);
      const node = a(handle, ctx);

      return {
        type: 'ar',
        base,
        node
      };
    };

    const br = (handle, ctx) => {
      const base = r(handle, ctx, 1);
      const node = b(handle, ctx);

      return {
        type: 'br',
        base,
        node
      };
    };

    const parser = createRDParser(start);

    const input1 = tokenIterator(['c', 'a', 'b']);
    expect(() => parser.run(input1))
      .toThrow(new TokenMismatch('EOI', input1.tokens[2]));

    const input2 = tokenIterator(['c', 'b', 'b', 'a', 'a']);
    const result2 = parser.run(input2);

    expect(result2).toEqual({
      type: 'start',
      node: {
        type: 'ar',
        base: {
          type: 'ar',
          base: {
            type: 'br',
            base: {
              type: 'br',
              base: { type: 'c', token: input2.tokens[0] },
              node: { type: 'b', token: input2.tokens[1] }
            },
            node: { type: 'b', token: input2.tokens[2] }
          },
          node: { type: 'a', token: input2.tokens[3] }
        },
        node: { type: 'a', token: input2.tokens[4] }
      }
    });
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
