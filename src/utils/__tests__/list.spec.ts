import { includes, last } from '../list';

describe('last', () => {
  it('gets last element in list', () => {
    expect(last([1, 2, 3])).toEqual(3);

    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    expect(last([])).toEqual(undefined);
  });
});

describe('includes', () => {
  it('returns if array includes element', () => {
    expect(includes([1, 2], 2)).toEqual(true);
    expect(includes([1, 2], 3)).toEqual(false);
  });
});
