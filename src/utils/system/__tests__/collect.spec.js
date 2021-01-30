import { collect } from '../collect';

it('collects iterator into list', () => {
  const list = [1, 2, 3, 4];

  const collected = collect().run(list[Symbol.iterator]());

  expect(collected).toEqual(list);
});