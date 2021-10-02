import { Source } from '&/utils/system/input';

let sourceNumber = 1;
export const createSource = (): Source => {
  const source = `[test|${sourceNumber}]`;
  sourceNumber += 1;

  return source;
};
