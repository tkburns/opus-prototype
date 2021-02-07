import { createTokenFilter } from '../token-filter';
import { runIterator } from '&test/utils/iterator';

const iteratorFromArray = (array) => array[Symbol.iterator]();

it('extracts tokens from input', () => {
  const filter = createTokenFilter(['ignore-a', 'ignore-d']);

  const iterator = filter.run(iteratorFromArray([
    { type: 'ignore-a' },
    { type: 'b' },
    { type: 'c' },
    { type: 'ignore-d' },
    { type: 'e' },
  ]));

  const result = runIterator(iterator);

  expect(result).toEqual([
    { type: 'b' },
    { type: 'c' },
    { type: 'e' },
  ])
});
