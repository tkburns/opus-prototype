import { a, b, c, d, tokenIterator } from './common';
import { cached } from '../cache';
import { createRDParser } from '..';
import { choice } from '../combinators';

const createCached = (rule, keySuffix) => {
  const trackedRule = jest.fn(rule);

  let cachedParser;
  if (keySuffix) {
    cachedParser = cached(keySuffix, trackedRule);
  } else {
    cachedParser = cached(trackedRule);
  }

  cachedParser.rule = trackedRule;

  return cachedParser;
};

const argsKeySuffix = (_ctx, ...args) => args.join(':');

const cachedA = createCached(a);
const cachedB = createCached(b);
const cachedC = createCached(c);
const cachedD = createCached(d);

beforeEach(() => {
  jest.clearAllMocks();
});

it('caches successful parse results', () => {
  const trackedB = jest.fn(b);

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
    const nodeB = trackedB(handle, ctx);
    const nodeC = c(handle, ctx);

    return {
      type: 'ABC',
      children: [nodeA, nodeB, nodeC]
    };
  };

  const ABD = (handle, ctx) => {
    const nodeA = cachedA(handle, ctx);
    const nodeB = trackedB(handle, ctx);
    const nodeD = d(handle, ctx);

    return {
      type: 'ABD',
      children: [nodeA, nodeB, nodeD]
    };
  };

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

  expect(cachedA.rule).toHaveBeenCalledTimes(1);
  expect(trackedB).toHaveBeenCalledTimes(2);
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

  const parser = createRDParser(start);

  const input = tokenIterator(['d']);
  const result = parser.run(input);

  expect(result).toEqual({
    type: 'start',
    node: { type: 'd', token: input.tokens[0] }
  });

  expect(cachedA.rule).toHaveBeenCalledTimes(1);
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

  expect(cachedA.rule).toHaveBeenCalledTimes(2);
});

it('caches based on context if specified', () => {
  const cachedCtxA = createCached(
    (h, c) => ({ ...a(h, c), key: c.key }),
    (c) => c.key
  );

  const nodes = (handle, context) => choice(handle, context, [
    (h, ctx) => {
      const n1 = cachedCtxA(h, { ...ctx, key: ctx.key1 });
      const n2 = b(h, ctx);
      return [n1, n2];
    },
    (h, ctx) => {
      const n1 = cachedCtxA(h, { ...ctx, key: ctx.key2 });
      const n2 = c(h, ctx);
      return [n1, n2];
    },
    (h, ctx) => {
      const n1 = cachedCtxA(h, { ...ctx, key: ctx.key3 });
      const n2 = d(h, ctx);
      return [n1, n2];
    },
  ]);

  const start = (handle, ctx) => {
    const children = nodes(handle, ctx);

    handle.consumeEOI();

    return {
      type: 'start',
      children
    };
  };

  const parser1 = createRDParser(start, { key1: '1', key2: '2', key3: '1' });

  const input1 = tokenIterator(['a', 'd']);
  const result1 = parser1.run(input1);

  expect(result1).toEqual({
    type: 'start',
    children: [
      { type: 'a', token: input1.tokens[0], key: '1' },
      { type: 'd', token: input1.tokens[1] },
    ]
  });

  expect(cachedCtxA.rule).toHaveBeenCalledTimes(2);
});

it('caches parsers with extra parameters', () => {
  const cachedArgsA = createCached(
    (h, c, ...args) => ({ ...a(h, c), args }),
    argsKeySuffix
  );

  const nodes = (handle, context) => choice(handle, context, [
    (h, ctx) => {
      const n1 = cachedArgsA(h, ctx, ...(ctx.args1 ?? []));
      const n2 = b(h, ctx);
      return [n1, n2];
    },
    (h, ctx) => {
      const n1 = cachedArgsA(h, ctx, ...(ctx.args2 ?? []));
      const n2 = c(h, ctx);
      return [n1, n2];
    },
    (h, ctx) => {
      const n1 = cachedArgsA(h, ctx, ...(ctx.args3 ?? []));
      const n2 = d(h, ctx);
      return [n1, n2];
    },
  ]);

  const start = (handle, ctx) => {
    const children = nodes(handle, ctx);

    handle.consumeEOI();

    return {
      type: 'start',
      children
    };
  };

  const parser1 = createRDParser(start, { args1: [1], args2: [2], args3: [1] });

  const input1 = tokenIterator(['a', 'd']);
  const result1 = parser1.run(input1);

  expect(result1).toEqual({
    type: 'start',
    children: [
      { type: 'a', token: input1.tokens[0], args: [1] },
      { type: 'd', token: input1.tokens[1] },
    ]
  });
  expect(cachedArgsA.rule).toHaveBeenCalledTimes(2);

  jest.clearAllMocks();

  const parser2 = createRDParser(start, { args1: [1], args2: [1, 2], args3: [1, 2, 3] });

  const input2 = tokenIterator(['a', 'd']);
  const result2 = parser2.run(input2);

  expect(result2).toEqual({
    type: 'start',
    children: [
      { type: 'a', token: input2.tokens[0], args: [1, 2, 3] },
      { type: 'd', token: input2.tokens[1] },
    ]
  });
  expect(cachedArgsA.rule).toHaveBeenCalledTimes(3);
});

describe('reevaluate', () => {
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
        { type: 'a', token: input.tokens[0] },
        { type: 'b', token: input.tokens[1] },
        { type: 'd', token: input.tokens[2] },
      ]
    });

    expect(cachedA.rule).toHaveBeenCalledTimes(2);
    expect(cachedB.rule).toHaveBeenCalledTimes(2);
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
        { type: 'a', token: input.tokens[0] },
        { type: 'b', token: input.tokens[1] },
        { type: 'd', token: input.tokens[2] },
      ]
    });

    expect(cachedA.rule).toHaveBeenCalledTimes(2);
    expect(cachedB.rule).toHaveBeenCalledTimes(1);
  });
});
