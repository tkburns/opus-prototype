import { createLexer } from '../lexer';
import { runIterator } from '&test/utils/iterator';
import { catchError } from '&test/utils/error';

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
    { type: '(', value: undefined },
    { type: 'word', value: 'hello' },
    { type: 'space', value: undefined },
    { type: 'word', value: 'there' },
    { type: ')', value: undefined },
  ])
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
    { type: 'let', value: undefined },
    { type: 'space', value: undefined },
    { type: 'word', value: 'letter' },
  ])
});

it('throws an error if it cannot match a token', () => {
  const lexer = createLexer({
    word: [/[a-zA-Z]+/, s => s],
    space: /\s+/
  });

  const iterator = lexer.run('hello 123');
  const error = catchError(() => runIterator(iterator));

  expect(error).toBeDefined()
});
