import { last } from '../list';

describe('last', () => {
  it('gets last element in list', () => {
    expect(last([1, 2, 3])).toEqual(3);
    expect(last([])).toEqual(undefined);
  });
});
