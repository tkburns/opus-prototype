import type { Name } from './base.types';
import type { SimpleLiteral } from './expression.types';

export type PatternNode = Pattern;

export type Pattern = (
  NamePattern |
  TuplePattern |
  SimpleLiteralPattern |
  WildcardPattern
);

export type NamePattern = {
  type: 'name-pattern';
  name: Name;
};

export type TuplePattern = {
  type: 'tuple-pattern';
  members: Pattern[];
};

export type SimpleLiteralPattern = {
  type: 'simple-literal-pattern';
  value: SimpleLiteral;
};

export type WildcardPattern = {
  type: 'wildcard-pattern';
};
