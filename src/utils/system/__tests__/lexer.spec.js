import { createLexer } from '../lexer';
import { runIterator } from '&test/utils/iterator';
import { catchError } from '&test/utils/error';

const loc = (line, column) => ({ location: { line, column } });

it('extracts tokens from input', () => {
  const lexer = createLexer({
    '(': '(',
    ')': ')',
    word: [/[a-zA-Z]+/, s => s],
    space: /\s+/
  });

  const iterator = lexer.run('(hello there)');
  const result = runIterator(iterator);

  expect(result).toEqual([
    { type: '(', source: '(', ...loc(1, 1) },
    { type: 'word', value: 'hello', source: 'hello', ...loc(1, 2) },
    { type: 'space', source: ' ', ...loc(1, 7) },
    { type: 'word', value: 'there', source: 'there', ...loc(1, 8) },
    { type: ')', source: ')', ...loc(1, 13) },
  ]);
});

it('tracks newlines in locations', () => {
  const lexer = createLexer({
    word: [/[a-zA-Z]+/, s => s],
    space: /\s+/
  });

  const iterator = lexer.run('hello there\n\nnice to  meet \n you');
  const result = runIterator(iterator);

  expect(result).toEqual([
    { type: 'word', value: 'hello', source: 'hello', ...loc(1, 1) },
    { type: 'space', source: ' ', ...loc(1, 6) },
    { type: 'word', value: 'there', source: 'there', ...loc(1, 7) },
    { type: 'space', source: '\n\n', ...loc(1, 12) },
    { type: 'word', value: 'nice', source: 'nice', ...loc(3, 1) },
    { type: 'space', source: ' ', ...loc(3, 5) },
    { type: 'word', value: 'to', source: 'to', ...loc(3, 6) },
    { type: 'space', source: '  ', ...loc(3, 8) },
    { type: 'word', value: 'meet', source: 'meet', ...loc(3, 10) },
    { type: 'space', source: ' \n ', ...loc(3, 14) },
    { type: 'word', value: 'you', source: 'you', ...loc(4, 2) },
  ]);
});

it('selects the longest match', () => {
  const lexer = createLexer({
    let: 'let',
    word: [/[a-zA-Z]+/, s => s],
    space: /\s+/
  });

  const iterator = lexer.run('let letter');
  const result = runIterator(iterator);

  expect(result).toEqual([
    { type: 'let', source: 'let', ...loc(1, 1) },
    { type: 'space', source: ' ', ...loc(1, 4) },
    { type: 'word', value: 'letter', source: 'letter', ...loc(1, 5) },
  ]);
});

it('throws an error if it cannot match a token', () => {
  const lexer = createLexer({
    word: [/[a-zA-Z]+/, s => s],
    space: /\s+/
  });

  const iterator = lexer.run('hello 123');
  const error = catchError(() => runIterator(iterator));

  expect(error).toBeDefined();
});
