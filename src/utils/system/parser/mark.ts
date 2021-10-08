import { Comparison } from '&/utils/comparison';
import { Source } from '../input';

export type Mark = {
  position: number;
  source: Source;
};

export const compareMarks = (m1: Mark, m2: Mark): Comparison | null => {
  if (m1.source !== m2.source) {
    return null;
  } else if (m1.position == m2.position) {
    return Comparison.EQUAL;
  } else if (m1.position < m2.position) {
    return Comparison.LESS;
  } else {
    return Comparison.GREATER;
  }
};

export const serializeMark = (mark: Mark): string =>
  `${mark.source}:${mark.position}`;
