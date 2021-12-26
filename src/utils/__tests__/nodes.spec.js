import { transformByType } from '../nodes';

it('routes based on type', () => {
  const routes = {
    a: (x) => ['a', x],
    b: (x) => ['b', x]
  };

  expect(transformByType({ type: 'a' }, routes)).toEqual(
    ['a', { type: 'a' }]
  );
  expect(transformByType({ type: 'b' }, routes)).toEqual(
    ['b', { type: 'b' }]
  );
});
