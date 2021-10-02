import { createTokenFilter } from '../token-filter';
import { runIterator } from '&test/utils/iterator';
import { createSource } from '&test/utils/input';

const iteratorFromArray = (array) => {
  const iterator = array[Symbol.iterator]();
  iterator.source = createSource();
  return iterator;
};

it('extracts tokens from input', () => {
  const filter = createTokenFilter(['ignore-a', 'ignore-d']);

  const inputIterator = iteratorFromArray([
    { type: 'ignore-a' },
    { type: 'b' },
    { type: 'c' },
    { type: 'ignore-d' },
    { type: 'e' },
  ]);

  const filteredIterator = filter.run(inputIterator);

  const result = runIterator(filteredIterator);

  expect(result).toEqual([
    { type: 'b' },
    { type: 'c' },
    { type: 'e' },
  ]);
  expect(filteredIterator.source).toEqual(inputIterator.source);
});
