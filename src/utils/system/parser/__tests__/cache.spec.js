import { a, b, c, d, tokenIterator } from './common';
import { cached } from '../cache';
import { createRDParser } from '..';
import { choice } from '../combinators';

it('caches successful parse results', () => {
  const start = (handle, ctx) => {
    const node = choice(handle, ctx, [ABC, ABD]);
    handle.consumeEOI();

    return {
      type: 'start',
      node
    };
  };

  const ABC = (handle, ctx) => {
    const nodeA = cachedA(handle, ctx);
    const nodeB = rawB(handle, ctx);
    const nodeC = c(handle, ctx);

    return {
      type: 'ABC',
      children: [nodeA, nodeB, nodeC]
    };
  };

  const ABD = (handle, ctx) => {
    const nodeA = cachedA(handle, ctx);
    const nodeB = rawB(handle, ctx);
    const nodeD = d(handle, ctx);

    return {
      type: 'ABD',
      children: [nodeA, nodeB, nodeD]
    };
  };

  const rawA = jest.fn(a);
  const rawB = jest.fn(b);
  const cachedA = cached(rawA);

  const parser = createRDParser(start);

  const input = tokenIterator(['a', 'b', 'd']);
  const result = parser.run(input);

  expect(result).toEqual({
    type: 'start',
    node: {
      type: 'ABD',
      children: [
        { type: 'a', token: input.tokens[0] },
        { type: 'b', token: input.tokens[1] },
        { type: 'd', token: input.tokens[2] }
      ]
    }
  });

  expect(rawA).toHaveBeenCalledTimes(1);
  expect(rawB).toHaveBeenCalledTimes(2);
});

it('caches failed parses', () => {
  const start = (handle, ctx) => {
    const node = choice(handle, ctx, [AB, AC, d]);
    handle.consumeEOI();

    return {
      type: 'start',
      node
    };
  };

  const AB = (handle, ctx) => {
    const nodeA = cachedA(handle, ctx);
    const nodeB = b(handle, ctx);

    return {
      type: 'AB',
      children: [nodeA, nodeB]
    };
  };

  const AC = (handle, ctx) => {
    const nodeA = cachedA(handle, ctx);
    const nodeC = c(handle, ctx);

    return {
      type: 'AC',
      children: [nodeA, nodeC]
    };
  };

  const rawA = jest.fn(a);
  const cachedA = cached(rawA);

  const parser = createRDParser(start);

  const input = tokenIterator(['d']);
  const result = parser.run(input);

  expect(result).toEqual({
    type: 'start',
    node: { type: 'd', token: input.tokens[0] }
  });

  expect(rawA).toHaveBeenCalledTimes(1);
});

it('caches based on position/mark', () => {
  const start = (handle, ctx) => {
    const node1 = cachedA(handle, ctx);
    const node2 = cachedA(handle, ctx);
    handle.consumeEOI();

    return {
      type: 'start',
      children: [node1, node2]
    };
  };

  const rawA = jest.fn(a);
  const cachedA = cached(rawA);

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

  expect(rawA).toHaveBeenCalledTimes(2);
});

describe('reevaluate', () => {
  let count = {};
  const createCached = (name, rule) => cached((handle, context) => {
    count[name] = (count[name] ?? 0) + 1;

    const node = rule(handle, context);

    return { ...node, count: count[name] };
  });

  const cachedA = createCached('a', a);
  const cachedB = createCached('b', b);
  const cachedC = createCached('c', c);
  const cachedD = createCached('d', d);

  const nodes = (handle, context) => choice(handle, context, [
    (h, c) => {
      const n1 = cachedA(h, c);
      const n2 = cachedB(h, c);
      const n3 = cachedC(h, c);
      return [n1, n2, n3];
    },
    (h, c) => {
      const n1 = cachedA(h, c);
      const n2 = cachedB(h, c);
      const n3 = cachedD(h, c);
      return [n1, n2, n3];
    },
  ]);

  beforeEach(() => {
    count = {};
  });

  it('forces cache to reevaluate entire subtree', () => {
    const start = (handle, ctx) => {
      const cacheContext = { ...ctx, cache: { reevaluate: true } };

      const children = nodes(handle, cacheContext);

      handle.consumeEOI();

      return {
        type: 'start',
        children
      };
    };

    const parser = createRDParser(start);

    const input = tokenIterator(['a', 'b', 'd']);
    const result = parser.run(input);

    expect(result).toEqual({
      type: 'start',
      children: [
        { type: 'a', token: input.tokens[0], count: 2 },
        { type: 'b', token: input.tokens[1], count: 2 },
        { type: 'd', token: input.tokens[2], count: 1 },
      ]
    });
  });

  it('forces cache to reevaluate rule base on mark', () => {
    const start = (handle, ctx) => {
      const mark = handle.mark();
      const cacheContext = { ...ctx, cache: { reevaluate: [mark] } };

      const children = nodes(handle, cacheContext);

      handle.consumeEOI();

      return {
        type: 'start',
        children
      };
    };

    const parser = createRDParser(start);

    const input = tokenIterator(['a', 'b', 'd']);
    const result = parser.run(input);

    expect(result).toEqual({
      type: 'start',
      children: [
        { type: 'a', token: input.tokens[0], count: 2 },
        { type: 'b', token: input.tokens[1], count: 1 },
        { type: 'd', token: input.tokens[2], count: 1 },
      ]
    });
  });
});
