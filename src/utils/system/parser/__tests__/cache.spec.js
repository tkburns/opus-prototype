import { a, b, c, d, tokenIterator } from './common';
import { cached } from '../cache';
import { createRDParser } from '..';
import { choice } from '../combinators';

it('caches successful parse results', () => {
  const start = (handle) => {
    const node = choice(handle, [ABC, ABD]);
    handle.consumeEOI();

    return {
      type: 'start',
      node
    };
  };

  const ABC = (handle) => {
    const nodeA = cachedA(handle);
    const nodeB = rawB(handle);
    const nodeC = c(handle);

    return {
      type: 'ABC',
      children: [nodeA, nodeB, nodeC]
    };
  };

  const ABD = (handle) => {
    const nodeA = cachedA(handle);
    const nodeB = rawB(handle);
    const nodeD = d(handle);

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
  const start = (handle) => {
    const node = choice(handle, [AB, AC, d]);
    handle.consumeEOI();

    return {
      type: 'start',
      node
    };
  };

  const AB = (handle) => {
    const nodeA = cachedA(handle);
    const nodeB = b(handle);

    return {
      type: 'AB',
      children: [nodeA, nodeB]
    };
  };

  const AC = (handle) => {
    const nodeA = cachedA(handle);
    const nodeC = c(handle);

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
  const start = (handle) => {
    const node1 = cachedA(handle);
    const node2 = cachedA(handle);
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
