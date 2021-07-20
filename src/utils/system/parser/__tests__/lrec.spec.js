import { a, b, c, tokenIterator } from './common';
import { createRDParser } from '../index';
import { choice } from '../combinators';
import { lrec } from '../lrec';

describe('lrec', () => {
  it('handles left recursion', () => {
    const start = (handle) => {
      const node = r(handle);
      return {
        type: 'start',
        node
      };
    };

    const r = lrec('r', (handle) => {
      return choice(handle, [ar, c]);
    });

    const ar = (handle) => {
      const base = r(handle);
      const node = a(handle);

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

  it('handle left recursion with base before recursive case', () => {
    const start = (handle) => {
      const node = r(handle);
      return {
        type: 'start',
        node
      };
    };

    const r = lrec('r', (handle) => {
      return choice(handle, [c, ca]);
    });

    const ca = (handle) => {
      const base = r(handle);
      const nodeC = c(handle);
      const nodeA = a(handle);

      return {
        type: 'ar',
        base,
        nodeC,
        nodeA,
      };
    };

    const parser = createRDParser(start);

    // base (c) also matches recursive case (ca)
    const input = tokenIterator(['c', 'c', 'a', 'c', 'a', 'c', 'a']);
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
            nodeC: { type: 'c', token: input.tokens[1] },
            nodeA: { type: 'a', token: input.tokens[2] }
          },
          nodeC: { type: 'c', token: input.tokens[3] },
          nodeA: { type: 'a', token: input.tokens[4] }
        },
        nodeC: { type: 'c', token: input.tokens[5] },
        nodeA: { type: 'a', token: input.tokens[6] }
      }
    });
  });

  it('handle nested left recursion', () => {
    const start = (handle) => {
      const node = r1(handle);
      handle.consume('!');

      return {
        type: 'start',
        node
      };
    };

    const r1 = lrec('r1', (handle) => {
      const node = r2(handle);
      handle.consume('.');

      return {
        type: 'r1',
        node
      };
    });

    const r2 = lrec('r2', (handle) => {
      const node = choice(handle, [ra, rb, c]);

      return {
        type: 'r2',
        node
      };
    });

    const ra = (handle) => {
      const rec = r1(handle);
      const node = a(handle);

      return {
        type: 'ra',
        rec,
        node
      };
    };

    const rb = (handle) => {
      const rec = r2(handle);
      const node = b(handle);

      return {
        type: 'rb',
        rec,
        node
      };
    };

    const parser = createRDParser(start);

    const input = tokenIterator(['c', '.', 'a', '.', 'a', 'b', 'b', '.', 'a', '.', '!']);
    const result = parser.run(input);

    const n = (type, node) => ({ type, node });
    const nrec = (type, rec, node) => ({ type, rec, node });
    const ntoken = (type, index) => ({ type, token: input.tokens[index] });

    expect(result).toEqual(
      n('start',
        n('r1',
          n('r2',
            nrec('ra',
              n('r1',
                n('r2',
                  nrec('rb',
                    n('r2',
                      nrec('rb',
                        n('r2',
                          nrec('ra',
                            n('r1',
                              n('r2',
                                nrec('ra',
                                  n('r1',
                                    n('r2',
                                      ntoken('c', 0)
                                    )
                                  ),
                                  ntoken('a', 2)
                                )
                              )
                            ),
                            ntoken('a', 4)
                          )
                        ),
                        ntoken('b', 5)
                      ),
                    ),
                    ntoken('b', 6)
                  )
                )
              ),
              ntoken('a', 8)
            )
          )
        )
      )
    );
  });
});
