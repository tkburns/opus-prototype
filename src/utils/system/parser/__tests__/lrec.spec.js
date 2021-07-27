import { a, b, c, tokenIterator } from './common';
import { createRDParser } from '../index';
import { choice, repeated } from '../combinators';
import { lrec } from '../lrec';

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

it('parses rules in order', () => {
  const start = (handle) => {
    const node = r(handle);
    const [leftovers, _] = repeated(handle, a);
    handle.consumeEOI();

    return {
      type: 'start',
      node,
      leftovers
    };
  };

  // base (c) also matches recursive case (ca)
  const r = lrec('r', (handle) => {
    return choice(handle, [c, ca, ra]);
  });

  const ca = (handle) => {
    const nodeC = c(handle);
    const nodeA = a(handle);

    return {
      type: 'ca',
      nodeC,
      nodeA
    };
  };

  const ra = (handle) => {
    const base = r(handle);
    const nodeA = a(handle);

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

it('handles nested left recursion', () => {
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
    const node = choice(handle, [rb, ra, c]);

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

  const nChain = (...args) => {
    const [node] = args.slice(-1);
    const types = args.slice(0, -1);

    return types.reduceRight((prev, type) => n(type, prev), node);
  };

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
                        nChain('r1', 'r2', ntoken('c', 0)),
                        ntoken('a', 2)
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
        ),
        ntoken('a', 8)
      )
    )
  );
});
