import { a, b, c, tokenIterator } from './common';
import { createRDParser } from '../index';
import { TokenMismatch, UnexpectedEOI } from '../errors';
import { repeated } from '../combinators';

it('parses with peg parser', () => {
  const start = (handle, ctx) => {
    const nodeA = a(handle, ctx);
    handle.consume('.');
    const nodeB = b(handle, ctx);

    handle.consumeEOI();

    return { type: 'start', children: [nodeA, nodeB] };
  };

  const parser = createRDParser(start);

  const input = tokenIterator(['a', '.', 'b']);
  const result = parser.run(input);

  expect(result).toEqual({
    type: 'start',
    children: [
      { type: 'a', token: input.tokens[0] },
      { type: 'b', token: input.tokens[2] },
    ]
  });
});

it('provides context for more advanced usages', () => {
  const start = (handle, ctx) => {
    const nodeA = a(handle, ctx);
    separator(handle, ctx);
    const nodeB = b(handle, ctx);
    separator(handle, { ...ctx, separator: '|' });
    const nodeC = c(handle, ctx);

    handle.consumeEOI();

    return { type: 'start', children: [nodeA, nodeB, nodeC] };
  };

  const separator = (handle, ctx) => {
    const sep = ctx.separator ?? '.';

    handle.consume(sep);
    repeated(handle, ctx, () => {
      handle.consume(sep);
    });

    return undefined;
  };

  const parser = createRDParser(start);

  const input = tokenIterator(['a', '.', 'b', '|', '|', 'c']);
  const result = parser.run(input);

  expect(result).toEqual({
    type: 'start',
    children: [
      { type: 'a', token: input.tokens[0] },
      { type: 'b', token: input.tokens[2] },
      { type: 'c', token: input.tokens[5] },
    ]
  });
});

it('throws TokenMismatch errors', () => {
  const start = (handle, ctx) => {
    const nodeA = a(handle, ctx);
    handle.consume('.');
    const nodeB = b(handle, ctx);

    handle.consumeEOI();

    return { type: 'start', children: [nodeA, nodeB] };
  };

  const parser = createRDParser(start);

  const input1 = tokenIterator(['a', '.', 'wrong']);
  expect(() => {
    parser.run(input1);
  }).toThrow(new TokenMismatch('b', input1.tokens[2]));

  const input2 = tokenIterator(['a', '.', 'b', '.']);
  expect(() => {
    parser.run(input2);
  }).toThrow(new TokenMismatch('EOI', input2.tokens[3]));
});

it('throws UnexpectedEOI errors', () => {
  const start = (handle, ctx) => {
    const nodeA = a(handle, ctx);
    handle.consume('.');
    const nodeB = b(handle, ctx);

    handle.consumeEOI();

    return { type: 'start', children: [nodeA, nodeB] };
  };

  const parser = createRDParser(start);

  expect(() => {
    parser.run(tokenIterator(['a', '.']));
  }).toThrow(new UnexpectedEOI());
});
