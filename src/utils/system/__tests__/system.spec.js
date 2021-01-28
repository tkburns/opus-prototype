import { system } from '../system';

it('pipes modules together', () => {
  const moduleA = {
    run: (str) => str.split(' ')
  };

  const moduleB = {
    run: (words) => words.map(word => word.toUpperCase())
  };

  const moduleC = {
    run: (words) => words.join('+')
  };

  const core = system(moduleA, moduleB, moduleC);

  const result = core.run('hello there');
  expect(result).toEqual('HELLO+THERE')
});
