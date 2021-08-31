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

it('forces cache to reevaluate rule', () => {
  const start = (handle, ctx) => {
    const child = choice(handle, ctx, [
      () => node(handle, { ...ctx, tokenType: 'b', ruleCount: 1 }),
      () => node(handle, { ...ctx, tokenType: 'c', ruleCount: 2 }),
      () => node(handle, { ...ctx, tokenType: 'c', ruleCount: 3, cache: { reevaluate: true } })
    ]);

    handle.consumeEOI();

    return {
      type: 'start',
      children: [child]
    };
  };

  const rawNode = jest.fn((handle, ctx) => {
    const tokenType = ctx.tokenType ?? 'a';

    const token = handle.consume(tokenType);
    return { type: 'node', token, ruleCount: ctx.ruleCount };
  });
  const node = cached(rawNode);

  const parser = createRDParser(start);

  const input = tokenIterator(['c']);
  const result = parser.run(input);

  expect(result).toEqual({
    type: 'start',
    children: [
      { type: 'node', token: input.tokens[0], ruleCount: 3 },
    ]
  });
  expect(rawNode).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ tokenType: 'b', ruleCount: 1 }));
  expect(rawNode).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ tokenType: 'c', ruleCount: 2 }));
  expect(rawNode).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ tokenType: 'c', ruleCount: 3 }));
});