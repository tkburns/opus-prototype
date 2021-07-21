import { a, b, tokenIterator } from './common';
import { createRDParser } from '../index';
import { TokenMismatch, UnexpectedEOI } from '../errors';

it('parses with peg parser', () => {
  const start = (handle) => {
    const nodeA = a(handle);
    handle.consume('.');
    const nodeB = b(handle);

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

it('throws TokenMismatch errors', () => {
  const start = (handle) => {
    const nodeA = a(handle);
    handle.consume('.');
    const nodeB = b(handle);

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
  const start = (handle) => {
    const nodeA = a(handle);
    handle.consume('.');
    const nodeB = b(handle);

    handle.consumeEOI();

    return { type: 'start', children: [nodeA, nodeB] };
  };

  const parser = createRDParser(start);

  expect(() => {
    parser.run(tokenIterator(['a', '.']));
  }).toThrow(new UnexpectedEOI());
});
