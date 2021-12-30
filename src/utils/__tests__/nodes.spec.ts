import { mapByType, transformByType } from '../nodes';

type A = { type: 'a' };
type B = { type: 'b'; value: string };

const typeMap = {
  a: (x: A) => ['a', x],
  b: (x: B, other: string) => [`b-${x.value}`, x, other]
};

describe('transformByType', () => {
  it('routes based on type', () => {
    expect(transformByType({ type: 'a' } as const, typeMap)).toEqual(
      ['a', { type: 'a' }]
    );
    expect(transformByType({ type: 'b', value: 'bar' } as const, ['blah'], typeMap))
      .toEqual(
        ['b-bar', { type: 'b', value: 'bar' }, 'blah']
      );
  });
});

describe('mapByType', () => {
  it('maps based on type', () => {
    const map = mapByType(typeMap);

    expect(map({ type: 'a' })).toEqual(
      ['a', { type: 'a' }]
    );
    expect(map({ type: 'b', value: 'bar' }, 'blah')).toEqual(
      ['b-bar', { type: 'b', value: 'bar' }, 'blah']
    );
  });
});
